#!/bin/bash

echo "🔧 Testing Reminder Creation System"
echo "===================================="
echo ""

# Test user ID - using jack@gabaiapp.com's ID
USER_ID="d52e32d5-3dbb-4287-a03d-939a739803a5"
PHONE_NUMBER="+17326101200"  # Your test phone number

# Get current time + 2 minutes for testing
REMINDER_TIME=$(date -d "+2 minutes" --iso-8601=seconds)

echo "📅 Creating a test voice reminder for $REMINDER_TIME"
echo ""

# Create a test reminder
curl -X POST http://localhost:5000/api/reminders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"title\": \"Test Voice Reminder - Should trigger soon\",
    \"description\": \"This is a test to verify reminders are working\",
    \"dueDate\": \"$REMINDER_TIME\",
    \"smsEnabled\": true,
    \"smsPhone\": \"$PHONE_NUMBER\",
    \"reminderMinutes\": 0,
    \"reminderType\": \"voice\",
    \"timezone\": \"America/New_York\"
  }" | jq

echo ""
echo "✅ Test reminder created"
echo "📱 Should trigger a voice call in 2 minutes to $PHONE_NUMBER"
echo ""
echo "Now checking database to verify it was saved..."
echo ""

# Check the database for recent reminders
echo "SELECT id, user_id, title, reminder_type, sms_phone, due_date FROM reminders WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC LIMIT 1;" | psql $DATABASE_URL