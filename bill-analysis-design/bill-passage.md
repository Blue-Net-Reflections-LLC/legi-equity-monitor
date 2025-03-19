## Overview
This document outlines our approach to identifying and analyzing bills with a high likelihood of passage, enabling proactive analysis of potential disparate impacts before bills reach the enrolled stage.

## Data Requirements

### Historical Data Scope
- **Optimal Range**: 3-5 years of legislative data
- **Minimum Requirements**:
  - 1.5 Congress sessions (3 years)
  - 2 election cycles
  - Committee reorganization periods
- **Data Types**:
  - Bill progress records
  - Sponsorship patterns
  - Committee assignments
  - Voting records
  - Amendment histories

## Scoring System

### Bill Passage Likelihood Score (0-100)
```typescript
interface BillScore {
  totalScore: number;
  components: {
    committeePower: number;    // 0-40 points
    sponsorLeadership: number; // 0-30 points
    bipartisanSupport: number; // 0-20 points
    amendmentActivity: number; // 0-10 points
  };
}
```

### Component Calculations

#### 1. Committee Power (40%)
```sql
WITH committee_progress AS (
  SELECT 
    c.committee_id,
    c.committee_name,
    bo.body_name AS committee_body_name,
    -- Count bills at different stages
    COUNT(DISTINCT br.bill_id) AS total_bills,
    COUNT(DISTINCT CASE 
            WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2) -- Engrossed
            THEN br.bill_id END) AS engrossed_bills,
    COUNT(DISTINCT CASE 
            WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3) -- Enrolled
            THEN br.bill_id END) AS enrolled_bills,
    COUNT(DISTINCT CASE 
            WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4) -- Passed
            THEN br.bill_id END) AS passed_bills,
    COUNT(DISTINCT CASE 
            WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                         WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 5) -- Vetoed
            THEN br.bill_id END) AS vetoed_bills,
    -- Current pending bills
    COUNT(DISTINCT CASE WHEN b.pending_committee_id = c.committee_id THEN b.bill_id END) AS pending_bills
  FROM ls_committee c
  JOIN ls_body bo ON c.committee_body_id = bo.body_id
  LEFT JOIN ls_bill_referral br ON c.committee_id = br.committee_id
  LEFT JOIN ls_bill b ON br.bill_id = b.bill_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  GROUP BY c.committee_id, c.committee_name, bo.body_name
)
SELECT 
  committee_id,
  committee_name,
  committee_body_name,
  total_bills,
  engrossed_bills,
  enrolled_bills,
  passed_bills,
  vetoed_bills,
  pending_bills,
  -- Use direct tiered scoring instead of normalized scores
  (
    -- Base points: Maximum 5 points just for being a committee with bills
    CASE 
      WHEN total_bills >= 50 THEN 5
      WHEN total_bills >= 20 THEN 3
      WHEN total_bills >= 5 THEN 1
      ELSE 0
    END +
    -- Engrossed: 5 points maximum
    CASE
      WHEN engrossed_bills >= 20 THEN 5
      WHEN engrossed_bills >= 10 THEN 3
      WHEN engrossed_bills >= 1 THEN 1
      ELSE 0
    END +
    -- Enrolled: 10 points maximum
    CASE
      WHEN enrolled_bills >= 20 THEN 10
      WHEN enrolled_bills >= 10 THEN 7
      WHEN enrolled_bills >= 5 THEN 5
      WHEN enrolled_bills >= 1 THEN 2
      ELSE 0
    END +
    -- Passed: 15 points maximum
    CASE
      WHEN passed_bills >= 20 THEN 15
      WHEN passed_bills >= 10 THEN 10
      WHEN passed_bills >= 5 THEN 7
      WHEN passed_bills >= 1 THEN 3
      ELSE 0
    END +
    -- Vetoed: 5 points maximum (still valuable to reach veto stage)
    CASE
      WHEN vetoed_bills >= 5 THEN 5
      WHEN vetoed_bills >= 2 THEN 3
      WHEN vetoed_bills >= 1 THEN 1
      ELSE 0
    END +
    -- Current influence: 5 points maximum
    CASE
      WHEN pending_bills >= 20 THEN 5
      WHEN pending_bills >= 10 THEN 3
      WHEN pending_bills >= 5 THEN 2
      WHEN pending_bills >= 1 THEN 1
      ELSE 0
    END
  ) AS power_score
FROM committee_progress
WHERE total_bills > 0
ORDER BY power_score DESC;
```

