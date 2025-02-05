BEGIN;

-- Drop the vector indexes first
DROP INDEX IF EXISTS idx_cluster_centroid;
DROP INDEX IF EXISTS idx_cluster_reduced;

-- Remove vector columns from legislation_clusters
ALTER TABLE legislation_clusters 
    DROP COLUMN IF EXISTS centroid_vector,
    DROP COLUMN IF EXISTS reduced_vector;

COMMIT; 