-- Clear all seed data from development
-- Run this to clean up any previously seeded specialist data

-- Delete seed services first (foreign key constraints)
DELETE FROM "Service" 
WHERE "name" IN (
  'Women''s Haircut & Style',
  'Hair Color & Highlights', 
  'Swedish Relaxation Massage',
  'Deep Tissue Massage',
  'Personal Training Session',
  'Fitness Assessment & Plan'
);

-- Delete seed specialists
DELETE FROM "Specialist" 
WHERE "businessName" IN (
  'Carol''s Hair Studio',
  'Relaxation Massage Therapy', 
  'FitLife Personal Training'
);

-- Delete seed users
DELETE FROM "User" 
WHERE "email" IN (
  'customer@example.com',
  'specialist@example.com', 
  'alice@example.com',
  'bob@example.com',
  'carol@stylist.com',
  'david@massage.com',
  'eva@fitness.com'
);

-- Reset any auto-increment sequences if needed
-- (PostgreSQL automatically handles this)

SELECT 'Seed data cleared successfully!' as message;