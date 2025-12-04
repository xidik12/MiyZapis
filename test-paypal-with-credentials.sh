#!/bin/bash

# Test PayPal with actual credentials
# This will verify if PayPal is properly configured once v1.0.3 deploys

BACKEND_URL="https://miyzapis-backend-production.up.railway.app/api/v1"

echo "🔍 Checking backend version..."
VERSION=$(curl -s "${BACKEND_URL}/health" | jq -r '.version')
echo "Current version: $VERSION"

if [ "$VERSION" != "1.0.3" ]; then
  echo "⚠️  Warning: Expected version 1.0.3, got $VERSION"
  echo "Railway may still be deploying. Please wait and try again."
  exit 1
fi

echo ""
echo "✅ Version 1.0.3 deployed!"
echo ""

# You need to provide a valid JWT token
if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Error: JWT_TOKEN environment variable not set"
  echo "Usage: export JWT_TOKEN='your-jwt-token' && ./test-paypal-with-credentials.sh"
  echo ""
  echo "To get a JWT token:"
  echo "1. Login to your app at https://miyzapis.com"
  echo "2. Open browser DevTools > Application > Local Storage"
  echo "3. Copy the 'token' value"
  exit 1
fi

echo "🧪 Testing PayPal Create Order Endpoint"
echo "========================================"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/paypal/create-order" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-test-'$(date +%s)'",
    "amount": 100,
    "currency": "USD",
    "description": "Test PayPal payment - $1.00 deposit"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ SUCCESS! PayPal is configured and working!"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.'

  # Extract approval URL
  APPROVAL_URL=$(echo "$BODY" | jq -r '.data.approvalUrl // .approvalUrl // empty')
  if [ -n "$APPROVAL_URL" ]; then
    echo ""
    echo "🎉 PayPal Order Created Successfully!"
    echo "📱 Approval URL: $APPROVAL_URL"
    echo ""
    echo "To complete payment:"
    echo "1. Open the URL above in a browser"
    echo "2. Login with PayPal sandbox account"
    echo "3. Complete the payment"
  fi
elif [ "$HTTP_STATUS" == "503" ]; then
  echo "⚠️  PayPal Not Configured"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "This means PayPal credentials are not set or invalid in Railway."
elif [ "$HTTP_STATUS" == "500" ]; then
  echo "❌ Internal Server Error"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "This indicates a runtime error. Check Railway logs for details."
else
  echo "❓ Unexpected Status Code"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "📊 Summary:"
echo "- Backend Version: $VERSION"
echo "- HTTP Status: $HTTP_STATUS"
echo "- PayPal Mode: sandbox (configured in Railway)"
echo ""
