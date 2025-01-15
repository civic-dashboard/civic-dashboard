#!/bin/bash

# Starting date
start_date="2009-01-01"
# Ending date
end_date="2020-09-01"

# Log file
log_file="script_log.log"

# Initialize current date for iteration
current_date="$start_date"

# Loop through each month until the end date
while [[ "$current_date" < "$end_date" ]]; do
    # Generate from_date and to_date for the current month
    from_date=$(date -d "$current_date" -u +"%Y-%m-%dT00:00:00.000Z")
    next_month=$(date -d "$current_date +1 month" +"%Y-%m-01")
    to_date=$(date -d "$next_month -1 second" -u +"%Y-%m-%dT23:59:59.999Z")

    # Ensure both dates are valid
    if [[ -z "$from_date" || -z "$to_date" ]]; then
        echo "Error generating dates. Exiting..." | tee -a "$log_file"
        exit 1
    fi

    # Log the dates being processed
    echo "Processing from $from_date to $to_date" | tee -a "$log_file"

    # Execute the curl command and log the output
    curl_response=$(curl -X POST http://localhost:5000/store-data \
        -H "Content-Type: application/json" \
        -d "{
  \"from_date\": \"$from_date\",
  \"to_date\": \"$to_date\"
}" 2>&1)

    echo "Curl response: $curl_response" | tee -a "$log_file"

    # Wait for a random interval between 11 and 29 seconds
    sleep_time=$((RANDOM % 19 + 11))
    echo "Sleeping for $sleep_time seconds" | tee -a "$log_file"
    sleep $sleep_time

    # Increment to the next month
    current_date="$next_month"
done

# Log completion
echo "Completed processing up to $to_date" | tee -a "$log_file"
