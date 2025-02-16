-- Migration to add blog posts to vector search
BEGIN;

-- Temporarily disable the trigger while we modify the check constraint
ALTER TABLE vector_index DISABLE TRIGGER validate_vector_index_entity_trigger;

-- Modify the entity_type check constraint to include blog_post
ALTER TABLE vector_index 
DROP CONSTRAINT IF EXISTS vector_index_entity_type_check,
ADD CONSTRAINT vector_index_entity_type_check 
CHECK (entity_type IN ('bill', 'sponsor', 'blog_post'));

-- Update the validation trigger function to handle blog posts
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
        -- For blog posts, we store the UUID's 128-bit integer representation
        IF NOT EXISTS (SELECT 1 FROM blog_posts WHERE (post_id::text::uuid::int8)::bigint = NEW.entity_id::bigint) THEN
            RAISE EXCEPTION 'Invalid post_id: %', NEW.entity_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the trigger
ALTER TABLE vector_index ENABLE TRIGGER validate_vector_index_entity_trigger;

-- Add comment for documentation
COMMENT ON CONSTRAINT vector_index_entity_type_check ON vector_index IS 
'Ensures entity_type is one of: bill, sponsor, or blog_post';

COMMIT; 