#### 2. Sponsor Leadership (30%)
```sql
WITH 
-- Identify bills that have advanced (engrossed, enrolled, passed, chaptered, vetoed)
successful_bills AS (
  SELECT 
    bill_id
  FROM 
    ls_bill_progress
  WHERE 
    progress_event_id IN (2, 3, 4, 5, 8) -- Engrossed, Enrolled, Passed, Vetoed, Chaptered
),

-- Calculate success rates for all sponsors
sponsor_success_rates AS (
  SELECT
    p.people_id,
    p.name,
    p.party_id,
    pa.party_name,
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) AS bills_sponsored,
    COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND sb.bill_id IS NOT NULL THEN bs.bill_id END) AS successful_bills,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0 
      THEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND sb.bill_id IS NOT NULL THEN bs.bill_id END)::float / 
            COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END))
      ELSE 0 
    END AS success_rate
  FROM 
    ls_people p
  JOIN 
    ls_party pa ON p.party_id = pa.party_id
  JOIN 
    ls_bill_sponsor bs ON p.people_id = bs.people_id
  JOIN
    ls_bill b ON bs.bill_id = b.bill_id
  JOIN
    ls_state st ON b.state_id = st.state_id
  LEFT JOIN
    successful_bills sb ON bs.bill_id = sb.bill_id
  WHERE
    st.state_abbr = 'NY' -- Filter for specific state (change as needed)
    AND b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = st.state_id)
    AND b.bill_type_id IN (1, 2, 3) -- Regular Bills, Resolutions, Concurrent Resolutions
  GROUP BY
    p.people_id, p.name, p.party_id, pa.party_name
),

-- Calculate bipartisan support metrics
bipartisan_metrics AS (
  SELECT
    primary_bs.people_id AS sponsor_id,
    COUNT(DISTINCT CASE WHEN primary_people.party_id != cosponsor_people.party_id THEN cosponsor_bs.people_id END) AS diff_party_cosponsors,
    COUNT(DISTINCT cosponsor_bs.people_id) AS total_cosponsors,
    CASE 
      WHEN COUNT(DISTINCT cosponsor_bs.people_id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN primary_people.party_id != cosponsor_people.party_id THEN cosponsor_bs.people_id END)::float / 
            COUNT(DISTINCT cosponsor_bs.people_id))
      ELSE 0 
    END AS bipartisan_ratio
  FROM 
    ls_bill_sponsor primary_bs
  JOIN
    ls_bill b ON primary_bs.bill_id = b.bill_id
  JOIN
    ls_people primary_people ON primary_bs.people_id = primary_people.people_id
  JOIN
    ls_state st ON b.state_id = st.state_id
  LEFT JOIN
    ls_bill_sponsor cosponsor_bs ON primary_bs.bill_id = cosponsor_bs.bill_id AND cosponsor_bs.sponsor_type_id != 1
  LEFT JOIN
    ls_people cosponsor_people ON cosponsor_bs.people_id = cosponsor_people.people_id
  WHERE
    primary_bs.sponsor_type_id = 1 -- Primary sponsors only
    AND st.state_abbr = 'NY' -- Filter for specific state (change as needed)
    AND b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = st.state_id)
  GROUP BY
    primary_bs.people_id
)

SELECT
  sr.people_id,
  sr.name,
  sr.party_name,
  sr.bills_sponsored,
  sr.successful_bills,
  (sr.success_rate * 100)::numeric(10,1) AS success_rate_pct,
  COALESCE(bm.total_cosponsors, 0) AS total_cosponsors,
  COALESCE(bm.diff_party_cosponsors, 0) AS diff_party_cosponsors,
  (COALESCE(bm.bipartisan_ratio, 0) * 100)::numeric(10,1) AS bipartisan_ratio_pct,
  
  -- Calculate leadership score (0-30 points maximum)
  (
    -- Effectiveness (0-10 points): Based on success rate
    (CASE 
      WHEN sr.success_rate >= 0.7 AND sr.bills_sponsored >= 5 THEN 10
      WHEN sr.success_rate >= 0.5 AND sr.bills_sponsored >= 3 THEN 7
      WHEN sr.success_rate >= 0.3 AND sr.bills_sponsored >= 2 THEN 5
      WHEN sr.success_rate > 0 THEN 3
      WHEN sr.bills_sponsored > 0 THEN 1
      ELSE 0
    END) +
    
    -- Volume (0-8 points): Based on number of bills sponsored
    (CASE 
      WHEN sr.bills_sponsored >= 15 THEN 8
      WHEN sr.bills_sponsored >= 10 THEN 6
      WHEN sr.bills_sponsored >= 5 THEN 4
      WHEN sr.bills_sponsored >= 1 THEN 2
      ELSE 0
    END) +
    
    -- Network (0-7 points): Based on bipartisan support
    (CASE 
      WHEN COALESCE(bm.bipartisan_ratio, 0) >= 0.4 THEN 7
      WHEN COALESCE(bm.bipartisan_ratio, 0) >= 0.3 THEN 5
      WHEN COALESCE(bm.bipartisan_ratio, 0) >= 0.2 THEN 3
      WHEN COALESCE(bm.bipartisan_ratio, 0) > 0 THEN 1
      ELSE 0
    END) +
    
    -- Engagement (0-5 points): Based on total cosponsors attracted
    (CASE 
      WHEN COALESCE(bm.total_cosponsors, 0) >= 30 THEN 5
      WHEN COALESCE(bm.total_cosponsors, 0) >= 20 THEN 4
      WHEN COALESCE(bm.total_cosponsors, 0) >= 10 THEN 3
      WHEN COALESCE(bm.total_cosponsors, 0) >= 5 THEN 2
      ELSE 0
    END)
  )::numeric(10,1) AS leadership_score
FROM
  sponsor_success_rates sr
LEFT JOIN
  bipartisan_metrics bm ON sr.people_id = bm.sponsor_id
WHERE
  sr.bills_sponsored > 0 -- Only include people who have sponsored at least one bill
ORDER BY
  leadership_score DESC,
  success_rate_pct DESC;
```

