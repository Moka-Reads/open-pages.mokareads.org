#!/bin/bash

# Open Pages Build Script
# Processes papers and generates static assets for the web

set -e  # Exit on error

# Create required directories
mkdir -p dist/css dist/js
mkdir -p papers/assets

# Set NODE_PATH for GitHub Actions
export NODE_PATH=$NODE_PATH:$(npm root -g)

# Copy CSS files
echo "Copying CSS files..."
cp src/css/style.css dist/css/
cp src/css/theme-default.css dist/css/
cp src/css/theme-maple.css dist/css/

# Copy JS files
echo "Copying JS files..."
mkdir -p dist/js
cp src/js/papers.js dist/js/
cp src/js/main.js dist/js/

# Remove ES module syntax from JS files for better browser compatibility
echo "Modifying JS files for browser compatibility..."
sed -i.bak 's/export default papersManager;//g' dist/js/papers.js
sed -i.bak 's/import papersManager from "\.\/papers\.js";//g' dist/js/main.js
rm -f dist/js/*.bak

# Process papers
echo "Processing papers..."
# Check if node is installed
if command -v node &> /dev/null; then
    # Install required dependencies if they don't exist
    if [ ! -d "node_modules" ] && [ -z "$CI" ]; then
        echo "Installing dependencies..."
        npm init -y
        npm install marked js-yaml glob
    fi

    # Run the build script
    node build.js
else
    echo "Node.js is not installed. Using fallback paper processing..."
    # Generate the JSON list of markdown files
    echo "[" > dist/papers-list.json
    first=true

    for file in papers/*.md; do
        if [ -f "$file" ]; then
            basename_file=$(basename "$file")
            slug="${basename_file%.md}"

            # Create a minimal paper entry
            if [ "$first" = true ]; then
                echo "  {\"slug\": \"$slug\", \"title\": \"$slug\", \"filename\": \"$basename_file\"}" >> dist/papers-list.json
                first=false
            else
                echo ",  {\"slug\": \"$slug\", \"title\": \"$slug\", \"filename\": \"$basename_file\"}" >> dist/papers-list.json
            fi
        fi
    done

    echo "]" >> dist/papers-list.json

    # Copy the papers list to the main papers.json for compatibility
    cp dist/papers-list.json dist/papers.json

    echo "WARNING: Basic paper processing complete. Install Node.js for full functionality."
fi

echo "Build complete!"
if [ -z "$CI" ]; then
    echo "Now you can run 'python -m http.server' to test the site locally"
else
    echo "Built for deployment"
fi
