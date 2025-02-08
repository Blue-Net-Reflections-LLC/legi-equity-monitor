BEGIN;

-- Create blog generation responses table
CREATE TABLE blog_generation_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES legislation_clusters(cluster_id),
    version INT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    hero_image_prompt TEXT,
    main_image_prompt TEXT,
    thumbnail_image_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cluster_id, version)
);

-- Add index for efficient lookups
CREATE INDEX idx_blog_gen_cluster_version ON blog_generation_responses(cluster_id, version);

-- Add helpful comments
COMMENT ON TABLE blog_generation_responses IS 'Stores AI-generated blog post content and prompts from clusters';
COMMENT ON COLUMN blog_generation_responses.version IS 'Sequential version number for multiple generations of the same cluster';
COMMENT ON COLUMN blog_generation_responses.model_name IS 'Name/version of the AI model used for generation';
COMMENT ON COLUMN blog_generation_responses.prompt IS 'System prompt used for generation';
COMMENT ON COLUMN blog_generation_responses.generated_content IS 'Raw generated content from the AI model';
COMMENT ON COLUMN blog_generation_responses.hero_image_prompt IS 'Prompt text for generating the hero/banner image';
COMMENT ON COLUMN blog_generation_responses.main_image_prompt IS 'Prompt text for generating the main content image';
COMMENT ON COLUMN blog_generation_responses.thumbnail_image_prompt IS 'Prompt text for generating the thumbnail image';

-- Create trigger for timestamp updates
CREATE TRIGGER update_blog_generation_responses_timestamp
    BEFORE UPDATE ON blog_generation_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

COMMIT; 