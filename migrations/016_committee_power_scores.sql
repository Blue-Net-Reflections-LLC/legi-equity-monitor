-- Migration 016 - Committee Power Score Pre-calculations
-- Creates and populates a table for pre-computed committee effectiveness scores

-- Create committee power scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS committee_power_scores (
  committee_id INT PRIMARY KEY,
  power_score NUMERIC(5,1) NOT NULL DEFAULT 0, -- 0-100 scale
  total_bills INT NOT NULL DEFAULT 0,
  engrossed_bills INT NOT NULL DEFAULT 0,
  enrolled_bills INT NOT NULL DEFAULT 0, 
  passed_bills INT NOT NULL DEFAULT 0,
  engrossed_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  enrolled_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  passed_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  activity_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  passed_effectiveness_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  enrolled_effectiveness_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  engrossed_effectiveness_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_committee_power_scores_score 
ON committee_power_scores (power_score DESC);

-- Initial population of the table with effectiveness-focused scoring
INSERT INTO committee_power_scores (
  committee_id,
  power_score,
  total_bills,
  engrossed_bills,
  enrolled_bills,
  passed_bills,
  engrossed_percentage,
  enrolled_percentage,
  passed_percentage,
  activity_score,
  passed_effectiveness_score,
  enrolled_effectiveness_score,
  engrossed_effectiveness_score,
  last_calculated
)
SELECT 
  c.committee_id,
  -- Final power score (sum of components, scale 0-100)
  (
    -- Base activity score
    CASE WHEN COUNT(DISTINCT br.bill_id) >= 50 THEN 10
         WHEN COUNT(DISTINCT br.bill_id) >= 20 THEN 7
         WHEN COUNT(DISTINCT br.bill_id) >= 5 THEN 4
         ELSE 0 END +
    
    -- Passed bills effectiveness score
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.50 THEN 50
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.25 THEN 35
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 20
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 10
                ELSE 0 END
         ELSE 0 END +
    
    -- Enrolled bills effectiveness score
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.40 THEN 25
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.20 THEN 15
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.05 THEN 7
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 3
                ELSE 0 END
         ELSE 0 END +
    
    -- Engrossed bills effectiveness score
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.60 THEN 15
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.30 THEN 10
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 5
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 2
                ELSE 0 END
         ELSE 0 END
  ) AS power_score,
  
  -- Raw counts
  COUNT(DISTINCT br.bill_id) AS total_bills,
  COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM ls_bill_progress bp 
    WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
  ) THEN br.bill_id END) AS engrossed_bills,
  COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM ls_bill_progress bp 
    WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
  ) THEN br.bill_id END) AS enrolled_bills,
  COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM ls_bill_progress bp 
    WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
  ) THEN br.bill_id END) AS passed_bills,
  
  -- Percentage calculations
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
       THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
         SELECT 1 FROM ls_bill_progress bp 
         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
       ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
       ELSE 0 END AS engrossed_percentage,
       
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
       THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
         SELECT 1 FROM ls_bill_progress bp 
         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
       ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
       ELSE 0 END AS enrolled_percentage,
       
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
       THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
         SELECT 1 FROM ls_bill_progress bp 
         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
       ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
       ELSE 0 END AS passed_percentage,
  
  -- Component scores for diagnostics
  -- 1. Base activity score
  CASE WHEN COUNT(DISTINCT br.bill_id) >= 50 THEN 10
       WHEN COUNT(DISTINCT br.bill_id) >= 20 THEN 7
       WHEN COUNT(DISTINCT br.bill_id) >= 5 THEN 4
       ELSE 0 END AS activity_score,
  
  -- 2. Passed bills effectiveness
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
         CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.50 THEN 50
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.25 THEN 35
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 20
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 10
              ELSE 0 END
       ELSE 0 END AS passed_effectiveness_score,
  
  -- 3. Enrolled bills effectiveness
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
         CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.40 THEN 25
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.20 THEN 15
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.05 THEN 7
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 3
              ELSE 0 END
       ELSE 0 END AS enrolled_effectiveness_score,
  
  -- 4. Engrossed bills effectiveness
  CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
         CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.60 THEN 15
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.30 THEN 10
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 5
              WHEN COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 2
              ELSE 0 END
       ELSE 0 END AS engrossed_effectiveness_score,
       
  -- Timestamp
  NOW() AS last_calculated
FROM ls_committee c
JOIN ls_bill_referral br ON c.committee_id = br.committee_id
GROUP BY c.committee_id
HAVING COUNT(DISTINCT br.bill_id) > 0
ON CONFLICT (committee_id) 
DO UPDATE SET 
  power_score = EXCLUDED.power_score,
  total_bills = EXCLUDED.total_bills,
  engrossed_bills = EXCLUDED.engrossed_bills, 
  enrolled_bills = EXCLUDED.enrolled_bills,
  passed_bills = EXCLUDED.passed_bills,
  engrossed_percentage = EXCLUDED.engrossed_percentage,
  enrolled_percentage = EXCLUDED.enrolled_percentage,
  passed_percentage = EXCLUDED.passed_percentage,
  activity_score = EXCLUDED.activity_score,
  passed_effectiveness_score = EXCLUDED.passed_effectiveness_score,
  enrolled_effectiveness_score = EXCLUDED.enrolled_effectiveness_score,
  engrossed_effectiveness_score = EXCLUDED.engrossed_effectiveness_score,
  last_calculated = NOW();

