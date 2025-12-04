#!/bin/bash

# Test deployed payment endpoints to see actual error responses

BACKEND_URL="https://miyzapis-backend-production.up.railway.app/api/v1"

# You need to provide a valid JWT token
if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Error: JWT_TOKEN environment variable not set"
  echo "Usage: export JWT_TOKEN='your-jwt-token' && ./test-deployed-payment.sh"
  exit 1
fi

echo "🧪 Testing PayPal Create Order Endpoint"
echo "========================================"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/paypal/create-order" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-test-123",
    "amount": 100,
    "currency": "USD",
    "description": "Test payment"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

echo ""
echo "🧪 Testing WayForPay Create Invoice Endpoint"
echo "============================================="

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${BACKEND_URL}/payments/wayforpay/create-invoice" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-test-456",
    "amount": 4000,
    "currency": "UAH",
    "description": "Test payment",
    "customerEmail": "",
    "customerPhone": ""
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
