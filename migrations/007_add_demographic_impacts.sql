BEGIN;

-- Add demographic_impacts column to cluster_analysis table
ALTER TABLE cluster_analysis
    ADD COLUMN IF NOT EXISTS demographic_impacts JSONB;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN cluster_analysis.demographic_impacts IS 'JSON object containing demographic impact analysis from LLM';

COMMIT; 