BEGIN;

-- Migration: 015_add_app_metadata_table
-- Description: Creates a general-purpose metadata table for tracking application state and configurations

-- Create the app_metadata table
CREATE TABLE app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE app_metadata IS 'General-purpose table for storing application metadata, configurations, and state';
COMMENT ON COLUMN app_metadata.key IS 'Unique identifier for the metadata entry';
COMMENT ON COLUMN app_metadata.value IS 'Value stored for this metadata entry';
COMMENT ON COLUMN app_metadata.created_at IS 'When this metadata entry was first created';
COMMENT ON COLUMN app_metadata.updated_at IS 'When this metadata entry was last updated';

-- Add initial entries for US legislators sync
INSERT INTO app_metadata (key, value)
VALUES ('us_legislators_last_sync', NULL),
       ('us_legislators_checksum', NULL);

COMMIT; 