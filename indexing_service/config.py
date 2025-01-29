import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env.local
load_dotenv('.env.local')

# Parse LEGISCAN_DB_URL and convert to SQLAlchemy format
db_url = os.getenv('LEGISCAN_DB_URL')
if not db_url:
    raise ValueError("LEGISCAN_DB_URL environment variable is required")

# Convert the URL to async SQLAlchemy format
parsed = urlparse(db_url)
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://{parsed.netloc}{parsed.path}?{parsed.query}"

# Model configuration from environment
MODEL_NAME = os.getenv('SERVER_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')  # Server-side PyTorch model
EMBEDDING_MAX_LENGTH = int(os.getenv('EMBEDDING_MAX_LENGTH', '512'))  # Server-side only
BATCH_SIZE = int(os.getenv('EMBEDDING_BATCH_SIZE', '100'))  # Server-side only
EMBEDDING_DIMENSION = 384  # This is fixed for the MiniLM model

# Processing configuration
# TODO: Evaluate more sophisticated text processing approaches:
# 1. Sliding window for long texts
# 2. Hierarchical embeddings (title + content separately)
# 3. Custom chunking strategies for bills with long descriptions
MAX_TEXT_LENGTH = EMBEDDING_MAX_LENGTH  # Match tokenizer's max length

# State mapping for improved search
STATE_MAPPING = {
    'US': 'United States Congress',  # Federal level
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'DC': 'District of Columbia'
} 