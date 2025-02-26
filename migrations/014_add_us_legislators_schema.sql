BEGIN;

-- Migration: 014_add_us_legislators_schema
-- Description: Creates tables and indexes for US Legislators data from GitHub
-- https://github.com/unitedstates/congress-legislators

-- Core legislator information
CREATE TABLE us_leg_legislators (
  id SERIAL PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE us_leg_legislators IS 'Core table for US legislators data imported from GitHub';

-- Terms served by legislators
CREATE TABLE us_leg_terms (
  id SERIAL PRIMARY KEY,
  legislator_id INTEGER REFERENCES us_leg_legislators(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('rep', 'sen')),
  state VARCHAR(2) NOT NULL,
  district VARCHAR(20),
  party VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  chamber VARCHAR(20) NOT NULL CHECK (chamber IN ('house', 'senate')),
  url VARCHAR(512),
  office VARCHAR(255),
  phone VARCHAR(30),
  is_current BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE us_leg_terms IS 'Terms (periods of service) for US legislators';
COMMENT ON COLUMN us_leg_terms.is_current IS 'Indicates if this is the legislator''s current term';

-- Various external identifiers
CREATE TABLE us_leg_ids (
  id SERIAL PRIMARY KEY,
  legislator_id INTEGER REFERENCES us_leg_legislators(id) ON DELETE CASCADE,
  bioguide_id VARCHAR(40),
  thomas_id VARCHAR(40),
  govtrack_id INTEGER,
  opensecrets_id VARCHAR(40),
  fec_id VARCHAR(40),
  icpsr_id INTEGER,
  lis_id VARCHAR(40)
);
COMMENT ON TABLE us_leg_ids IS 'External identifiers for US legislators';
COMMENT ON COLUMN us_leg_ids.bioguide_id IS 'Bioguide ID used to link to bill sponsors';

-- Name variations
CREATE TABLE us_leg_names (
  id SERIAL PRIMARY KEY,
  legislator_id INTEGER REFERENCES us_leg_legislators(id) ON DELETE CASCADE,
  first VARCHAR(100),
  middle VARCHAR(100),
  last VARCHAR(100),
  suffix VARCHAR(30),
  nickname VARCHAR(100),
  official_full VARCHAR(300)
);
COMMENT ON TABLE us_leg_names IS 'Name variations for US legislators';

-- Biographical information
CREATE TABLE us_leg_bio (
  id SERIAL PRIMARY KEY,
  legislator_id INTEGER REFERENCES us_leg_legislators(id) ON DELETE CASCADE,
  birthday DATE,
  gender VARCHAR(1)
);
COMMENT ON TABLE us_leg_bio IS 'Biographical information for US legislators';

-- Social media accounts
CREATE TABLE us_leg_social_media (
  id SERIAL PRIMARY KEY,
  legislator_id INTEGER REFERENCES us_leg_legislators(id) ON DELETE CASCADE,
  twitter VARCHAR(100),
  facebook VARCHAR(150),
  youtube VARCHAR(150),
  instagram VARCHAR(100)
);
COMMENT ON TABLE us_leg_social_media IS 'Social media accounts for US legislators';

-- Create indexes for performance
CREATE INDEX idx_us_leg_terms_legislator_id ON us_leg_terms(legislator_id);
CREATE INDEX idx_us_leg_terms_state_district ON us_leg_terms(state, district);
CREATE INDEX idx_us_leg_terms_is_current ON us_leg_terms(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_us_leg_terms_chamber ON us_leg_terms(chamber);
CREATE INDEX idx_us_leg_names_legislator_id ON us_leg_names(legislator_id);
CREATE INDEX idx_us_leg_ids_legislator_id ON us_leg_ids(legislator_id);
CREATE INDEX idx_us_leg_ids_bioguide_id ON us_leg_ids(bioguide_id);
CREATE INDEX idx_us_leg_bio_legislator_id ON us_leg_bio(legislator_id);
CREATE INDEX idx_us_leg_social_media_legislator_id ON us_leg_social_media(legislator_id);

-- Add trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_us_leg_names_official_full_trgm ON us_leg_names USING GIN (official_full gin_trgm_ops);
CREATE INDEX idx_us_leg_names_last_trgm ON us_leg_names USING GIN (last gin_trgm_ops);
CREATE INDEX idx_us_leg_terms_current_state_district ON us_leg_terms (state, district) WHERE is_current = TRUE;

COMMIT; 