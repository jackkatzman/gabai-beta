#!/bin/bash

echo "🚀 Setting up GabAi Analytics Dashboard with Metabase..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"

# Quick setup with default settings
echo "🐳 Starting Metabase container..."
docker run -d \
  --name gabai-analytics \
  -p 3000:3000 \
  -e MB_DB_FILE="/metabase-data/metabase.db" \
  -v metabase-data:/metabase-data \
  metabase/metabase:latest

if [ $? -eq 0 ]; then
    echo "✅ Metabase started successfully!"
    echo ""
    echo "📊 Analytics Dashboard Setup:"
    echo "1. Open: http://localhost:3000"
    echo "2. Create admin account (first time only)"
    echo "3. Connect to your PostgreSQL database:"
    echo "   - Database Type: PostgreSQL"
    echo "   - Host: $DATABASE_URL (or your database host)"
    echo "   - Database: your-database-name"
    echo "   - Username: your-username"
    echo "   - Password: your-password"
    echo ""
    echo "🎯 Key Tables to Explore:"
    echo "   - users (user analytics)"
    echo "   - messages (conversation data)"
    echo "   - smart_lists (feature usage)"
    echo "   - contacts (growth metrics)"
    echo ""
    echo "📈 Suggested Dashboards:"
    echo "   - User Growth & Engagement"
    echo "   - Revenue & Affiliate Performance"
    echo "   - Feature Usage Analytics"
    echo "   - System Performance Metrics"
    echo ""
    echo "🔧 To stop: docker stop gabai-analytics"
    echo "🗑️  To remove: docker rm gabai-analytics"
else
    echo "❌ Failed to start Metabase"
    exit 1
fi