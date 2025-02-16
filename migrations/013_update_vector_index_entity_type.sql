-- Migration to update vector_index entity_type column length
BEGIN;

-- Temporarily disable the trigger while we modify the column
ALTER TABLE vector_index DISABLE TRIGGER validate_vector_index_entity_trigger;

-- Update the entity_type column to allow longer values
ALTER TABLE vector_index 
ALTER COLUMN entity_type TYPE varchar(20);

-- Re-enable the trigger
ALTER TABLE vector_index ENABLE TRIGGER validate_vector_index_entity_trigger;

-- Add comment for documentation
COMMENT ON COLUMN vector_index.entity_type IS 
'Type of entity being indexed (bill, sponsor, or blog_post)';

COMMIT;