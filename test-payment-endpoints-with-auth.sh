#!/bin/bash

# Payment Endpoints Test Script with Authentication
# This script should be run AFTER deploying the fixes to Railway

BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo "=== Payment Endpoints Test Script ==="
echo ""
echo "INSTRUCTIONS:"
echo "1. Deploy the backend with the fixes to Railway"
echo "2. Get a valid JWT token by authenticating through the frontend or API"
echo "3. Set the JWT_TOKEN environment variable: export JWT_TOKEN='your-token-here'"
echo "4. Run this script again"
echo ""

if [ -z "$JWT_TOKEN" ]; then
  echo "ERROR: JWT_TOKEN environment variable is not set"
  echo "Please set it with: export JWT_TOKEN='your-jwt-token'"
  echo ""
  echo "You can get a token by:"
  echo "  1. Using the Telegram mini-app to authenticate"
  echo "  2. Using the frontend application to log in"
  echo "  3. Making a direct API call to the auth endpoint"
  exit 1
fi

echo "Using JWT Token: ${JWT_TOKEN:0:20}..."
echo ""

# Test PayPal endpoint
echo "=== Test 1: PayPal Create Order ==="
echo "Testing with temporary bookingId: booking-1759806764967"
echo ""
PAYPAL_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/paypal/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "bookingId": "booking-1759806764967",
    "amount": 100,
    "currency": "USD",
    "description": "Haircut - Xidik Dev"
  }')

echo "$PAYPAL_RESPONSE" | jq '.'

if echo "$PAYPAL_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✓ PayPal endpoint test PASSED"
elif echo "$PAYPAL_RESPONSE" | jq -e '.error.code == "VALIDATION_ERROR"' > /dev/null 2>&1; then
  echo "✗ PayPal endpoint test FAILED - Validation error (bookingId validation still broken)"
  echo "Error details:"
  echo "$PAYPAL_RESPONSE" | jq '.error.details'
else
  echo "✗ PayPal endpoint test FAILED - Other error"
  echo "$PAYPAL_RESPONSE" | jq '.error'
fi

echo ""
echo ""

# Test WayForPay endpoint
echo "=== Test 2: WayForPay Create Invoice ==="
echo "Testing with temporary bookingId: booking-1759806764967"
echo ""
WAYFORPAY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/wayforpay/create-invoice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "bookingId": "booking-1759806764967",
    "amount": 4000,
    "currency": "UAH",
    "description": "Haircut - Xidik Dev",
    "customerEmail": "",
    "customerPhone": ""
  }')

echo "$WAYFORPAY_RESPONSE" | jq '.'

if echo "$WAYFORPAY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✓ WayForPay endpoint test PASSED"
elif echo "$WAYFORPAY_RESPONSE" | jq -e '.error.code == "VALIDATION_ERROR"' > /dev/null 2>&1; then
  echo "✗ WayForPay endpoint test FAILED - Validation error (bookingId validation still broken)"
  echo "Error details:"
  echo "$WAYFORPAY_RESPONSE" | jq '.error.details'
elif echo "$WAYFORPAY_RESPONSE" | jq -e '.error.message == "Booking not found"' > /dev/null 2>&1; then
  echo "✗ WayForPay endpoint test FAILED - Still checking for booking existence"
else
  echo "✗ WayForPay endpoint test FAILED - Other error"
  echo "$WAYFORPAY_RESPONSE" | jq '.error'
fi

echo ""
echo ""
echo "=== Test Summary ==="
echo "Tests complete. Check results above."
echo ""
echo "Expected behavior:"
echo "  - PayPal: Should create an order with a temporary bookingId"
echo "  - WayForPay: Should create an invoice with a temporary bookingId"
echo ""
echo "Both endpoints should NOT return validation errors about CUID format"
echo "Both endpoints should support payment-first flow with temporary bookingIds"
