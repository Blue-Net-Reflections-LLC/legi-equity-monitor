"""
Data fetching and preparation functionality.
"""

import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from urllib.parse import urlparse

import asyncpg

from ..config import (
    SQLALCHEMY_DATABASE_URL, SQLALCHEMY_CONNECT_ARGS,
    MAX_TEXT_LENGTH
)

logger = logging.getLogger(__name__)

def get_week_dates(week: int, year: int) -> Tuple[datetime, datetime]:
    """Get start and end dates for a week number in a year."""
    first_day = datetime(year, 1, 1)
    while first_day.weekday() != 0:
        first_day += timedelta(days=1)
    
    start_date = first_day + timedelta(weeks=week-1)
    end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    return start_date, end_date

def is_template_bill(title: str, description: str) -> bool:
    """Detect if a bill is a template/shell bill."""
    if not title or not description:
        return False
        
    # Check for Oklahoma template patterns
    ok_patterns = [
        # Standard format
        r'^[^;]+; Oklahoma [A-Za-z\s]+ Act of \d{4}; effective date\.$',
        # Variation without Oklahoma prefix
        r'^[^;]+; [A-Za-z\s]+ Act of \d{4}; effective date\.$',
        # Variation with period instead of semicolon
        r'^[^;]+; Oklahoma [A-Za-z\s]+ Act of \d{4}\. Effective date\.$',
        # Variation with additional details
        r'^[^;]+; Oklahoma [A-Za-z\s]+ Act of \d{4};[^.]+; effective date\.$',
        # Variation without semicolon prefix
        r'^[A-Za-z\s]+; Oklahoma [A-Za-z\s]+ Act of \d{4}; effective date\.$',
        # Variation with Emergency
        r'^[^;]+; Oklahoma [A-Za-z\s]+ Act of \d{4}; emergency\.$',
        # Variation with just Act of 2025
        r'^[^;]+; [A-Za-z\s]+ Act of \d{4}; effective date$'
    ]
    
    # Check for Illinois template patterns
    il_patterns = [
        # Technical change patterns
        r'^[A-Z\s-]+\-TECH$',  # Matches "LOCAL GOVERNMENT-TECH", "EDUCATION-TECH", etc.
        r'Makes a technical change in a Section concerning the short title\.$',
        r'Makes a technical change in the short title Section\.$',
        r'Contains only a short title provision\.$',
        # Common Illinois template descriptions
        r'^Amends the .+ Act\. Makes a technical change in a Section concerning .+\.$',
        r'^Creates the .+ Act\. Contains only a short title provision\.$'
    ]

    # Check for North Dakota template patterns
    nd_patterns = [
        # Common title patterns
        r'^The [a-z\s]+\.$',  # Matches simple titles like "The homestead tax credit."
        r'^[A-Za-z\s]+ and to provide [a-z\s]+\.$',  # Matches "X and to provide a penalty."
        
        # Common description patterns
        r'^A BILL for an Act to amend and reenact section \d+-\d+(?:-\d+)?(?:\.\d+)? of the North Dakota Century Code, relating to [^;]+(?:; and to provide (?:a penalty|an effective date|an appropriation|for application))?\.$',
        r'^A BILL for an Act to create and enact (?:a new section|new sections) to chapter \d+-\d+(?:\.\d+)? of the North Dakota Century Code, relating to [^;]+(?:; and to provide (?:a penalty|an effective date|an appropriation|for application))?\.$',
        
        # Extremely short titles that are likely templates
        r'^[A-Za-z\s]{1,25}\.$',  # Very short titles ending in period
        
        # Common boilerplate endings
        r'; and to provide a penalty\.$',
        r'; and to provide an effective date\.$',
        r'; and to provide an appropriation\.$',
        r'; and to provide for application\.$',
        r'; and to declare an emergency\.$'
    ]
    
    # Check title and description against all patterns
    return (
        any(bool(re.match(pattern, title, re.IGNORECASE)) for pattern in ok_patterns) or
        any(bool(re.match(pattern, title)) for pattern in il_patterns) or  # Case sensitive for IL title patterns
        any(bool(re.match(pattern, description)) for pattern in il_patterns) or  # Check description too
        any(bool(re.match(pattern, title)) for pattern in nd_patterns) or  # Check ND patterns
        any(bool(re.match(pattern, description)) for pattern in nd_patterns)  # Check ND patterns in description
    )

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
        # North Dakota specific patterns
        r'^A BILL for an Act to\s+',
        r'amend and reenact\s+(?:section|subsection|subdivision|paragraph|chapter)\s+[\d\.\-]+(?:\s+of\s+the\s+North\s+Dakota\s+Century\s+Code)?,?\s*',
        r'create and enact\s+(?:a new section|new sections|a new subdivision|new subdivisions|a new subsection|new subsections|a new paragraph|new paragraphs)\s+to\s+(?:section|chapter)\s+[\d\.\-]+(?:\s+of\s+the\s+North\s+Dakota\s+Century\s+Code)?,?\s*',
        r'repeal\s+(?:section|subsection|subdivision|paragraph|chapter)\s+[\d\.\-]+(?:\s+of\s+the\s+North\s+Dakota\s+Century\s+Code)?,?\s*',
        r'of the North Dakota Century Code,?\s*',
        r'relating to\s+',
        r';\s*and\s+to\s+provide\s+(?:a penalty|an effective date|an appropriation|for application)\s*',
        r';\s*and\s+to\s+declare\s+an\s+emergency\s*',
        r';\s*to\s+provide\s+for\s+a\s+legislative\s+management\s+(?:study|report)\s*',
        r';\s*to\s+provide\s+for\s+application\s*',
        r';\s*to\s+provide\s+a\s+continuing\s+appropriation\s*',
        r';\s*to\s+provide\s+legislative\s+intent\s*',
        r';\s*to\s+provide\s+for\s+retroactive\s+application\s*',
        r';\s*to\s+provide\s+an\s+expiration\s+date\s*',
        r';\s*to\s+provide\s+for\s+a\s+transfer\s*',
        r';\s*to\s+provide\s+for\s+a\s+report\s*',
        r';\s*to\s+provide\s+for\s+a\s+penalty\s*',
        r';\s*to\s+provide\s+for\s+an\s+effective\s+date\s*',
        r';\s*to\s+provide\s+for\s+retroactive\s+application\s*',
        r';\s*to\s+provide\s+for\s+a\s+contingent\s+effective\s+date\s*',
        r';\s*to\s+provide\s+for\s+a\s+contingent\s+expiration\s+date\s*',
        
        # South Carolina specific patterns
        r'^Amend The South Carolina Code Of Laws\s+',
        r'By Amending Section \d+-\d+-\d+[^,\.]+',
        r'By Adding Section \d+-\d+-\d+[^,\.]+',
        r'By Adding Article \d+ To[^,\.]+',
        r'By Adding Chapter \d+ To[^,\.]+',
        r'By Repealing Section \d+-\d+-\d+[^,\.]+',
        r'Relating To[^,\.]+,\s*',
        r'So As To\s+',
        r'And To\s+',
        r'To Direct[^,\.]+',
        r'To Define[^,\.]+',
        r'To Provide[^,\.]+',
        r'To Make[^,\.]+',
        r'To Designate[^,\.]+',
        
        # General state code references
        r'^AN ACT to amend [A-Za-z\s]+ Code[^.]+\.',
        r'Chapter \d+[^.]+\.',
        r'Title \d+[^.]+\.',
        r'Section \d+[^.]+\.',
        
        # Common prefixes
        r'^Budget Act of \d{4}\.',
        r'^As introduced,\s*',
        r'An act to\s+',
        r'An act relating to\s+',
        r'Relating to\s+',
        r'Concerning\s+',
        r'^To\s+',
        r'^TO CREATE\s+',
        r'^TO AMEND\s+',
        r'^TO ESTABLISH\s+',
        r'^TO PROVIDE\s+',
        r'^TO REQUIRE\s+',
        r'^TO MODIFY\s+',
        r'^TO IMPLEMENT\s+',
        r'^TO AUTHORIZE\s+',
        r'^TO MAKE\s+',
        
        # Bill numbers and identifiers
        r'\([A-Z]+\d+\)',
        r'Bill No\. \d+',
        r'Senate Bill \d+',
        r'House Bill \d+',
        
        # State-specific terms
        r'the state of [A-Za-z\s]+',
        r'this state[\'s]*',
        r'state legislature',
        r'general assembly',
        r'South Carolina Code',
        r'South Carolina Constitution',
        r'South Carolina State',
        r'South Carolina Department of',
        r'South Carolina Division of'
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

