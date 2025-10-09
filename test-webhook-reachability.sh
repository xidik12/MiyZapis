#!/bin/bash

echo "🧪 Testing Webhook Endpoints Reachability"
echo "=========================================="
echo ""

BACKEND_URL="https://miyzapis-backend-production.up.railway.app"

echo "1. Testing PayPal Webhook Endpoint..."
curl -X POST "${BACKEND_URL}/api/v1/payments/webhooks/paypal" \
  -H "Content-Type: application/json" \
  -H "PAYPAL-TRANSMISSION-ID: test" \
  -H "PAYPAL-TRANSMISSION-TIME: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "PAYPAL-CERT-URL: test" \
  -H "PAYPAL-AUTH-ALGO: SHA256withRSA" \
  -H "PAYPAL-TRANSMISSION-SIG: test" \
  -d '{"event_type":"TEST","resource":{}}' \
  -w "\nStatus Code: %{http_code}\n" \
  -s -o /dev/null
echo ""

echo "2. Testing Coinbase Webhook Endpoint..."
curl -X POST "${BACKEND_URL}/api/v1/payments/webhooks/coinbase" \
  -H "Content-Type: application/json" \
  -H "X-CC-Webhook-Signature: test123" \
  -d '{"event":{"type":"charge:created","data":{}}}' \
  -w "\nStatus Code: %{http_code}\n" \
  -s -o /dev/null
echo ""

echo "3. Check Railway Logs for these test requests:"
echo "   railway logs --service MiyZapis-backend | grep -i webhook"