#### 3. Bipartisan Support (20%)
```sql
WITH bill_party_stats AS (
  SELECT 
    b.bill_id,
    b.bill_number,
    b.title,
    b.status_id,
    -- Get primary sponsor party
    (SELECT pa.party_abbr 
     FROM ls_bill_sponsor bs 
     JOIN ls_people p ON bs.people_id = p.people_id
     JOIN ls_party pa ON p.party_id = pa.party_id
     WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1 
     LIMIT 1) AS primary_sponsor_party,
    -- Count total Democratic cosponsors
    COUNT(DISTINCT CASE WHEN p.party_id = 1 THEN bs.people_id END) AS dem_sponsors,
    -- Count total Republican cosponsors
    COUNT(DISTINCT CASE WHEN p.party_id = 2 THEN bs.people_id END) AS rep_sponsors,
    -- Count total third-party or independent cosponsors
    COUNT(DISTINCT CASE WHEN p.party_id NOT IN (1, 2) THEN bs.people_id END) AS other_sponsors,
    -- Total cosponsors
    COUNT(DISTINCT bs.people_id) AS total_sponsors
  FROM ls_bill b
  JOIN ls_bill_sponsor bs ON b.bill_id = bs.bill_id
  JOIN ls_people p ON bs.people_id = p.people_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
  GROUP BY b.bill_id, b.bill_number, b.title, b.status_id
),
bipartisan_scores AS (
  SELECT 
    bill_id,
    bill_number,
    title,
    primary_sponsor_party,
    dem_sponsors,
    rep_sponsors,
    other_sponsors,
    total_sponsors,
    -- Calculate the bipartisan score
    CASE
      -- First check if there are sponsors from both major parties
      WHEN dem_sponsors > 0 AND rep_sponsors > 0 THEN
        -- If primary sponsor is Democratic, measure Republican support
        CASE WHEN primary_sponsor_party = 'D' THEN
          CASE
            WHEN rep_sponsors >= 10 THEN 20
            WHEN rep_sponsors >= 5 THEN 15
            WHEN rep_sponsors >= 3 THEN 10
            WHEN rep_sponsors >= 1 THEN 5
            ELSE 0
          END
        -- If primary sponsor is Republican, measure Democratic support
        WHEN primary_sponsor_party = 'R' THEN
          CASE
            WHEN dem_sponsors >= 10 THEN 20
            WHEN dem_sponsors >= 5 THEN 15
            WHEN dem_sponsors >= 3 THEN 10
            WHEN dem_sponsors >= 1 THEN 5
            ELSE 0
          END
        -- If primary sponsor is third party or independent, the mere presence of both parties is noteworthy
        ELSE
          CASE
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 5 THEN 20
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 3 THEN 15
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 1 THEN 10
            ELSE 5
          END
        END
      -- If only one party is represented, no bipartisan support
      ELSE 0
    END AS bipartisan_score
  FROM bill_party_stats
)
SELECT 
  bill_id,
  bill_number,
  title,
  primary_sponsor_party,
  dem_sponsors,
  rep_sponsors,
  other_sponsors,
  total_sponsors,
  bipartisan_score
FROM bipartisan_scores
ORDER BY bipartisan_score DESC;
```

