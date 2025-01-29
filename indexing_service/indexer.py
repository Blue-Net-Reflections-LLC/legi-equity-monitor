import logging
from typing import List, Dict, Any
import asyncio

import torch
from transformers import AutoTokenizer, AutoModel
from sqlalchemy import select, join, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from tqdm import tqdm
import numpy as np

from config import (
    SQLALCHEMY_DATABASE_URL, SQLALCHEMY_CONNECT_ARGS, MODEL_NAME, BATCH_SIZE, 
    MAX_TEXT_LENGTH, STATE_MAPPING, EMBEDDING_MAX_LENGTH
)
from models import VectorIndex, Bill, Sponsor, Party, State, Body, Committee

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorIndexer:
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Using device: {self.device}")
        
        # Initialize tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModel.from_pretrained(MODEL_NAME).to(self.device)
        self.model.eval()  # Set to evaluation mode
        
        # Database setup
        self.engine = create_async_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args=SQLALCHEMY_CONNECT_ARGS
        )
        self.Session = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    def _batch_generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a batch of texts."""
        with torch.no_grad():
            # Tokenize and move to device
            inputs = self.tokenizer(
                texts,
                padding=True,
                truncation=True,
                max_length=EMBEDDING_MAX_LENGTH,
                return_tensors="pt"
            ).to(self.device)
            
            # Get model outputs
            outputs = self.model(**inputs)
            
            # Use mean pooling
            attention_mask = inputs['attention_mask']
            token_embeddings = outputs.last_hidden_state
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            
            return embeddings.cpu().numpy()

    def _prepare_bill_text(self, bill: Dict[str, Any]) -> str:
        """Prepare bill text for embedding."""
        components = [
            bill['state_name'],
            bill['state_abbr'],
            bill['bill_number'],
            f"in {bill['body_name']}",
            bill['title'] or '',
            bill['description'] or ''
        ]

        if bill['pending_committee_name']:
            components.append(f"in committee: {bill['pending_committee_name']}")

        return ' '.join(filter(None, components))[:MAX_TEXT_LENGTH]

    def _prepare_sponsor_text(self, sponsor: Dict[str, Any]) -> str:
        """Prepare sponsor text for embedding."""
        state_name = STATE_MAPPING.get(sponsor['state_abbr'], '')
        name_parts = [
            sponsor['first_name'],
            sponsor['middle_name'],
            sponsor['last_name']
        ]
        if sponsor['suffix']:
            name_parts.append(sponsor['suffix'])
        if sponsor['nickname']:
            name_parts.append(f"({sponsor['nickname']})")

        components = [
            state_name,
            sponsor['state_abbr'],
            ' '.join(filter(None, name_parts)),
            sponsor['party_name'] or '',
            f"District {sponsor['district']}" if sponsor['district'] else ''
        ]
        return ' '.join(filter(None, components))[:MAX_TEXT_LENGTH]

    async def _get_bills_to_update(self, session: AsyncSession) -> List[Dict[str, Any]]:
        """Get bills that need updating based on changed_hash."""
        query = (
            select(Bill, State, Body, Committee)
            .join(State, Bill.state_id == State.state_id)
            .join(Body, Bill.body_id == Body.body_id)
            .outerjoin(Committee, Bill.pending_committee_id == Committee.committee_id)
            .join(
                VectorIndex,
                (VectorIndex.entity_id == Bill.bill_id) & 
                (VectorIndex.entity_type == 'bill'),
                isouter=True
            )
            .where(
                (VectorIndex.source_hash.is_(None)) |
                (VectorIndex.source_hash != Bill.change_hash)
            )
            .limit(BATCH_SIZE)
        )
        
        result = await session.execute(query)
        return [
            {
                'bill_id': bill.bill_id,
                'state_id': bill.state_id,
                'state_abbr': state.state_abbr,
                'state_name': state.state_name,
                'bill_number': bill.bill_number,
                'title': bill.title,
                'description': bill.description,
                'body_name': body.body_name,
                'pending_committee_name': committee.committee_name if committee else None,
                'changed_hash': bill.change_hash
            }
            for bill, state, body, committee in result
        ]

    async def _get_sponsors_to_update(self, session: AsyncSession) -> List[Dict[str, Any]]:
        """Get sponsors that need updating based on person_hash."""
        query = (
            select(Sponsor, Party, State)
            .join(Party, Sponsor.party_id == Party.party_id)
            .join(State, Sponsor.state_id == State.state_id)
            .join(
                VectorIndex,
                (VectorIndex.entity_id == Sponsor.people_id) & 
                (VectorIndex.entity_type == 'sponsor'),
                isouter=True
            )
            .where(
                (VectorIndex.source_hash.is_(None)) |
                (VectorIndex.source_hash != Sponsor.person_hash)
            )
            .limit(BATCH_SIZE)
        )
        
        result = await session.execute(query)
        return [
            {
                'sponsor_id': sponsor.people_id,
                'state_abbr': state.state_abbr,
                'first_name': sponsor.first_name,
                'middle_name': sponsor.middle_name,
                'last_name': sponsor.last_name,
                'suffix': sponsor.suffix,
                'nickname': sponsor.nickname,
                'party_name': party.party_name,
                'district': sponsor.district,
                'changed_hash': sponsor.person_hash
            }
            for sponsor, party, state in result
        ]

    async def _update_vector_index(
        self,
        session: AsyncSession,
        items: List[Dict[str, Any]],
        entity_type: str,
        prepare_text_func
    ):
        """Update vector index for a batch of items."""
        if not items:
            return

        # Prepare texts and generate embeddings
        texts = [prepare_text_func(item) for item in items]
        embeddings = self._batch_generate_embeddings(texts)

        # Update database
        for item, text, embedding in zip(items, texts, embeddings):
            vector_index = VectorIndex(
                entity_type=entity_type,
                entity_id=item[f'{entity_type}_id'],
                search_text=text,
                embedding=embedding.tolist(),
                source_hash=item['changed_hash'],
                state_abbr=item['state_abbr'],
                state_name=STATE_MAPPING.get(item['state_abbr'], '')
            )
            await session.merge(vector_index)

        await session.commit()

    async def update_index(self):
        """Main method to update the vector index."""
        async with self.Session() as session:
            # Update bills
            bills = await self._get_bills_to_update(session)
            if bills:
                logger.info(f"Updating {len(bills)} bills")
                await self._update_vector_index(
                    session, bills, 'bill', self._prepare_bill_text
                )

            # Update sponsors
            sponsors = await self._get_sponsors_to_update(session)
            if sponsors:
                logger.info(f"Updating {len(sponsors)} sponsors")
                await self._update_vector_index(
                    session, sponsors, 'sponsor', self._prepare_sponsor_text
                )

            # Verify counts
            result = await session.execute(
                text("SELECT entity_type, COUNT(*) FROM vector_index GROUP BY entity_type")
            )
            for type_, count in result.fetchall():
                logger.info(f"Total embeddings for {type_}: {count}")

            logger.info("Update completed")

async def main():
    indexer = VectorIndexer()
    try:
        await indexer.update_index()
    finally:
        await indexer.engine.dispose()

if __name__ == "__main__":
    asyncio.run(main()) 