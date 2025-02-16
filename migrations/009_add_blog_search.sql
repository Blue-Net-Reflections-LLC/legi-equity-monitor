BEGIN;

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GiST index for trigram search on title and content
CREATE INDEX idx_blog_posts_title_trgm ON blog_posts USING GiST (title gist_trgm_ops);
CREATE INDEX idx_blog_posts_content_trgm ON blog_posts USING GiST (content gist_trgm_ops);

-- Add helpful comments
COMMENT ON INDEX idx_blog_posts_title_trgm IS 'GiST index for trigram similarity search on blog post titles';
COMMENT ON INDEX idx_blog_posts_content_trgm IS 'GiST index for trigram similarity search on blog post content';

COMMIT; 