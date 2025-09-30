#!/bin/bash

# Production Payment API Testing and Debugging Script

BASE_URL="https://miyzapis-backend-production.up.railway.app/api/v1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Payment API Debugging Script ===${NC}"
echo "Backend URL: $BASE_URL"
echo "Started at: $(date)"
echo ""

# Step 1: Health Check
echo -e "${YELLOW}1. Health Check${NC}"
HEALTH=$(curl -s "$BASE_URL/health")
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
echo ""

# Step 2: Register a test customer
echo -e "${YELLOW}2. Registering Test Customer${NC}"
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"payment.test.${TIMESTAMP}@example.com\",
    \"password\": \"TestPassword123!\",
    \"firstName\": \"Payment\",
    \"lastName\": \"Tester\",
    \"userType\": \"CUSTOMER\",
    \"phoneNumber\": \"+1234567890\",
    \"language\": \"en\"
  }")

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token
CUSTOMER_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken // empty')

if [ -z "$CUSTOMER_TOKEN" ]; then
    echo -e "${RED}✗ Failed to register customer and get token${NC}"
    echo -e "${YELLOW}Trying to login with existing test account...${NC}"

    # Try login instead
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "customer@example.com",
        "password": "Password123"
      }')

    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    CUSTOMER_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken // empty')

    if [ -z "$CUSTOMER_TOKEN" ]; then
        echo -e "${RED}✗ Failed to get authentication token${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token (first 40 chars): ${CUSTOMER_TOKEN:0:40}..."
echo ""

# Step 3: Get available services
echo -e "${YELLOW}3. Fetching Available Services${NC}"
SERVICES_RESPONSE=$(curl -s "$BASE_URL/services" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

echo "$SERVICES_RESPONSE" | jq '.data[0] // .data // .' 2>/dev/null | head -20

SERVICE_ID=$(echo "$SERVICES_RESPONSE" | jq -r '.data[0].id // .data.services[0].id // .services[0].id // empty' 2>/dev/null)

if [ -z "$SERVICE_ID" ]; then
    echo -e "${YELLOW}⚠ No services found in response. Using test service ID${NC}"
    SERVICE_ID="test-service-$(date +%s)"
fi

echo -e "${GREEN}Service ID: $SERVICE_ID${NC}"
echo ""

# Step 4: Test Deposit Configuration Endpoint
echo -e "${YELLOW}4. Testing Deposit Configuration Endpoint${NC}"
echo "GET $BASE_URL/crypto-payments/config/deposit"
DEPOSIT_CONFIG=$(curl -s "$BASE_URL/crypto-payments/config/deposit" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

echo "$DEPOSIT_CONFIG" | jq '.' 2>/dev/null || echo "$DEPOSIT_CONFIG"
echo ""

# Step 5: Test Payment Intent Endpoint with CRYPTO
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TEST 1: Payment Intent (CRYPTO_ONLY)${NC}"
echo -e "${BLUE}======================================${NC}"
SCHEDULED_AT=$(date -u -v+2d +"%Y-%m-%dT10:00:00Z" 2>/dev/null || date -u -d "+2 days" +"%Y-%m-%dT10:00:00Z" 2>/dev/null || echo "2025-10-02T10:00:00Z")

CRYPTO_INTENT_PAYLOAD="{
  \"serviceId\": \"$SERVICE_ID\",
  \"scheduledAt\": \"$SCHEDULED_AT\",
  \"duration\": 60,
  \"customerNotes\": \"Test booking for payment debugging\",
  \"loyaltyPointsUsed\": 0,
  \"useWalletFirst\": false,
  \"paymentMethod\": \"CRYPTO_ONLY\"
}"

echo "Request Payload:"
echo "$CRYPTO_INTENT_PAYLOAD" | jq '.' 2>/dev/null || echo "$CRYPTO_INTENT_PAYLOAD"
echo ""

echo "Sending request to: POST $BASE_URL/crypto-payments/intent"
CRYPTO_INTENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/crypto-payments/intent" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CRYPTO_INTENT_PAYLOAD")

HTTP_CODE=$(echo "$CRYPTO_INTENT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CRYPTO_INTENT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ CRYPTO Payment Intent: SUCCESS${NC}"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}✗ CRYPTO Payment Intent: BAD REQUEST (400)${NC}"
    echo -e "${YELLOW}This indicates validation errors or invalid request data${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ CRYPTO Payment Intent: INTERNAL SERVER ERROR (500)${NC}"
    echo -e "${YELLOW}This indicates a backend processing error${NC}"
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ CRYPTO Payment Intent: SERVICE UNAVAILABLE (503)${NC}"
    echo -e "${YELLOW}Coinbase Commerce may not be configured${NC}"
