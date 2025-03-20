-- Migration: Add indexes to optimize category filtering performance

-- Index on bill_analysis_results for bill_id
-- This helps quickly find analysis results for a specific bill
CREATE INDEX IF NOT EXISTS idx_bill_analysis_results_bill_id 
ON bill_analysis_results(bill_id);

-- Index on bill_analysis_category_scores for analysis_id
-- This helps with joining bill_analysis_results to category_scores
CREATE INDEX IF NOT EXISTS idx_bill_analysis_category_scores_analysis_id
ON bill_analysis_category_scores(analysis_id);

-- Index on bill_analysis_category_scores for category
-- This helps filter by specific categories
CREATE INDEX IF NOT EXISTS idx_bill_analysis_category_scores_category
ON bill_analysis_category_scores(category);

-- Combined index for common filtering patterns - positive impact filter
CREATE INDEX IF NOT EXISTS idx_category_scores_positive_filter
ON bill_analysis_category_scores(analysis_id, category, positive_impact_score, bias_score)
WHERE positive_impact_score > bias_score AND positive_impact_score >= 0.60;

-- Combined index for common filtering patterns - bias filter
CREATE INDEX IF NOT EXISTS idx_category_scores_bias_filter
ON bill_analysis_category_scores(analysis_id, category, bias_score, positive_impact_score)
WHERE bias_score >= positive_impact_score AND bias_score >= 0.60;

-- Combined index for common filtering patterns - neutral filter
CREATE INDEX IF NOT EXISTS idx_category_scores_neutral_filter
ON bill_analysis_category_scores(analysis_id, category)
WHERE bias_score < 0.60 AND positive_impact_score < 0.60; 