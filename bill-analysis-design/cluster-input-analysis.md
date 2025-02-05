# Input Fields for Cluster Analysis

## The following fields are used for LLM analysis 
View: lsv_bill
-   b.bill_id,
-   b.bill_number,
-   p.progress_desc AS status_desc,
-   b.status_date,
-   b.title,
-   b.description, (only use if different from title)
-   bo1.body_name,
-   c.committee_name AS pending_committee_name,
-   b.created,
-   b.updated,
-   st.state_name,
-   s.session_name

View: lsv_bill_sponsor (Only one Primary Sponsor is used)
-   spt.sponsor_type_desc,
-   p.party_id,
-   pa.party_abbr,
-   pa.party_name,
-   p.name,

View: lsv_bill_history (last action date is used)
-   bh.history_step,
-   bh.history_date,
-   bo.body_short AS history_body_short,
-   bh.history_action,
 
 Table: bill_analysis_subgroup_scores
     subgroup_code as "affected demographic" (need to map to a demographic)
     bias_score (is Bias if score >= 0.6)
     positive_impact_score (is Positive Impact if score >= 0.6)



### Subgroup Code Mapping
  // Race
  'BH': 'Black/African American',
  'AP': 'Asian/Pacific Islander',
  'LX': 'Latinx',
  'WH': 'White',
  'IN': 'Indigenous/Native American',
  // Religion
  'MU': 'Muslim',
  'CH': 'Christian',
  'JW': 'Jewish',
  'HI': 'Hindu',
  'BD': 'Buddhist',
  'SK': 'Sikh',
  'AT': 'Atheist/Agnostic',
  // Gender
  'ML': 'Male',
  'FM': 'Female',
  'TG': 'Transgender',
  'NB': 'Nonbinary',
  'GQ': 'Genderqueer',
  // Age
  'CY': 'Children and Youth',
  'AD': 'Adults',
  'OA': 'Older Adults (Seniors)',
  // Nationality
  'IM': 'Immigrant Communities',
  'NC': 'Naturalized Citizens',
  'FN': 'Foreign Nationals',
  // Sexual Orientation
  'LQ': 'LGBTQ+',
  'HT': 'Heterosexual',
  'BI': 'Bisexual',
  'PS': 'Pansexual',
  'AS': 'Asexual',
  // Veterans
  'VT': 'Veterans (General)',
  'DV': 'Disabled Veterans',
  'RM': 'Retired Military Personnel',
  // Disability
  'PD': 'Physical Disabilities',
  'MH': 'Mental Health Challenges',
  'DD': 'Developmental Disabilities'