else
    echo -e "${RED}✗ CRYPTO Payment Intent: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Step 6: Test Payment Intent Endpoint with PAYPAL
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TEST 2: Payment Intent (PAYPAL)${NC}"
echo -e "${BLUE}======================================${NC}"

PAYPAL_INTENT_PAYLOAD="{
  \"serviceId\": \"$SERVICE_ID\",
  \"scheduledAt\": \"$SCHEDULED_AT\",
  \"duration\": 60,
  \"customerNotes\": \"Test PayPal booking\",
  \"loyaltyPointsUsed\": 0,
  \"useWalletFirst\": false,
  \"paymentMethod\": \"PAYPAL\"
}"

echo "Request Payload:"
echo "$PAYPAL_INTENT_PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYPAL_INTENT_PAYLOAD"
echo ""

echo "Sending request to: POST $BASE_URL/crypto-payments/intent"
PAYPAL_INTENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/crypto-payments/intent" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYPAL_INTENT_PAYLOAD")

HTTP_CODE=$(echo "$PAYPAL_INTENT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$PAYPAL_INTENT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PayPal Payment Intent: SUCCESS${NC}"
    PAYPAL_ORDER_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.paypalPayment.orderId // empty')
    APPROVAL_URL=$(echo "$RESPONSE_BODY" | jq -r '.data.approvalUrl // empty')
    if [ -n "$APPROVAL_URL" ]; then
        echo -e "${GREEN}PayPal Approval URL: $APPROVAL_URL${NC}"
    fi
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}✗ PayPal Payment Intent: BAD REQUEST (400)${NC}"
    echo -e "${YELLOW}This indicates validation errors or invalid request data${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ PayPal Payment Intent: INTERNAL SERVER ERROR (500)${NC}"
    echo -e "${YELLOW}This indicates a backend processing error or PayPal API issue${NC}"
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ PayPal Payment Intent: SERVICE UNAVAILABLE (503)${NC}"
    echo -e "${YELLOW}PayPal may not be configured properly${NC}"
else
    echo -e "${RED}✗ PayPal Payment Intent: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Step 7: Test Direct PayPal Create Order Endpoint
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TEST 3: Direct PayPal Create Order${NC}"
echo -e "${BLUE}======================================${NC}"

PAYPAL_ORDER_PAYLOAD="{
  \"bookingId\": \"test-booking-${TIMESTAMP}\",
  \"amount\": 1000,
  \"currency\": \"USD\",
  \"description\": \"Test PayPal payment order\",
  \"metadata\": {
    \"test\": true,
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }
}"

echo "Request Payload:"
echo "$PAYPAL_ORDER_PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYPAL_ORDER_PAYLOAD"
echo ""

echo "Sending request to: POST $BASE_URL/crypto-payments/paypal/create-order"
PAYPAL_ORDER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/crypto-payments/paypal/create-order" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYPAL_ORDER_PAYLOAD")

HTTP_CODE=$(echo "$PAYPAL_ORDER_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$PAYPAL_ORDER_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PayPal Create Order: SUCCESS${NC}"
    PAYPAL_ORDER_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.id // empty')
    APPROVAL_URL=$(echo "$RESPONSE_BODY" | jq -r '.data.approvalUrl // empty')
    if [ -n "$APPROVAL_URL" ]; then
        echo -e "${GREEN}PayPal Order ID: $PAYPAL_ORDER_ID${NC}"
        echo -e "${GREEN}Approval URL: $APPROVAL_URL${NC}"
    fi
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}✗ PayPal Create Order: BAD REQUEST (400)${NC}"
    echo -e "${YELLOW}Validation error or invalid payload${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ PayPal Create Order: INTERNAL SERVER ERROR (500)${NC}"
    echo -e "${YELLOW}Backend error or PayPal API integration issue${NC}"
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ PayPal Create Order: SERVICE UNAVAILABLE (503)${NC}"
    echo -e "${YELLOW}PayPal credentials may not be configured in production${NC}"
else
    echo -e "${RED}✗ PayPal Create Order: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}======================================${NC}"
echo "All tests completed. Check the responses above for detailed error information."
echo ""
echo "Common issues to check:"
echo "  1. PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) configured in Railway"
echo "  2. Coinbase Commerce API key configured for crypto payments"
echo "  3. Service validation - ensure serviceId exists in database"
echo "  4. Booking validation - ensure bookingId format is correct"
echo "  5. Frontend URL configured for PayPal redirect URLs"
echo ""