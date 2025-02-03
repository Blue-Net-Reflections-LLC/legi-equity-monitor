"""
Legislative Bill Clustering Service

Fetches bills directly from ls_bill, generates embeddings, and clusters by theme.
"""

import logging
import asyncio
import argparse
from datetime import datetime, timedelta
from urllib.parse import urlparse
import uuid
from typing import List, Dict, Any
import time
from pathlib import Path
import re

import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel
from sklearn.preprocessing import normalize
from umap import UMAP
import hdbscan
import asyncpg
from huggingface_hub import HfFolder
from requests.exceptions import ReadTimeout, ConnectionError

try:
    import cupy as cp
    CUDA_AVAILABLE = True
except ImportError:
    CUDA_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("CUDA (cupy) not available. Using CPU for distance calculations.")

from config import (
    SQLALCHEMY_DATABASE_URL, SQLALCHEMY_CONNECT_ARGS, MODEL_NAME,
    EMBEDDING_MAX_LENGTH, MAX_TEXT_LENGTH
)

logger = logging.getLogger(__name__)

# Add default paths
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_DIR = MODELS_DIR / "bge-m3"

def get_week_dates(week: int, year: int):
    """Get start and end dates for a week number in a year."""
    first_day = datetime(year, 1, 1)
    while first_day.weekday() != 0:
        first_day += timedelta(days=1)
    
    start_date = first_day + timedelta(weeks=week-1)
    end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    return start_date, end_date

def validate_model_path(model_path: str) -> Path:
    """Validate and return the model path."""
    if model_path == "BAAI/bge-m3":
        return model_path
        
    path = Path(model_path)
    if not path.is_absolute():
        # Always use models directory as base
        path = MODELS_DIR / path
    
    if not path.exists():
        raise ValueError(f"Model path does not exist: {path}")
    
    if not (path / "config.json").exists():
        raise ValueError(f"Invalid model directory, missing config.json: {path}")
        
    return path

