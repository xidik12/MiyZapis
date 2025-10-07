#!/bin/bash

BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo "=== Payment Endpoints Test ==="
echo ""

# These endpoints need authentication, but we can check what errors we get
echo "Testing PayPal endpoint (expect 401 without auth, not 500):"
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/paypal/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-1759806764967",
    "amount": 100,
    "currency": "USD",
    "description": "Haircut - Xidik Dev"
  }')
echo "$RESPONSE" | jq '.'

echo ""
echo "Testing WayForPay endpoint (expect 401 without auth, not 500):"
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/wayforpay/create-invoice" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-1759806764967",
    "amount": 4000,
    "currency": "UAH",
    "description": "Haircut - Xidik Dev",
    "customerEmail": "",
    "customerPhone": ""
  }')
echo "$RESPONSE" | jq '.'

echo ""
echo "=== Test Complete ==="
echo "If you see 401 Unauthorized errors instead of 500 errors, the validation fix is working!"
echo "To fully test, we need to deploy the changes and test with a valid auth token."
