#!/bin/bash

# Comprehensive API Testing Script for BookingBot Platform

BASE_URL="http://localhost:3002/api/v1"

echo "=== BookingBot Platform Comprehensive API Testing ==="
echo "Base URL: $BASE_URL"
echo "Starting tests at: $(date)"
echo

# Health Check
echo "1. HEALTH CHECK"
curl -s "$BASE_URL/health" | jq .
echo

# Authentication Tests
echo "2. AUTHENTICATION TESTS"

# Register Customer
echo "2.1 Register Customer"
CUSTOMER_REG=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api.test.customer@example.com",
    "password": "Password123",
    "firstName": "Тест",
    "lastName": "Кастомер",
    "userType": "CUSTOMER",
    "phoneNumber": "+380111222333",
    "language": "uk"
  }')
echo "$CUSTOMER_REG" | jq .
CUSTOMER_TOKEN=$(echo "$CUSTOMER_REG" | jq -r '.data.tokens.accessToken // empty')
echo "Customer Token: $CUSTOMER_TOKEN"
echo

# Register Specialist
echo "2.2 Register Specialist"
SPECIALIST_REG=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api.test.specialist@example.com",
    "password": "Password123",
    "firstName": "Тест",
    "lastName": "Спеціаліст",
    "userType": "SPECIALIST",
    "phoneNumber": "+380444555666",
    "language": "uk"
  }')
echo "$SPECIALIST_REG" | jq .
SPECIALIST_TOKEN=$(echo "$SPECIALIST_REG" | jq -r '.data.tokens.accessToken // empty')
SPECIALIST_ID=$(echo "$SPECIALIST_REG" | jq -r '.data.user.id // empty')
echo "Specialist Token: $SPECIALIST_TOKEN"
echo "Specialist User ID: $SPECIALIST_ID"
echo

# Test Login
echo "2.3 Test Customer Login"
CUSTOMER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api.test.customer@example.com",
    "password": "Password123"
  }')
echo "$CUSTOMER_LOGIN" | jq .
CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | jq -r '.data.tokens.accessToken // empty')
echo

# User Management Tests
echo "3. USER MANAGEMENT TESTS"

# Get Customer Profile
echo "3.1 Get Customer Profile"
curl -s "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Update Customer Profile
echo "3.2 Update Customer Profile"
curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Тест Оновлений",
    "lastName": "Кастомер",
    "language": "uk",
    "timezone": "Europe/Kiev"
  }' | jq .
echo

# Get Specialist Profile
echo "3.3 Get Specialist Profile"
curl -s "$BASE_URL/specialists/my/profile" \
  -H "Authorization: Bearer $SPECIALIST_TOKEN" | jq .
echo

# Service Management Tests
echo "4. SERVICE MANAGEMENT TESTS"

# Create Service
echo "4.1 Create Service by Specialist"
SERVICE_CREATE=$(curl -s -X POST "$BASE_URL/services" \
  -H "Authorization: Bearer $SPECIALIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестова послуга",
    "description": "Тестовий опис послуги",
    "category": "test",
    "basePrice": 300,
    "currency": "UAH",
    "duration": 45,
    "requirements": ["test requirement"],
    "deliverables": ["test deliverable"]
  }')
echo "$SERVICE_CREATE" | jq .
SERVICE_ID=$(echo "$SERVICE_CREATE" | jq -r '.data.service.id // empty')
echo "Service ID: $SERVICE_ID"
echo

# Search Services
echo "4.2 Search Services"
curl -s "$BASE_URL/services?limit=10" | jq .
echo

# Get Specific Service
echo "4.3 Get Specific Service"
if [ ! -z "$SERVICE_ID" ]; then
  curl -s "$BASE_URL/services/$SERVICE_ID" | jq .
else
  echo "Service ID not available, skipping..."
fi
echo

# Booking Management Tests
echo "5. BOOKING MANAGEMENT TESTS"

# Create Booking
echo "5.1 Create Booking"
if [ ! -z "$SERVICE_ID" ] && [ ! -z "$SPECIALIST_ID" ]; then
  BOOKING_CREATE=$(curl -s -X POST "$BASE_URL/bookings" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"serviceId\": \"$SERVICE_ID\",
      \"specialistId\": \"$SPECIALIST_ID\",
      \"scheduledAt\": \"2025-08-23T14:00:00Z\",
      \"duration\": 45,
      \"customerNotes\": \"Тестове бронювання\"
    }")
  echo "$BOOKING_CREATE" | jq .
  BOOKING_ID=$(echo "$BOOKING_CREATE" | jq -r '.data.booking.id // empty')
  echo "Booking ID: $BOOKING_ID"
else
  echo "Service ID or Specialist ID not available, skipping..."
fi
echo

# Get Customer Bookings
echo "5.2 Get Customer Bookings"
curl -s "$BASE_URL/bookings" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Payment Tests
echo "6. PAYMENT TESTS"

# Create Payment Intent
echo "6.1 Create Payment Intent"
if [ ! -z "$BOOKING_ID" ]; then
  curl -s -X POST "$BASE_URL/payments/create-intent" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"bookingId\": \"$BOOKING_ID\",
      \"amount\": 300,
      \"currency\": \"UAH\",
      \"paymentMethodType\": \"card\"
    }" | jq .
else
  echo "Booking ID not available, skipping..."
fi
echo

# Loyalty Program Tests
echo "7. LOYALTY PROGRAM TESTS"

# Get Loyalty Balance
echo "7.1 Get Loyalty Balance"
curl -s "$BASE_URL/loyalty/balance" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Get Loyalty Transactions
echo "7.2 Get Loyalty Transactions"
curl -s "$BASE_URL/loyalty/transactions" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Notification Tests
echo "8. NOTIFICATION TESTS"

# Get Notifications
echo "8.1 Get User Notifications"
curl -s "$BASE_URL/notifications" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# File Upload Tests
echo "9. FILE UPLOAD TESTS"

# Test file upload endpoint (without actual file)
echo "9.1 File Upload Endpoint Test"
curl -s "$BASE_URL/files/upload" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Analytics Tests
echo "10. ANALYTICS TESTS"

# Get Analytics Dashboard (for specialist)
echo "10.1 Get Specialist Analytics"
curl -s "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $SPECIALIST_TOKEN" | jq .
echo

# Enhanced Analytics
echo "10.2 Get Enhanced Analytics"
curl -s "$BASE_URL/analytics-enhanced/overview" \
  -H "Authorization: Bearer $SPECIALIST_TOKEN" | jq .
echo

# Messaging Tests
echo "11. MESSAGING TESTS"

# Get Conversations
echo "11.1 Get User Conversations"
curl -s "$BASE_URL/messages/conversations" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

# Specialist Availability Tests
echo "12. AVAILABILITY TESTS"

# Get Availability
echo "12.1 Get Specialist Availability"
curl -s "$BASE_URL/availability/$SPECIALIST_ID" | jq .
echo

# Admin Tests (would fail without admin user)
echo "13. ADMIN ENDPOINT TESTS"

# Test admin endpoint (should fail)
echo "13.1 Test Admin Dashboard (should fail without admin role)"
curl -s "$BASE_URL/admin/dashboard" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .
echo

echo "=== API Testing Complete ==="
echo "Completed at: $(date)"