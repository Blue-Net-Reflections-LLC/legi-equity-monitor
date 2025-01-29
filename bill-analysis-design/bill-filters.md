# Bill Listing Filters

## General Rules
1. Filters will popover the grid
2. When filters are applied, a tag will appear above the bill grid
3. Filters are to display regardless if they product no results.
4. If there are not bills, then a No Results page should be display.

## Impact Scores Rules
1. If a bill has bias score that is equal to the positive impact score --> The bill has neutral impact
2. If a bill has bias score that is under 0.60 and a positive score that is under 0.60, then the bill is neutral impact
3. If a bill has a bias score that is greater than the positive score, then bill has bias impact
4. If a bill has a bias score that is less than the positive score, then the bill has positive impact

## Internal filters 
- Only bills of type 1 will display
- bills must filter by the current state.

## Filters
### Impact Analysis 
#### Overall Bias / Positive / Neutral
- Type: Multiselect
- Applies the Impact Score rules at the `bill_analysis_results` table in the db.

#### Impact Categories
- Type: Multiselect 
- A list of categories that are defined in the [Categories and Subgroups](https://github.com/Blue-Net-Reflections-LLC/legi-equity-monitor/wiki/Categories-and-subgroups)
- Users should be able to filter by a category
- Applies the Impact Score rules for on a selected category using data from the `bill_analysis_category_scores` table in db.

#### Impact Demographic
- Type: Multiselect 
- A list of demographics that are defined in the [Categories and Subgroups](https://github.com/Blue-Net-Reflections-LLC/legi-equity-monitor/wiki/Categories-and-subgroups).  demographics is an alias for subgroups.
- Users should be able to filter by a demographic
- Applies the Impact Score rules for on a selected demographic using data from the `bill_analysis_subgroup_scores` table in db.

### Bill 
#### Party
- Type: Single select and mutually exclusive
- We are only filtering by the primary sponsors party
- Parties are found in the `ls_party` but must be joined with the bills primary sponsor

#### Committee
- Type: Multiselect
- If a state uses committee, display the filter
- Committees could be found in the `ls_committee` table

#### Support
- Type: Single select and mutually exclusive
- If a bill has at least 2 sponsors, then it has support, otherwise it does not.
- A bill's sponsors can be found in the `ls_bill_sponsor` junction table

#### Committee
- Type: Multiselect
