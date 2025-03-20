-- Migration: Add Performance Indexes for Bill Listing Pages
-- Description: Adds indexes to improve state bill listing page performance

BEGIN;

-- Index for filtering by state_abbr (via state_id) and bill_type
CREATE INDEX IF NOT EXISTS idx_bill_state_type ON ls_bill(state_id, bill_type_id);

-- Index to help with latest action sort (history in descending order)
CREATE INDEX IF NOT EXISTS idx_bill_history_desc ON ls_bill_history(bill_id, history_step DESC);

-- Index for the lsv_bill view's common filter
CREATE INDEX IF NOT EXISTS idx_state_abbr_bill_type ON ls_state(state_abbr) 
WHERE state_abbr IS NOT NULL AND state_abbr != '';

-- Additional index to help with performance when joining bill sponsors
CREATE INDEX IF NOT EXISTS idx_bill_sponsor_bill_lookup ON ls_bill_sponsor(bill_id);

-- Index to optimize access to category scores
CREATE INDEX IF NOT EXISTS idx_category_scores_analysis_lookup ON bill_analysis_category_scores(analysis_id);

COMMIT; 