#### 4. Amendment Activity (10%)
```sql
WITH amendment_counts AS (
  SELECT 
    b.bill_id,
    b.bill_number,
    b.title,
    b.status_id,
    COUNT(a.amendment_id) AS amendment_count,
    -- Count adopted amendments
    SUM(CASE WHEN a.adopted = 1 THEN 1 ELSE 0 END) AS adopted_count,
    -- Most recent amendment date
    MAX(a.amendment_date) AS last_amendment_date
  FROM ls_bill b
  LEFT JOIN ls_bill_amendment a ON b.bill_id = a.bill_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
  GROUP BY b.bill_id, b.bill_number, b.title, b.status_id
)
SELECT 
  bill_id,
  bill_number,
  title,
  amendment_count,
  adopted_count,
  last_amendment_date,
  -- Calculate amendment activity score
  CASE
    -- Bills with amendments tend to have stakeholder engagement & negotiation
    WHEN amendment_count = 0 THEN 10  -- No amendments suggests consensus or fast-tracking
    WHEN amendment_count BETWEEN 1 AND 3 THEN
      CASE 
        WHEN adopted_count > 0 THEN 8  -- Some amendments adopted shows productive refinement
        ELSE 6  -- Amendments proposed but not adopted
      END
    WHEN amendment_count BETWEEN 4 AND 10 THEN
      CASE
        WHEN adopted_count::float / amendment_count >= 0.5 THEN 5  -- Good adoption rate with moderate activity
        ELSE 3  -- Lower adoption rate with moderate activity
      END  
    ELSE 1  -- Many amendments suggests controversy or complexity
  END AS amendment_score
FROM amendment_counts
ORDER BY amendment_score DESC, amendment_count;
```

### Combined Score Calculation

To calculate the complete bill passage likelihood score, we need to combine all four components. The following query combines these components and calculates the total score:

