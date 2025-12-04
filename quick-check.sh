#!/bin/bash

# Quick check if Railway has redeployed and if PayPal works

echo "🔍 Quick Payment Status Check"
echo "=============================="
echo ""

BACKEND_URL="https://miyzapis-backend-production.up.railway.app/api/v1"

# Check version and uptime
echo "1️⃣ Checking deployment status..."
HEALTH=$(curl -s "${BACKEND_URL}/health")
VERSION=$(echo "$HEALTH" | jq -r '.version')
UPTIME=$(echo "$HEALTH" | jq -r '.uptime // "unknown"')

echo "   Version: $VERSION"
echo "   Uptime: ${UPTIME}s"
echo ""

if [ "$UPTIME" -lt 120 ]; then
  echo "   ✅ Recently deployed! (uptime < 2 min)"
  echo "   This means Railway just redeployed with new credentials"
else
  echo "   ⏳ Uptime > 2 min - might still be deploying"
  echo "   Wait 30 seconds and try again"
fi

echo ""
echo "2️⃣ Quick PayPal test (no auth)..."

RESPONSE=$(curl -s -w "\nHTTP:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/paypal/create-order" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test","amount":100,"currency":"USD"}')

STATUS=$(echo "$RESPONSE" | grep "HTTP:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP:/d')

if [ "$STATUS" == "401" ]; then
  echo "   ✅ PayPal service is running (needs authentication)"
  echo "   This is GOOD - means PayPal is configured!"
  echo ""
  echo "   Next: Test with your JWT token to create real order"
elif [ "$STATUS" == "503" ]; then
  echo "   ❌ PayPal NOT configured"
  echo "   Check if Railway has finished deploying"
  echo ""
  ERROR=$(echo "$BODY" | jq -r '.error // empty')
  echo "   Error: $ERROR"
elif [ "$STATUS" == "500" ]; then
  echo "   ❌ PayPal error"
  echo ""
  ERROR=$(echo "$BODY" | jq -r '.error // empty')
  echo "   Error: $ERROR"
fi

echo ""
echo "📊 Summary:"
echo "- If uptime < 2 min: Railway just redeployed ✅"
echo "- If status 401: PayPal is configured ✅"
echo "- If status 503: Still using old env vars ⏳"
echo ""
echo "To test with authentication:"
echo "  export JWT_TOKEN='your-token'"
echo "  ./debug-payment-errors.sh"
echo ""
