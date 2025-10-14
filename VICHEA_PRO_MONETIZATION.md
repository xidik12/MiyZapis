# VicheaPro Monetization System

## Overview
Comprehensive monetization features for the VicheaPro booking platform, designed for the Cambodian market.

## Business Model Summary

### Revenue Streams

#### 1. Customer Booking Fees
- **$1 per booking** charged to customers
- Applied to all completed bookings
- Covers platform operational costs

#### 2. Specialist Subscriptions
Individual specialists can choose from:
- **Monthly**: $10/month (Basic) or $30/month (Premium)
- **Yearly**: $100/year (Basic) or $300/year (Premium)
- **Commission**: 5% per booking (alternative to subscription)

#### 3. Business Subscriptions
Businesses (clinics, salons, spas) with multiple employees:
- **5% commission per booking** (only option for businesses)
- Unlimited employees
- Premium option available for featured listings

#### 4. Premium Listings
- Featured placement in search results
- Increased visibility and booking conversions
- Pricing tiers:
  - **Featured**: $20-60 (7-30 days)
  - **Sponsored**: $15-45 (7-30 days)
  - **Top Rated**: $10-30 (7-30 days)

#### 5. Advertisement Revenue
- Banner ads on service pages
- Sidebar ads in search results
- Pay-per-click model ($0.50 per click)
- Budget-based campaigns

### Referral Program

#### Customer Referrals
- Refer a customer: **$2 wallet credit**
- Refer a specialist: **$5 wallet credit**
- Credits can be used for booking payments

#### Specialist Referrals
- Specialists referring other specialists: **1 month free service**

---

## Database Schema

### Subscription Plans
```prisma
model SubscriptionPlan {
  id                String
  name              String
  nameKh            String // Khmer translation
  type              String // INDIVIDUAL_BASIC, INDIVIDUAL_PREMIUM, BUSINESS_BASIC, BUSINESS_PREMIUM
  userType          String // INDIVIDUAL, BUSINESS
  monthlyPrice      Float?
  yearlyPrice       Float?
  commissionRate    Float?
  isPremiumListing  Boolean
  maxServices       Int?
  maxEmployees      Int?
  // ... features and settings
}
```

### User Subscriptions
```prisma
model UserSubscription {
  id                String
  userId            String
  planId            String
  status            String // ACTIVE, CANCELLED, EXPIRED
  billingType       String // MONTHLY, YEARLY, COMMISSION
  premiumListingActive Boolean
  // ... billing and payment tracking
}
```

### Advertisements
```prisma
model Advertisement {
  id                String
  advertiserId      String
  type              String // SERVICE_PAGE_BANNER, SEARCH_SIDEBAR
  placement         String // TOP, SIDEBAR, BOTTOM
  title             String
  titleKh           String?
  // ... ad content and targeting
  dailyBudget       Float?
  totalBudget       Float?
  costPerClick      Float
  impressions       Int
  clicks            Int
  conversions       Int
  // ... schedule and status
}
```

### Premium Listings
```prisma
model PremiumListing {
  id                String
  specialistId      String
  type              String // FEATURED, SPONSORED, TOP_RATED
  boostMultiplier   Float // Search ranking boost
  priority          Int // Display order (1-10)
  price             Float
  billingType       String // ONE_TIME, WEEKLY, MONTHLY
  // ... schedule and performance tracking
}
```

### Platform Transactions
```prisma
model PlatformTransaction {
  id                String
  bookingId         String
  userId            String
  specialistId      String
  type              String // BOOKING_FEE, COMMISSION, AD_PAYMENT, PREMIUM_LISTING
  amount            Float
  status            String
  // ... settlement tracking
}
```

### Referral Rewards
```prisma
model ReferralReward {
  id                String
  referrerId        String
  referredId        String?
  type              String // CUSTOMER_REFERRAL, SPECIALIST_REFERRAL
  amount            Float // $2 or $5
  freeMonths        Int? // For specialist-to-specialist referrals
  status            String // PENDING, COMPLETED, EXPIRED
  // ... completion tracking
}
```

---

## API Endpoints

### Advertisement Management