```sql
WITH 
-- Committee Power Component (0-40 points)
committee_scores AS (
  SELECT 
    b.bill_id,
    -- Get committee power score where the bill is currently pending
    COALESCE(
      (SELECT cp.power_score 
       FROM (
         -- This subquery reproduces the committee power calculation
         WITH committee_progress AS (
           SELECT 
             c.committee_id,
             COUNT(DISTINCT br.bill_id) AS total_bills,
             COUNT(DISTINCT CASE 
                     WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                                  WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2)
                     THEN br.bill_id END) AS engrossed_bills,
             COUNT(DISTINCT CASE 
                     WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                                  WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3)
                     THEN br.bill_id END) AS enrolled_bills,
             COUNT(DISTINCT CASE 
                     WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                                  WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4)
                     THEN br.bill_id END) AS passed_bills,
             COUNT(DISTINCT CASE 
                     WHEN EXISTS (SELECT 1 FROM ls_bill_progress bp 
                                  WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 5)
                     THEN br.bill_id END) AS vetoed_bills,
             COUNT(DISTINCT CASE WHEN b2.pending_committee_id = c.committee_id THEN b2.bill_id END) AS pending_bills
           FROM ls_committee c
           LEFT JOIN ls_bill_referral br ON c.committee_id = br.committee_id
           LEFT JOIN ls_bill b2 ON br.bill_id = b2.bill_id
           WHERE b2.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b2.state_id)
           GROUP BY c.committee_id
         )
         SELECT 
           committee_id,
           (
             CASE WHEN total_bills >= 50 THEN 5 WHEN total_bills >= 20 THEN 3 WHEN total_bills >= 5 THEN 1 ELSE 0 END +
             CASE WHEN engrossed_bills >= 20 THEN 5 WHEN engrossed_bills >= 10 THEN 3 WHEN engrossed_bills >= 1 THEN 1 ELSE 0 END +
             CASE WHEN enrolled_bills >= 20 THEN 10 WHEN enrolled_bills >= 10 THEN 7 WHEN enrolled_bills >= 5 THEN 5 WHEN enrolled_bills >= 1 THEN 2 ELSE 0 END +
             CASE WHEN passed_bills >= 20 THEN 15 WHEN passed_bills >= 10 THEN 10 WHEN passed_bills >= 5 THEN 7 WHEN passed_bills >= 1 THEN 3 ELSE 0 END +
             CASE WHEN vetoed_bills >= 5 THEN 5 WHEN vetoed_bills >= 2 THEN 3 WHEN vetoed_bills >= 1 THEN 1 ELSE 0 END +
             CASE WHEN pending_bills >= 20 THEN 5 WHEN pending_bills >= 10 THEN 3 WHEN pending_bills >= 5 THEN 2 WHEN pending_bills >= 1 THEN 1 ELSE 0 END
           ) AS power_score
         FROM committee_progress
       ) cp
       WHERE cp.committee_id = b.pending_committee_id
      ), 0) AS committee_power_score
  FROM ls_bill b
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
),

-- Sponsor Leadership Component (0-30 points)
sponsor_scores AS (
  SELECT 
    b.bill_id,
    -- Get leadership score of primary sponsor
    COALESCE(
      (SELECT sl.leadership_score 
       FROM (
         -- This subquery reproduces the sponsor leadership calculation
         WITH sponsor_metrics AS (
           SELECT 
             p.people_id,
             COUNT(DISTINCT CASE WHEN bs2.sponsor_type_id = 1 THEN bs2.bill_id END) AS primary_bills,
             COUNT(DISTINCT CASE 
                 WHEN bs2.sponsor_type_id = 1 AND EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = bs2.bill_id AND bp.progress_event_id IN (3, 4, 8)
                 ) 
                 THEN bs2.bill_id 
               END) AS successful_primary_bills,
             (SELECT COUNT(DISTINCT co.people_id) 
              FROM ls_bill_sponsor bs3 
              JOIN ls_bill_sponsor co ON bs3.bill_id = co.bill_id AND co.sponsor_type_id != 1 
              WHERE bs3.people_id = p.people_id AND bs3.sponsor_type_id = 1
             ) AS cosponsors_attracted,
             COUNT(DISTINCT CASE WHEN bs2.sponsor_type_id != 1 THEN bs2.bill_id END) AS bills_cosponsored,
             CASE WHEN p.district = '' OR p.district IS NULL THEN TRUE ELSE FALSE END AS is_leadership_position
           FROM ls_people p
           JOIN ls_bill_sponsor bs2 ON p.people_id = bs2.people_id
           JOIN ls_bill b2 ON bs2.bill_id = b2.bill_id
           WHERE b2.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b2.state_id)
           GROUP BY p.people_id, p.district
         )
         SELECT 
           people_id,
           (
             CASE
               WHEN primary_bills >= 5 AND successful_primary_bills::float / primary_bills >= 0.7 THEN 10
               WHEN primary_bills >= 3 AND successful_primary_bills::float / primary_bills >= 0.5 THEN 7
               WHEN primary_bills >= 2 AND successful_primary_bills::float / primary_bills >= 0.3 THEN 5
               WHEN successful_primary_bills > 0 THEN 3
               WHEN primary_bills > 0 THEN 1
               ELSE 0
             END +
             CASE
               WHEN primary_bills >= 20 THEN 8
               WHEN primary_bills >= 10 THEN 6
               WHEN primary_bills >= 5 THEN 4
               WHEN primary_bills >= 1 THEN 2
               ELSE 0
             END +
             CASE
               WHEN cosponsors_attracted >= 30 THEN 7
               WHEN cosponsors_attracted >= 20 THEN 5
               WHEN cosponsors_attracted >= 10 THEN 3
               WHEN cosponsors_attracted >= 1 THEN 1
               ELSE 0
             END +
             CASE
               WHEN bills_cosponsored >= 50 THEN 3
               WHEN bills_cosponsored >= 20 THEN 2
               WHEN bills_cosponsored >= 5 THEN 1
               ELSE 0
             END +
             CASE WHEN is_leadership_position THEN 2 ELSE 0 END
           ) AS leadership_score
         FROM sponsor_metrics
         WHERE primary_bills > 0
       ) sl
       WHERE sl.people_id = (
         SELECT bs.people_id 
         FROM ls_bill_sponsor bs 
         WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1
         LIMIT 1
       )
      ), 0) AS sponsor_leadership_score
  FROM ls_bill b
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
),

-- Bipartisan Support Component (0-20 points)
bipartisan_scores AS (
  SELECT 
    b.bill_id,
    (SELECT pa.party_abbr 
     FROM ls_bill_sponsor bs 
     JOIN ls_people p ON bs.people_id = p.people_id
     JOIN ls_party pa ON p.party_id = pa.party_id
     WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1 
     LIMIT 1) AS primary_sponsor_party,
    COUNT(DISTINCT CASE WHEN p.party_id = 1 THEN bs.people_id END) AS dem_sponsors,
    COUNT(DISTINCT CASE WHEN p.party_id = 2 THEN bs.people_id END) AS rep_sponsors
  FROM ls_bill b
  JOIN ls_bill_sponsor bs ON b.bill_id = bs.bill_id
  JOIN ls_people p ON bs.people_id = p.people_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
  GROUP BY b.bill_id
),

-- Calculate bipartisan score from the data
bipartisan_final_scores AS (
  SELECT 
    bill_id,
    CASE
      WHEN dem_sponsors > 0 AND rep_sponsors > 0 THEN
        CASE WHEN primary_sponsor_party = 'D' THEN
          CASE
            WHEN rep_sponsors >= 10 THEN 20
            WHEN rep_sponsors >= 5 THEN 15
            WHEN rep_sponsors >= 3 THEN 10
            WHEN rep_sponsors >= 1 THEN 5
            ELSE 0
          END
        WHEN primary_sponsor_party = 'R' THEN
          CASE
            WHEN dem_sponsors >= 10 THEN 20
            WHEN dem_sponsors >= 5 THEN 15
            WHEN dem_sponsors >= 3 THEN 10
            WHEN dem_sponsors >= 1 THEN 5
            ELSE 0
          END
        ELSE
          CASE
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 5 THEN 20
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 3 THEN 15
            WHEN LEAST(dem_sponsors, rep_sponsors) >= 1 THEN 10
            ELSE 5
          END
        END
      ELSE 0
    END AS bipartisan_score
  FROM bipartisan_scores
),

-- Amendment Activity Component (0-10 points)
amendment_scores AS (
  SELECT 
    b.bill_id,
    COUNT(a.amendment_id) AS amendment_count,
    SUM(CASE WHEN a.adopted = 1 THEN 1 ELSE 0 END) AS adopted_count
  FROM ls_bill b
  LEFT JOIN ls_bill_amendment a ON b.bill_id = a.bill_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
  GROUP BY b.bill_id
),

-- Calculate amendment score from the data
amendment_final_scores AS (
  SELECT 
    bill_id,
    CASE
      WHEN amendment_count = 0 THEN 10
      WHEN amendment_count BETWEEN 1 AND 3 THEN
        CASE WHEN adopted_count > 0 THEN 8 ELSE 6 END
      WHEN amendment_count BETWEEN 4 AND 10 THEN
        CASE WHEN adopted_count::float / amendment_count >= 0.5 THEN 5 ELSE 3 END  
      ELSE 1
    END AS amendment_score
  FROM amendment_scores
),

-- Combine all scores
final_scores AS (
  SELECT 
    b.bill_id,
    b.bill_number,
    b.title,
    st.state_abbr,
    b.status_id,
    pr.progress_desc AS status_desc,
    COALESCE(cs.committee_power_score, 0) AS committee_power_score,
    COALESCE(ss.sponsor_leadership_score, 0) AS sponsor_leadership_score,
    COALESCE(bs.bipartisan_score, 0) AS bipartisan_score,
    COALESCE(ams.amendment_score, 0) AS amendment_score,
    COALESCE(cs.committee_power_score, 0) + 
    COALESCE(ss.sponsor_leadership_score, 0) + 
    COALESCE(bs.bipartisan_score, 0) + 
    COALESCE(ams.amendment_score, 0) AS total_score
  FROM ls_bill b
  JOIN ls_state st ON b.state_id = st.state_id
  LEFT JOIN ls_progress pr ON b.status_id = pr.progress_event_id
  LEFT JOIN committee_scores cs ON b.bill_id = cs.bill_id
  LEFT JOIN sponsor_scores ss ON b.bill_id = ss.bill_id
  LEFT JOIN bipartisan_final_scores bs ON b.bill_id = bs.bill_id
  LEFT JOIN amendment_final_scores ams ON b.bill_id = ams.bill_id
  WHERE b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)
  AND b.bill_type_id = 1  -- Only regular bills
)

-- Final output with scores and likelihood categories
SELECT 
  bill_id,
  bill_number,
  title,
  state_abbr,
  status_desc,
  committee_power_score AS "Committee Power (40%)",
  sponsor_leadership_score AS "Sponsor Leadership (30%)",
  bipartisan_score AS "Bipartisan Support (20%)",
  amendment_score AS "Amendment Activity (10%)",
  total_score AS "Total Score (0-100)",
  CASE
    WHEN total_score >= 80 THEN 'Very High'
    WHEN total_score >= 70 THEN 'High'
    WHEN total_score >= 50 THEN 'Medium'
    WHEN total_score >= 30 THEN 'Low'
    ELSE 'Very Low'
  END AS "Passage Likelihood"
FROM final_scores
ORDER BY total_score DESC;
```

