#!/bin/bash
# This file overrides npm build behavior
echo "🚨 FORCING FULL BUILD..."
vite build
cp -r dist/public/* server/public/
exec /usr/local/bin/npm run build:original
