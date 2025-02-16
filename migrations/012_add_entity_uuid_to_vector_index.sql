-- Migration to add entity_uuid to vector_index table
BEGIN;

-- Add entity_uuid column for storing original UUIDs
ALTER TABLE vector_index 
ADD COLUMN IF NOT EXISTS entity_uuid UUID NULL;

-- Add index on entity_uuid for efficient lookups
CREATE INDEX IF NOT EXISTS ix_vector_index_entity_uuid ON vector_index (entity_uuid) WHERE entity_uuid IS NOT NULL;

-- Temporarily disable the trigger while we update it
ALTER TABLE vector_index DISABLE TRIGGER validate_vector_index_entity_trigger;

-- Update the validation trigger function to handle blog post UUIDs
CREATE OR REPLACE FUNCTION validate_vector_index_entity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.entity_type = 'bill' THEN
        IF NOT EXISTS (SELECT 1 FROM ls_bill WHERE bill_id = NEW.entity_id) THEN
            RAISE EXCEPTION 'Invalid bill_id: %', NEW.entity_id;
        END IF;
    ELSIF NEW.entity_type = 'sponsor' THEN
        IF NOT EXISTS (SELECT 1 FROM ls_people WHERE people_id = NEW.entity_id) THEN
            RAISE EXCEPTION 'Invalid people_id: %', NEW.entity_id;
        END IF;
    ELSIF NEW.entity_type = 'blog_post' THEN
        -- For blog posts, we validate using the UUID
        IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE post_id = NEW.entity_uuid) THEN
            RAISE EXCEPTION 'Invalid post_id: %', NEW.entity_uuid;
        END IF;
        -- Ensure entity_uuid is set for blog posts
        IF NEW.entity_uuid IS NULL THEN
            RAISE EXCEPTION 'entity_uuid must be set for blog posts';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the trigger
ALTER TABLE vector_index ENABLE TRIGGER validate_vector_index_entity_trigger;

-- Add comment for documentation
COMMENT ON COLUMN vector_index.entity_uuid IS 
'UUID identifier for entities that use UUIDs (like blog_posts). Primary identifier for blog posts, while entity_id serves as an internal sequential ID.';

COMMIT; 