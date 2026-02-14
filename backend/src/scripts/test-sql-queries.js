const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FrsHSPBtjWPCQQhGvLAcQMrWhYLxaKOS@junction.proxy.rlwy.net:43164/railway';

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
});

async function testQueries() {
  console.log('🔍 Testing SQL Queries...\n');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    // Test 1: User trends query
    console.log('1️⃣ Testing User Analytics Query...');
    try {
      const userTrends = await prisma.$queryRaw`
        SELECT
          created_at::date as date,
          user_type,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
        GROUP BY created_at::date, user_type
        ORDER BY date ASC
      `;
      console.log('✅ User Analytics Query: SUCCESS');
      console.log('   Sample data:', userTrends.slice(0, 2));
    } catch (error) {
      console.log('❌ User Analytics Query: FAILED');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }

    // Test 2: Booking trends query
    console.log('\n2️⃣ Testing Booking Analytics Query...');
    try {
      const bookingTrends = await prisma.$queryRaw`
        SELECT
          created_at::date as date,
          status,
          COUNT(*) as count,
          AVG(total_amount) as avg_amount
        FROM bookings
        WHERE created_at >= ${startDate}
        GROUP BY created_at::date, status
        ORDER BY date ASC
      `;
      console.log('✅ Booking Analytics Query: SUCCESS');
      console.log('   Sample data:', bookingTrends.slice(0, 2));
    } catch (error) {
      console.log('❌ Booking Analytics Query: FAILED');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }

    // Test 3: Revenue trends query
    console.log('\n3️⃣ Testing Financial Analytics Query...');
    try {
      const revenueTrends = await prisma.$queryRaw`
        SELECT
          created_at::date as date,
          type,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM payments
        WHERE created_at >= ${startDate}
          AND status = 'SUCCEEDED'
        GROUP BY created_at::date, type
        ORDER BY date ASC
      `;
      console.log('✅ Financial Analytics Query: SUCCESS');
      console.log('   Sample data:', revenueTrends.slice(0, 2));
    } catch (error) {
      console.log('❌ Financial Analytics Query: FAILED');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }

    // Test 4: Check actual column names
    console.log('\n4️⃣ Checking Database Schema...');
    const schemaInfo = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'bookings', 'payments')
      ORDER BY table_name, ordinal_position
    `;

    console.log('\n📋 Database Columns:');
    const grouped = {};
    schemaInfo.forEach(col => {
      if (!grouped[col.table_name]) grouped[col.table_name] = [];
      grouped[col.table_name].push(`${col.column_name} (${col.data_type})`);
    });

    Object.keys(grouped).forEach(table => {
      console.log(`\n${table}:`);
      grouped[table].forEach(col => console.log(`  - ${col}`));
    });

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
