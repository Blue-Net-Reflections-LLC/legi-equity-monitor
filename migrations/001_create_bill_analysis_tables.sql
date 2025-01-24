-- Migration: Create Bill Analysis Tables
-- Description: Initial schema for bill analysis tracking and results

BEGIN;

-- Create ENUMs for state tracking
CREATE TYPE batch_state_enum AS ENUM ('running', 'completed', 'failed');
CREATE TYPE processing_state_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
CREATE TYPE analysis_state_enum AS ENUM ('pending', 'completed', 'skipped', 'error');

-- Track analysis status for each bill
CREATE TABLE bill_analysis_status (
    bill_id INTEGER PRIMARY KEY REFERENCES ls_bill(bill_id),
    last_analyzed TIMESTAMP,
    last_change_hash CHAR(32),    -- Track the change_hash we last analyzed
    current_change_hash CHAR(32),  -- Latest change_hash from ls_bill
    analysis_state analysis_state_enum NOT NULL DEFAULT 'pending',
    skip_reason TEXT,             -- e.g. 'insufficient_content'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Track batch progress
CREATE TABLE bill_analysis_progress (
    batch_id TEXT PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_bills INTEGER NOT NULL,
    processed_bills INTEGER NOT NULL DEFAULT 0,
    failed_bills INTEGER NOT NULL DEFAULT 0,
    batch_state batch_state_enum NOT NULL DEFAULT 'running',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Track individual bill progress within batch
CREATE TABLE bill_analysis_batch_items (
    batch_id TEXT REFERENCES bill_analysis_progress(batch_id) ON DELETE CASCADE,
    bill_id INTEGER NOT NULL REFERENCES ls_bill(bill_id),
    processing_state processing_state_enum NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    processing_time INTEGER,                   -- Time taken in milliseconds
    token_count INTEGER,                       -- Actual tokens used
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_id, bill_id)
);

-- Analysis results tables
CREATE TABLE bill_analysis_results (
    analysis_id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES ls_bill(bill_id),
    overall_bias_score NUMERIC(3,2) NOT NULL,
    overall_positive_impact_score NUMERIC(3,2) NOT NULL,
    confidence VARCHAR(10) NOT NULL,  -- 'High', 'Medium', 'Low'
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bill_id),  -- One active analysis per bill
    CONSTRAINT valid_confidence CHECK (confidence IN ('High', 'Medium', 'Low')),
    CONSTRAINT valid_bias_score CHECK (overall_bias_score BETWEEN 0 AND 1),
    CONSTRAINT valid_positive_score CHECK (overall_positive_impact_score BETWEEN 0 AND 1)
);

CREATE TABLE bill_analysis_category_scores (
    category_score_id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES bill_analysis_results(analysis_id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL,  -- 'race', 'religion', etc.
    bias_score NUMERIC(3,2) NOT NULL,
    positive_impact_score NUMERIC(3,2) NOT NULL,
    notes TEXT,
    UNIQUE(analysis_id, category),
    CONSTRAINT valid_category_bias_score CHECK (bias_score BETWEEN 0 AND 1),
    CONSTRAINT valid_category_positive_score CHECK (positive_impact_score BETWEEN 0 AND 1)
);

CREATE TABLE bill_analysis_subgroup_scores (
    subgroup_score_id SERIAL PRIMARY KEY,
    category_score_id INTEGER NOT NULL REFERENCES bill_analysis_category_scores(category_score_id) ON DELETE CASCADE,
    subgroup_code VARCHAR(5) NOT NULL,  -- 'BH', 'AP', etc.
    bias_score NUMERIC(3,2) NOT NULL,
    positive_impact_score NUMERIC(3,2) NOT NULL,
    evidence TEXT NOT NULL,
    UNIQUE(category_score_id, subgroup_code),
    CONSTRAINT valid_subgroup_bias_score CHECK (bias_score BETWEEN 0 AND 1),
    CONSTRAINT valid_subgroup_positive_score CHECK (positive_impact_score BETWEEN 0 AND 1)
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