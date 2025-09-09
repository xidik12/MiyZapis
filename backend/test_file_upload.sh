#!/bin/bash

# Test script to verify file upload functionality with enhanced Railway environment detection
echo "🔍 Testing file upload with enhanced Railway environment detection..."

API_BASE="https://miyzapis-backend-production.up.railway.app/api/v1"

# First, try registration to create test user
echo "📝 Attempting to register test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-upload@test.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "Upload",
    "userType": "CLIENT"
  }')

echo "Registration response: $REGISTER_RESPONSE"

# Then login to get auth token
echo "📝 Attempting login to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-upload@test.com",
    "password": "test123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get auth token. Response:"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Got auth token: ${TOKEN:0:20}..."

# Test the robust upload endpoint
echo ""
echo "🔍 Testing robust upload endpoint with auth..."

# Create a small test image file
echo "📝 Creating test image file..."
cat > /tmp/test_image.txt << 'EOF'
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# Convert base64 to binary (simple test image)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png

echo "📤 Uploading test file..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/files/upload-robust?purpose=avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test.png" \
  --max-time 30)

echo ""
echo "🔍 Upload response:"
echo "$UPLOAD_RESPONSE" | head -50

# Clean up
rm -f /tmp/test_image.txt /tmp/test.png

echo ""
echo "✅ File upload test completed"