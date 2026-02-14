const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'https://miyzapis-backend-production.up.railway.app';
const ADMIN_EMAIL = 'admin@miyzapis.com';
const ADMIN_PASSWORD = 'Admin123!@#';

let authToken = null;
const detailedResults = {};

// Login to get admin token
async function login() {
  console.log('🔐 Logging in as admin...\n');

  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success && response.data.data.tokens) {
      authToken = response.data.data.tokens.accessToken;
      console.log('✅ Login successful\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Fetch and document endpoint
async function fetchEndpoint(name, url, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    const response = await axios.get(`${API_URL}${url}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);

    // Store detailed results
    detailedResults[name] = {
      url,
      description,
      status: response.status,
      success: data.success,
      data: data.data || data,
      timestamp: new Date().toISOString()
    };

    // Print summary
    printDataSummary(data.data || data);

    return true;

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }

    detailedResults[name] = {
      url,
      description,
      error: error.message,
      status: error.response?.status,
      errorData: error.response?.data,
      timestamp: new Date().toISOString()
    };

    return false;
  }
}

// Print data summary
function printDataSummary(data, indent = 0) {
  const prefix = '  '.repeat(indent);

  if (Array.isArray(data)) {
    console.log(`${prefix}📋 Array with ${data.length} items`);
    if (data.length > 0) {
      console.log(`${prefix}   First item:`, JSON.stringify(data[0], null, 2).substring(0, 200));
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log(`${prefix}📊 Object with keys:`);
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        console.log(`${prefix}  - ${key}: Array[${value.length}]`);
        if (value.length > 0 && typeof value[0] === 'object') {
          console.log(`${prefix}    Example item keys: ${Object.keys(value[0]).join(', ')}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(`${prefix}  - ${key}: Object`);
        printDataSummary(value, indent + 2);
      } else {
        console.log(`${prefix}  - ${key}: ${value}`);
      }
    }
  } else {
    console.log(`${prefix}Value: ${data}`);
  }
}

// Test all endpoints
async function testAllEndpoints() {
  console.log('\n🚀 DETAILED ADMIN API TESTING\n');
  console.log('This will fetch actual data from all endpoints and document the structure\n');

  // Dashboard Stats
  await fetchEndpoint(
    'Dashboard Stats (30d)',
    '/api/v1/admin/dashboard/stats?period=30d',
    'Get overall dashboard statistics including user counts, bookings, revenue, and growth metrics'
  );

  // User Analytics
  await fetchEndpoint(
    'User Analytics',
    '/api/v1/admin/analytics/users?period=30d',
    'Get detailed user analytics including registration trends, engagement stats, and geographic distribution'
  );

  // Booking Analytics
  await fetchEndpoint(
    'Booking Analytics',
    '/api/v1/admin/analytics/bookings?period=30d',
    'Get booking statistics including status distribution, trends, popular services, and peak hours'
  );

  // Financial Analytics
  await fetchEndpoint(
    'Financial Analytics',
    '/api/v1/admin/analytics/financial?period=30d',
    'Get financial data including revenue trends, payment methods, currency distribution, and top earners'
  );

  // Referral Analytics
  await fetchEndpoint(
    'Referral Analytics',
    '/api/v1/admin/analytics/referrals',
    'Get referral program performance including conversion rates, rewards distributed, and top referrers'
  );

  // System Health
  await fetchEndpoint(
    'System Health',
    '/api/v1/admin/system/health',
    'Get system health status including database, Redis, system metrics, and application metrics'
  );

  // Audit Logs
  await fetchEndpoint(
    'Audit Logs',
    '/api/v1/admin/audit-logs',
    'Get audit logs of administrative actions'
  );
}

