"""
Embeddings generation module using BGE-M3 model.
"""

import logging
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

from ..config import EMBEDDING_MAX_LENGTH

logger = logging.getLogger(__name__)

# Add default paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_DIR = MODELS_DIR / "bge-m3"

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

    def generate_embeddings(self, texts: list[str], batch_size: int = 32) -> np.ndarray:
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