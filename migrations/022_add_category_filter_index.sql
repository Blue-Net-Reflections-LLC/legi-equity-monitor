-- Add index to optimize case-insensitive category filtering
CREATE INDEX IF NOT EXISTS idx_bill_analysis_category_scores_category_lower
ON bill_analysis_category_scores(LOWER(category)); 