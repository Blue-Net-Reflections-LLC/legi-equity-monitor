```mermaid
flowchart TD
    start([Job Starts])
    gather_context([Gather input context token window, e.g., 4M tokens for MiniMax Text 01])
    query_bills([Query bills in reverse chronological order])
    check_content{Does bill have amendments OR description >= 20 tokens?}
    skip_ineligible([Skip analysis and record status: 'insufficient_content'])
    check_new{Is bill new?}
    add_to_queue_new([Add new bill to processing queue with input data])
    check_modified{Is bill modified?}
    add_to_queue_modified([Add modified bill to processing queue with input data])
    input_limit{Is input queue at 80% of context window?}
    generate_request([Generate request using input JSON structure])
    process_llm([Send request to LLM and retrieve results])
    validate_llm_response{Is there a 1:1 match between input and output bills?}
    log_error([Log explanation of mismatch and stop processing])
    store_results([Store results in database with timestamps and hashes])
    job_end([Record last processing time and finish job])

    %% Define connections
    start --> gather_context
    gather_context --> query_bills
    query_bills --> check_content
    check_content -- No --> skip_ineligible
    check_content -- Yes --> check_new
    check_new -- Yes --> add_to_queue_new
    check_new -- No --> check_modified
    check_modified -- Yes --> add_to_queue_modified
    add_to_queue_new --> input_limit
    add_to_queue_modified --> input_limit
    input_limit -- Yes --> generate_request
    generate_request --> process_llm
    process_llm --> validate_llm_response
    validate_llm_response -- No --> log_error
    validate_llm_response -- Yes --> store_results
    store_results --> job_end
    skip_ineligible --> job_end
    log_error --> job_end

    %% Add notes
    classDef note fill:#fff,stroke:#333,stroke-dasharray: 5 5;
    class check_content note;
```

### Key Changes:
- Modified content check to include amendments
- Bills with amendments will be analyzed even if description is short
- Content from both description and amendments will be included in analysis input
- Skip only if both description is short AND no amendments exist
