import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import asyncpg
import sqlalchemy
import dotenv
import os

# Load environment variables
dotenv.load_dotenv()

def test_torch():
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA device: {torch.cuda.get_device_name(0)}")

def test_transformers():
    model_name = os.getenv('SERVER_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
    print(f"\nLoading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    print("Model loaded successfully")

def print_versions():
    print(f"\nNumPy version: {np.__version__}")
    print(f"SQLAlchemy version: {sqlalchemy.__version__}")
    try:
        # python-dotenv version can be accessed through dotenv.version
        print(f"python-dotenv version: {dotenv.version.__version__}")
    except:
        print("python-dotenv is installed but version info not available")

if __name__ == "__main__":
    print("Testing environment setup...")
    test_torch()
    test_transformers()
    print_versions()
    print("\nAll tests completed successfully!") 