#!/bin/bash

# BAFCI - Get Authentication Token Script
# This script helps you get your auth token for API testing

echo "=========================================="
echo "  BAFCI - Get Authentication Token"
echo "=========================================="
echo ""

# Get credentials
read -p "Enter your email: " EMAIL
read -sp "Enter your password: " PASSWORD
echo ""
echo ""

echo "Logging in..."
echo ""

# Make login request
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $RESPONSE"
else
  echo "✅ Login successful!"
  echo ""
  echo "=========================================="
  echo "Your Auth Token:"
  echo "=========================================="
  echo "$TOKEN"
  echo ""
  echo "=========================================="
  echo "Use this token in your API requests:"
  echo "=========================================="
  echo "curl -X POST http://localhost:5000/api/notifications/trigger-auto-sms \\"
  echo "  -H \"x-auth-token: $TOKEN\""
  echo ""
fi
