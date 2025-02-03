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
        
        return texts, metadata
        
    finally:
        await conn.close() 