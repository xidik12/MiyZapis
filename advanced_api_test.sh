#!/bin/bash

# Advanced API Testing Script for BookingBot Platform
API_BASE="http://localhost:3002/api/v1"

echo "🚀 Advanced BookingBot Platform Testing"
echo "======================================="

# Create test users and get tokens
echo "🔧 Setting up test users..."

# Create customer
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

# Login customer and get token
customer_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$customer_email\",
        \"password\": \"TestPassword123!\"
    }")

customer_token=$(echo $customer_login_response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Create specialist
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

# Login specialist and get token
specialist_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$specialist_email\",
        \"password\": \"TestPassword123!\"
    }")

specialist_token=$(echo $specialist_login_response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Tokens obtained - Customer: ${customer_token:0:20}... Specialist: ${specialist_token:0:20}..."

# Test 1: Specialist Profile Creation
echo ""
echo "🏪 Testing Specialist Profile Creation..."
if [[ -n "$specialist_token" ]]; then
    profile_response=$(curl -s -X POST "$API_BASE/specialists/profile" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"businessName\": \"Test Beauty Studio\",
            \"bio\": \"Professional beauty services with 5+ years experience\",
            \"specialties\": [\"hair\", \"makeup\", \"nails\"],
            \"address\": \"123 Test Street\",
            \"city\": \"Kiev\",
            \"country\": \"Ukraine\",
            \"workingHours\": {
                \"monday\": {\"start\": \"09:00\", \"end\": \"18:00\"},
                \"tuesday\": {\"start\": \"09:00\", \"end\": \"18:00\"},
                \"wednesday\": {\"start\": \"09:00\", \"end\": \"18:00\"},
                \"thursday\": {\"start\": \"09:00\", \"end\": \"18:00\"},
                \"friday\": {\"start\": \"09:00\", \"end\": \"18:00\"}
            }
        }")
    
    profile_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/specialists/profile" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"businessName\": \"Test Beauty Studio\",
            \"bio\": \"Professional beauty services\",
            \"specialties\": [\"hair\", \"makeup\"]
        }")
    
    if [[ $profile_status == "200" ]] || [[ $profile_status == "201" ]]; then
        echo "✅ Specialist profile creation successful (Status: $profile_status)"
    else
        echo "❌ Specialist profile creation failed (Status: $profile_status)"
        echo "   Response: $profile_response"
    fi
else
    echo "❌ No specialist token available"
fi

