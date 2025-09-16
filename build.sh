#!/bin/bash

# Build the server
echo "Building server..."
npm run build

# Copy static files to dist
echo "Copying static files..."
cp -r server/public dist/

echo "Build complete!"