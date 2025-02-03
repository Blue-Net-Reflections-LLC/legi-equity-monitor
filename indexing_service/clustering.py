"""
Legislative Bill Clustering Service

Fetches bills directly from ls_bill, generates embeddings, and clusters by theme.
"""

from .clustering.main import main

__all__ = ['main']

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 