// Generate detailed report
function generateReport() {
  console.log('\n\n' + '='.repeat(70));
  console.log('📄 GENERATING DETAILED REPORT');
  console.log('='.repeat(70) + '\n');

  const reportPath = path.join(__dirname, 'admin-api-test-results.json');
  const mdReportPath = path.join(__dirname, 'admin-api-test-results.md');

  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(detailedResults, null, 2));
  console.log(`✅ JSON report saved: ${reportPath}`);

  // Generate Markdown report
  let mdReport = '# MiyZapis Admin API Test Results\n\n';
  mdReport += `**Test Date:** ${new Date().toISOString()}\n\n`;
  mdReport += `**API URL:** ${API_URL}\n\n`;
  mdReport += '---\n\n';

  // Summary table
  mdReport += '## Summary\n\n';
  mdReport += '| Endpoint | Status | Success |\n';
  mdReport += '|----------|--------|----------|\n';

  for (const [name, result] of Object.entries(detailedResults)) {
    const status = result.status || 'ERROR';
    const success = result.success ? '✅' : '❌';
    mdReport += `| ${name} | ${status} | ${success} |\n`;
  }

  mdReport += '\n---\n\n';

  // Detailed results
  mdReport += '## Detailed Results\n\n';

  for (const [name, result] of Object.entries(detailedResults)) {
    mdReport += `### ${name}\n\n`;
    mdReport += `**URL:** \`${result.url}\`\n\n`;
    mdReport += `**Description:** ${result.description}\n\n`;
    mdReport += `**Status:** ${result.status || 'ERROR'}\n\n`;

    if (result.success) {
      mdReport += `**Success:** ✅\n\n`;
      mdReport += '**Response Structure:**\n\n';
      mdReport += '```json\n';
      mdReport += JSON.stringify(result.data, null, 2).substring(0, 1000);
      if (JSON.stringify(result.data).length > 1000) {
        mdReport += '\n... (truncated)';
      }
      mdReport += '\n```\n\n';
    } else {
      mdReport += `**Error:** ${result.error}\n\n`;
      if (result.errorData) {
        mdReport += '**Error Details:**\n\n';
        mdReport += '```json\n';
        mdReport += JSON.stringify(result.errorData, null, 2);
        mdReport += '\n```\n\n';
      }
    }

    mdReport += '---\n\n';
  }

  // Add endpoint documentation
  mdReport += '## API Endpoints Reference\n\n';
  mdReport += '### Analytics Endpoints\n\n';
  mdReport += '#### Dashboard Stats\n';
  mdReport += '```\nGET /api/v1/admin/dashboard/stats?period={period}\n```\n\n';
  mdReport += '**Parameters:**\n';
  mdReport += '- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Overview: Total users, specialists, services, bookings, revenue\n';
  mdReport += '- Growth metrics: New users, bookings, revenue with growth rates\n';
  mdReport += '- Recent activity: Latest bookings and user registrations\n';
  mdReport += '- Analytics: Category stats and top specialists\n\n';

  mdReport += '#### User Analytics\n';
  mdReport += '```\nGET /api/v1/admin/analytics/users?period={period}&userType={type}\n```\n\n';
  mdReport += '**Parameters:**\n';
  mdReport += '- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)\n';
  mdReport += '- `userType` (optional): `CUSTOMER`, `SPECIALIST`, `ADMIN`\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- User registration trends over time\n';
  mdReport += '- Engagement statistics by user type\n';
  mdReport += '- Geographic distribution\n\n';

  mdReport += '#### Booking Analytics\n';
  mdReport += '```\nGET /api/v1/admin/analytics/bookings?period={period}\n```\n\n';
  mdReport += '**Parameters:**\n';
  mdReport += '- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Status distribution (pending, confirmed, completed, cancelled)\n';
  mdReport += '- Booking trends over time\n';
  mdReport += '- Popular services\n';
  mdReport += '- Peak hours analysis\n';
  mdReport += '- Revenue by category\n\n';

  mdReport += '#### Financial Analytics\n';
  mdReport += '```\nGET /api/v1/admin/analytics/financial?period={period}\n```\n\n';
  mdReport += '**Parameters:**\n';
  mdReport += '- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Revenue trends over time\n';
  mdReport += '- Payment method distribution\n';
  mdReport += '- Currency statistics\n';
  mdReport += '- Top earning specialists\n';
  mdReport += '- Refund analysis\n\n';

  mdReport += '#### Referral Analytics\n';
  mdReport += '```\nGET /api/v1/admin/analytics/referrals\n```\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Referral performance summary\n';
  mdReport += '- Conversion rates\n';
  mdReport += '- Rewards distributed\n';
  mdReport += '- Top referrers\n\n';

  mdReport += '### System Endpoints\n\n';
  mdReport += '#### System Health\n';
  mdReport += '```\nGET /api/v1/admin/system/health\n```\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Database health check\n';
  mdReport += '- Redis health check\n';
  mdReport += '- System metrics (uptime, memory, CPU)\n';
  mdReport += '- Application metrics (users, bookings)\n\n';

  mdReport += '#### Audit Logs\n';
  mdReport += '```\nGET /api/v1/admin/audit-logs\n```\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Administrative action logs\n';
  mdReport += '- Pagination information\n\n';

  mdReport += '### Management Endpoints\n\n';
  mdReport += '#### User Management\n';
  mdReport += '```\nPOST /api/v1/admin/users/manage\n```\n\n';
  mdReport += '**Body:**\n';
  mdReport += '```json\n{\n  "action": "activate|deactivate|delete",\n  "userIds": ["uuid1", "uuid2"]\n}\n```\n\n';

  mdReport += '#### Referral Cleanup\n';
  mdReport += '```\nPOST /api/v1/admin/referrals/cleanup-expired\n```\n\n';
  mdReport += '**Response includes:**\n';
  mdReport += '- Number of expired referrals cleaned up\n\n';

  mdReport += '### Authentication\n\n';
  mdReport += 'All admin endpoints require:\n\n';
  mdReport += '1. **Authentication:** Bearer token in Authorization header\n';
  mdReport += '2. **Authorization:** User must have admin role (`userType: "ADMIN"` or `"admin"`)\n\n';
  mdReport += '**Example:**\n';
  mdReport += '```\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n```\n\n';

  // Save Markdown report
  fs.writeFileSync(mdReportPath, mdReport);
  console.log(`✅ Markdown report saved: ${mdReportPath}`);

  console.log('\n📊 Test Statistics:');
  const total = Object.keys(detailedResults).length;
  const successful = Object.values(detailedResults).filter(r => r.success).length;
  const failed = total - successful;
  console.log(`   Total endpoints tested: ${total}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${((successful / total) * 100).toFixed(1)}%`);
}

// Main execution
async function main() {
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Login failed. Cannot proceed.');
    return;
  }

  await testAllEndpoints();
  generateReport();

  console.log('\n✅ Testing complete!\n');
}

main().catch(console.error);