#### Create Advertisement
```http
POST /api/v1/advertisements
Authorization: Bearer {token}

{
  "type": "SERVICE_PAGE_BANNER",
  "placement": "TOP",
  "title": "Premium Dental Services",
  "titleKh": "សេវាធ្មេញពិសេស",
  "description": "20% off for new patients",
  "linkUrl": "https://vichea-pro.com/dentist/123",
  "targetCategories": ["dental", "health"],
  "targetLocations": ["Phnom Penh"],
  "dailyBudget": 10,
  "totalBudget": 300,
  "costPerClick": 0.5,
  "startDate": "2025-10-15",
  "endDate": "2025-11-15"
}
```

#### Get Active Ads (Public)
```http
GET /api/v1/advertisements/public?type=SERVICE_PAGE_BANNER&category=dental&location=Phnom%20Penh
```

#### Track Ad Impression
```http
POST /api/v1/advertisements/{adId}/impression
```

#### Track Ad Click
```http
POST /api/v1/advertisements/{adId}/click
```

#### Get Ad Analytics
```http
GET /api/v1/advertisements/{adId}/analytics?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {token}
```

### Premium Listing Management

#### Create Premium Listing
```http
POST /api/v1/premium-listings
Authorization: Bearer {token}

{
  "type": "FEATURED",
  "category": "dental",
  "location": "Phnom Penh",
  "priority": 10,
  "price": 60,
  "billingType": "ONE_TIME",
  "startDate": "2025-10-15",
  "duration": 30
}
```

#### Get Active Premium Listings
```http
GET /api/v1/premium-listings/active?category=dental&location=Phnom%20Penh&limit=10
```

#### Check If Specialist Has Active Listing
```http
GET /api/v1/premium-listings/check/{specialistId}?category=dental
```

#### Track Premium Listing Performance
```http
POST /api/v1/premium-listings/{listingId}/impression
POST /api/v1/premium-listings/{listingId}/click
POST /api/v1/premium-listings/{listingId}/conversion
Body: { "bookingAmount": 50 }
```

#### Get Premium Listing Pricing
```http
GET /api/v1/premium-listings/pricing

Response:
{
  "FEATURED": {
    "ONE_TIME": { "7": 20, "14": 35, "30": 60 },
    "WEEKLY": 15,
    "MONTHLY": 50
  },
  "SPONSORED": {
    "ONE_TIME": { "7": 15, "14": 25, "30": 45 },
    "WEEKLY": 10,
    "MONTHLY": 35
  },
  "TOP_RATED": {
    "ONE_TIME": { "7": 10, "14": 18, "30": 30 },
    "WEEKLY": 8,
    "MONTHLY": 25
  }
}
```

---

## Implementation Status

### ✅ Completed

1. **Database Schema**
   - SubscriptionPlan model
   - UserSubscription model
   - Advertisement model with analytics
   - PremiumListing model with analytics
   - PlatformTransaction model for fee tracking
   - ReferralReward model for new wallet credit system

2. **Backend Services**
   - AdvertisementService with full CRUD and tracking
   - PremiumListingService with performance analytics
   - Seed script for subscription plans

3. **API Endpoints**
   - 15 advertisement endpoints
   - 14 premium listing endpoints
   - Authentication and authorization
   - Public endpoints for ad/listing display

4. **Routes Integration**
   - Added to main routes file
   - Proper middleware for authentication

### 🔄 In Progress

5. **Platform Fee Integration**
   - Update booking flow to charge $1 customer fee
   - Track platform fees in PlatformTransaction model
   - Calculate specialist commissions (5%)

6. **Referral System Update**
   - Implement new wallet credit rewards ($2/$5)
   - Specialist free month rewards
   - Update referral service logic

### 📋 Pending

7. **Frontend Components**
   - Ad display component for service pages
   - Premium listing badges in search results
   - Specialist ad management dashboard
   - Premium listing purchase flow
   - Referral dashboard with wallet credits

8. **Admin Dashboard**
   - Ad approval interface
   - Revenue analytics
   - Subscription management
   - Platform transaction reporting

9. **Payment Integration**
   - ABA Bank payment for Cambodia (replaces crypto/PayPal)
   - Subscription payment processing
   - Ad campaign billing
   - Premium listing checkout

