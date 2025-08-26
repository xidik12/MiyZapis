#!/bin/bash

echo "Testing CORS configuration..."

# Test preflight request
echo "Testing preflight OPTIONS request..."
curl -i -X OPTIONS \
  -H "Origin: https://miyzapis.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  https://miyzapis-backend-production.up.railway.app/api/v1/specialists/profile

echo -e "\n\nTesting actual GET request..."
curl -i -X GET \
  -H "Origin: https://miyzapis.com" \
  https://miyzapis-backend-production.up.railway.app/api/v1/health

echo -e "\n\nDone testing CORS."