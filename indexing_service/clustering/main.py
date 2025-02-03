"""
Main entry point for the clustering service.
"""

import logging
import asyncio
import argparse
from pathlib import Path

from .embeddings import EmbeddingGenerator
from .clustering import cluster_embeddings, reduce_dimensions
from .analysis import analyze_clusters, generate_cluster_report
from .data import fetch_bills

# Configure logger
logger = logging.getLogger(__name__)

# Add default paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_DIR = MODELS_DIR / "bge-m3"

async def main():
    parser = argparse.ArgumentParser(description='Bill clustering service')
    parser.add_argument('-week', type=int, help='Week number (1-53)', required=True)
    parser.add_argument('-year', type=int, help='Year', required=True)
    parser.add_argument('--test-fetch', action='store_true', help='Only test fetching bills')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--model-path', type=str, default=str(DEFAULT_MODEL_DIR), 
                       help='Path to the model directory (absolute path or relative to project root)')
    parser.add_argument('--use-local', action='store_true', help='Use local model files only')
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        # 1. Fetch bills and generate embeddings
        texts, metadata = await fetch_bills(
            args.week, 
            args.year, 
            args.test_fetch,
            model_path=args.model_path,
            use_local=args.use_local
        )
        
        if texts is None or len(texts) == 0:
            return
            
        # Generate embeddings
        logger.info("\nGenerating embeddings...")
        embedding_generator = EmbeddingGenerator(model_path=args.model_path, use_local=args.use_local)
        embeddings = embedding_generator.generate_embeddings(texts)
            
        # 2. Reduce dimensions
        reduced_embeddings = reduce_dimensions(embeddings)
        
        # 3. Cluster
        labels, probabilities = cluster_embeddings(reduced_embeddings)
        
        # 4. Analyze results and get clusters
        clusters = analyze_clusters(embeddings, reduced_embeddings, labels, probabilities, metadata)
        
        # 5. Generate clustering report
        generate_cluster_report(clusters, metadata, embeddings, labels)
            
    except ValueError as ve:
        logger.error(f"Invalid input: {str(ve)}")
        exit(1)
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 