# Test 2: Service Creation
echo ""
echo "🛍️ Testing Service Creation..."
if [[ -n "$specialist_token" ]]; then
    service_response=$(curl -s -X POST "$API_BASE/services" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"name\": \"Professional Hair Styling\",
            \"description\": \"Complete hair styling service including wash, cut, and style\",
            \"category\": \"beauty\",
            \"basePrice\": 150.00,
            \"currency\": \"USD\",
            \"duration\": 90,
            \"requirements\": [\"clean hair\", \"arrive 10 minutes early\"],
            \"deliverables\": [\"styled hair\", \"styling tips\", \"product recommendations\"]
        }")
    
    service_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/services" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"name\": \"Test Service\",
            \"description\": \"Test service description\",
            \"category\": \"beauty\",
            \"basePrice\": 100.00,
            \"currency\": \"USD\",
            \"duration\": 60
        }")
    
    if [[ $service_status == "200" ]] || [[ $service_status == "201" ]]; then
        echo "✅ Service creation successful (Status: $service_status)"
        # Extract service ID for further testing
        service_id=$(echo $service_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Service ID: $service_id"
    else
        echo "❌ Service creation failed (Status: $service_status)"
        echo "   Response: $service_response"
    fi
else
    echo "❌ No specialist token available"
fi

# Test 3: Booking Creation
echo ""
echo "📅 Testing Booking Creation..."
if [[ -n "$customer_token" ]] && [[ -n "$service_id" ]]; then
    # Calculate a future date (7 days from now)
    future_date=$(date -u -d "+7 days" +"%Y-%m-%dT14:00:00.000Z")
    
    booking_response=$(curl -s -X POST "$API_BASE/bookings" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $customer_token" \
        -d "{
            \"serviceId\": \"$service_id\",
            \"scheduledAt\": \"$future_date\",
            \"customerNotes\": \"Looking forward to this service! Please confirm availability.\"
        }")
    
    booking_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/bookings" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $customer_token" \
        -d "{
            \"serviceId\": \"$service_id\",
            \"scheduledAt\": \"$future_date\",
            \"customerNotes\": \"Test booking\"
        }")
    
    if [[ $booking_status == "200" ]] || [[ $booking_status == "201" ]]; then
        echo "✅ Booking creation successful (Status: $booking_status)"
        # Extract booking ID for further testing
        booking_id=$(echo $booking_response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Booking ID: $booking_id"
    else
        echo "❌ Booking creation failed (Status: $booking_status)"
        echo "   Response: $booking_response"
    fi
else
    echo "❌ Missing customer token or service ID"
fi

# Test 4: Customer Profile Update
echo ""
echo "👤 Testing Customer Profile Update..."
if [[ -n "$customer_token" ]]; then
    profile_update_response=$(curl -s -X PUT "$API_BASE/users/profile" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $customer_token" \
        -d "{
            \"firstName\": \"UpdatedCustomer\",
            \"lastName\": \"UpdatedUser\",
            \"phoneNumber\": \"+380111222333\",
            \"language\": \"uk\",
            \"currency\": \"UAH\"
        }")
    
    profile_update_status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_BASE/users/profile" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $customer_token" \
        -d "{
            \"firstName\": \"UpdatedCustomer\",
            \"language\": \"uk\"
        }")
    
    if [[ $profile_update_status == "200" ]]; then
        echo "✅ Customer profile update successful (Status: $profile_update_status)"
    else
        echo "❌ Customer profile update failed (Status: $profile_update_status)"
        echo "   Response: $profile_update_response"
    fi
else
    echo "❌ No customer token available"
fi

# Test 5: Notifications Access
echo ""
echo "🔔 Testing Notifications Access..."
if [[ -n "$customer_token" ]]; then
    notifications_response=$(curl -s -X GET "$API_BASE/notifications" \
        -H "Authorization: Bearer $customer_token")
    
    notifications_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/notifications" \
        -H "Authorization: Bearer $customer_token")
    
    if [[ $notifications_status == "200" ]]; then
        echo "✅ Notifications access successful (Status: $notifications_status)"
    else
        echo "❌ Notifications access failed (Status: $notifications_status)"
        echo "   Response: $notifications_response"
    fi
else
    echo "❌ No customer token available"
fi

# Test 6: Analytics Access (Specialist)
echo ""
echo "📊 Testing Analytics Access..."
if [[ -n "$specialist_token" ]]; then
    analytics_response=$(curl -s -X GET "$API_BASE/analytics/dashboard" \
        -H "Authorization: Bearer $specialist_token")
    
    analytics_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/analytics/dashboard" \
        -H "Authorization: Bearer $specialist_token")
    
    if [[ $analytics_status == "200" ]]; then
        echo "✅ Analytics access successful (Status: $analytics_status)"
    else
        echo "❌ Analytics access failed (Status: $analytics_status)"
        echo "   Response: $analytics_response"
    fi
else
    echo "❌ No specialist token available"
fi

# Test 7: Service Update
echo ""
echo "✏️ Testing Service Update..."
if [[ -n "$specialist_token" ]] && [[ -n "$service_id" ]]; then
    service_update_response=$(curl -s -X PUT "$API_BASE/services/$service_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"name\": \"Updated Professional Hair Styling\",
            \"description\": \"Premium hair styling service with updated features\",
            \"basePrice\": 175.00
        }")
    
    service_update_status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_BASE/services/$service_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $specialist_token" \
        -d "{
            \"name\": \"Updated Service\",
            \"basePrice\": 120.00
        }")
    
    if [[ $service_update_status == "200" ]]; then
        echo "✅ Service update successful (Status: $service_update_status)"
    else
        echo "❌ Service update failed (Status: $service_update_status)"
        echo "   Response: $service_update_response"
    fi
else
    echo "❌ Missing specialist token or service ID"
fi

# Test 8: Booking Management (List bookings)
echo ""
echo "📋 Testing Booking Management..."
if [[ -n "$customer_token" ]]; then
    bookings_response=$(curl -s -X GET "$API_BASE/bookings" \
        -H "Authorization: Bearer $customer_token")
    
    bookings_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/bookings" \
        -H "Authorization: Bearer $customer_token")
    
    if [[ $bookings_status == "200" ]]; then
        echo "✅ Booking management access successful (Status: $bookings_status)"
    else
        echo "❌ Booking management access failed (Status: $bookings_status)"
        echo "   Response: $bookings_response"
    fi
else
    echo "❌ No customer token available"
fi

# Test 9: File Upload Endpoint Test
echo ""
echo "📁 Testing File Upload Endpoint..."
file_upload_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/files")

if [[ $file_upload_status == "401" ]]; then
    echo "✅ File upload endpoint exists and requires authentication (Status: $file_upload_status)"
else
    echo "⚠️ File upload endpoint status: $file_upload_status"
fi

# Test 10: Error Handling for Non-existent Resources
echo ""
echo "🚫 Testing Error Handling for Non-existent Resources..."
nonexistent_service_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/services/nonexistent-id")
nonexistent_booking_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/bookings/nonexistent-id" \
    -H "Authorization: Bearer $customer_token")

if [[ $nonexistent_service_status == "404" ]]; then
    echo "✅ Proper 404 handling for non-existent service (Status: $nonexistent_service_status)"
else
    echo "❌ Improper handling for non-existent service (Status: $nonexistent_service_status)"
fi

if [[ $nonexistent_booking_status == "404" ]] || [[ $nonexistent_booking_status == "403" ]]; then
    echo "✅ Proper error handling for non-existent booking (Status: $nonexistent_booking_status)"
else
    echo "❌ Improper handling for non-existent booking (Status: $nonexistent_booking_status)"
fi

echo ""
echo "🏁 Advanced Testing Complete!"
echo "======================================="
echo "Summary: All core platform functionality tested"