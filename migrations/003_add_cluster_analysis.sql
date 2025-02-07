BEGIN;

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for analysis status
CREATE TYPE analysis_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- Create enum for blog post status
CREATE TYPE blog_post_status AS ENUM (
    'draft',
    'review',
    'published',
    'archived'
);

-- Table to store bill clusters
CREATE TABLE legislation_clusters (
    cluster_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_name VARCHAR(255),
    centroid_vector VECTOR(384),
    reduced_vector VECTOR(128),
    min_date DATE,
    max_date DATE,
    bill_count INTEGER NOT NULL DEFAULT 0,
    state_count INTEGER NOT NULL DEFAULT 0,
    cluster_description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table to store cluster membership
CREATE TABLE cluster_bills (
    cluster_id UUID REFERENCES legislation_clusters(cluster_id),
    bill_id INTEGER REFERENCES ls_bill(bill_id),
    distance_to_centroid FLOAT,
    membership_confidence FLOAT CHECK (membership_confidence BETWEEN 0 AND 1),
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cluster_id, bill_id)
);

-- Table to store cluster analysis context and results
CREATE TABLE cluster_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES legislation_clusters(cluster_id),
    status analysis_status NOT NULL DEFAULT 'pending',
    input_token_count INTEGER,
    output_token_count INTEGER,
    analysis_parameters JSONB,
    executive_summary TEXT,
    policy_impacts JSONB,
    risk_assessment JSONB,
    future_outlook TEXT,
    raw_llm_response JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table to store blog posts
CREATE TABLE blog_posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID REFERENCES legislation_clusters(cluster_id) NULL,
    analysis_id UUID REFERENCES cluster_analysis(analysis_id) NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status blog_post_status NOT NULL DEFAULT 'draft',
    content TEXT NOT NULL,
    metadata JSONB,
    author VARCHAR(100),
    is_curated BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

);

-- Create indexes for efficient querying
CREATE INDEX idx_clusters_dates ON legislation_clusters(min_date, max_date);
CREATE INDEX idx_clusters_bill_count ON legislation_clusters(bill_count DESC);
CREATE INDEX idx_clusters_state_count ON legislation_clusters(state_count DESC);
CREATE INDEX idx_cluster_centroid ON legislation_clusters USING ivfflat (centroid_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_cluster_reduced ON legislation_clusters USING ivfflat (reduced_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_cluster_bills_added ON cluster_bills(added_at);
CREATE INDEX idx_cluster_bills_confidence ON cluster_bills(membership_confidence DESC);

CREATE INDEX idx_cluster_analysis_status ON cluster_analysis(status);
CREATE INDEX idx_cluster_analysis_dates ON cluster_analysis(started_at, completed_at);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- Add GiST index for full text search on blog content
ALTER TABLE blog_posts ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX idx_blog_posts_search ON blog_posts USING GiST (search_vector);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_legislation_clusters_timestamp
    BEFORE UPDATE ON legislation_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cluster_analysis_timestamp
    BEFORE UPDATE ON cluster_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_blog_posts_timestamp
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add helpful comments
COMMENT ON TABLE legislation_clusters IS 'Stores information about clusters of related bills';
COMMENT ON TABLE cluster_bills IS 'Maps bills to their clusters with confidence scores';
COMMENT ON TABLE cluster_analysis IS 'Stores LLM analysis results for each cluster';
COMMENT ON TABLE blog_posts IS 'Stores generated blog posts about legislative themes';

-- Create view for cluster statistics
CREATE VIEW cluster_stats AS
SELECT 
    c.cluster_id,
    c.cluster_name,
    c.bill_count,
    c.state_count,
    COUNT(DISTINCT cb.bill_id) as actual_bill_count,
    COUNT(DISTINCT b.state_id) as actual_state_count,
    MIN(cb.membership_confidence) as min_confidence,
    AVG(cb.membership_confidence) as avg_confidence,
    MAX(cb.membership_confidence) as max_confidence,
    MIN(b.status_date) as earliest_bill_date,
    MAX(b.status_date) as latest_bill_date,
    COUNT(DISTINCT ca.analysis_id) as analysis_count,
    COUNT(DISTINCT bp.post_id) as blog_post_count
FROM legislation_clusters c
LEFT JOIN cluster_bills cb ON c.cluster_id = cb.cluster_id
LEFT JOIN ls_bill b ON cb.bill_id = b.bill_id
LEFT JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
LEFT JOIN blog_posts bp ON c.cluster_id = bp.cluster_id
GROUP BY c.cluster_id, c.cluster_name, c.bill_count, c.state_count;

-- Create view for published blog posts with cluster info
CREATE VIEW published_blog_posts AS
SELECT 
    bp.*,
    CASE WHEN bp.is_curated THEN NULL ELSE c.cluster_name END as cluster_name,
    CASE WHEN bp.is_curated THEN NULL ELSE c.bill_count END as bill_count,
    CASE WHEN bp.is_curated THEN NULL ELSE c.state_count END as state_count,
    CASE WHEN bp.is_curated THEN NULL ELSE ca.executive_summary END as executive_summary,
    CASE WHEN bp.is_curated THEN NULL ELSE ca.policy_impacts END as policy_impacts,
    CASE WHEN bp.is_curated THEN NULL ELSE ca.risk_assessment END as risk_assessment,
    CASE WHEN bp.is_curated THEN NULL ELSE ca.future_outlook END as future_outlook
FROM blog_posts bp
LEFT JOIN legislation_clusters c ON bp.cluster_id = c.cluster_id
LEFT JOIN cluster_analysis ca ON bp.analysis_id = ca.analysis_id
WHERE bp.status = 'published'
ORDER BY bp.published_at DESC;

COMMIT; 