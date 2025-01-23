# Input JSON

```json
{
  "bill_id": "12345",
  "status": "In Progress",
  "session_year_start": "2025",
  "session_year_end": "2025",
  "state": "California",
  "description": "This bill proposes funding for public schools in underserved communities.",
  "sponsors": [
    {
      "people_id": "56789",
      "party": "Democratic",
      "type": "Primary Sponsor"
    }
  ],
  "subjects": [
    "Education",
    "Public Funding"
  ],
  "amendments": [
    {
      "amendment_id": "A123",
      "title": "Amendment to include rural areas",
      "description": "Adds language to include rural areas in funding allocation.",
      "adopted": true
    }
  ],
  "full_texts": [
    {
      "date": "2025-01-10",
      "name": "Original Bill Text",
      "content_url": "https://example.com/bill_text.pdf"
    }
  ]
}
```

# Field Documentation
| **Field**          | **Type**   | **Description**                                                                                       | **Source**                     |
|---------------------|------------|-------------------------------------------------------------------------------------------------------|--------------------------------|
| `bill_id`           | String     | Unique identifier for the bill.                                                                      | `lsv_bill.bill_id`            |
| `status`            | String     | Current status of the bill (e.g., In Progress, Passed).                                              | `lsv_bill.status_desc`        |
| `session_year_start`| String     | Starting year of the legislative session for the bill.                                               | `lsv_bill.session_year_start` |
| `session_year_end`  | String     | Ending year of the legislative session for the bill.                                                 | `lsv_bill.session_year_end`   |
| `state`             | String     | The state where the bill is being considered.                                                        | `lsv_bill.state_name`         |
| `description`       | String     | Summary or abstract of the bill's content.                                                           | `lsv_bill.description`        |
| `sponsors`          | Array      | List of bill sponsors, including their `people_id`, party name, and type (e.g., Primary Sponsor).     | `lsv_bill_sponsor`            |
| `sponsors[].people_id` | String  | Unique identifier for the sponsor.                                                                   | `lsv_bill_sponsor.people_id`  |
| `sponsors[].party`  | String     | Full name of the sponsor's political party (e.g., Democratic, Republican).                           | Mapped from `party_abbr`      |
| `sponsors[].type`   | String     | Role of the sponsor (e.g., Primary Sponsor, Co-Sponsor).                                             | `lsv_bill_sponsor.sponsor_type_desc` |
| `subjects`          | Array      | Topics or categories associated with the bill.                                                       | `lsv_bill_subject.subject_name` |
| `amendments`        | Array      | Details of any amendments to the bill.                                                               | `lsv_bill_amendment`          |
| `amendments[].amendment_id` | String | Unique identifier for the amendment.                                                              | `lsv_bill_amendment.amendment_id` |
| `amendments[].title`| String     | Title of the amendment.                                                                              | `lsv_bill_amendment.amendment_title` |
| `amendments[].description`| String| Description of the amendment's purpose.                                                             | `lsv_bill_amendment.amendment_desc` |
| `amendments[].adopted` | Boolean | Whether the amendment was adopted.                                                                   | `lsv_bill_amendment.adopted`  |
| `full_texts`        | Array      | Details of the full bill text documents.                                                             | `lsv_bill_text`               |
| `full_texts[].date` | String     | Date the text was provided.                                                                          | `lsv_bill_text.bill_text_date` |
| `full_texts[].name` | String     | Name of the bill text document.                                                                      | `lsv_bill_text.bill_text_name` |
| `full_texts[].content_url` | String | URL link to the full text document.                                                                | Placeholder (Assume available) |

