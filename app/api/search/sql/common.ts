// Common entity data selection CTE
export const entityDataCTE = `
  entity_data AS (
    SELECT 
      e.entity_type,
      e.entity_id,
      e.similarity,
      CASE 
        WHEN e.entity_type = 'bill' THEN 
          json_build_object(
            'bill_id', bill.bill_id,
            'bill_number', bill.bill_number,
            'bill_type', bill.bill_type_abbr,
            'title', bill.title,
            'description', bill.description,
            'committee_name', c.committee_name,
            'last_action', h.history_action,
            'last_action_date', h.history_date,
            'state_abbr', e.state_abbr,
            'state_name', e.state_name
          )
        WHEN e.entity_type = 'sponsor' THEN
          json_build_object(
            'people_id', p.people_id,
            'first_name', split_part(p.name, ' ', 1),
            'last_name', array_to_string(array_remove(string_to_array(p.name, ' '), split_part(p.name, ' ', 1)), ' '),
            'name', p.name,
            'party_name', pa.party_name,
            'district', p.district,
            'body_name', ro.role_name,
            'state_abbr', e.state_abbr,
            'state_name', e.state_name,
            'votesmart_id', p.votesmart_id
          )
        WHEN e.entity_type = 'blog_post' THEN
          json_build_object(
            'post_id', bp.post_id,
            'title', bp.title,
            'slug', bp.slug,
            'main_image', bp.main_image,
            'published_at', bp.published_at,
            'state_abbr', e.state_abbr,
            'state_name', e.state_name
          )
      END as item_data
    FROM ranked e
    LEFT JOIN lsv_bill bill ON e.entity_type = 'bill' AND e.entity_id = bill.bill_id AND bill.bill_type_id = 1
    LEFT JOIN ls_committee c ON bill.pending_committee_id = c.committee_id
    LEFT JOIN ls_bill_history h ON bill.bill_id = h.bill_id 
      AND h.history_step = (SELECT MAX(history_step) FROM ls_bill_history WHERE bill_id = bill.bill_id)
    LEFT JOIN ls_people p ON e.entity_type = 'sponsor' AND e.entity_id = p.people_id
    LEFT JOIN ls_party pa ON p.party_id = pa.party_id
    LEFT JOIN ls_role ro ON p.role_id = ro.role_id
    LEFT JOIN blog_posts bp ON e.entity_type = 'blog_post' AND e.entity_uuid = bp.post_id
  )
`

// Common result mapping function
export const mapResults = (results: any[]) => results.map(r => ({
  type: r.entity_type,
  similarity: r.similarity,
  source: r.source,
  item: r.item_data
})) 