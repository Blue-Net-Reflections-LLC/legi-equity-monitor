"""
Cluster storage operations with dry-run capability.
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Any
import numpy as np
import asyncpg

logger = logging.getLogger(__name__)

def generate_cluster_dml(clusters: list, metadata: list, embeddings: np.ndarray, labels: np.ndarray, 
                   dry_run: bool = False, batch_size: int = 1000, week: int = None, year: int = None):
    """Generate batched DML statements for storing clusters and their relationships."""
    logger.info(f"Generating cluster DML statements for week {week}, year {year}...")
    
    # Initialize batches
    cluster_batches = []
    bill_batches = []
    analysis_batches = []
    current_cluster_batch = []
    current_bill_batch = []
    current_analysis_batch = []
    
    # Process each cluster
    for cluster_info in clusters:
        cluster_id = cluster_info['cluster_id']
        
        # Add cluster info to batch
        current_cluster_batch.append({
            'cluster_id': cluster_id,
            'cluster_name': f'Cluster {cluster_id[:8]}',  # Use first 8 chars of UUID
            'bill_count': cluster_info['size'],
            'state_count': cluster_info['states'],
            'min_date': cluster_info['min_date'],
            'max_date': cluster_info['max_date'],
            'cluster_description': '',  # Can be populated later with analysis
            'cluster_week': week,  # Add week tracking
            'cluster_year': year,  # Add year tracking
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        logger.debug(f"Added cluster {cluster_id} with week={week}, year={year}")
        
        # Add pending analysis record
        current_analysis_batch.append({
            'analysis_id': uuid.uuid4(),
            'cluster_id': cluster_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        # Process bills in this cluster
        for bill in cluster_info['bills']:
            current_bill_batch.append({
                'cluster_id': cluster_id,
                'bill_id': bill['bill_id'],
                'distance_to_centroid': bill['distance'],
                'membership_confidence': bill['confidence'],
                'added_at': datetime.utcnow()
            })
            
            # Check if bill batch is full
            if len(current_bill_batch) >= batch_size:
                bill_batches.append(current_bill_batch)
                current_bill_batch = []
        
        # Check if cluster batch is full
        if len(current_cluster_batch) >= batch_size:
            cluster_batches.append(current_cluster_batch)
            current_cluster_batch = []
            analysis_batches.append(current_analysis_batch)
            current_analysis_batch = []
    
    # Add any remaining items to batches
    if current_cluster_batch:
        cluster_batches.append(current_cluster_batch)
        analysis_batches.append(current_analysis_batch)
    if current_bill_batch:
        bill_batches.append(current_bill_batch)
    
    # Generate DML statements
    dml_statements = []
    
    # Cluster insert statements
    for batch in cluster_batches:
        cluster_ids = [c['cluster_id'] for c in batch]
        cluster_names = [c['cluster_name'] for c in batch]
        min_dates = [c['min_date'] for c in batch]
        max_dates = [c['max_date'] for c in batch]
        bill_counts = [c['bill_count'] for c in batch]
        state_counts = [c['state_count'] for c in batch]
        descriptions = [c['cluster_description'] for c in batch]
        cluster_weeks = [c['cluster_week'] for c in batch]
        cluster_years = [c['cluster_year'] for c in batch]
        created_ats = [c['created_at'] for c in batch]
        updated_ats = [c['updated_at'] for c in batch]
        
        stmt = """
        INSERT INTO legislation_clusters (
            cluster_id, cluster_name, min_date, max_date, 
            bill_count, state_count, cluster_description,
            cluster_week, cluster_year,
            created_at, updated_at
        ) SELECT * FROM unnest(
            $1::uuid[], $2::varchar[], $3::date[], $4::date[],
            $5::integer[], $6::integer[], $7::text[],
            $8::integer[], $9::integer[],
            $10::timestamptz[], $11::timestamptz[]
        )
        """
        dml_statements.append((stmt, (
            cluster_ids, cluster_names, min_dates, max_dates,
            bill_counts, state_counts, descriptions,
            cluster_weeks, cluster_years,
            created_ats, updated_ats
        )))
        
        if dry_run:
            logger.info(f"Would insert {len(batch)} clusters")
    
    # Analysis insert statements
    for batch in analysis_batches:
        analysis_ids = [a['analysis_id'] for a in batch]
        cluster_ids = [a['cluster_id'] for a in batch]
        created_ats = [a['created_at'] for a in batch]
        updated_ats = [a['updated_at'] for a in batch]
        
        stmt = """
        INSERT INTO cluster_analysis (
            analysis_id, cluster_id, status, created_at, updated_at
        ) SELECT * FROM unnest(
            $1::uuid[], $2::uuid[], $3::analysis_status[], $4::timestamptz[], $5::timestamptz[]
        )
        """
        dml_statements.append((stmt, (
            analysis_ids, cluster_ids, 
            ['pending'] * len(batch),  # Default status for all records
            created_ats, updated_ats
        )))
        
        if dry_run:
            logger.info(f"Would insert {len(batch)} pending analysis records")
    
    # Bill membership insert statements
    for batch in bill_batches:
        cluster_ids = [b['cluster_id'] for b in batch]
        bill_ids = [b['bill_id'] for b in batch]
        distances = [b['distance_to_centroid'] for b in batch]
        confidences = [b['membership_confidence'] for b in batch]
        added_ats = [b['added_at'] for b in batch]
        
        stmt = """
        INSERT INTO cluster_bills (
            cluster_id, bill_id, distance_to_centroid, membership_confidence, added_at
        ) SELECT * FROM unnest(
            $1::uuid[], $2::integer[], $3::float[], $4::float[], $5::timestamptz[]
        )
        """
        dml_statements.append((stmt, (
            cluster_ids, bill_ids, distances, confidences, added_ats
        )))
        
        if dry_run:
            logger.info(f"Would insert {len(batch)} bill memberships")
    
    return dml_statements

async def store_clusters(
    conn: asyncpg.Connection,
    clusters: list,  # Changed from Dict to list to match analyze_clusters output
    metadata: list,  # Changed from Dict to list to match analyze_clusters output
    embeddings: np.ndarray,
    labels: np.ndarray,
    batch_size: int = 1000,
    dry_run: bool = False,
    week: int = None,
    year: int = None
) -> None:
    """
    Store clustering results in the database using batched operations.
    
    Args:
        conn: asyncpg connection
        clusters: List of cluster information
        metadata: List of bill metadata
        embeddings: Original embeddings array
        labels: Cluster labels array
        batch_size: Number of records per batch
        dry_run: If True, execute SQL but rollback transaction
        week: Week number for tracking
        year: Year for tracking
    """
    logger.info(f"Starting store_clusters with week={week}, year={year}")
    try:
        async with conn.transaction():
            # Generate DML statements
            dml_statements = generate_cluster_dml(
                clusters=clusters,
                metadata=metadata,
                embeddings=embeddings,
                labels=labels,
                dry_run=dry_run,  # Pass through dry_run flag
                batch_size=batch_size,
                week=week,  # Pass week parameter
                year=year   # Pass year parameter
            )
            
            # Execute each statement in the transaction
            for sql, params in dml_statements:
                # params is already a tuple of values, no need to convert
                await conn.execute(sql, *params)
            
            if dry_run:
                # Log what would have been stored
                logger.info(f"DRY RUN - Would store {len(clusters)} clusters")
                logger.info("Rolling back transaction...")
                raise asyncpg.TransactionRollbackError("Dry run - rolling back")
            
            logger.info(f"Successfully stored {len(clusters)} clusters")
        
    except asyncpg.TransactionRollbackError as e:
        if not dry_run:
            logger.error(f"Transaction rolled back: {str(e)}")
            raise
    except Exception as e:
        logger.error(f"Error storing clusters: {str(e)}")
        raise 