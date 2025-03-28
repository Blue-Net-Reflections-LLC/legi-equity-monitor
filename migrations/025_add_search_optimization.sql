-- Migration 025: Add materialized view and indexes for optimized search
-- Description: Creates a materialized view and indexes to optimize the search query performance

-- Create the materialized view for valid bills
CREATE MATERIALIZED VIEW mv_valid_bills AS
SELECT 
    b.bill_id,
    b.bill_type_id,
    b.session_id,
    b.body_id,
    b.current_body_id,
    b.state_id,
    bar.bill_id as has_analysis
FROM ls_bill b
INNER JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
WHERE b.bill_type_id = 1;

-- Create a covering index that includes all needed columns
CREATE INDEX ON mv_valid_bills(bill_id, bill_type_id, session_id, body_id, current_body_id, state_id, has_analysis);

-- Create a partial index for just the bill_id
CREATE INDEX ON mv_valid_bills(bill_id) WHERE bill_type_id = 1;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_valid_bills()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_valid_bills;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when underlying tables change
CREATE TRIGGER refresh_valid_bills_bill
    AFTER INSERT OR UPDATE OR DELETE ON ls_bill
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_valid_bills();

CREATE TRIGGER refresh_valid_bills_analysis
    AFTER INSERT OR UPDATE OR DELETE ON bill_analysis_results
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_valid_bills();

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW mv_valid_bills;

-- Add comment to the materialized view
COMMENT ON MATERIALIZED VIEW mv_valid_bills IS 'Materialized view for valid bills with analysis results, used to optimize search queries'; 