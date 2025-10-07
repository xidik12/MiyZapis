#!/bin/bash

BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo "=== Comprehensive Payment Endpoint Test ==="
echo ""
echo "NOTE: The backend needs to be redeployed with the fixes for this test to work properly."
echo ""

# Test 1: Check if auth endpoints work
echo "Step 1: Testing auth endpoint availability"
curl -s "$BACKEND_URL/api/v1/auth/telegram" -X POST \
  -H "Content-Type: application/json" \
  -d '{"initData": "test"}' | jq '.'

echo ""
echo "Step 2: Testing guest auth (if available)"
curl -s "$BACKEND_URL/api/v1/auth/guest" -X POST \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "=== Summary ==="
echo "The fixes have been applied to the code:"
echo "1. Changed bookingId validation from .cuid() to .min(1) to accept temporary IDs"
echo "2. Updated WayForPay controller to support payment-first flow (like PayPal)"
echo "3. Made customerEmail and customerPhone optional and allow empty strings"
echo ""
echo "Files modified:"
echo "- /Users/salakhitdinovkhidayotullo/Documents/BookingBot/backend/src/controllers/payment.controller.ts"
echo ""
echo "To test with authentication, deploy these changes and use a valid JWT token."
