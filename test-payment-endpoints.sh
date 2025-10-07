#!/bin/bash

# Test payment endpoints with the deployed backend
BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo "=== Testing Payment Endpoints ==="
echo ""
# First, we need to get an auth token
# For testing, let me check if we can login with a test user
echo "Step 1: Login to get auth token"
echo "We need valid credentials to test authenticated endpoints"

# Check backend health
echo ""
echo "Step 2: Check backend health"
curl -s "$BACKEND_URL/health" | jq '.' || echo "Backend health check failed"

echo ""
echo "Step 3: Check payment methods availability"
curl -s "$BACKEND_URL/api/v1/payment-methods" | jq '.' || echo "Payment methods check failed"

echo ""
echo "=== Tests require authentication ==="
echo "Please provide a valid JWT token to test the payment endpoints"
echo ""
echo "PayPal endpoint: POST $BACKEND_URL/api/v1/payments/paypal/create-order"
echo "WayForPay endpoint: POST $BACKEND_URL/api/v1/payments/wayforpay/create-invoice"
