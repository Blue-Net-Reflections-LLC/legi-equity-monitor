-- Enum for impact severity
CREATE TYPE impact_severity AS ENUM ('mild', 'medium', 'high', 'urgent');

-- Table for racial impact analysis
CREATE TABLE racial_impact_analysis (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id),
  race_code VARCHAR(2) NOT NULL,
  impact_type BOOLEAN NOT NULL, -- true for positive, false for negative
  severity impact_severity NOT NULL,
  analysis_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bill_id, race_code)
);

-- Table to track processed bills
CREATE TABLE bill_analysis_status (
  bill_id INTEGER PRIMARY KEY REFERENCES bills(bill_id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL -- 'completed', 'failed', 'in_progress'
); 