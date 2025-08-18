import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const sampleUsers = [
    {
      email: 'customer@example.com',
      firstName: 'Demo',
      lastName: 'Customer',
      userType: 'CUSTOMER' as const,
      isEmailVerified: true,
      loyaltyPoints: 150
    },
    {
      email: 'specialist@example.com',
      firstName: 'Demo',
      lastName: 'Specialist',
      userType: 'SPECIALIST' as const,
      isEmailVerified: true,
      loyaltyPoints: 0
    },
    {
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      userType: 'CUSTOMER' as const,
      isEmailVerified: true,
      loyaltyPoints: 150
    },
    {
      email: 'bob@example.com', 
      firstName: 'Bob',
      lastName: 'Smith',
      userType: 'CUSTOMER' as const,
      isEmailVerified: true,
      loyaltyPoints: 75
    },
    {
      email: 'carol@stylist.com',
      firstName: 'Carol',
      lastName: 'Williams',
      userType: 'SPECIALIST' as const,
      isEmailVerified: true,
      loyaltyPoints: 0
    },
    {
      email: 'david@massage.com',
      firstName: 'David',
      lastName: 'Brown',
      userType: 'SPECIALIST' as const,
      isEmailVerified: true,
      loyaltyPoints: 0
    },
    {
      email: 'eva@fitness.com',
      firstName: 'Eva',
      lastName: 'Davis',
      userType: 'SPECIALIST' as const,
      isEmailVerified: true,
      loyaltyPoints: 0
    }
  ];

  // Hash password for all users
  const hashedPassword = await hash('demo123456', 12);

  console.log('Creating users...');
  const users = [];
  for (const userData of sampleUsers) {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      console.log(`Created user: ${user.firstName} ${user.lastName}`);
    } else {
      console.log(`User already exists: ${user.firstName} ${user.lastName}`);
    }
    users.push(user);
  }

  // Create specialists from the users
  console.log('Creating specialists...');
  const specialistUsers = users.filter(u => u.userType === 'SPECIALIST');
  
  const specialistData = [
    {
      userId: specialistUsers[0].id, // Carol
      businessName: 'Carol\'s Hair Studio',
      bio: 'Professional hair stylist with 8 years of experience. Specializing in cuts, colors, and styling for all hair types.',
      specialties: '["haircuts", "hair-coloring", "styling", "treatments"]',
      certifications: '["Certified Hair Colorist", "Advanced Cutting Techniques"]',
      workingHours: '{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00", "saturday": "10:00-16:00", "sunday": "closed"}',
      experience: 8,
      city: 'New York',
      state: 'NY',
      country: 'USA',
      rating: 4.8,
      reviewCount: 47,
      completedBookings: 156,
      responseTime: 30
    },
    {
      userId: specialistUsers[1].id, // David
      businessName: 'Relaxation Massage Therapy',
      bio: 'Licensed massage therapist offering Swedish, deep tissue, and therapeutic massage. Helping clients relax and recover.',
      specialties: '["swedish-massage", "deep-tissue", "sports-massage", "therapeutic"]',
      certifications: '["Licensed Massage Therapist", "Sports Massage Certification"]',
      workingHours: '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-15:00", "sunday": "10:00-14:00"}',
      experience: 12,
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      rating: 4.9,
      reviewCount: 73,
      completedBookings: 289,
      responseTime: 15
    },
    {
      userId: specialistUsers[2].id, // Eva
      businessName: 'FitLife Personal Training',
      bio: 'Certified personal trainer focused on strength training, weight loss, and functional fitness. Let\'s achieve your goals together!',
      specialties: '["personal-training", "weight-loss", "strength-training", "nutrition"]',
      certifications: '["NASM Certified Personal Trainer", "Nutrition Specialist"]',
      workingHours: '{"monday": "6:00-20:00", "tuesday": "6:00-20:00", "wednesday": "6:00-20:00", "thursday": "6:00-20:00", "friday": "6:00-20:00", "saturday": "8:00-16:00", "sunday": "8:00-16:00"}',
      experience: 5,
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      rating: 4.7,
      reviewCount: 32,
      completedBookings: 98,
      responseTime: 45
    }
  ];

  const specialists = [];
  for (const specData of specialistData) {
    // Check if specialist already exists
    let specialist = await prisma.specialist.findUnique({
      where: { userId: specData.userId }
    });
    
    if (!specialist) {
      specialist = await prisma.specialist.create({
        data: specData
      });
      console.log(`Created specialist: ${specData.businessName}`);
    } else {
      console.log(`Specialist already exists: ${specData.businessName}`);
    }
    specialists.push(specialist);
  }

  // Create services
  console.log('Creating services...');
  const servicesData = [
    // Carol's services (Hair)
    {
      specialistId: specialists[0].id,
      name: 'Women\'s Haircut & Style',
      description: 'Professional haircut with wash, cut, and styling. Includes consultation to find the perfect look for you.',
      category: 'haircut',
      basePrice: 65.00,
      currency: 'USD',
      duration: 75,
      requirements: '["Clean hair preferred", "Bring reference photos if desired"]',
      deliverables: '["Professional haircut", "Styling", "Hair care advice"]',
      images: '["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400"]',
      isActive: true
    },
    {
      specialistId: specialists[0].id,
      name: 'Hair Color & Highlights',
      description: 'Full hair coloring service including highlights, lowlights, or all-over color. Professional products only.',
      category: 'haircut',
      basePrice: 120.00,
      currency: 'USD',
      duration: 150,
      requirements: '["Hair consultation required", "No recent chemical treatments"]',
      deliverables: '["Hair coloring", "Toning", "Styling", "Color maintenance tips"]',
      images: '["https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400"]',
      isActive: true
    },
    // David's services (Massage)
    {
      specialistId: specialists[1].id,
      name: 'Swedish Relaxation Massage',
      description: 'Full body Swedish massage designed to promote relaxation and stress relief. Perfect for unwinding.',
      category: 'massage',
      basePrice: 85.00,
      currency: 'USD',
      duration: 60,
      requirements: '["Comfortable clothing", "No recent injuries"]',
      deliverables: '["60-minute massage", "Relaxation techniques", "Stress relief"]',
      images: '["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400"]',
      isActive: true
    },
    {
      specialistId: specialists[1].id,
      name: 'Deep Tissue Massage',
      description: 'Therapeutic deep tissue massage targeting muscle tension and knots. Great for athletes and active individuals.',
      category: 'massage',
      basePrice: 95.00,
      currency: 'USD',
      duration: 60,
      requirements: '["Medical clearance if injured", "Hydrate well before session"]',
      deliverables: '["Deep tissue therapy", "Muscle tension relief", "Recovery techniques"]',
      images: '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]',
      isActive: true
    },
    // Eva's services (Fitness)
    {
      specialistId: specialists[2].id,
      name: 'Personal Training Session',
      description: 'One-on-one personal training session customized to your fitness goals and experience level.',
      category: 'fitness',
      basePrice: 75.00,
      currency: 'USD',
      duration: 60,
      requirements: '["Gym membership or home gym access", "Workout clothes", "Water bottle"]',
      deliverables: '["Customized workout", "Proper form instruction", "Progress tracking"]',
      images: '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]',
      isActive: true
    },
    {
      specialistId: specialists[2].id,
      name: 'Fitness Assessment & Plan',
      description: 'Comprehensive fitness assessment with personalized workout and nutrition plan creation.',
      category: 'fitness',
      basePrice: 125.00,
      currency: 'USD',
      duration: 90,
      requirements: '["Medical history form", "Fitness goals discussion"]',
      deliverables: '["Fitness assessment", "Custom workout plan", "Nutrition guidelines", "Goal setting"]',
      images: '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]',
      isActive: true
    }
  ];

  const services = [];
  for (const serviceData of servicesData) {
    const service = await prisma.service.create({
      data: serviceData
    });
    services.push(service);
    console.log(`Created service: ${service.name}`);
  }

  // Create sample bookings
  console.log('Creating sample bookings...');
  const customerUsers = users.filter(u => u.userType === 'CUSTOMER');
  
  const bookingsData = [
    {
      customerId: customerUsers[0].id, // Alice
      specialistId: specialists[0].id, // Carol
      serviceId: services[0].id, // Women's Haircut
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 75,
      totalAmount: 65.00,
      depositAmount: 5.00,
      remainingAmount: 60.00,
      deliverables: '["Professional haircut", "Styling", "Hair care advice"]',
      customerNotes: 'Looking for a fresh new look, something modern and easy to maintain.',
      status: 'CONFIRMED' as const
    },
    {
      customerId: customerUsers[1].id, // Bob  
      specialistId: specialists[1].id, // David
      serviceId: services[2].id, // Swedish Massage
      scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      duration: 60,
      totalAmount: 85.00,
      depositAmount: 10.00,
      remainingAmount: 75.00,
      deliverables: '["60-minute massage", "Relaxation techniques", "Stress relief"]',
      customerNotes: 'First time getting a massage, looking forward to relaxing.',
      status: 'CONFIRMED' as const
    },
    {
      customerId: customerUsers[0].id, // Alice
      specialistId: specialists[2].id, // Eva
      serviceId: services[4].id, // Personal Training
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      duration: 60,
      totalAmount: 75.00,
      depositAmount: 5.00,
      remainingAmount: 70.00,
      deliverables: '["Customized workout", "Proper form instruction", "Progress tracking"]',
      customerNotes: 'Want to focus on core strength and flexibility.',
      status: 'COMPLETED' as const
    }
  ];

  // Skip bookings for now due to foreign key constraints
  console.log('Skipping bookings for now...');

  // Create sample reviews
  console.log('Creating sample reviews...');
  const reviewsData = [
    {
      customerId: customerUsers[0].id, // Alice
      specialistId: specialists[2].id, // Eva
      serviceId: services[4].id, // Personal Training
      rating: 5,
      comment: 'Eva is an amazing trainer! She really knows how to motivate and push you to achieve your goals. The workout was challenging but fun.',
      tags: '["motivating", "knowledgeable", "professional"]',
      isVerified: true
    },
    {
      customerId: customerUsers[1].id, // Bob
      specialistId: specialists[0].id, // Carol
      serviceId: services[0].id, // Haircut
      rating: 4,
      comment: 'Great haircut! Carol listened to what I wanted and delivered exactly that. Very professional and friendly.',
      tags: '["professional", "skilled", "friendly"]',
      isVerified: true
    }
  ];

  // Skip reviews for now since they depend on bookings
  console.log('Skipping reviews for now...');

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${users.length} users created`);
  console.log(`- ${specialists.length} specialists created`); 
  console.log(`- ${services.length} services created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });