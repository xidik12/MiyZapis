#!/bin/bash

# Test PayPal webhook endpoint
echo "🧪 Testing PayPal webhook endpoint..."
echo ""

# Send test webhook
curl -X POST https://miyzapis-backend-production.up.railway.app/api/v1/payments/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
  "id": "WH-TEST-12345",
  "event_version": "1.0",
  "create_time": "2025-10-10T04:21:20Z",
  "resource_type": "capture",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "summary": "Payment completed for test booking",
  "resource": {
    "id": "CAPTURE123456",
    "status": "COMPLETED",
    "amount": {
      "currency_code": "USD",
      "value": "1.00"
    },
    "supplementary_data": {
      "related_ids": {
        "order_id": "ORDER123456789"
      }
    }
  }
}'

echo ""
echo "✅ Test webhook sent - check Railway logs for processing"
