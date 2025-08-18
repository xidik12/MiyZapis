#!/bin/bash

# Simple API Testing Script for BookingBot Platform
API_BASE="http://localhost:3002/api/v1"

echo "🚀 BookingBot Platform API Testing"
echo "=================================="

# Test 1: Health Check
echo "📊 Testing Health Check..."
health_response=$(curl -s "$API_BASE/health")
if [[ $? -eq 0 ]]; then
    echo "✅ Health check passed"
    echo "   Response: $health_response"
else
    echo "❌ Health check failed"
fi

# Test 2: User Registration (Customer)
echo ""
echo "👤 Testing Customer Registration..."
customer_email="testcustomer$(date +%s)@bookingbot.test"
customer_reg_response=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$customer_email\",
        \"password\": \"TestPassword123!\",
        \"firstName\": \"TestCustomer\",
        \"lastName\": \"User\",
        \"userType\": \"CUSTOMER\",
        \"phoneNumber\": \"+380123456789\",
        \"language\": \"en\"
    }")

if [[ $customer_reg_response == *"success"* ]] || [[ $customer_reg_response == *"id"* ]]; then
    echo "✅ Customer registration successful"
else
    echo "❌ Customer registration failed"
    echo "   Response: $customer_reg_response"
fi

# Test 3: User Registration (Specialist)
echo ""
echo "🔧 Testing Specialist Registration..."
specialist_email="testspecialist$(date +%s)@bookingbot.test"
specialist_reg_response=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$specialist_email\",
        \"password\": \"TestPassword123!\",
        \"firstName\": \"TestSpecialist\",
        \"lastName\": \"User\",
        \"userType\": \"SPECIALIST\",
        \"phoneNumber\": \"+380987654321\",
        \"language\": \"en\"
    }")

if [[ $specialist_reg_response == *"success"* ]] || [[ $specialist_reg_response == *"id"* ]]; then
    echo "✅ Specialist registration successful"
else
    echo "❌ Specialist registration failed"
    echo "   Response: $specialist_reg_response"
fi

# Test 4: Customer Login
echo ""
echo "🔐 Testing Customer Login..."
customer_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$customer_email\",
        \"password\": \"TestPassword123!\"
    }")

if [[ $customer_login_response == *"token"* ]] || [[ $customer_login_response == *"accessToken"* ]]; then
    echo "✅ Customer login successful"
    # Extract token for further testing
    customer_token=$(echo $customer_login_response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [[ -z "$customer_token" ]]; then
        customer_token=$(echo $customer_login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
else
    echo "❌ Customer login failed"
    echo "   Response: $customer_login_response"
fi

# Test 5: Specialist Login
echo ""
echo "🔧 Testing Specialist Login..."
specialist_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$specialist_email\",
        \"password\": \"TestPassword123!\"
    }")

if [[ $specialist_login_response == *"token"* ]] || [[ $specialist_login_response == *"accessToken"* ]]; then
    echo "✅ Specialist login successful"
    # Extract token for further testing
    specialist_token=$(echo $specialist_login_response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [[ -z "$specialist_token" ]]; then
        specialist_token=$(echo $specialist_login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
else
    echo "❌ Specialist login failed"
    echo "   Response: $specialist_login_response"
fi

# Test 6: Protected Route Access (Customer Profile)
if [[ -n "$customer_token" ]]; then
    echo ""
    echo "👤 Testing Protected Route Access (Customer Profile)..."
    profile_response=$(curl -s -X GET "$API_BASE/users/profile" \
        -H "Authorization: Bearer $customer_token")
    
    if [[ $profile_response == *"email"* ]] && [[ $profile_response == *"$customer_email"* ]]; then
        echo "✅ Protected route access successful"
    else
        echo "❌ Protected route access failed"
        echo "   Response: $profile_response"
    fi
fi

# Test 7: Services Discovery
echo ""
echo "🔍 Testing Service Discovery..."
services_response=$(curl -s -X GET "$API_BASE/services")
services_status=$?

if [[ $services_status -eq 0 ]] && [[ $services_response != *"error"* ]]; then
    echo "✅ Service discovery working"
else
    echo "❌ Service discovery failed"
    echo "   Response: $services_response"
fi

# Test 8: Specialists Discovery
echo ""
echo "👥 Testing Specialist Discovery..."
specialists_response=$(curl -s -X GET "$API_BASE/specialists")
specialists_status=$?

if [[ $specialists_status -eq 0 ]] && [[ $specialists_response != *"error"* ]]; then
    echo "✅ Specialist discovery working"
else
    echo "❌ Specialist discovery failed"
    echo "   Response: $specialists_response"
fi

# Test 9: Invalid Login Handling
echo ""
echo "🚫 Testing Invalid Login Handling..."
invalid_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$customer_email\",
        \"password\": \"wrongpassword\"
    }")

invalid_login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$customer_email\",
        \"password\": \"wrongpassword\"
    }")

if [[ $invalid_login_status == "401" ]] || [[ $invalid_login_status == "400" ]]; then
    echo "✅ Invalid login properly rejected (Status: $invalid_login_status)"
else
    echo "❌ Invalid login not properly handled (Status: $invalid_login_status)"
fi

# Test 10: Unauthorized Access
echo ""
echo "🔒 Testing Unauthorized Access..."
unauthorized_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/users/profile")

if [[ $unauthorized_status == "401" ]]; then
    echo "✅ Unauthorized access properly blocked (Status: $unauthorized_status)"
else
    echo "❌ Unauthorized access not properly blocked (Status: $unauthorized_status)"
fi

# Test 11: Input Validation
echo ""
echo "✅ Testing Input Validation..."
validation_response=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"invalid-email\",
        \"password\": \"123\",
        \"firstName\": \"\",
        \"userType\": \"INVALID_TYPE\"
    }")

validation_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"invalid-email\",
        \"password\": \"123\",
        \"firstName\": \"\",
        \"userType\": \"INVALID_TYPE\"
    }")

if [[ $validation_status == "400" ]]; then
    echo "✅ Input validation working (Status: $validation_status)"
else
    echo "❌ Input validation not working properly (Status: $validation_status)"
fi

# Test 12: Performance Test (Response Time)
echo ""
echo "⚡ Testing API Performance..."
start_time=$(date +%s%N)
curl -s "$API_BASE/health" > /dev/null
end_time=$(date +%s%N)
duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds

if [[ $duration -lt 1000 ]]; then
    echo "✅ Good response time: ${duration}ms"
else
    echo "⚠️ Slow response time: ${duration}ms"
fi

echo ""
echo "🏁 Testing Complete!"
echo "=================================="
echo "Summary: Check the ✅ and ❌ symbols above for test results"