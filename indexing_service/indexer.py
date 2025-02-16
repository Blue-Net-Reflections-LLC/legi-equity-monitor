import logging
from typing import List, Dict, Any
import asyncio
import re  # Add re for HTML stripping
import uuid
import struct

import torch
from transformers import AutoTokenizer, AutoModel
from sqlalchemy import select, join, text as sql_text, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from tqdm import tqdm
import numpy as np

from config import (
    SQLALCHEMY_DATABASE_URL, SQLALCHEMY_CONNECT_ARGS, MODEL_NAME, BATCH_SIZE, 
    MAX_TEXT_LENGTH, STATE_MAPPING, EMBEDDING_MAX_LENGTH
)
from models import VectorIndex, Bill, Sponsor, Party, State, Body, Committee, BlogPost

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def uuid_to_int32(uuid_str: str) -> int:
    """
    Convert a UUID to a 32-bit integer deterministically.
    This function extracts the last 4 bytes of the UUID
    as a signed integer, suitable for a PostgreSQL INT column.
    """
    # Parse the string to a UUID object
    uuid_obj = uuid.UUID(uuid_str)
    
    # Unpack the last 4 bytes as a signed 32-bit integer (big-endian)
    int_val = struct.unpack('>i', uuid_obj.bytes[-4:])[0]
    return int_val


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

    def _prepare_blog_text(self, blog: Dict[str, Any]) -> str:
        """Prepare blog post text for embedding."""
        # Remove HTML tags from content
        content = re.sub(r'<[^>]+>', '', blog['content'])
        
        components = [
            blog['title'],
            content,
            # Join keywords if they exist
            ' '.join(blog['post_metadata'].get('keywords', [])) if blog['post_metadata'] and blog['post_metadata'].get('keywords') else ''
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

    async def _get_blog_posts_to_update(self, session: AsyncSession) -> List[Dict[str, Any]]:
        """Get blog posts that need updating based on updated_at timestamp."""
        result = await session.execute(
            sql_text("""
                SELECT 
                    post_id,
                    title,
                    content,
                    metadata as post_metadata,
                    EXTRACT(epoch FROM updated_at)::text as changed_hash
                FROM blog_posts b
                LEFT JOIN vector_index v ON 
                    v.entity_uuid = b.post_id AND 
                    v.entity_type = 'blog_post'
                WHERE v.source_hash IS NULL 
                    OR v.source_hash != EXTRACT(epoch FROM b.updated_at)::text
                LIMIT :batch_size
            """),
            {"batch_size": BATCH_SIZE}
        )
        
        return [
            {
                'post_id': uuid_to_int32(str(row.post_id)),  # Convert UUID to int32 using our helper function
                'uuid': row.post_id,  # Keep original UUID for entity_uuid
                'title': row.title,
                'content': row.content,
                'post_metadata': row.post_metadata,
                'changed_hash': row.changed_hash,
                'state_abbr': 'US',  # Blog posts are national by default
                'state_name': 'United States'
            }
            for row in result.fetchall()
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
        search_texts = [prepare_text_func(item) for item in items]
        embeddings = self._batch_generate_embeddings(search_texts)

        # Update database using raw SQL for upsert
        for item, search_text, embedding in zip(items, search_texts, embeddings):
            # Convert numpy array to list and format as PostgreSQL vector literal
            vector_str = f"[{','.join(str(x) for x in embedding.tolist())}]"
            
            # Prepare parameters based on entity typeA
            params = {
                'entity_type': entity_type,
                'entity_id': item['post_id'],  #if entity_type == 'blog_post' else item[f'{entity_type}_id'],
                'entity_uuid': item.get('uuid'),  # Only set for blog posts
                'search_text': search_text,
                'embedding': vector_str,
                'source_hash': item['changed_hash'],
                'state_abbr': item['state_abbr'],
                'state_name': item['state_name'] if entity_type == 'blog_post' else STATE_MAPPING.get(item['state_abbr'], '')
            }

#            for key, value in params.items():
#                print(f"gitrParameter {key}: {value} (type: {type(value)})")
            
            # Execute the upsert
            await session.execute(
                sql_text("""
                    INSERT INTO vector_index (
                        entity_type, entity_id, entity_uuid, search_text, embedding, 
                        source_hash, state_abbr, state_name
                    ) VALUES (
                        :entity_type, :entity_id, :entity_uuid, :search_text, :embedding,
                        :source_hash, :state_abbr, :state_name
                    )
                    ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                        entity_uuid = EXCLUDED.entity_uuid,
                        search_text = EXCLUDED.search_text,
                        embedding = EXCLUDED.embedding,
                        source_hash = EXCLUDED.source_hash,
                        state_abbr = EXCLUDED.state_abbr,
                        state_name = EXCLUDED.state_name,
                        indexed_at = CURRENT_TIMESTAMP
                """),
                params
            )

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

            # Update blog posts
            blog_posts = await self._get_blog_posts_to_update(session)
            if blog_posts:
                logger.info(f"Updating {len(blog_posts)} blog posts")
                await self._update_vector_index(
                    session, blog_posts, 'blog_post', self._prepare_blog_text
                )

            # Verify counts
            result = await session.execute(
                sql_text("SELECT entity_type, COUNT(*) FROM vector_index GROUP BY entity_type")
            )
            for type_, count in result.fetchall():
                logger.info(f"Total embeddings for {type_}: {count}")

            logger.info("Update completed")

async def main():
    indexer = VectorIndexer()
    try:
        while True:  # Run until no more items
            async with indexer.Session() as session:
                # Check if there are any items to process
                bills = await indexer._get_bills_to_update(session)
                sponsors = await indexer._get_sponsors_to_update(session)
                blog_posts = await indexer._get_blog_posts_to_update(session)
                
                if not bills and not sponsors and not blog_posts:
                    logger.info("No more items to process. Exiting...")
                    break
                
                # Process items
                await indexer.update_index()
                
                # Small delay to prevent hammering the database
                await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received interrupt signal. Shutting down gracefully...")
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        raise
    finally:
        await indexer.engine.dispose()
        logger.info("Indexer shutdown complete")

if __name__ == "__main__":
    asyncio.run(main()) 