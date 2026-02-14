-- SQL Script to Fix Admin Analytics Data Quality Issues
-- MiyZapis Backend - Admin Dashboard Fixes
-- Date: 2026-02-05

-- ============================================================================
-- FIX #1: Remove XSS Test Accounts (HIGH PRIORITY)
-- ============================================================================

-- First, let's see what accounts have XSS payloads
SELECT id, "firstName", "lastName", email, "userType", "createdAt"
FROM users
WHERE
  "firstName" LIKE '%<%' OR "firstName" LIKE '%>%'
  OR "lastName" LIKE '%<%' OR "lastName" LIKE '%>%'
  OR email LIKE '%testuser20%bt@gmail.com';

-- Delete XSS test accounts
DELETE FROM users
WHERE
  email LIKE '%testuser20%bt@gmail.com'
  OR "firstName" LIKE '%<%>%'
  OR "lastName" LIKE '%<%>%'
  OR "firstName" LIKE '<img%'
  OR "lastName" LIKE '<img%';

-- ============================================================================
-- FIX #2: Fix Empty Service Categories (MEDIUM PRIORITY)
-- ============================================================================

-- Check services with empty or NULL categories
SELECT id, name, category, "basePrice", currency
FROM services
WHERE category = '' OR category IS NULL;

-- Update empty categories to 'uncategorized'
UPDATE services
SET category = 'uncategorized'
WHERE category = '' OR category IS NULL;

-- ============================================================================
-- FIX #3: Standardize Category Names (MEDIUM PRIORITY)
-- ============================================================================

-- Map Cyrillic and non-standard categories to standard ones
-- Example: "Пекарь" -> "food-services"
UPDATE services
SET category = CASE
  WHEN category = 'Пекарь' THEN 'food-services'
  WHEN category = '' THEN 'uncategorized'
  ELSE category
END
WHERE category NOT IN (
  'hair-styling',
  'beauty-makeup',
  'education-tutoring',
  'language-lessons',
  'home-services',
  'health-fitness',
  'business-consulting',
  'technology',
  'manicure-pedicure',
  'hair-coloring',
  'massage-spa',
  'personal-training',
  'nutrition',
  'photography',
  'videography',
  'event-planning',
  'cleaning',
  'repairs-maintenance',
  'pet-care',
  'uncategorized'
);

-- ============================================================================
-- FIX #4: Add Database Constraints (PREVENTIVE)
-- ============================================================================

-- Ensure categories are not empty going forward
-- Note: This might fail if there are still empty categories
-- Run the UPDATE above first!

-- Add check constraint for non-empty category
ALTER TABLE services
DROP CONSTRAINT IF EXISTS category_not_empty;

ALTER TABLE services
ADD CONSTRAINT category_not_empty
CHECK (category IS NOT NULL AND category != '');

-- Add check constraint for valid names (no HTML tags)
ALTER TABLE users
DROP CONSTRAINT IF EXISTS name_no_html;

ALTER TABLE users
ADD CONSTRAINT name_no_html
CHECK (
  "firstName" !~ '<[^>]*>' AND
  "lastName" !~ '<[^>]*>'
);

-- ============================================================================
-- FIX #5: Data Cleanup - Remove Test/Invalid Data
-- ============================================================================

-- Find and review potentially invalid specialists
SELECT
  s.id,
  u."firstName",
  u."lastName",
  u.email,
  s."businessName",
  s."rating",
  s."reviewCount",
  (SELECT COUNT(*) FROM services WHERE "specialistId" = s.id) as service_count
FROM specialists s
JOIN users u ON s."userId" = u.id
WHERE
  s."businessName" = ''
  OR u."firstName" = ''
  OR u."lastName" = ''
ORDER BY s."createdAt" DESC;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify no XSS payloads remain
SELECT COUNT(*) as xss_accounts
FROM users
WHERE
  "firstName" LIKE '%<%' OR "firstName" LIKE '%>%'
  OR "lastName" LIKE '%<%' OR "lastName" LIKE '%>%';

-- Verify no empty categories
SELECT COUNT(*) as empty_categories
FROM services
WHERE category = '' OR category IS NULL;

-- Verify category distribution
SELECT
  category,
  COUNT(*) as service_count,
  AVG("basePrice") as avg_price,
  MIN("basePrice") as min_price,
  MAX("basePrice") as max_price
FROM services
GROUP BY category
ORDER BY service_count DESC;

-- Verify user data integrity
SELECT
  "userType",
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "isActive" = true) as active,
  COUNT(*) FILTER (WHERE "isActive" = false) as inactive
FROM users
GROUP BY "userType";

-- ============================================================================
-- OPTIONAL: Reset Test Data (USE WITH CAUTION!)
-- ============================================================================

-- Only run this in development/staging environments!
-- This will delete test bookings and users created during testing

/*
-- Delete test bookings (scheduled in the future with PENDING status)
DELETE FROM bookings
WHERE status = 'PENDING'
  AND "scheduledAt" > NOW()
  AND "customerId" IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%@gmail.com'
  );

-- Delete test users (created recently with minimal activity)
DELETE FROM users
WHERE
  "createdAt" > NOW() - INTERVAL '7 days'
  AND "userType" != 'admin'
  AND id NOT IN (
    SELECT "customerId" FROM bookings WHERE status = 'COMPLETED'
    UNION
    SELECT "specialistId" FROM bookings WHERE status = 'COMPLETED'
  );
*/

-- ============================================================================
-- POST-FIX VALIDATION
-- ============================================================================

-- Run these queries after applying fixes to ensure everything is correct

-- 1. Check for any remaining data quality issues
SELECT
  'Empty Categories' as issue,
  COUNT(*) as count
FROM services
WHERE category = '' OR category IS NULL
UNION ALL
SELECT
  'XSS in User Names' as issue,
  COUNT(*) as count
FROM users
WHERE "firstName" LIKE '%<%' OR "lastName" LIKE '%<%'
UNION ALL
SELECT
  'Empty Business Names' as issue,
  COUNT(*) as count
FROM specialists
WHERE "businessName" = '' OR "businessName" IS NULL
UNION ALL
SELECT
  'Invalid Emails' as issue,
  COUNT(*) as count
FROM users
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- 2. Summary statistics
SELECT
  'Total Users' as metric,
  COUNT(*)::text as value
FROM users
WHERE "isActive" = true
UNION ALL
SELECT
  'Total Specialists' as metric,
  COUNT(*)::text as value
FROM specialists s
JOIN users u ON s."userId" = u.id
WHERE u."isActive" = true
UNION ALL
SELECT
  'Total Services' as metric,
  COUNT(*)::text as value
FROM services
WHERE "isActive" = true
UNION ALL
SELECT
  'Total Bookings' as metric,
  COUNT(*)::text as value
FROM bookings;

-- ============================================================================
-- END OF SQL FIXES
-- ============================================================================

-- Notes:
-- 1. Test these queries in a staging environment first!
-- 2. Back up your database before running DELETE operations
-- 3. Review the results of SELECT queries before running UPDATE/DELETE
-- 4. The constraint additions might fail if data doesn't comply - fix data first
-- 5. Document any manual changes made outside of this script
