"""
Legislative Bill Clustering Service

Fetches and clusters bills for a specific week.
"""

import logging
import asyncio
import argparse
from datetime import datetime, timedelta
from urllib.parse import urlparse

import numpy as np
import umap
import hdbscan
from sklearn.preprocessing import normalize
import asyncpg

from config import SQLALCHEMY_DATABASE_URL, SQLALCHEMY_CONNECT_ARGS

logger = logging.getLogger(__name__)

def get_week_dates(week: int, year: int):
    """Get start and end dates for a week number in a year."""
    # Get first day of the year
    first_day = datetime(year, 1, 1)
    
    # Get the first Monday of the year
    while first_day.weekday() != 0:  # 0 = Monday
        first_day += timedelta(days=1)
    
    # Calculate start and end of requested week
    start_date = first_day + timedelta(weeks=week-1)
    end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    return start_date, end_date

async def fetch_bills(week: int, year: int, test_mode: bool = False):
    """Fetch bills for a specific week."""
    start_date, end_date = get_week_dates(week, year)
    
    url = urlparse(SQLALCHEMY_DATABASE_URL.replace('postgresql+asyncpg://', 'postgres://'))
    conn = await asyncpg.connect(
        user=url.username,
        password=url.password,
        database=url.path[1:],
        host=url.hostname,
        port=url.port or 5432,
        ssl=SQLALCHEMY_CONNECT_ARGS.get('ssl')
    )
    
    try:
        # Get overview of all bills first
        overview = await conn.fetchrow("""
            SELECT COUNT(*) as total, 
                   MIN(indexed_at) as earliest,
                   MAX(indexed_at) as latest
            FROM vector_index 
            WHERE entity_type = 'bill';
        """)
        
        logger.info("\nDatabase Overview:")
        logger.info(f"Total bills: {overview['total']}")
        logger.info(f"Date range: {overview['earliest']} to {overview['latest']}")
        
        # Fetch bills for the specified week
        query = """
            SELECT 
                entity_id as bill_id,
                state_abbr,
                state_name,
                indexed_at,
                embedding
            FROM vector_index
            WHERE entity_type = 'bill'
            AND indexed_at >= $1
            AND indexed_at < $2
            ORDER BY indexed_at;
        """
        
        logger.info(f"\nFetching bills between:")
        logger.info(f"Start: {start_date}")
        logger.info(f"End: {end_date}")
        
        rows = await conn.fetch(query, start_date, end_date)
        logger.info(f"\nFound {len(rows)} bills for week {week} of {year}")
        
        if test_mode:
            # In test mode, just show the first few bills
            for row in rows[:5]:
                logger.info(f"Bill {row['bill_id']} from {row['state_name']} indexed at {row['indexed_at']}")
            return None, None
            
        # Parse embeddings for clustering
        embeddings = []
        metadata = []
        for row in rows:
            embeddings.append(row['embedding'])  # Now directly using the float array
            metadata.append({
                'bill_id': row['bill_id'],
                'state': row['state_name'],
                'indexed_at': row['indexed_at']
            })
            
        return np.array(embeddings), metadata
        
    finally:
        await conn.close()

async def cluster_bills(embeddings: np.ndarray, metadata: list[dict]):
    """Simple clustering pipeline to group similar bills."""
    try:
        if len(embeddings) == 0:
            logger.info("No bills to cluster")
            return
            
        logger.info(f"Clustering {len(embeddings)} bills")
        
        # 2. Normalize and reduce dimensions
        normalized = normalize(embeddings)
        reducer = umap.UMAP(
            n_components=32,  # Reduce to 32 dimensions
            n_neighbors=15,
            min_dist=0.1,
            metric='cosine',
            random_state=42
        )
        reduced = reducer.fit_transform(normalized)
        
        # 3. Cluster
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=5,  # Start with small clusters
            min_samples=3,
            metric='euclidean'
        )
        labels = clusterer.fit_predict(reduced)
        
        # 4. Analyze results
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_noise = list(labels).count(-1)
        
        logger.info(f"\nClustering Results:")
        logger.info(f"Number of clusters: {n_clusters}")
        logger.info(f"Noise points: {n_noise}")
        
        # Show example clusters
        for cluster_id in range(max(labels) + 1):
            cluster_bills = [m for l, m in zip(labels, metadata) if l == cluster_id][:5]
            if cluster_bills:
                logger.info(f"\nCluster {cluster_id} examples:")
                for bill in cluster_bills:
                    logger.info(f"Bill {bill['bill_id']} from {bill['state']}")
        
    except Exception as e:
        logger.error(f"Error in clustering: {str(e)}", exc_info=True)
        raise

async def main():
    parser = argparse.ArgumentParser(description='Bill clustering service')
    parser.add_argument('-week', type=int, help='Week number (1-53)', required=True)
    parser.add_argument('-year', type=int, help='Year', required=True)
    parser.add_argument('--test-fetch', action='store_true', help='Only test fetching bills')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        embeddings, metadata = await fetch_bills(args.week, args.year, args.test_fetch)
            
        if embeddings is None:
            return
            
        await cluster_bills(embeddings, metadata)
            
    except ValueError as ve:
        logger.error(f"Invalid input: {str(ve)}")
        exit(1)
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 