This combined query:

1. Calculates each of the four component scores separately in CTEs
2. Combines them into a final score on a 0-100 scale
3. Categorizes bills by passage likelihood based on their total score
4. Provides a breakdown of scores by component for transparency

## Implementation Strategy

### 1. Initial Filtering
```typescript
const MINIMUM_SCORE_THRESHOLD = 70;

async function getHighPriorityBills(): Promise<Bill[]> {
  const bills = await fetchActiveBills();
  const scoredBills = await Promise.all(
    bills.map(async bill => ({
      bill,
      score: await calculatePassageLikelihood(bill)
    }))
  );
  
  return scoredBills
    .filter(({ score }) => score >= MINIMUM_SCORE_THRESHOLD)
    .map(({ bill }) => bill);
}
```

### 2. Disparate Impact Analysis Pipeline
```typescript
interface DemographicImpact {
  billId: string;
  impactedGroups: string[];
  impactSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  analysisFactors: string[];
}

async function analyzeBillImpact(bill: Bill): Promise<DemographicImpact> {
  // 1. Text Analysis
  const textImpact = await analyzeTextForDemographicTerms(bill.text);
  
  // 2. Historical Pattern Analysis
  const historicalImpact = await analyzeHistoricalImpacts(bill.subject);
  
  // 3. Community Feedback Integration
  const communityFeedback = await getCommunityFeedback(bill.id);
  
  return combineImpactAnalysis(textImpact, historicalImpact, communityFeedback);
}
```

