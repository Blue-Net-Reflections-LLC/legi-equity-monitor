import os
import ssl
import logging
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env.local if it exists
env_path = Path('.env.local')
if env_path.exists():
    logger.info(f"Loading environment from {env_path}")
    load_dotenv(env_path, override=True)
else:
    logger.warning(f"{env_path} not found")

# Parse LEGISCAN_DB_URL and convert to SQLAlchemy format
db_url = os.getenv('LEGISCAN_DB_URL')
if not db_url:
    raise ValueError("LEGISCAN_DB_URL environment variable is required")

# Parse the URL and handle SSL configuration
parsed = urlparse(db_url)
query_params = parse_qs(parsed.query)

# Remove sslmode from query string and handle it separately in connect_args
ssl_mode = query_params.pop('sslmode', ['prefer'])[0]

# Configure SSL based on environment variables
disable_ssl = os.getenv('DISABLE_SSL', '').lower()
reject_unauthorized = os.getenv('NODE_TLS_REJECT_UNAUTHORIZED', '1')

logger.info(f"SSL Configuration:")
logger.info(f"DISABLE_SSL raw value: {disable_ssl!r}")
logger.info(f"NODE_TLS_REJECT_UNAUTHORIZED raw value: {reject_unauthorized!r}")
logger.info(f"SSL mode from URL: {ssl_mode}")

# Always use SSL with verification disabled
logger.info("Using SSL with verification disabled")
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
connect_args = {'ssl': ssl_context}

logger.info(f"Final connect_args: {connect_args}")

# Reconstruct query string without sslmode
query_string = '&'.join(f"{k}={v[0]}" for k, v in query_params.items())
base_url = f"postgresql+asyncpg://{parsed.netloc}{parsed.path}"
SQLALCHEMY_DATABASE_URL = f"{base_url}{'?' + query_string if query_string else ''}"
SQLALCHEMY_CONNECT_ARGS = connect_args

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