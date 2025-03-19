-- Migration 018 - Add Sponsor Success Score Refresh Function

-- Create or replace the refresh function
CREATE OR REPLACE FUNCTION refresh_sponsor_success_scores()
RETURNS void AS $$
BEGIN
  -- Truncate and rebuild the table to refresh scores
  DELETE FROM sponsor_success_scores;
  
  INSERT INTO sponsor_success_scores (
    people_id, success_score, bills_sponsored, successful_bills, 
    success_rate, bipartisan_count, lead_count, cosponsor_count,
    activity_score, effectiveness_score, bipartisan_score, leadership_score,
    party_id, last_calculated
  )
  SELECT 
    p.people_id,
    -- Final success score (sum of components, scale 0-100)
    (
      -- Base activity score (10% weight)
      CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 30 THEN 10
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 20 THEN 8
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 10 THEN 6
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN 4
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 1 THEN 2
           ELSE 0 END +
      
      -- Success rate score (60% weight)
      CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN
             CASE WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.75 THEN 60
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.60 THEN 55
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.50 THEN 50
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.40 THEN 45
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.30 THEN 40
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.20 THEN 30
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.10 THEN 20
                  WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) > 0 THEN 10
                  ELSE 0 END
             WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0 THEN
               CASE WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
               SELECT 1 FROM ls_bill_progress bp 
               WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
             ) THEN bs.bill_id END)::float / 
               NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) > 0 THEN 8
                  ELSE 0 END
             ELSE 0 END +
      
      -- Bipartisan score (15% weight)
      CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN
             CASE WHEN (SELECT COUNT(DISTINCT b.bill_id)
                  FROM ls_bill_sponsor bs2
                  JOIN ls_bill b ON bs2.bill_id = b.bill_id
                  JOIN ls_people p2 ON bs2.people_id = p2.people_id
                  WHERE bs2.people_id = p.people_id
                  AND bs2.sponsor_type_id = 1
                  AND EXISTS (
                    SELECT 1 FROM ls_bill_sponsor bs3
                    JOIN ls_people p3 ON bs3.people_id = p3.people_id
                    WHERE bs3.bill_id = b.bill_id
                    AND bs3.sponsor_type_id != 1
                    AND p3.party_id != p.party_id
                    AND p3.party_id IN (1, 2)
                  )) >= 10 THEN 15
                  WHEN (SELECT COUNT(DISTINCT b.bill_id)
                  FROM ls_bill_sponsor bs2
                  JOIN ls_bill b ON bs2.bill_id = b.bill_id
                  JOIN ls_people p2 ON bs2.people_id = p2.people_id
                  WHERE bs2.people_id = p.people_id
                  AND bs2.sponsor_type_id = 1
                  AND EXISTS (
                    SELECT 1 FROM ls_bill_sponsor bs3
                    JOIN ls_people p3 ON bs3.people_id = p3.people_id
                    WHERE bs3.bill_id = b.bill_id
                    AND bs3.sponsor_type_id != 1
                    AND p3.party_id != p.party_id
                    AND p3.party_id IN (1, 2)
                  )) >= 5 THEN 12
                  WHEN (SELECT COUNT(DISTINCT b.bill_id)
                  FROM ls_bill_sponsor bs2
                  JOIN ls_bill b ON bs2.bill_id = b.bill_id
                  JOIN ls_people p2 ON bs2.people_id = p2.people_id
                  WHERE bs2.people_id = p.people_id
                  AND bs2.sponsor_type_id = 1
                  AND EXISTS (
                    SELECT 1 FROM ls_bill_sponsor bs3
                    JOIN ls_people p3 ON bs3.people_id = p3.people_id
                    WHERE bs3.bill_id = b.bill_id
                    AND bs3.sponsor_type_id != 1
                    AND p3.party_id != p.party_id
                    AND p3.party_id IN (1, 2)
                  )) >= 3 THEN 10
                  WHEN (SELECT COUNT(DISTINCT b.bill_id)
                  FROM ls_bill_sponsor bs2
                  JOIN ls_bill b ON bs2.bill_id = b.bill_id
                  JOIN ls_people p2 ON bs2.people_id = p2.people_id
                  WHERE bs2.people_id = p.people_id
                  AND bs2.sponsor_type_id = 1
                  AND EXISTS (
                    SELECT 1 FROM ls_bill_sponsor bs3
                    JOIN ls_people p3 ON bs3.people_id = p3.people_id
                    WHERE bs3.bill_id = b.bill_id
                    AND bs3.sponsor_type_id != 1
                    AND p3.party_id != p.party_id
                    AND p3.party_id IN (1, 2)
                  )) >= 1 THEN 5
                  ELSE 0 END
             ELSE 0 END +
      
      -- Leadership score (15% weight)
      CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 30 THEN 15
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 20 THEN 12
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 10 THEN 9
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN 6
           WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 1 THEN 3
           ELSE 0 END
    ) AS success_score,
    
    -- Raw metrics
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) AS bills_sponsored,
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
      SELECT 1 FROM ls_bill_progress bp 
      WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
    ) THEN bs.bill_id END) AS successful_bills,
    
    -- Success rate
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0 
      THEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
        SELECT 1 FROM ls_bill_progress bp 
        WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
      ) THEN bs.bill_id END)::float / 
        COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END))
      ELSE 0 
    END AS success_rate,
    
    -- Bipartisan bills count
    (SELECT COUNT(DISTINCT b.bill_id)
     FROM ls_bill_sponsor bs2
     JOIN ls_bill b ON bs2.bill_id = b.bill_id
     JOIN ls_people p2 ON bs2.people_id = p2.people_id
     WHERE bs2.people_id = p.people_id
     AND bs2.sponsor_type_id = 1
     AND EXISTS (
       SELECT 1 FROM ls_bill_sponsor bs3
       JOIN ls_people p3 ON bs3.people_id = p3.people_id
       WHERE bs3.bill_id = b.bill_id
       AND bs3.sponsor_type_id != 1
       AND p3.party_id != p.party_id
       AND p3.party_id IN (1, 2)
     )) AS bipartisan_count,
    
    -- Lead and cosponsor counts
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) AS lead_count,
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id != 1 THEN bs.bill_id END) AS cosponsor_count,
    
    -- Component scores
    CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 30 THEN 10
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 20 THEN 8
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 10 THEN 6
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN 4
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 1 THEN 2
         ELSE 0 END AS activity_score,
    
    -- Effectiveness score
    CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN
           CASE WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.75 THEN 60
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.60 THEN 55
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.50 THEN 50
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.40 THEN 45
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.30 THEN 40
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.20 THEN 30
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) >= 0.10 THEN 20
                WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) > 0 THEN 10
                ELSE 0 END
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0 THEN
           CASE WHEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
             SELECT 1 FROM ls_bill_progress bp 
             WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
           ) THEN bs.bill_id END)::float / 
             NULLIF(COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END), 0)) > 0 THEN 8
                ELSE 0 END
         ELSE 0 END AS effectiveness_score,
    
    -- Bipartisan score
    CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN
           CASE WHEN (SELECT COUNT(DISTINCT b.bill_id)
                FROM ls_bill_sponsor bs2
                JOIN ls_bill b ON bs2.bill_id = b.bill_id
                JOIN ls_people p2 ON bs2.people_id = p2.people_id
                WHERE bs2.people_id = p.people_id
                AND bs2.sponsor_type_id = 1
                AND EXISTS (
                  SELECT 1 FROM ls_bill_sponsor bs3
                  JOIN ls_people p3 ON bs3.people_id = p3.people_id
                  WHERE bs3.bill_id = b.bill_id
                  AND bs3.sponsor_type_id != 1
                  AND p3.party_id != p.party_id
                  AND p3.party_id IN (1, 2)
                )) >= 10 THEN 15
                WHEN (SELECT COUNT(DISTINCT b.bill_id)
                FROM ls_bill_sponsor bs2
                JOIN ls_bill b ON bs2.bill_id = b.bill_id
                JOIN ls_people p2 ON bs2.people_id = p2.people_id
                WHERE bs2.people_id = p.people_id
                AND bs2.sponsor_type_id = 1
                AND EXISTS (
                  SELECT 1 FROM ls_bill_sponsor bs3
                  JOIN ls_people p3 ON bs3.people_id = p3.people_id
                  WHERE bs3.bill_id = b.bill_id
                  AND bs3.sponsor_type_id != 1
                  AND p3.party_id != p.party_id
                  AND p3.party_id IN (1, 2)
                )) >= 5 THEN 12
                WHEN (SELECT COUNT(DISTINCT b.bill_id)
                FROM ls_bill_sponsor bs2
                JOIN ls_bill b ON bs2.bill_id = b.bill_id
                JOIN ls_people p2 ON bs2.people_id = p2.people_id
                WHERE bs2.people_id = p.people_id
                AND bs2.sponsor_type_id = 1
                AND EXISTS (
                  SELECT 1 FROM ls_bill_sponsor bs3
                  JOIN ls_people p3 ON bs3.people_id = p3.people_id
                  WHERE bs3.bill_id = b.bill_id
                  AND bs3.sponsor_type_id != 1
                  AND p3.party_id != p.party_id
                  AND p3.party_id IN (1, 2)
                )) >= 3 THEN 10
                WHEN (SELECT COUNT(DISTINCT b.bill_id)
                FROM ls_bill_sponsor bs2
                JOIN ls_bill b ON bs2.bill_id = b.bill_id
                JOIN ls_people p2 ON bs2.people_id = p2.people_id
                WHERE bs2.people_id = p.people_id
                AND bs2.sponsor_type_id = 1
                AND EXISTS (
                  SELECT 1 FROM ls_bill_sponsor bs3
                  JOIN ls_people p3 ON bs3.people_id = p3.people_id
                  WHERE bs3.bill_id = b.bill_id
                  AND bs3.sponsor_type_id != 1
                  AND p3.party_id != p.party_id
                  AND p3.party_id IN (1, 2)
                )) >= 1 THEN 5
                ELSE 0 END
         ELSE 0 END AS bipartisan_score,
    
    -- Leadership score
    CASE WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 30 THEN 15
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 20 THEN 12
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 10 THEN 9
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 5 THEN 6
         WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) >= 1 THEN 3
         ELSE 0 END AS leadership_score,
    
    -- Party ID
    p.party_id,
    
    -- Timestamp
    NOW() AS last_calculated
  FROM ls_people p
  JOIN ls_bill_sponsor bs ON p.people_id = bs.people_id
  GROUP BY p.people_id, p.party_id
  HAVING COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function
COMMENT ON FUNCTION refresh_sponsor_success_scores() IS 'Refreshes the sponsor success scores table with updated calculations based on current bill data'; 