### 3. Monitoring and Alerts
```typescript
interface BillAlert {
  billId: string;
  passageLikelihood: number;
  demographicImpact: DemographicImpact;
  timeToAction: number; // days until next major event
  recommendedActions: string[];
}

async function monitorHighPriorityBills(): Promise<void> {
  const bills = await getHighPriorityBills();
  
  for (const bill of bills) {
    const impact = await analyzeBillImpact(bill);
    if (impact.impactSeverity === 'HIGH') {
      await createAlert({
        billId: bill.id,
        passageLikelihood: bill.score,
        demographicImpact: impact,
        timeToAction: calculateTimeToAction(bill),
        recommendedActions: generateRecommendedActions(bill, impact)
      });
    }
  }
}
```

## Validation and Refinement

### Performance Metrics
- False Positive Rate (bills flagged but didn't pass)
- False Negative Rate (bills passed but weren't flagged)
- Time-to-Action Window (days between flag and enrollment)
- Impact Prediction Accuracy

### Continuous Improvement
1. Weekly analysis of prediction accuracy
2. Monthly recalibration of scoring weights
3. Quarterly review of demographic impact indicators
4. Bi-annual review of historical data relevance

## Integration Points

### Data Sources
- LegiScan API
- State Legislative APIs
- Community Feedback System
- Historical Impact Database

### System Components
- Bill Tracking Service
- Scoring Engine
- Impact Analysis Pipeline
- Alert System
- Reporting Dashboard

## Resource Optimization

### Processing Priority
1. Bills in committee with high scores
2. Bills approaching floor votes
3. Bills with recent significant amendments
4. Bills with increasing bipartisan support

### Analysis Depth
- **Tier 1** (Score > 80): Full analysis pipeline
- **Tier 2** (Score 70-80): Basic impact assessment
- **Tier 3** (Score < 70): Monitoring only

## Next Steps

1. Implement initial scoring system
2. Set up monitoring pipeline
3. Create alert dashboard
4. Establish feedback loop
5. Deploy validation metrics
6. Begin historical data import