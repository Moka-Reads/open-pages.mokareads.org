#!/bin/bash

# Copy CSS assets to dist directory
echo "Copying CSS files to dist..."

# Create dist/css directory if it doesn't exist
mkdir -p dist/css

# Copy CSS files
cp src/css/style.css dist/css/
cp src/css/theme-default.css dist/css/
cp src/css/theme-moka.css dist/css/

echo "CSS files copied successfully!"
