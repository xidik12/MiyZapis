#!/bin/bash

# Replace with your actual PayPal order ID from the logs
ORDER_ID="70029653ED601371N"  # From your logs at 13:27:19

# Replace with your actual auth token (get from browser DevTools → Application → Local Storage)
AUTH_TOKEN="your_auth_token_here"

echo "🔄 Manually triggering PayPal order capture..."
echo "Order ID: $ORDER_ID"
echo ""

curl -X POST "https://miyzapis-backend-production.up.railway.app/api/v1/payments/paypal/capture-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\"}" \
  -v

echo ""
echo ""
echo "Check Railway logs for capture attempt:"
echo "railway logs --service MiyZapis-backend | grep -i 'paypal.*captur'"
