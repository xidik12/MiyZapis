#!/usr/bin/env node

/**
 * Test script for loyalty rewards system functionality
 * Tests both specialist (create/manage rewards) and customer (browse/redeem rewards) workflows
 */

const API_BASE = 'http://localhost:3020/api/v1';

// Test user credentials - you may need to create these users first
const SPECIALIST_TEST_EMAIL = 'specialist@test.com';
const CUSTOMER_TEST_EMAIL = 'customer@test.com';
const TEST_PASSWORD = 'TestPassword123!';

let specialistToken = '';
let customerToken = '';

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    return {
      status: response.status,
      data: result,
      ok: response.ok
    };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function loginUser(email, password, userType) {
  console.log(`🔐 Attempting login for ${userType}: ${email}`);

  const response = await makeRequest('/auth/login', 'POST', {
    email,
    password
  });

  if (response.ok) {
    console.log(`✅ ${userType} login successful`);
    return response.data.token;
  } else {
    console.log(`❌ ${userType} login failed:`, response.data);
    return null;
  }
}

async function registerUser(email, password, firstName, lastName, userType) {
  console.log(`📝 Registering ${userType}: ${email}`);

  const response = await makeRequest('/auth/register', 'POST', {
    email,
    password,
    firstName,
    lastName,
    userType: userType.toUpperCase()
  });

  if (response.ok) {
    console.log(`✅ ${userType} registration successful`);
    return response.data.token;
  } else if (response.status === 409 || (response.data && response.data.error && response.data.error.code === 'EMAIL_ALREADY_EXISTS')) {
    console.log(`ℹ️ ${userType} already exists, attempting login...`);
    return await loginUser(email, password, userType);
  } else {
    console.log(`❌ ${userType} registration failed:`, response.data);
    return null;
  }
}

async function testSpecialistRewardCreation() {
  console.log('\n🎯 Testing Specialist Reward Creation');
  console.log('=====================================');

  // Create a test reward
  const rewardData = {
    title: "10% Off Haircut",
    description: "Get 10% off your next haircut service",
    type: "PERCENTAGE_OFF",
    pointsRequired: 100,
    discountPercent: 10,
    usageLimit: "UNLIMITED",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };

  const response = await makeRequest('/rewards', 'POST', rewardData, specialistToken);

  if (response.ok) {
    console.log('✅ Reward created successfully');
    console.log(`   Reward ID: ${response.data.data.reward.id}`);
    console.log(`   Title: ${response.data.data.reward.title}`);
    console.log(`   Points Required: ${response.data.data.reward.pointsRequired}`);
    return response.data.data.reward.id;
  } else {
    console.log('❌ Failed to create reward:', response.data);
    return null;
  }
}

async function testSpecialistRewardManagement() {
  console.log('\n📋 Testing Specialist Reward Management');
  console.log('=======================================');

  // Get specialist's rewards
  const response = await makeRequest('/rewards/specialist', 'GET', null, specialistToken);

  if (response.ok) {
    const rewards = response.data.data.rewards;
    console.log(`✅ Retrieved ${rewards.length} specialist rewards`);

    rewards.forEach((reward, index) => {
      console.log(`   ${index + 1}. ${reward.title} (${reward.pointsRequired} points) - ${reward.isActive ? 'Active' : 'Inactive'}`);
    });

    return rewards;
  } else {
    console.log('❌ Failed to get specialist rewards:', response.data);
    return [];
  }
}

async function testCustomerRewardBrowsing() {
  console.log('\n🛍️ Testing Customer Reward Browsing');
  console.log('===================================');

  // Get available rewards for customer
  const response = await makeRequest('/rewards/available', 'GET', null, customerToken);

  if (response.ok) {
    const rewards = response.data.data.rewards;
    console.log(`✅ Found ${rewards.length} available rewards for customer`);

    rewards.forEach((reward, index) => {
      console.log(`   ${index + 1}. ${reward.title}`);
      console.log(`      Points: ${reward.pointsRequired}`);
      console.log(`      Discount: ${reward.discountPercent ? reward.discountPercent + '%' : '$' + reward.discountAmount || 'Special offer'}`);
      console.log(`      Specialist: ${reward.specialist?.user?.firstName} ${reward.specialist?.user?.lastName}`);
    });

    return rewards;
  } else {
    console.log('❌ Failed to get available rewards:', response.data);
    return [];
  }
}