-- Create a function to refresh committee scores (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION refresh_committee_power_scores()
RETURNS void AS $$
BEGIN
  -- Update the committee power scores
  INSERT INTO committee_power_scores (
    committee_id,
    power_score,
    total_bills,
    engrossed_bills,
    enrolled_bills,
    passed_bills,
    engrossed_percentage,
    enrolled_percentage,
    passed_percentage,
    activity_score,
    passed_effectiveness_score,
    enrolled_effectiveness_score,
    engrossed_effectiveness_score,
    last_calculated
  )
  SELECT 
    c.committee_id,
    -- Final power score calculation (same as above)
    (
      -- Base activity score
      CASE WHEN COUNT(DISTINCT br.bill_id) >= 50 THEN 10
           WHEN COUNT(DISTINCT br.bill_id) >= 20 THEN 7
           WHEN COUNT(DISTINCT br.bill_id) >= 5 THEN 4
           ELSE 0 END +
      
      -- Passed bills effectiveness score
      CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
             CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.50 THEN 50
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.25 THEN 35
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 20
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 10
                  ELSE 0 END
           ELSE 0 END +
      
      -- Enrolled bills effectiveness score
      CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
             CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.40 THEN 25
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.20 THEN 15
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.05 THEN 7
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 3
                  ELSE 0 END
           ELSE 0 END +
      
      -- Engrossed bills effectiveness score
      CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
             CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.60 THEN 15
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.30 THEN 10
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 5
                  WHEN COUNT(DISTINCT CASE WHEN EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
             ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 2
                  ELSE 0 END
           ELSE 0 END
    ) AS power_score,
    
    -- Same metrics as above for the other fields
    COUNT(DISTINCT br.bill_id) AS total_bills,
    COUNT(DISTINCT CASE WHEN EXISTS (
      SELECT 1 FROM ls_bill_progress bp 
      WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
    ) THEN br.bill_id END) AS engrossed_bills,
    COUNT(DISTINCT CASE WHEN EXISTS (
      SELECT 1 FROM ls_bill_progress bp 
      WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
    ) THEN br.bill_id END) AS enrolled_bills,
    COUNT(DISTINCT CASE WHEN EXISTS (
      SELECT 1 FROM ls_bill_progress bp 
      WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
    ) THEN br.bill_id END) AS passed_bills,
    
    -- Percentages
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
         THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
         ELSE 0 END AS engrossed_percentage,
         
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
         THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
         ELSE 0 END AS enrolled_percentage,
         
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 
         THEN CAST((COUNT(DISTINCT CASE WHEN EXISTS (
           SELECT 1 FROM ls_bill_progress bp 
           WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
         ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) * 100) AS NUMERIC(5,1))
         ELSE 0 END AS passed_percentage,
    
    -- Component scores
    CASE WHEN COUNT(DISTINCT br.bill_id) >= 50 THEN 10
         WHEN COUNT(DISTINCT br.bill_id) >= 20 THEN 7
         WHEN COUNT(DISTINCT br.bill_id) >= 5 THEN 4
         ELSE 0 END AS activity_score,
    
    -- Passed effectiveness
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.50 THEN 50
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.25 THEN 35
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 20
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 10
                ELSE 0 END
         ELSE 0 END AS passed_effectiveness_score,
    
    -- Enrolled effectiveness
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.40 THEN 25
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.20 THEN 15
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.05 THEN 7
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 3
                ELSE 0 END
         ELSE 0 END AS enrolled_effectiveness_score,
    
    -- Engrossed effectiveness
    CASE WHEN COUNT(DISTINCT br.bill_id) > 0 THEN
           CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.60 THEN 15
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.30 THEN 10
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) >= 0.10 THEN 5
                WHEN COUNT(DISTINCT CASE WHEN EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2
           ) THEN br.bill_id END)::float / COUNT(DISTINCT br.bill_id) > 0 THEN 2
                ELSE 0 END
         ELSE 0 END AS engrossed_effectiveness_score,
         
    NOW() AS last_calculated
  FROM ls_committee c
  JOIN ls_bill_referral br ON c.committee_id = br.committee_id
  GROUP BY c.committee_id
  HAVING COUNT(DISTINCT br.bill_id) > 0
  ON CONFLICT (committee_id) 
  DO UPDATE SET 
    power_score = EXCLUDED.power_score,
    total_bills = EXCLUDED.total_bills,
    engrossed_bills = EXCLUDED.engrossed_bills, 
    enrolled_bills = EXCLUDED.enrolled_bills,
    passed_bills = EXCLUDED.passed_bills,
    engrossed_percentage = EXCLUDED.engrossed_percentage,
    enrolled_percentage = EXCLUDED.enrolled_percentage,
    passed_percentage = EXCLUDED.passed_percentage,
    activity_score = EXCLUDED.activity_score,
    passed_effectiveness_score = EXCLUDED.passed_effectiveness_score,
    enrolled_effectiveness_score = EXCLUDED.enrolled_effectiveness_score,
    engrossed_effectiveness_score = EXCLUDED.engrossed_effectiveness_score,
    last_calculated = NOW();
    
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the migration and usage
COMMENT ON TABLE committee_power_scores IS 'Pre-computed committee power scores based on bill effectiveness metrics';
COMMENT ON FUNCTION refresh_committee_power_scores() IS 'Updates committee power scores. Should be run daily via a scheduled job.'; 