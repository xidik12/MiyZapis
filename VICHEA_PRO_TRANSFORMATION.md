# VicheaPro Transformation Plan

## Project Overview
Transform MiyZapis (Ukrainian booking platform) into VicheaPro (Cambodian booking platform)

## Major Changes

### 1. Business Model Transformation
**Current:** Individual specialists only
**New:** Individual specialists + Business accounts (clinics, salons, etc.)

#### Business Account Features:
- Multi-employee management
- Centralized dashboard for business owner
- Employee roles and permissions
- Consolidated revenue tracking
- Business-level settings and branding
- Employee schedule management
- Service assignment per employee

#### Database Schema Changes:
```prisma
model Business {
  id                String   @id @default(cuid())
  name              String
  description       String?
  descriptionKh     String?  // Khmer description
  type              String   // SALON, CLINIC, SPA, etc.

  // Owner
  ownerId           String
  owner             User     @relation(fields: [ownerId], references: [id])

  // Business details
  logo              String?
  coverImage        String?
  address           String
  city              String
  phoneNumber       String
  email             String
  website           String?

  // Settings
  timezone          String   @default("Asia/Phnom_Penh")
  currency          String   @default("USD")
  language          String   @default("km") // Khmer

  // Working hours (for whole business)
  workingHours      String   // JSON

  // Employees
  employees         Employee[]
  services          Service[]
  bookings          Booking[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Employee {
  id                String   @id @default(cuid())
  businessId        String
  business          Business @relation(fields: [businessId], references: [id])

  userId            String?  // Link to User if they have an account
  user              User?    @relation(fields: [userId], references: [id])

  // Employee details
  firstName         String
  lastName          String
  email             String?
  phoneNumber       String?
  avatar            String?

  // Role & Permissions
  role              String   @default("EMPLOYEE") // EMPLOYEE, MANAGER
  canManageBookings Boolean  @default(true)
  canManageServices Boolean  @default(false)

  // Schedule
  workingHours      String   // JSON - can override business hours
  isActive          Boolean  @default(true)

  // Services they provide
  services          Service[]
  bookings          Booking[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 2. Payment Methods
**Remove:**
- ✗ Crypto (Coinbase Commerce)
- ✗ PayPal
- ✗ WayForPay

**Add:**
- ✓ ABA Bank (Cambodia's leading mobile banking)
- ✓ Cash payment on arrival
- ✓ Keep wallet system

**ABA Integration:**
- ABA PayWay API
- QR code payment
- Deep linking to ABA mobile app

### 3. Branding Changes
**Name:** MiyZapis → VicheaPro
**Meaning:** "Vichea" (វិជ្ជា) = Professional/Expertise in Khmer

**Colors:**
- Primary: #C8102E (Red - from Cambodian flag)
- Secondary: #FFD700 (Gold - represents temples)
- Accent: #003893 (Blue - from Cambodian flag)
- Background: Light cream/beige for elegance

**Logo Concept:**
- Incorporate Angkor Wat silhouette or Khmer artistic patterns
- Modern, clean design with traditional elements
- Professional and trustworthy feel

### 4. UI/UX Redesign for Cambodia

**Cultural Elements:**
- Khmer script support (primary language)
- English as secondary language
- Traditional Khmer patterns as decorative elements
- Respect for hierarchy and formality
- Family-oriented messaging

**Currency:**
- USD (primary - widely used in Cambodia)
- KHR (Cambodian Riel) as secondary option
- Display both currencies with toggle

**Localization:**
- Date format: DD/MM/YYYY (European style used in Cambodia)
- Time format: 24-hour preferred
- Phone format: +855 (Cambodia country code)
- Address format: Cambodian structure (Sangkat, Khan, City)

### 5. Language Support
**Languages:**
1. Khmer (ភាសាខ្មែរ) - Primary
2. English - Secondary
3. Remove: Ukrainian, Russian

**Translation Keys to Update:**
- All UI strings
- Email templates
- SMS notifications
- Error messages

### 6. Business Types for Cambodia
```typescript
enum BusinessType {
  SALON = 'Hair Salon / Barbershop'
  SPA = 'Spa & Massage'
  CLINIC = 'Medical Clinic'
  DENTAL = 'Dental Clinic'
  FITNESS = 'Gym & Fitness Center'
  BEAUTY = 'Beauty Salon'
  WELLNESS = 'Wellness Center'
  AUTOMOTIVE = 'Auto Repair & Service'
  RESTAURANT = 'Restaurant'
  EDUCATION = 'Education & Training'
}
```

## Implementation Phases

### Phase 1: Database & Backend (Current)
1. Create Business and Employee models
2. Update User model to support business owners
3. Modify Service model to link to Business/Employee
4. Update Booking model to handle business bookings
5. Create business management APIs
6. Create employee management APIs

### Phase 2: Payment Integration
1. Remove crypto payment files
2. Remove PayPal integration
3. Remove WayForPay integration
4. Integrate ABA PayWay API
5. Update payment flow UI
6. Add cash payment option

### Phase 3: Branding
1. Update app name throughout codebase
2. Create new logo and favicon
3. Update color scheme (CSS variables)
4. Update manifest.json
5. Update meta tags and SEO

### Phase 4: UI/UX Redesign
1. Add Cambodian design elements
2. Update layout and components
3. Add Khmer font support
4. Redesign landing page
5. Update email templates

### Phase 5: Language & Localization
1. Add Khmer language to LanguageContext
2. Translate all strings to Khmer
3. Remove Ukrainian and Russian
4. Update date/time formatting
5. Update currency display

### Phase 6: Business Features
1. Business registration flow
2. Business dashboard
3. Employee management interface
4. Multi-employee scheduling
5. Business analytics

## Technical Details

### ABA PayWay Integration
```typescript
// ABA Payment Configuration
const ABA_CONFIG = {
  MERCHANT_ID: process.env.ABA_MERCHANT_ID,
  API_URL: 'https://checkout.payway.com.kh/api',
  PUBLIC_KEY: process.env.ABA_PUBLIC_KEY,
  CONTINUE_SUCCESS_URL: `${process.env.FRONTEND_URL}/payment/success`,
  CONTINUE_FAILURE_URL: `${process.env.FRONTEND_URL}/payment/failure`,
};
```

### Khmer Font
```css
@font-face {
  font-family: 'Khmer';
  src: url('/fonts/KhmerOS.ttf') format('truetype');
}

