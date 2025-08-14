#!/bin/bash

# Generate a JSON list of all markdown files in the papers directory
# Run this script whenever you add new papers

cd "$(dirname "$0")"

# Create papers directory if it doesn't exist
mkdir -p papers

# Generate the JSON list of markdown files
echo "[" > papers/papers-list.json
first=true

for file in papers/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "  \"$basename_file\"" >> papers/papers-list.json
            first=false
        else
            echo ",  \"$basename_file\"" >> papers/papers-list.json
        fi
    fi
done

echo "]" >> papers/papers-list.json

echo "Papers list updated in papers/papers-list.json"
echo "Found papers:"
cat papers/papers-list.json
