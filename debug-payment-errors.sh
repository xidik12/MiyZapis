#!/bin/bash

# Debug script to check what's actually happening with payments

BACKEND_URL="https://miyzapis-backend-production.up.railway.app/api/v1"

echo "🔍 Debugging Payment Errors"
echo "=============================="
echo ""

echo "1️⃣ Checking Backend Version..."
VERSION=$(curl -s "${BACKEND_URL}/health" | jq -r '.version')
echo "   Version: $VERSION"
echo ""

echo "2️⃣ Checking PayPal Configuration..."
echo "   Expected: PAYPAL_CLIENT_ID should be set"
echo "   Expected: isConfigured() should return true"
echo ""

if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  No JWT_TOKEN set. Please provide your auth token:"
  echo "   1. Login to https://miyzapis.com"
  echo "   2. Open DevTools > Application > Local Storage"
  echo "   3. Copy 'token' value"
  echo "   4. Run: export JWT_TOKEN='your-token'"
  echo ""
  echo "3️⃣ Testing PayPal without auth (will show if service is configured)..."
  echo ""

  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "${BACKEND_URL}/payments/paypal/create-order" \
    -H "Content-Type: application/json" \
    -d '{
      "bookingId": "test-123",
      "amount": 100,
      "currency": "USD",
      "description": "Test"
    }')

  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

  echo "   Status: $HTTP_STATUS"

  if [ "$HTTP_STATUS" == "401" ]; then
    echo "   ✅ Good - requires authentication (service is working)"
    echo ""
    echo "   Now test with JWT_TOKEN to see actual PayPal error"
  elif [ "$HTTP_STATUS" == "503" ]; then
    echo "   ❌ PayPal NOT configured"
    echo "   Response: $BODY"
  elif [ "$HTTP_STATUS" == "500" ]; then
    echo "   ❌ Internal Server Error"
    echo "   Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  fi

  echo ""
  exit 0
fi

echo "3️⃣ Testing PayPal Create Order..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/paypal/create-order" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-'$(date +%s)'",
    "amount": 100,
    "currency": "USD",
    "description": "Test $1 deposit"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "   Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "   ✅ SUCCESS! PayPal is working!"
  echo ""
  APPROVAL_URL=$(echo "$BODY" | jq -r '.data.approvalUrl // .approvalUrl // empty')
  echo "   Approval URL: $APPROVAL_URL"
elif [ "$HTTP_STATUS" == "503" ]; then
  echo "   ❌ Service Unavailable - PayPal not configured"
  echo ""
  echo "   This means isConfigured() returned false"
  echo "   Credentials might be empty strings or invalid"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_STATUS" == "500" ]; then
  echo "   ❌ Internal Server Error"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "   This usually means:"
  echo "   - PayPal SDK error (invalid credentials)"
  echo "   - Runtime error in service"
  echo "   - Check Railway logs for details"
elif [ "$HTTP_STATUS" == "400" ]; then
  echo "   ❌ Bad Request - Validation error"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "   ❓ Unexpected status: $HTTP_STATUS"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "4️⃣ Testing WayForPay Create Invoice..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/wayforpay/create-invoice" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-'$(date +%s)'",
    "amount": 4000,
    "currency": "UAH",
    "description": "Test 40 UAH deposit",
    "customerEmail": "",
    "customerPhone": ""
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "   Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "   ✅ SUCCESS! WayForPay is working!"
elif [ "$HTTP_STATUS" == "503" ]; then
  echo "   ⚠️  WayForPay not configured (expected if no credentials)"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_STATUS" == "500" ]; then
  echo "   ❌ Internal Server Error"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "5️⃣ Testing Coinbase Commerce (Crypto)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/coinbase/create-charge" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "test-service",
    "scheduledAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "duration": 30,
    "specialistId": "test-specialist",
    "paymentMethod": "CRYPTO_ONLY"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "   Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "   ✅ SUCCESS! Coinbase Commerce is working!"
elif [ "$HTTP_STATUS" == "500" ]; then
  echo "   ❌ Internal Server Error"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo "Backend Version: $VERSION"
echo ""
echo "PayPal Credentials in Railway:"
echo "  PAYPAL_CLIENT_ID: AZUL7Va46o-Oq46aHXlCF******"
echo "  PAYPAL_CLIENT_SECRET: EDIT-vTtpFihy3******"
echo "  PAYPAL_MODE: sandbox"
echo ""
echo "Next Steps:"
echo "1. If 503 errors: Credentials are not being read properly"
echo "2. If 500 errors: Check Railway logs for actual error message"
echo "3. If validation errors: Fix request format"
echo ""