body {
  font-family: 'Khmer', 'Inter', sans-serif;
}
```

### Color Variables
```css
:root {
  --primary: #C8102E;
  --primary-dark: #A00D25;
  --secondary: #FFD700;
  --accent: #003893;
  --background: #FAF8F5;
  --text: #2C2C2C;
  --text-light: #6B6B6B;
}
```

## Files to Modify

### Remove/Replace:
- `/src/services/coinbase.service.ts` - DELETE
- `/src/services/paypal.service.ts` - DELETE
- `/src/services/wayforpay.service.ts` - DELETE
- `/src/components/payment/CryptoPayment.tsx` - DELETE
- `/src/components/payment/PayPalPayment.tsx` - DELETE

### Add:
- `/src/services/aba.service.ts` - CREATE
- `/src/components/payment/ABAPayment.tsx` - CREATE
- `/src/models/Business.ts` - CREATE
- `/src/models/Employee.ts` - CREATE
- `/src/pages/business/Dashboard.tsx` - CREATE
- `/src/pages/business/Employees.tsx` - CREATE

### Update:
- All language files
- All color variables
- Logo files
- Manifest and meta tags
- Database schema
- API endpoints

## Timeline Estimate
- Phase 1: 3-4 days
- Phase 2: 2-3 days
- Phase 3: 1-2 days
- Phase 4: 3-4 days
- Phase 5: 2-3 days
- Phase 6: 4-5 days

**Total: ~15-21 days**

## Notes
- Keep existing specialist functionality (backwards compatible)
- Businesses are essentially "super specialists" with employees
- Individual specialists can upgrade to business accounts
- All existing data should be migrated/preserved