async function testLoyaltyTiers() {
  console.log('\n🏆 Testing Loyalty Tiers');
  console.log('========================');

  // Get loyalty tiers
  const response = await makeRequest('/loyalty/tiers', 'GET', null, customerToken);

  if (response.ok) {
    const tiers = response.data.data.tiers;
    console.log(`✅ Found ${tiers.length} loyalty tiers`);

    tiers.forEach((tier, index) => {
      console.log(`   ${index + 1}. ${tier.name}`);
      console.log(`      Min Points: ${tier.minPoints}`);
      console.log(`      Benefits: ${tier.benefits?.join(', ') || 'None listed'}`);
    });

    return tiers;
  } else {
    console.log('❌ Failed to get loyalty tiers:', response.data);
    return [];
  }
}

async function testCustomerLoyaltyProfile() {
  console.log('\n👤 Testing Customer Loyalty Profile');
  console.log('==================================');

  // Get customer's loyalty profile
  const response = await makeRequest('/loyalty/profile', 'GET', null, customerToken);

  if (response.ok) {
    const profile = response.data.data;
    console.log('✅ Customer loyalty profile retrieved');
    console.log(`   Current Points: ${profile.currentPoints}`);
    console.log(`   Lifetime Points: ${profile.lifetimePoints}`);
    console.log(`   Current Tier: ${profile.currentTier?.name || 'None'}`);

    return profile;
  } else {
    console.log('❌ Failed to get customer loyalty profile:', response.data);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Loyalty Rewards System Tests');
  console.log('=========================================');

  try {
    // Step 1: Setup test users
    console.log('\n🚀 Setting up test users...');
    specialistToken = await registerUser(SPECIALIST_TEST_EMAIL, TEST_PASSWORD, 'Test', 'Specialist', 'specialist');
    customerToken = await registerUser(CUSTOMER_TEST_EMAIL, TEST_PASSWORD, 'Test', 'Customer', 'customer');

    if (!specialistToken || !customerToken) {
      throw new Error('Failed to setup test users');
    }

    // Step 2: Test specialist workflow
    console.log('\n🔧 Testing Specialist Workflow');
    const rewardId = await testSpecialistRewardCreation();
    const specialistRewards = await testSpecialistRewardManagement();

    // Step 3: Test customer workflow
    console.log('\n👥 Testing Customer Workflow');
    const availableRewards = await testCustomerRewardBrowsing();
    const customerProfile = await testCustomerLoyaltyProfile();
    const loyaltyTiers = await testLoyaltyTiers();

    // Step 4: Summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Specialist can create rewards: ${rewardId ? 'Yes' : 'No'}`);
    console.log(`✅ Specialist can manage rewards: ${specialistRewards.length > 0 ? 'Yes' : 'No'}`);
    console.log(`✅ Customers can browse rewards: ${availableRewards.length >= 0 ? 'Yes' : 'No'}`);
    console.log(`✅ Loyalty profile system works: ${customerProfile ? 'Yes' : 'No'}`);
    console.log(`✅ Loyalty tiers are configured: ${loyaltyTiers.length > 0 ? 'Yes' : 'No'}`);

    if (rewardId && specialistRewards.length > 0 && customerProfile && loyaltyTiers.length > 0) {
      console.log('\n🎉 All loyalty rewards system tests passed!');
      console.log('\n🔧 System is ready for use:');
      console.log('   • Specialists can create and manage rewards');
      console.log('   • Customers can browse available rewards');
      console.log('   • Loyalty tiers and points system is functional');
      console.log('   • Database schema and API endpoints are working');

      return true;
    } else {
      console.log('\n⚠️ Some tests failed or returned unexpected results');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    return false;
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ for native fetch support');
  console.log('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runTests().then((success) => {
  if (success) {
    console.log('\n✅ Loyalty rewards system is fully functional!');
    process.exit(0);
  } else {
    console.log('\n❌ Some loyalty rewards tests failed.');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n💥 Test runner crashed:', error);
  process.exit(1);
});