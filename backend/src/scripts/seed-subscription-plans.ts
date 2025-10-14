import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  try {
    // Clear existing plans
    await prisma.subscriptionPlan.deleteMany({});

    // Create Individual Plans
    const individualBasic = await prisma.subscriptionPlan.create({
      data: {
        name: 'Individual Basic',
        nameKh: 'ផ្ទាល់ខ្លួនមូលដ្ឋាន',
        description: 'Basic plan for individual specialists - Pay monthly/yearly or 5% commission per booking',
        descriptionKh: 'ផែនការមូលដ្ឋានសម្រាប់អ្នកជំនាញបុគ្គល - បង់ប្រចាំខែ/ឆ្នាំ ឬ ៥% កម្រៃ',
        type: 'INDIVIDUAL_BASIC',
        userType: 'INDIVIDUAL',
        monthlyPrice: 10.0,
        yearlyPrice: 100.0,
        commissionRate: 0.05,
        isPremiumListing: false,
        maxServices: null, // unlimited
        maxEmployees: null,
        analyticsAccess: true,
        prioritySupport: false,
        customBranding: false,
        isActive: true,
      },
    });

    const individualPremium = await prisma.subscriptionPlan.create({
      data: {
        name: 'Individual Premium',
        nameKh: 'ផ្ទាល់ខ្លួនពិសេស',
        description: 'Premium plan with featured listings - $30/month, $300/year, or 5% commission',
        descriptionKh: 'ផែនការពិសេសជាមួយការបង្ហាញលេចធ្លោ - ៣០ដុល្លារ/ខែ, ៣០០ដុល្លារ/ឆ្នាំ ឬ ៥% កម្រៃ',
        type: 'INDIVIDUAL_PREMIUM',
        userType: 'INDIVIDUAL',
        monthlyPrice: 30.0,
        yearlyPrice: 300.0,
        commissionRate: 0.05,
        isPremiumListing: true,
        maxServices: null, // unlimited
        maxEmployees: null,
        analyticsAccess: true,
        prioritySupport: true,
        customBranding: false,
        isActive: true,
      },
    });

    // Create Business Plans
    const businessBasic = await prisma.subscriptionPlan.create({
      data: {
        name: 'Business Basic',
        nameKh: 'អាជីវកម្មមូលដ្ឋាន',
        description: 'For businesses with multiple employees - 5% commission per booking',
        descriptionKh: 'សម្រាប់អាជីវកម្មដែលមានបុគ្គលិកច្រើននាក់ - ៥% កម្រៃក្នុងមួយការកក់',
        type: 'BUSINESS_BASIC',
        userType: 'BUSINESS',
        monthlyPrice: null,
        yearlyPrice: null,
        commissionRate: 0.05,
        isPremiumListing: false,
        maxServices: null, // unlimited
        maxEmployees: null, // unlimited
        analyticsAccess: true,
        prioritySupport: false,
        customBranding: false,
        isActive: true,
      },
    });

    const businessPremium = await prisma.subscriptionPlan.create({
      data: {
        name: 'Business Premium',
        nameKh: 'អាជីវកម្មពិសេស',
        description: 'Premium business plan with featured listings and custom branding - 5% commission',
        descriptionKh: 'ផែនការអាជីវកម្មពិសេសជាមួយការបង្ហាញលេចធ្លោនិងម៉ាកផ្ទាល់ខ្លួន - ៥% កម្រៃ',
        type: 'BUSINESS_PREMIUM',
        userType: 'BUSINESS',
        monthlyPrice: null,
        yearlyPrice: null,
        commissionRate: 0.05,
        isPremiumListing: true,
        maxServices: null, // unlimited
        maxEmployees: null, // unlimited
        analyticsAccess: true,
        prioritySupport: true,
        customBranding: true,
        isActive: true,
      },
    });

    console.log('✅ Subscription plans created:');
    console.log('  - Individual Basic:', individualBasic.id);
    console.log('  - Individual Premium:', individualPremium.id);
    console.log('  - Business Basic:', businessBasic.id);
    console.log('  - Business Premium:', businessPremium.id);

    console.log('\n📋 Subscription Plan Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Individual Basic:');
    console.log('  - $10/month or $100/year');
    console.log('  - Alternative: 5% commission per booking');
    console.log('  - Standard listing');
    console.log('');
    console.log('Individual Premium:');
    console.log('  - $30/month or $300/year');
    console.log('  - Alternative: 5% commission per booking');
    console.log('  - Premium listing (featured in search)');
    console.log('  - Priority support');
    console.log('');
    console.log('Business Basic:');
    console.log('  - 5% commission per booking only');
    console.log('  - Unlimited employees');
    console.log('  - Standard listing');
    console.log('');
    console.log('Business Premium:');
    console.log('  - 5% commission per booking only');
    console.log('  - Unlimited employees');
    console.log('  - Premium listing (featured in search)');
    console.log('  - Custom branding');
    console.log('  - Priority support');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSubscriptionPlans()
  .then(() => {
    console.log('✅ Subscription plans seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to seed subscription plans:', error);
    process.exit(1);
  });
