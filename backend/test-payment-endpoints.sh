#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing Payment API Endpoints${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Step 1: Check if backend is running
echo -e "${YELLOW}Step 1: Checking backend health...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/health")
if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Backend is running (HTTP $HEALTH_STATUS)${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $HEALTH_STATUS)${NC}"
fi
echo ""

# Step 2: Register/Login to get authentication token
echo -e "${YELLOW}Step 2: Authenticating user...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testpayment'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Payment",
    "role": "CUSTOMER"
  }')

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Failed to get authentication token${NC}"
    echo "Response: $AUTH_RESPONSE"
    echo ""
    echo -e "${YELLOW}Trying to login with existing credentials...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "Test123456"
      }')
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Login also failed${NC}"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 3: Get a valid service ID
echo -e "${YELLOW}Step 3: Fetching available services...${NC}"
SERVICES_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/services" \
  -H "Authorization: Bearer $TOKEN")

SERVICE_ID=$(echo $SERVICES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
    echo -e "${YELLOW}⚠ No services found, using a test service ID${NC}"
    SERVICE_ID="test-service-id-123"
else
    echo -e "${GREEN}✓ Found service ID: $SERVICE_ID${NC}"
fi
echo ""

# Step 4: Test Payment Intent Endpoint
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST 1: POST /api/v1/payments/intent${NC}"
echo -e "${YELLOW}========================================${NC}"

SCHEDULED_AT=$(date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT%H:%M:%SZ")

echo "Request payload:"
INTENT_PAYLOAD='{
  "serviceId": "'$SERVICE_ID'",
  "scheduledAt": "'$SCHEDULED_AT'",
  "duration": 60,
  "customerNotes": "Test booking",
  "loyaltyPointsUsed": 0,
  "useWalletFirst": false,
  "paymentMethod": "CRYPTO_ONLY"
}'
echo "$INTENT_PAYLOAD" | jq '.' 2>/dev/null || echo "$INTENT_PAYLOAD"
echo ""

echo "Sending request..."
INTENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/v1/payments/intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INTENT_PAYLOAD")

HTTP_CODE=$(echo "$INTENT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$INTENT_RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Payment intent endpoint working correctly${NC}"
else
    echo -e "${RED}✗ Payment intent endpoint failed with HTTP $HTTP_CODE${NC}"
fi
echo ""

# Step 5: Test PayPal Create Order Endpoint
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST 2: POST /api/v1/payments/paypal/create-order${NC}"
echo -e "${YELLOW}========================================${NC}"

echo "Request payload:"
PAYPAL_PAYLOAD='{
  "bookingId": "booking-test-'$(date +%s)'",
  "amount": 1000,
  "currency": "USD",
  "description": "Test booking payment",
  "metadata": {
    "test": true,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }
}'
echo "$PAYPAL_PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYPAL_PAYLOAD"
echo ""

echo "Sending request..."
PAYPAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/v1/payments/paypal/create-order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYPAL_PAYLOAD")

HTTP_CODE=$(echo "$PAYPAL_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$PAYPAL_RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PayPal create-order endpoint working correctly${NC}"
else
    echo -e "${RED}✗ PayPal create-order endpoint failed with HTTP $HTTP_CODE${NC}"
fi
echo ""

# Step 6: Test Payment Intent with PayPal method
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST 3: POST /api/v1/payments/intent (PayPal)${NC}"
echo -e "${YELLOW}========================================${NC}"

echo "Request payload:"
INTENT_PAYPAL_PAYLOAD='{
  "serviceId": "'$SERVICE_ID'",
  "scheduledAt": "'$SCHEDULED_AT'",
  "duration": 60,
  "customerNotes": "Test booking with PayPal",
  "loyaltyPointsUsed": 0,
  "useWalletFirst": false,
  "paymentMethod": "PAYPAL"
}'
echo "$INTENT_PAYPAL_PAYLOAD" | jq '.' 2>/dev/null || echo "$INTENT_PAYPAL_PAYLOAD"
echo ""

echo "Sending request..."
INTENT_PAYPAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/v1/payments/intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INTENT_PAYPAL_PAYLOAD")

HTTP_CODE=$(echo "$INTENT_PAYPAL_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$INTENT_PAYPAL_RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Payment intent with PayPal method working correctly${NC}"
else
    echo -e "${RED}✗ Payment intent with PayPal method failed with HTTP $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "All tests completed. Review the responses above for detailed error information."
echo ""