BEGIN;

-- Add new enum value for no_theme status
ALTER TYPE analysis_status ADD VALUE IF NOT EXISTS 'no_theme';

COMMIT; 