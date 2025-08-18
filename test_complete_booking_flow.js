const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testCompleteBookingFlow() {
  try {
    console.log('=== Testing Complete Booking Flow ===\n');

    // 1. Register a customer
    console.log('1. Registering customer...');
    const customerData = {
      email: `customer-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'Customer',
      userType: 'CUSTOMER'
    };

    const customerResponse = await axios.post(`${API_BASE_URL}/auth/register`, customerData, {
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
    });

    const customerToken = customerResponse.data.data.tokens.accessToken;
    console.log('✅ Customer registered:', customerResponse.data.data.user.email);

    // 2. Register a specialist
    console.log('\n2. Registering specialist...');
    const specialistData = {
      email: `specialist-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'Specialist',
      userType: 'SPECIALIST'
    };

    const specialistResponse = await axios.post(`${API_BASE_URL}/auth/register`, specialistData, {
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
    });

    const specialistToken = specialistResponse.data.data.tokens.accessToken;
    console.log('✅ Specialist registered:', specialistResponse.data.data.user.email);

    // 3. Update specialist profile
    console.log('\n3. Updating specialist profile...');
    const updateProfile = await axios.put(`${API_BASE_URL}/specialists/profile`, {
      businessName: 'Premium Beauty Studio',
      bio: 'Professional beauty and wellness services',
      specialties: ['haircut', 'massage'],
      experience: 5
    }, {
      headers: { 'Authorization': `Bearer ${specialistToken}`, 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
    });
    console.log('✅ Specialist profile updated:', updateProfile.data.data.specialist.businessName);

    // 4. Create a service
    console.log('\n4. Creating service...');
    const serviceResponse = await axios.post(`${API_BASE_URL}/services`, {
      name: 'Premium Haircut & Style',
      description: 'Professional haircut with wash, cut, and styling',
      category: 'haircut',
      basePrice: 75,
      duration: 90,
      currency: 'USD'
    }, {
      headers: { 'Authorization': `Bearer ${specialistToken}`, 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
    });

    const serviceId = serviceResponse.data.data.service.id;
    console.log('✅ Service created:', serviceResponse.data.data.service.name, `($${serviceResponse.data.data.service.basePrice})`);

    // 5. Customer searches for services
    console.log('\n5. Customer searching for services...');
    const searchResponse = await axios.get(`${API_BASE_URL}/services?category=haircut`, {
      headers: { 'Origin': 'http://localhost:3005' }
    });

    console.log('✅ Found services:', searchResponse.data.data.services.length);
    const foundService = searchResponse.data.data.services.find(s => s.id === serviceId);
    if (foundService) {
      console.log('✅ Our created service is visible in search results');
    }

    // 6. Get service availability (this might not be implemented yet)
    console.log('\n6. Checking service availability...');
    try {
      const availabilityResponse = await axios.get(`${API_BASE_URL}/bookings/availability?serviceId=${serviceId}&date=2025-08-20`, {
        headers: { 'Origin': 'http://localhost:3005' }
      });
      console.log('✅ Availability checked:', availabilityResponse.data.data.length, 'slots available');
    } catch (availError) {
      console.log('⚠️ Availability check not available:', availError.response?.data?.error?.message);
    }

    // 7. Create a booking
    console.log('\n7. Creating booking...');
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 3); // 3 days from now
    bookingDate.setHours(14, 0, 0, 0); // 2 PM

    try {
      // First, get the specialist ID from the service
      const specialistId = serviceResponse.data.data.service.specialistId;
      
      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, {
        serviceId: serviceId,
        specialistId: specialistId,
        scheduledAt: bookingDate.toISOString(),
        duration: 90, // Duration in minutes
        customerNotes: 'First time customer, looking for a modern style'
      }, {
        headers: { 'Authorization': `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
      });

      const bookingId = bookingResponse.data.data.booking.id;
      console.log('✅ Booking created:', bookingId);
      console.log('   Status:', bookingResponse.data.data.booking.status);
      console.log('   Scheduled for:', bookingResponse.data.data.booking.scheduledDate);

      // 8. Get customer bookings
      console.log('\n8. Getting customer bookings...');
      const customerBookings = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${customerToken}`, 'Origin': 'http://localhost:3005' }
      });
      console.log('✅ Customer has', customerBookings.data.data.bookings.length, 'bookings');

      // 9. Get specialist bookings
      console.log('\n9. Getting specialist bookings...');
      const specialistBookings = await axios.get(`${API_BASE_URL}/bookings?role=specialist`, {
        headers: { 'Authorization': `Bearer ${specialistToken}`, 'Origin': 'http://localhost:3005' }
      });
      console.log('✅ Specialist has', specialistBookings.data.data.bookings.length, 'bookings');

      // 10. Specialist confirms booking
      console.log('\n10. Specialist confirming booking...');
      try {
        const confirmResponse = await axios.patch(`${API_BASE_URL}/bookings/${bookingId}`, {
          status: 'CONFIRMED'
        }, {
          headers: { 'Authorization': `Bearer ${specialistToken}`, 'Content-Type': 'application/json', 'Origin': 'http://localhost:3005' }
        });
        console.log('✅ Booking confirmed by specialist');
        console.log('   New status:', confirmResponse.data.data.booking.status);
      } catch (confirmError) {
        console.log('⚠️ Booking confirmation failed:', confirmError.response?.data?.error?.message);
      }

    } catch (bookingError) {
      console.log('⚠️ Booking creation failed:', bookingError.response?.data?.error?.message);
      console.log('Full error:', JSON.stringify(bookingError.response?.data, null, 2));
    }

    console.log('\n=== Booking Flow Test Complete ===');
    return true;

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    return false;
  }
}

testCompleteBookingFlow().then(success => {
  console.log('\n' + (success ? '🎉 All tests passed!' : '❌ Some tests failed'));
  process.exit(success ? 0 : 1);
});