"""
Legislative Bill Clustering Package

Provides functionality for clustering legislative bills by theme using embeddings.
"""

from .embeddings import EmbeddingGenerator
from .clustering import cluster_embeddings, reduce_dimensions
from .analysis import analyze_clusters, generate_cluster_report
from .data import fetch_bills, prepare_bill_text, get_week_dates
from .main import main

__all__ = [
    'EmbeddingGenerator',
    'cluster_embeddings',
    'reduce_dimensions',
    'analyze_clusters',
    'generate_cluster_report',
    'fetch_bills',
    'prepare_bill_text',
    'get_week_dates',
    'main'
] 