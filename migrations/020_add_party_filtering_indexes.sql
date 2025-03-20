-- Migration: Add indexes to optimize party filtering performance

-- Index on bill_sponsor for bill_id (may already exist)
CREATE INDEX IF NOT EXISTS idx_bill_sponsor_bill_id 
ON ls_bill_sponsor(bill_id);

-- Index on bill_sponsor for people_id (may already exist)
CREATE INDEX IF NOT EXISTS idx_bill_sponsor_people_id 
ON ls_bill_sponsor(people_id);

-- Index on bill_sponsor for sponsor_order - critical for party filtering
-- This helps quickly identify primary sponsors (sponsor_order = 1)
CREATE INDEX IF NOT EXISTS idx_bill_sponsor_sponsor_order 
ON ls_bill_sponsor(sponsor_order);

-- Index on people for party_id - helps with party joins
CREATE INDEX IF NOT EXISTS idx_people_party_id 
ON ls_people(party_id);

-- Combined index on bill_sponsor for common filtering pattern
-- This can help with the specific use case of finding primary sponsors
CREATE INDEX IF NOT EXISTS idx_bill_sponsor_order_people
ON ls_bill_sponsor(sponsor_order, people_id);

-- Index on party for party_abbr - helps with party filtering by abbreviation
CREATE INDEX IF NOT EXISTS idx_party_abbr
ON ls_party(party_abbr); 