def analyze_bill_data(metadata: list, texts: list[str]):
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
                   COUNT(DISTINCT b.state_id) as states,
                   MIN(bh.history_date) as earliest,
                   MAX(bh.history_date) as latest
            FROM ls_bill_history bh
            JOIN ls_bill b ON bh.bill_id = b.bill_id;
        """)
        
        logger.info("\nDatabase Overview:")
        logger.info(f"Total history entries: {overview['total']}")
        logger.info(f"States: {overview['states']}")
        logger.info(f"Date range: {overview['earliest']} to {overview['latest']}")
        
        # Fetch bills with history information
        query = """
            SELECT DISTINCT ON (b.bill_id)
                b.bill_id,
                b.bill_number,
                b.title,
                b.description,
                b.created,
                s.state_name,
                s.state_abbr,
                bh.history_date,
                bh.history_action
            FROM ls_bill b
            JOIN ls_state s ON b.state_id = s.state_id
            JOIN ls_bill_history bh ON b.bill_id = bh.bill_id
            JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
            WHERE bh.history_date >= $1
            AND bh.history_date < $2
            ORDER BY b.bill_id, bh.history_date DESC;
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
                logger.info(f"Last Action: {row['history_action']} on {row['history_date']}")
            return None, None
        
        # Prepare texts and metadata
        texts = []
        metadata = []
        skipped_template_bills = 0
        
        for row in rows:
            # Skip Oklahoma template bills
            if is_template_bill(row['title'], row['description']):
                skipped_template_bills += 1
                continue
                
            text = prepare_bill_text(dict(row))
            texts.append(text)
            metadata.append({
                'bill_id': row['bill_id'],
                'bill_number': row['bill_number'],
                'state': row['state_name'],
                'state_abbr': row['state_abbr'],
                'created': row['created'],
                'history_date': row['history_date'],
                'history_action': row['history_action']
            })
        
        if skipped_template_bills > 0:
            logger.info(f"\nSkipped {skipped_template_bills} template bills")
            
        # Analyze bill data before generating embeddings
        analyze_bill_data(metadata, texts)
        
        return texts, metadata
        
    finally:
        await conn.close() 