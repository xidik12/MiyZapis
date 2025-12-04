#!/bin/bash

# Use one of the actual PayPal order IDs from your database
# Change this to match your most recent payment
ORDER_ID="93G980651R9991942"

echo "🔔 Triggering PayPal webhook for order: $ORDER_ID"
echo ""

curl -X POST https://miyzapis-backend-production.up.railway.app/api/v1/payments/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d "{
  \"id\": \"WH-MANUAL-$(date +%s)\",
  \"event_version\": \"1.0\",
  \"create_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"resource_type\": \"capture\",
  \"event_type\": \"PAYMENT.CAPTURE.COMPLETED\",
  \"summary\": \"Payment completed for order $ORDER_ID\",
  \"resource\": {
    \"id\": \"CAPTURE-$(date +%s)\",
    \"status\": \"COMPLETED\",
    \"amount\": {
      \"currency_code\": \"USD\",
      \"value\": \"1.00\"
    },
    \"supplementary_data\": {
      \"related_ids\": {
        \"order_id\": \"$ORDER_ID\"
      }
    }
  }
}"

echo ""
echo "✅ Webhook sent - check Railway logs and your email!"
echo "📧 You should receive a booking confirmation email"
