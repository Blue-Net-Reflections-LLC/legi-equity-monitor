"""
Entry point for the clustering package when run as a module.
"""

from .main import main

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 