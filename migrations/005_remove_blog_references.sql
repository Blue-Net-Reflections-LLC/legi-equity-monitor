-- Migration to remove blog post references to clustering tables
-- Each command runs in its own implicit transaction for better error handling

-- 1. First, try dropping the view
DROP VIEW IF EXISTS published_blog_posts;

-- 2. If successful, then try removing the first foreign key
ALTER TABLE blog_posts
    DROP CONSTRAINT IF EXISTS blog_posts_cluster_id_fkey;

-- 3. Then try removing the second foreign key
ALTER TABLE blog_posts
    DROP CONSTRAINT IF EXISTS blog_posts_analysis_id_fkey;

-- 4. Then try dropping the column
ALTER TABLE blog_posts
    DROP COLUMN IF EXISTS analysis_id;

-- 5. Finally, try modifying cluster_id to be nullable without foreign key reference
ALTER TABLE blog_posts
    ALTER COLUMN cluster_id DROP NOT NULL;