10. **Analytics & Reporting**
    - Revenue dashboard
    - Ad performance metrics
    - Premium listing ROI tracking
    - Specialist earnings reports

---

## Subscription Plan Details

### Individual Basic ($10/month or $100/year)
- Unlimited services
- Standard listing in search
- Basic analytics
- Alternative: 5% commission per booking

### Individual Premium ($30/month or $300/year)
- Unlimited services
- **Premium listing** (featured in search)
- Priority support
- Advanced analytics
- Alternative: 5% commission per booking

### Business Basic (5% commission only)
- Unlimited employees
- Unlimited services per employee
- Standard listing
- Business analytics dashboard

### Business Premium (5% commission only)
- Unlimited employees
- Unlimited services
- **Premium listing** for business
- Custom branding
- Priority support
- Advanced business analytics

---

## Revenue Calculation Examples

### Example 1: Individual Specialist (Monthly Subscription)
- Subscription: $30/month (Premium)
- 50 bookings @ $40 each = $2,000 revenue
- Platform collects: $30 subscription + $50 customer fees (50 × $1)
- Specialist keeps: $2,000 (all booking revenue)

### Example 2: Individual Specialist (Commission)
- 50 bookings @ $40 each = $2,000 revenue
- Platform collects: $100 commission (5% of $2,000) + $50 customer fees
- Specialist keeps: $1,900

### Example 3: Business (Dental Clinic)
- 5 dentists, each doing 30 bookings/month @ $50 each
- Total revenue: 150 bookings × $50 = $7,500
- Platform collects: $375 commission (5% of $7,500) + $150 customer fees
- Business keeps: $7,125

### Example 4: Premium Listing
- Specialist purchases 30-day Featured listing: $60
- Listing generates 20 additional bookings @ $40 each = $800
- ROI: ($800 - $60) / $60 = 1,233% ROI

---

## Analytics Tracked

### Advertisement Analytics
- Impressions (views)
- Clicks
- Conversions (bookings)
- Click-through rate (CTR)
- Conversion rate
- Cost per conversion
- Total spend vs. budget
- Daily performance breakdown

### Premium Listing Analytics
- Impressions
- Clicks
- Conversions
- CTR
- Conversion rate
- Revenue generated
- Average booking value
- ROI calculation

### Platform Revenue Analytics
- Customer booking fees ($1 each)
- Specialist subscriptions (monthly/yearly)
- Business commissions (5%)
- Ad revenue (pay-per-click)
- Premium listing sales
- Total revenue by source
- Settlement tracking

---

## Next Steps

1. **Update Booking Service** - Add $1 platform fee logic
2. **Update Referral Service** - Implement new wallet credit system
3. **Build Frontend Components** - Ad display and premium listing UI
4. **Integrate ABA Payment** - Replace crypto/PayPal with ABA Bank
5. **Admin Dashboard** - Revenue management and ad approval
6. **Testing** - End-to-end monetization flow testing
7. **Documentation** - User guides for specialists and businesses

---

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma (updated with new models)
├── src/
│   ├── services/
│   │   ├── advertisement/
│   │   │   └── index.ts
│   │   └── premium-listing/
│   │       └── index.ts
│   ├── controllers/
│   │   ├── advertisements/
│   │   │   └── index.ts
│   │   └── premium-listings/
│   │       └── index.ts
│   ├── routes/
│   │   ├── advertisements.ts
│   │   ├── premium-listings.ts
│   │   └── index.ts (updated)
│   └── scripts/
│       └── seed-subscription-plans.ts

frontend/
└── src/
    └── components/
        ├── ads/
        │   └── AdBanner.tsx (to be created)
        └── premium/
            └── PremiumBadge.tsx (to be created)
```

---

## Notes

- All prices in USD (primary currency for Cambodia)
- KHR (Cambodian Riel) support to be added later
- Khmer language translations included in all models
- Analytics tracked daily for performance optimization
- Automatic budget exhaustion detection for ads
- Automatic expiry detection for premium listings
- Commission calculations handled in booking service
- Wallet credits usable for booking payments only
- Specialist free month rewards tracked separately
