BEGIN;

-- Add columns to track which week/year a cluster was created for
ALTER TABLE legislation_clusters 
ADD COLUMN cluster_week INTEGER,
ADD COLUMN cluster_year INTEGER;

-- Create an index for efficient querying by week/year
CREATE INDEX idx_clusters_week_year ON legislation_clusters(cluster_week, cluster_year);

-- Add a constraint to ensure week is between 1 and 53
ALTER TABLE legislation_clusters
ADD CONSTRAINT check_valid_week 
CHECK (cluster_week BETWEEN 1 AND 53);

-- Add a constraint to ensure year is reasonable
ALTER TABLE legislation_clusters
ADD CONSTRAINT check_valid_year 
CHECK (cluster_year >= 2020 AND cluster_year <= 2100);

-- Update cluster_stats view to include week/year
DROP VIEW IF EXISTS cluster_stats;
CREATE VIEW cluster_stats AS
SELECT 
    c.cluster_id,
    c.cluster_name,
    c.bill_count,
    c.state_count,
    c.cluster_week,
    c.cluster_year,
    COUNT(DISTINCT cb.bill_id) as actual_bill_count,
    COUNT(DISTINCT b.state_id) as actual_state_count,
    MIN(cb.membership_confidence) as min_confidence,
    AVG(cb.membership_confidence) as avg_confidence,
    MAX(cb.membership_confidence) as max_confidence,
    MIN(b.status_date) as earliest_bill_date,
    MAX(b.status_date) as latest_bill_date,
    COUNT(DISTINCT ca.analysis_id) as analysis_count,
    COUNT(DISTINCT bp.post_id) as blog_post_count
FROM legislation_clusters c
LEFT JOIN cluster_bills cb ON c.cluster_id = cb.cluster_id
LEFT JOIN ls_bill b ON cb.bill_id = b.bill_id
LEFT JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
LEFT JOIN blog_posts bp ON c.cluster_id = bp.cluster_id
GROUP BY c.cluster_id, c.cluster_name, c.bill_count, c.state_count, c.cluster_week, c.cluster_year;

COMMENT ON COLUMN legislation_clusters.cluster_week IS 'The week number (1-53) this cluster was created for';
COMMENT ON COLUMN legislation_clusters.cluster_year IS 'The year this cluster was created for';

COMMIT; 