class EmbeddingGenerator:
    def __init__(self, model_path: str = "BAAI/bge-m3", use_local: bool = False):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Using device: {self.device}")
        
        # Ensure models directory exists
        MODELS_DIR.mkdir(exist_ok=True)
        
        # Initialize model
        try:
            self.model_path = validate_model_path(model_path)
            logger.info(f"Loading model from: {self.model_path}")
            
            # Load model from local path if specified
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                local_files_only=use_local
            )
            self.model = AutoModel.from_pretrained(
                self.model_path,
                local_files_only=use_local
            ).to(self.device)
            
            self.model.eval()
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            if use_local:
                logger.error(f"Make sure the model is downloaded to: {MODELS_DIR}")
            raise

    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for a list of texts using BGE-M3."""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            with torch.no_grad():
                # Note: BGE-M3 doesn't need instruction prefix
                
                # Tokenize and move to device
                inputs = self.tokenizer(
                    batch,
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
                batch_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
                
                # Normalize embeddings
                batch_embeddings = torch.nn.functional.normalize(batch_embeddings, p=2, dim=1)
                
                embeddings.extend(batch_embeddings.cpu().numpy())
                
            if i % 1000 == 0 and i > 0:
                logger.info(f"Processed {i}/{len(texts)} texts")
        
        return np.array(embeddings)

def prepare_bill_text(bill: Dict[str, Any]) -> str:
    """Prepare bill text for embedding by combining title and description."""
    title = (bill['title'] or '').strip()
    description = (bill['description'] or '').strip()
    
    # If either is missing, use the other
    if not title:
        return description[:MAX_TEXT_LENGTH]
    if not description:
        return title[:MAX_TEXT_LENGTH]
    
    # Remove state-specific patterns
    patterns_to_remove = [
        # State code references
        r'^AN ACT to amend [A-Za-z\s]+ Code[^.]+\.',  # Matches any state code reference
        r'Chapter \d+[^.]+\.',  # Chapter references
        r'Title \d+[^.]+\.',    # Title references
        r'Section \d+[^.]+\.',  # Section references
        
        # Common prefixes
        r'^Budget Act of \d{4}\.',  # Budget acts
        r'^As introduced,\s*',
        r'An act to\s+',
        r'An act relating to\s+',
        r'Relating to\s+',
        r'Concerning\s+',
        
        # Bill numbers and identifiers
        r'\([A-Z]+\d+\)',  # Bill numbers in parentheses
        r'Bill No\. \d+',
        r'Senate Bill \d+',
        r'House Bill \d+',
        
        # State-specific terms
        r'the state of [A-Za-z\s]+',
        r'this state[\'s]*',
        r'state legislature',
        r'general assembly',
    ]
    
    for pattern in patterns_to_remove:
        title = re.sub(pattern, '', title, flags=re.IGNORECASE)
        description = re.sub(pattern, '', description, flags=re.IGNORECASE)
    
    # Remove all-caps titles and normalize case
    if title.isupper():
        title = title.title()
    if description.isupper():
        description = description.title()
    
    # Clean up whitespace and punctuation
    def clean_text(text):
        # Remove multiple spaces
        text = ' '.join(text.split())
        # Remove multiple periods
        text = re.sub(r'\.+', '.', text)
        # Remove leading/trailing punctuation
        text = text.strip('.,; ')
        return text
    
    title = clean_text(title)
    description = clean_text(description)
    
    # If texts are too similar or empty after cleaning, use the most informative one
    if not title or not description:
        return (title or description)[:MAX_TEXT_LENGTH]
    
    if title.lower() == description.lower():
        return title[:MAX_TEXT_LENGTH]
    
    # If description starts with title, use just description
    if description.lower().startswith(title.lower()):
        return description[:MAX_TEXT_LENGTH]
    
    # If either is a subset of the other, use the longer one
    if title.lower() in description.lower():
        return description[:MAX_TEXT_LENGTH]
    if description.lower() in title.lower():
        return title[:MAX_TEXT_LENGTH]
    
    # Combine title and description
    return f"{title}\n\n{description}"[:MAX_TEXT_LENGTH]

def analyze_bill_data(metadata: list, texts: List[str]):
    """Analyze bill data to identify patterns and potential data quality issues."""
    logger.info("\nAnalyzing bill data patterns...")
    
    # Group bills by state
    state_bills = {}
    for i, (meta, text) in enumerate(zip(metadata, texts)):
        state = meta['state']
        if state not in state_bills:
            state_bills[state] = []
        state_bills[state].append({
            'bill_id': meta['bill_id'],
            'bill_number': meta['bill_number'],
            'text': text,
            'created': meta['created']
        })
    
    # Analyze problematic states
    problem_states = ['Illinois', 'California', 'Tennessee']
    for state in problem_states:
        if state not in state_bills:
            continue
            
        bills = state_bills[state]
        logger.info(f"\n{state} Analysis:")
        logger.info(f"Total bills: {len(bills)}")
        
        # Check for duplicate texts
        unique_texts = set(b['text'] for b in bills)
        logger.info(f"Unique texts: {len(unique_texts)} ({len(unique_texts)/len(bills):.1%} of total)")
        
        # Analyze text patterns
        text_lengths = [len(b['text']) for b in bills]
        logger.info(f"Text length stats:")
        logger.info(f"  Min: {min(text_lengths)}")
        logger.info(f"  Max: {max(text_lengths)}")
        logger.info(f"  Avg: {sum(text_lengths)/len(text_lengths):.1f}")
        
        # Look for common prefixes/patterns
        logger.info(f"\nExample bills:")
        for bill in bills[:5]:
            logger.info(f"\nBill {bill['bill_id']} ({bill['bill_number']}):")
            logger.info(f"Created: {bill['created']}")
            logger.info(f"Text: {bill['text'][:200]}...")

async def fetch_bills(week: int, year: int, test_mode: bool = False, model_path: str = "BAAI/bge-m3", use_local: bool = False):
    """Fetch bills directly from ls_bill table."""
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
        # Get overview of bills
        overview = await conn.fetchrow("""
            SELECT COUNT(*) as total,
                   COUNT(DISTINCT state_id) as states,
                   MIN(created) as earliest,
                   MAX(created) as latest
            FROM ls_bill;
        """)
        
        logger.info("\nDatabase Overview:")
        logger.info(f"Total bills: {overview['total']}")
        logger.info(f"States: {overview['states']}")
        logger.info(f"Date range: {overview['earliest']} to {overview['latest']}")
        
        # Fetch bills with just the needed fields
        query = """
            SELECT 
                b.bill_id,
                b.bill_number,
                b.title,
                b.description,
                b.created,
                s.state_name,
                s.state_abbr
            FROM ls_bill b
            JOIN ls_state s ON b.state_id = s.state_id
            WHERE b.created >= $1
            AND b.created < $2
            ORDER BY b.created;
        """
        
        logger.info(f"\nFetching bills between:")
        logger.info(f"Start: {start_date}")
        logger.info(f"End: {end_date}")
        
        rows = await conn.fetch(query, start_date, end_date)
        logger.info(f"\nFound {len(rows)} bills for week {week} of {year}")
        
        if test_mode:
            for row in rows[:5]:
                logger.info(f"Bill {row['bill_id']} ({row['bill_number']}) from {row['state_name']}")
                logger.info(f"Title: {row['title'][:100]}...")
            return None, None
        
        # Prepare texts and metadata
        texts = []
        metadata = []
        
        for row in rows:
            text = prepare_bill_text(dict(row))
            texts.append(text)
            metadata.append({
                'bill_id': row['bill_id'],
                'bill_number': row['bill_number'],
                'state': row['state_name'],
                'state_abbr': row['state_abbr'],
                'created': row['created']
            })
        
        # Analyze bill data before generating embeddings
        analyze_bill_data(metadata, texts)
        
        # Generate embeddings
        logger.info("\nGenerating embeddings...")
        embedding_generator = EmbeddingGenerator(model_path=model_path, use_local=use_local)
        embeddings = embedding_generator.generate_embeddings(texts)
        
        return embeddings, metadata
        
    finally:
        await conn.close()

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
        # 1. Fetch bills
        embeddings, metadata = await fetch_bills(
            args.week, 
            args.year, 
            args.test_fetch,
            model_path=args.model_path,
            use_local=args.use_local
        )
        
        if embeddings is None or len(embeddings) == 0:
            return
            
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