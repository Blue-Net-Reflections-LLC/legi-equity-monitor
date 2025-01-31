-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create vector index table
CREATE TABLE IF NOT EXISTS vector_index (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(7) NOT NULL CHECK (entity_type IN ('bill', 'sponsor')),
    entity_id INTEGER NOT NULL,
    search_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    source_hash VARCHAR(64) NOT NULL,  -- Accommodates both CHAR(32) for bills and CHAR(8) for sponsors
    state_abbr CHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    indexed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT vector_index_entity_unique UNIQUE (entity_type, entity_id)
);

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_vector_search 
ON vector_index 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_vector_index_entity 
ON vector_index (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_vector_index_state 
ON vector_index (state_abbr);

CREATE INDEX IF NOT EXISTS idx_vector_index_source_hash 
ON vector_index (source_hash);

CREATE INDEX IF NOT EXISTS idx_vector_index_search_text 
ON vector_index USING gin(search_text gin_trgm_ops);

-- Create trigger function to validate entity references
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER validate_vector_index_entity_trigger
    BEFORE INSERT OR UPDATE ON vector_index
    FOR EACH ROW
    EXECUTE FUNCTION validate_vector_index_entity();

-- Add comments for documentation
COMMENT ON TABLE vector_index IS 'Stores vector embeddings for semantic search of bills and sponsors';
COMMENT ON COLUMN vector_index.entity_type IS 'Type of entity (bill or sponsor)';
COMMENT ON COLUMN vector_index.entity_id IS 'ID of the referenced entity (bill_id or sponsor_id)';
COMMENT ON COLUMN vector_index.embedding IS 'Vector embedding generated from entity text using all-MiniLM-L6-v2 model';
COMMENT ON COLUMN vector_index.source_hash IS 'Hash from source table to track changes (32 chars for bills, 8 for sponsors)';
COMMENT ON COLUMN vector_index.search_text IS 'Original text used to generate the embedding'; 