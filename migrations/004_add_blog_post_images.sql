BEGIN;

-- Add image URL columns to blog_posts table
ALTER TABLE blog_posts
  ADD COLUMN hero_image TEXT NULL,
  ADD COLUMN main_image TEXT NULL,
  ADD COLUMN thumb TEXT NULL;

-- Add helpful comments
COMMENT ON COLUMN blog_posts.hero_image IS 'URL for the hero/banner image of the blog post';
COMMENT ON COLUMN blog_posts.main_image IS 'URL for the main content image of the blog post';
COMMENT ON COLUMN blog_posts.thumb IS 'URL for the thumbnail image used in blog post listings';

COMMIT; 