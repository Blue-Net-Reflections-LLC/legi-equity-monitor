"""
Core clustering functionality using UMAP and HDBSCAN.
"""

import logging
import numpy as np
from sklearn.preprocessing import normalize
from umap import UMAP
import hdbscan

logger = logging.getLogger(__name__)

def reduce_dimensions(embeddings: np.ndarray) -> np.ndarray:
    """Reduce embedding dimensions using UMAP."""
    logger.info("\nReducing dimensions from 1024 to 256...")
    
    # Normalize embeddings
    normalized = normalize(embeddings)
    
    # Configure UMAP - increase dimensions and adjust for better separation
    reducer = UMAP(
        n_components=256,          # Increased from 128 to preserve more information
        n_neighbors=50,           # Increased to capture more global structure
        min_dist=0.05,           # Reduced to allow tighter clusters
        metric='cosine',
        random_state=42
    )
    
    # Reduce dimensions
    reduced = reducer.fit_transform(normalized)
    logger.info(f"Reduced shape: {reduced.shape}")
    
    return reduced

def cluster_embeddings(reduced_embeddings: np.ndarray):
    """Perform clustering on reduced embeddings."""
    logger.info("\nClustering reduced embeddings...")
    
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=12,      # Reduced from 15 to allow more granular clusters
        min_samples=4,            # Increased from 3 for more reliable clusters
        cluster_selection_epsilon=0.2,  # Increased from 0.15 to merge similar clusters
        metric='euclidean',
        cluster_selection_method='eom',  # Keep EOM for better separation
        prediction_data=True
    )
    
    labels = clusterer.fit_predict(reduced_embeddings)
    probabilities = getattr(clusterer, 'probabilities_', None)
    
    # Log clustering stats
    unique_labels = set(labels)
    n_clusters = len(unique_labels) - (1 if -1 in labels else 0)
    n_noise = list(labels).count(-1)
    cluster_sizes = [list(labels).count(i) for i in range(max(labels) + 1)]
    
    logger.info(f"\nClustering Statistics:")
    logger.info(f"Number of clusters: {n_clusters}")
    logger.info(f"Noise points: {n_noise} ({n_noise/len(labels):.1%})")
    if cluster_sizes:
        logger.info(f"Cluster sizes: min={min(cluster_sizes)}, max={max(cluster_sizes)}, avg={sum(cluster_sizes)/len(cluster_sizes):.1f}")
    
    return labels, probabilities 