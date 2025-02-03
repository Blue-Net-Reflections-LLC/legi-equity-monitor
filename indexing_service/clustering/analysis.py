"""
Cluster analysis and report generation functionality.
"""

import logging
import uuid
from datetime import datetime
from pathlib import Path
import numpy as np

try:
    import cupy as cp
    CUDA_AVAILABLE = True
except ImportError:
    CUDA_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("CUDA (cupy) not available. Using CPU for distance calculations.")

logger = logging.getLogger(__name__)

# Add default paths
PROJECT_ROOT = Path(__file__).parent.parent.parent

def analyze_clusters(embeddings: np.ndarray, reduced_embeddings: np.ndarray, 
                    labels: np.ndarray, probabilities: np.ndarray, metadata: list):
    """Analyze clustering results."""
    if CUDA_AVAILABLE:
        # Use GPU for calculations
        embeddings_gpu = cp.array(embeddings)
    else:
        # Use CPU for calculations
        embeddings_gpu = embeddings
    
    unique_labels = set(labels)
    n_clusters = len(unique_labels) - (1 if -1 in labels else 0)
    n_noise = list(labels).count(-1)
    
    logger.info("\nClustering Results:")
    logger.info(f"Number of clusters: {n_clusters}")
    logger.info(f"Noise points: {n_noise} ({n_noise/len(labels):.1%} of total)")
    
    # Calculate overall state distribution
    all_states = set(m['state'] for m in metadata)
    logger.info(f"Total states in dataset: {len(all_states)}")
    
    clusters = []
    
    # Process each cluster
    for label in sorted(list(unique_labels)):
        if label == -1:
            continue
            
        # Get indices of bills in this cluster
        cluster_mask = labels == label
        cluster_indices = np.where(cluster_mask)[0]
        
        # Calculate cluster statistics
        cluster_bills = [metadata[i] for i in cluster_indices]
        state_counts = {}
        for bill in cluster_bills:
            state_counts[bill['state']] = state_counts.get(bill['state'], 0) + 1
            
        dates = [b['created'] for b in cluster_bills]
        
        # Calculate state diversity metrics
        n_states = len(state_counts)
        state_distribution = {state: count/len(cluster_bills) for state, count in state_counts.items()}
        max_state_percentage = max(state_distribution.values())
        
        if CUDA_AVAILABLE:
            # Calculate centroids and distances on GPU
            centroid = cp.mean(embeddings_gpu[cluster_mask], axis=0)
            reduced_centroid = cp.mean(cp.array(reduced_embeddings[cluster_mask]), axis=0)
            distances = cp.linalg.norm(embeddings_gpu[cluster_mask] - centroid, axis=1)
            centroid = cp.asnumpy(centroid)
            reduced_centroid = cp.asnumpy(reduced_centroid)
            distances_cpu = cp.asnumpy(distances)
            avg_distance = float(cp.mean(distances))
            max_distance = float(cp.max(distances))
        else:
            # Calculate centroids and distances on CPU
            centroid = np.mean(embeddings[cluster_mask], axis=0)
            reduced_centroid = np.mean(reduced_embeddings[cluster_mask], axis=0)
            distances = np.linalg.norm(embeddings[cluster_mask] - centroid, axis=1)
            distances_cpu = distances
            avg_distance = float(np.mean(distances))
            max_distance = float(np.max(distances))
        
        # Create cluster info
        cluster_info = {
            'cluster_id': str(uuid.uuid4()),
            'size': len(cluster_bills),
            'states': n_states,
            'state_distribution': state_distribution,
            'max_state_percentage': max_state_percentage,
            'min_date': min(dates),
            'max_date': max(dates),
            'centroid': centroid,
            'reduced_centroid': reduced_centroid,
            'avg_distance': avg_distance,
            'max_distance': max_distance,
            'bills': []
        }
        
        # Add bill details
        for idx, bill_idx in enumerate(cluster_indices):
            cluster_info['bills'].append({
                'bill_id': metadata[bill_idx]['bill_id'],
                'state': metadata[bill_idx]['state'],
                'distance': float(distances_cpu[idx]),
                'confidence': float(probabilities[bill_idx]) if probabilities is not None else None
            })
        
        clusters.append(cluster_info)
        
        # Log cluster summary with state distribution
        logger.info(f"\nCluster {label}:")
        logger.info(f"Size: {cluster_info['size']} bills")
        logger.info(f"States: {n_states} states")
        logger.info(f"State distribution:")
        for state, pct in sorted(state_distribution.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {state}: {pct:.1%}")
        logger.info(f"Date range: {cluster_info['min_date']} to {cluster_info['max_date']}")
        logger.info("Example bills:")
        for bill in sorted(cluster_info['bills'], key=lambda x: x['distance'])[:5]:
            logger.info(f"- Bill {bill['bill_id']} from {bill['state']}")
            logger.info(f"  Distance: {bill['distance']:.3f}, Confidence: {bill['confidence']:.3f}")
    
    return clusters

def generate_cluster_report(clusters: list, metadata: list, embeddings: np.ndarray, labels: np.ndarray):
    """Generate a detailed report of clustering results and save to file."""
    logger.info("\nGenerating Clustering Report...")
    
    # Create reports directory if it doesn't exist
    reports_dir = PROJECT_ROOT / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    # Create report filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = reports_dir / f"cluster_report_{timestamp}.txt"
    
    with open(report_file, 'w', encoding='utf-8') as f:
        def write_section(text):
            f.write(text + "\n")
            logger.info(text)
    
        # Overall Statistics
        unique_labels = set(labels)
        n_clusters = len(unique_labels) - (1 if -1 in labels else 0)
        n_noise = list(labels).count(-1)
        total_bills = len(labels)
        
        write_section("=" * 80)
        write_section("CLUSTERING REPORT")
        write_section("=" * 80)
        
        # 1. Summary Statistics
        write_section("\n1. SUMMARY STATISTICS")
        write_section("-" * 50)
        write_section(f"Total Bills Analyzed: {total_bills}")
        write_section(f"Number of Clusters: {n_clusters}")
        write_section(f"Noise Points: {n_noise} ({n_noise/total_bills:.1%})")
        
        # Calculate state coverage
        all_states = set(m['state'] for m in metadata)
        write_section(f"States Represented: {len(all_states)}")
        
        # 2. Cluster Size Distribution
        write_section("\n2. CLUSTER SIZE DISTRIBUTION")
        write_section("-" * 50)
        sizes = [list(labels).count(i) for i in range(max(labels) + 1)]
        write_section(f"Minimum Cluster Size: {min(sizes)}")
        write_section(f"Maximum Cluster Size: {max(sizes)}")
        write_section(f"Average Cluster Size: {sum(sizes)/len(sizes):.1f}")
        
        # Size brackets
        brackets = [(0,25), (26,50), (51,100), (101,200), (201,float('inf'))]
        for min_size, max_size in brackets:
            count = len([s for s in sizes if min_size <= s <= max_size])
            write_section(f"Clusters with {min_size}-{int(max_size) if max_size != float('inf') else '+'} bills: {count}")
        
        # 3. State Distribution Analysis
        write_section("\n3. STATE DISTRIBUTION PATTERNS")
        write_section("-" * 50)
        
        # Count clusters where each state appears
        state_cluster_counts = {}
        for state in all_states:
            count = 0
            for label in range(max(labels) + 1):
                cluster_bills = [m for i, m in enumerate(metadata) if labels[i] == label]
                if any(b['state'] == state for b in cluster_bills):
                    count += 1
            state_cluster_counts[state] = count
        
        # Show top states by cluster presence
        write_section("Top States by Cluster Presence:")
        for state, count in sorted(state_cluster_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            write_section(f"{state}: {count} clusters ({count/n_clusters:.1%})")
        
        # 4. Temporal Analysis
        write_section("\n4. TEMPORAL DISTRIBUTION")
        write_section("-" * 50)
        
        all_dates = [m['created'] for m in metadata]
        min_date = min(all_dates)
        max_date = max(all_dates)
        date_range = max_date - min_date
        
        write_section(f"Date Range: {date_range.days} days, {date_range.seconds//3600} hours")
        write_section(f"Earliest Bill: {min_date}")
        write_section(f"Latest Bill: {max_date}")
        
        # 5. Notable Clusters
        write_section("\n5. NOTABLE CLUSTERS")
        write_section("-" * 50)
        
        # Find clusters with interesting patterns
        for label in range(max(labels) + 1):
            cluster_bills = [m for i, m in enumerate(metadata) if labels[i] == label]
            if not cluster_bills:
                continue
                
            # Calculate state distribution
            state_counts = {}
            for bill in cluster_bills:
                state_counts[bill['state']] = state_counts.get(bill['state'], 0) + 1
            
            cluster_size = len(cluster_bills)
            n_states = len(state_counts)
            max_state_pct = max(count/cluster_size for count in state_counts.values())
            
            # Log interesting clusters
            if cluster_size >= 100 or max_state_pct >= 0.8 or n_states >= 20:
                write_section(f"\nCluster {label}:")
                write_section(f"Size: {cluster_size} bills")
                write_section(f"States: {n_states}")
                write_section("Top 3 States:")
                for state, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
                    write_section(f"  {state}: {count/cluster_size:.1%}")
        
        write_section("\n" + "=" * 80)
        
        # 6. Clustering Parameters
        write_section("\n6. CLUSTERING PARAMETERS")
        write_section("-" * 50)
        write_section("UMAP Configuration:")
        write_section("- Dimensions: 256")
        write_section("- n_neighbors: 50")
        write_section("- min_dist: 0.05")
        write_section("- metric: cosine")
        
        write_section("\nHDBSCAN Configuration:")
        write_section("- min_cluster_size: 12")
        write_section("- min_samples: 4")
        write_section("- cluster_selection_epsilon: 0.2")
        write_section("- metric: euclidean")
        write_section("- cluster_selection_method: eom")
    
    logger.info(f"\nReport saved to: {report_file}") 