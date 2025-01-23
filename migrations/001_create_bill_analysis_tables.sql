-- Migration: Create Bill Analysis Tables
-- Description: Initial schema for bill analysis tracking and results

BEGIN;

-- Track analysis status for each bill
CREATE TABLE bill_analysis_status (
    bill_id INTEGER PRIMARY KEY REFERENCES ls_bill(bill_id),
    last_analyzed TIMESTAMP,
    last_change_hash CHAR(32),    -- Track the change_hash we last analyzed
    current_change_hash CHAR(32),  -- Latest change_hash from ls_bill
    analysis_state VARCHAR(20),    -- 'pending', 'completed', 'skipped', 'error'
    skip_reason TEXT,             -- e.g. 'insufficient_content'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track batch progress
CREATE TABLE bill_analysis_progress (
    progress_id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL,                    -- Unique identifier for batch run
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_bills INTEGER NOT NULL,              -- Number of bills in batch
    processed_bills INTEGER DEFAULT 0,         -- Successfully processed
    failed_bills INTEGER DEFAULT 0,            -- Failed to process
    skipped_bills INTEGER DEFAULT 0,           -- Skipped due to criteria
    batch_state VARCHAR(20) NOT NULL,          -- 'running', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track individual bill progress within batch
CREATE TABLE bill_analysis_batch_items (
    batch_id UUID NOT NULL,
    bill_id INTEGER NOT NULL REFERENCES ls_bill(bill_id),
    processing_state VARCHAR(20) NOT NULL,     -- 'pending', 'processing', 'completed', 'failed', 'skipped'
    attempt_count INTEGER DEFAULT 0,
    last_error TEXT,
    processing_time INTEGER,                   -- Time taken in milliseconds
    token_count INTEGER,                       -- Actual tokens used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_id, bill_id),
    FOREIGN KEY (batch_id) REFERENCES bill_analysis_progress(batch_id)
);

-- Analysis results tables
CREATE TABLE bill_analysis_results (
    analysis_id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES ls_bill(bill_id),
    overall_bias_score NUMERIC(3,2),
    overall_positive_impact_score NUMERIC(3,2),
    confidence VARCHAR(10),  -- 'High', 'Medium', 'Low'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bill_id)  -- One active analysis per bill
);

CREATE TABLE bill_analysis_category_scores (
    category_score_id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES bill_analysis_results(analysis_id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL,  -- 'race', 'religion', etc.
    bias_score NUMERIC(3,2),
    positive_impact_score NUMERIC(3,2),
    notes TEXT,
    UNIQUE(analysis_id, category)
);

CREATE TABLE bill_analysis_subgroup_scores (
    subgroup_score_id SERIAL PRIMARY KEY,
    category_score_id INTEGER NOT NULL REFERENCES bill_analysis_category_scores(category_score_id) ON DELETE CASCADE,
    subgroup_code VARCHAR(5) NOT NULL,  -- 'BH', 'AP', etc.
    bias_score NUMERIC(3,2),
    positive_impact_score NUMERIC(3,2),
    evidence TEXT,
    UNIQUE(category_score_id, subgroup_code)
);

-- Indexes for bill selection
CREATE INDEX idx_bill_type_updated ON ls_bill(bill_type_id, updated DESC);
CREATE INDEX idx_bill_description_length ON ls_bill(bill_type_id, (array_length(regexp_split_to_array(trim(description), '\s+'), 1)));
CREATE INDEX idx_bill_amendments ON ls_bill_amendment(bill_id);

-- Indexes for analysis results
CREATE INDEX idx_analysis_bill_id ON bill_analysis_results(bill_id);
CREATE INDEX idx_analysis_scores ON bill_analysis_results(overall_bias_score, overall_positive_impact_score);
CREATE INDEX idx_category_scores ON bill_analysis_category_scores(category, bias_score, positive_impact_score);
CREATE INDEX idx_subgroup_scores ON bill_analysis_subgroup_scores(subgroup_code, bias_score, positive_impact_score);

-- Indexes for progress tracking
CREATE INDEX idx_batch_progress ON bill_analysis_progress(batch_id, batch_state);
CREATE INDEX idx_batch_items_status ON bill_analysis_batch_items(batch_id, processing_state);

COMMIT; 