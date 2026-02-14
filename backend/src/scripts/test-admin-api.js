const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

// Configuration
const API_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FrsHSPBtjWPCQQhGvLAcQMrWhYLxaKOS@junction.proxy.rlwy.net:43164/railway';

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
});

let authToken = null;

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check admin user exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@miyzapis.com' },
      select: { id: true, email: true, userType: true, isActive: true }
    });

    if (!admin) {
      console.log('❌ Admin user not found in database');
      return false;
    }

    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      userType: admin.userType,
      isActive: admin.isActive
    });

    // Check tables exist
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.service.count(),
    ]);

    console.log('✅ Database tables accessible:', {
      users: counts[0],
      bookings: counts[1],
      services: counts[2]
    });

    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Admin Login API...\n');

  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: 'admin@miyzapis.com',
      password: 'Admin123!@#'
    });

    if (response.data.success && response.data.data.tokens) {
      authToken = response.data.data.tokens.accessToken;
      console.log('✅ Login successful');
      console.log('✅ Access token received:', authToken.substring(0, 50) + '...');
      console.log('✅ User data:', {
        email: response.data.data.user.email,
        userType: response.data.data.user.userType,
        firstName: response.data.data.user.firstName
      });
      return true;
    } else {
      console.log('❌ Login failed: Invalid response structure');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Login API call failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAdminEndpoints() {
  console.log('\n📊 Testing Admin Analytics Endpoints...\n');

  if (!authToken) {
    console.log('❌ No auth token available. Login must succeed first.');
    return;
  }

  const endpoints = [
    { name: 'Dashboard Stats', url: '/api/v1/admin/dashboard/stats?period=30d' },
    { name: 'User Analytics', url: '/api/v1/admin/analytics/users?period=30d' },
    { name: 'Booking Analytics', url: '/api/v1/admin/analytics/bookings?period=30d' },
    { name: 'Financial Analytics', url: '/api/v1/admin/analytics/financial?period=30d' },
    { name: 'Referral Analytics', url: '/api/v1/admin/analytics/referrals' },
    { name: 'System Health', url: '/api/v1/admin/system/health' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        results.push({ endpoint: endpoint.name, status: 'SUCCESS' });
      } else {
        console.log(`⚠️  ${endpoint.name}: Unexpected response`);
        results.push({ endpoint: endpoint.name, status: 'UNEXPECTED' });
      }
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const message = errorData?.error?.message || errorData?.message || error.message;
      console.log(`❌ ${endpoint.name}: ${status} - ${message}`);
      console.log(`   Full error:`, JSON.stringify(errorData, null, 2));
      results.push({ endpoint: endpoint.name, status: `ERROR ${status}`, message });
    }
  }

  console.log('\n📋 Summary:');
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status.includes('ERROR')).length;
  console.log(`✅ Successful: ${successful}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);

  if (failed > 0) {
    console.log('\n🔍 Failed endpoints:');
    results.filter(r => r.status.includes('ERROR')).forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.status} - ${r.message}`);
    });
  }

  return successful === endpoints.length;
}

async function runAllTests() {
  console.log('🚀 Starting Admin API & Database Tests\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Database
    const dbOk = await testDatabaseConnection();
    if (!dbOk) {
      console.log('\n❌ Database tests failed. Cannot proceed.');
      return;
    }

    // Test 2: Login
    const loginOk = await testLogin();
    if (!loginOk) {
      console.log('\n❌ Login tests failed. Cannot proceed to endpoint tests.');
      return;
    }

    // Test 3: Admin endpoints
    const endpointsOk = await testAdminEndpoints();

    console.log('\n' + '='.repeat(60));
    if (dbOk && loginOk && endpointsOk) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\nℹ️  If you\'re still getting 403 in browser:');
      console.log('  1. Clear browser cache/localStorage');
      console.log('  2. Login again to get fresh token');
      console.log('  3. The backend is working correctly');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nℹ️  Check the errors above for details');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runAllTests();
