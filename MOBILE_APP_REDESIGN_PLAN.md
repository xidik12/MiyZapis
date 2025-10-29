# Mobile App Redesign Plan - Panhaha

## Summary of Changes Made Today

### ✅ Completed Tasks

1. **Fixed Regular Login Authentication**
   - Issue: Mobile app login was failing with "Invalid credentials"
   - Root cause: Backend email verification check (now disabled)
   - Status: Login now works correctly with existing accounts

2. **Fixed Google Sign-In Backend Configuration**
   - Issue: Google Sign-In returning 500 error
   - Root cause: Missing `GOOGLE_CLIENT_ID` in backend environment
   - Fix: Added Google OAuth credentials to `.env`
   - File: `/backend/.env` (lines 83-86)

3. **Fixed Password Reset Feature**
   - Issue: Reset emails sending broken links (undefined URL)
   - Root cause: Missing `FRONTEND_URL` environment variable
   - Fix: Added `FRONTEND_URL=https://www.panhaha.com` to `.env`
   - File: `/backend/.env` (lines 61-62)

4. **Fixed CORS Configuration**
   - Issue: Production website blocked by CORS
   - Fix: Added `panhaha.com` to allowed origins
   - File: `/backend/.env` (line 59)

5. **Rebranded Email Templates**
   - Issue: All emails still saying "MiyZapis"
   - Fix: Replaced all instances with "Panhaha"
   - Files: All files in `/backend/src/services/email/`

### ⚠️ Pending Deployment to Railway

The following environment variables need to be added to your **Railway backend project**:

```bash
FRONTEND_URL=https://www.panhaha.com
GOOGLE_CLIENT_ID=173408809843-ejkso19cac792tu551b32rbj92ju4iio.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://www.panhaha.com/auth/google/callback
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:3004,http://localhost:3005,https://www.panhaha.com,https://panhaha.com
```

**Steps to Deploy:**
1. Go to Railway → Your backend service → Variables tab
2. Add the above variables
3. Railway will automatically redeploy
4. Once deployed, Google Sign-In and Password Reset will work correctly

---

## Mobile App Redesign Requirements

### 🎨 Design & Branding

#### Color Scheme (from website tailwind.config.js)
```
PRIMARY (Dark Navy Blue):
- Main: #1E40AF
- Light: #3B82F6
- Dark: #1E3A8A

SECONDARY (Bright Crimson Red):
- Main: #DC2626
- Light: #EF4444
- Dark: #B91C1C

ACCENT (Rich Gold - borders/outlines only):
- Main: #EAB308
- Light: #FACC15
- Dark: #CA8A04

NEUTRAL (Grays):
- Backgrounds: #FAFAFA (light) / #18181B (dark)
- Text: #18181B (light) / #FAFAFA (dark)
- Borders: #E4E4E7 (light) / #3F3F46 (dark)
```

#### Typography
- Primary Font: Inter
- Display Font: Space Grotesk
- Monospace: JetBrains Mono

### 🌓 Theme Support
- **Light Mode**: Default theme with white/light gray backgrounds
- **Dark Mode**: Dark theme with dark gray/black backgrounds
- Theme toggle in side drawer
- Persist theme preference in AsyncStorage

### 🧭 Navigation Structure

#### Replace Bottom Tabs with Side Drawer Navigation
The app currently uses bottom tabs but should use **drawer navigation only** (like the website's mobile sidebar).

**Drawer Structure:**

```
┌─────────────────────────────────┐
│ Panhaha                    [×]  │
├─────────────────────────────────┤
│ 👤 [User Avatar & Name]         │
│    [User Type Badge]            │
├─────────────────────────────────┤
│                                 │
│ 🏠 Home                         │
│ 📅 My Bookings                  │
│ 🔍 Search Services              │
│ ⭐ Favorites                    │
│                                 │
│ --- FOR SPECIALISTS ---         │
│ 📊 Dashboard                    │
│ 🗓️  Calendar                    │
│ 💼 My Services                  │
│ 👥 My Clients                   │
│ 💰 Earnings                     │
│                                 │
│ --- SETTINGS ---                │
│ ⚙️  Settings                    │
│ 🌓 Theme Toggle                 │
│ 🌍 Language                     │
│ 📱 Notifications                │
│ ℹ️  About                       │
│ 🚪 Logout                       │
└─────────────────────────────────┘
```

### 👥 Role-Based Features

#### Customer Role
**Screens:**
- Home (Browse Services)
- Search Services
- Service Detail
- Specialist Profile
- Book Appointment
- My Bookings
- Booking Detail
- Favorites
- Profile/Settings

#### Specialist Role
**Additional Screens:**
- Dashboard (Stats, Revenue, Bookings)
- Calendar (Availability Management)
- My Services (Service Management)
- My Clients (Client List)
- Earnings (Financial Overview)
- Add/Edit Service

#### Business Role (Future)
**Additional Screens:**
- Business Dashboard
- Team Management
- Multi-Specialist Calendar
- Business Analytics

### 📱 Missing Features to Add

Based on website comparison, these features are missing from mobile:

1. **Advanced Search & Filters**
   - Category filters
   - Location-based search
   - Price range filter
   - Rating filter
   - Availability filter

2. **Favorites/Wishlist**
   - Save favorite specialists
   - Save favorite services
   - Quick access from drawer

3. **Reviews & Ratings**
   - Write reviews after booking
   - View specialist reviews
   - Rating submission

4. **Wallet/Credits System**
   - View wallet balance
   - Add funds
   - Transaction history
   - Referral rewards

5. **Referral System**
   - Referral code sharing
   - Track referrals
   - Rewards tracking

6. **Notifications**
   - Push notifications
   - In-app notifications
   - Notification preferences

7. **Messaging** (if enabled)
   - Chat with specialists
   - Booking-related messages

8. **Specialist Features**
   - Availability management
   - Service management (CRUD)
   - Earnings dashboard
   - Client management
   - Calendar view

### 📋 Implementation Plan

#### Phase 1: Core Navigation & Theme (Week 1)
- [ ] Implement side drawer navigation
- [ ] Remove bottom tabs
- [ ] Create light/dark theme system
- [ ] Apply Panhaha color scheme
- [ ] Implement theme toggle

#### Phase 2: Role-Based Navigation (Week 1-2)
- [ ] Detect user role from auth state
- [ ] Show/hide menu items based on role
- [ ] Implement role-specific screens
- [ ] Add role switching (for multi-role users)

#### Phase 3: Customer Features (Week 2-3)
- [ ] Enhanced search with filters
- [ ] Favorites/Wishlist
- [ ] Reviews & Ratings
- [ ] Booking history improvements
- [ ] Profile enhancements

#### Phase 4: Specialist Features (Week 3-4)
- [ ] Specialist dashboard
- [ ] Calendar/Availability management
- [ ] Service management
- [ ] Earnings overview
- [ ] Client management

#### Phase 5: Advanced Features (Week 4-5)
- [ ] Wallet/Credits system
- [ ] Referral system
- [ ] Notifications
- [ ] Messaging (if enabled)
- [ ] Payment integration

#### Phase 6: Polish & Testing (Week 5-6)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Cross-device testing
- [ ] Bug fixes
- [ ] App store preparation

### 🎯 Priority Features (Start Here)

1. **Side Drawer Navigation** - Critical
2. **Light/Dark Theme** - Critical
3. **Panhaha Colors** - Critical
4. **Role-Based Navigation** - High
5. **Specialist Dashboard** - High
6. **Search Filters** - High
7. **Favorites** - Medium
8. **Reviews** - Medium

### 📝 Technical Notes

#### Navigation Library
- Use `@react-navigation/drawer` for side drawer
- Remove `@react-navigation/bottom-tabs`
- Keep stack navigation for screen transitions

#### Theme Implementation
- Create `ThemeContext` or use existing theme system
- Store theme preference with AsyncStorage
- Apply colors from Panhaha color scheme
- Support system theme detection

#### Color Configuration
Create a colors config file matching website:
```typescript
// colors.ts
export const colors = {
  light: {
    primary: '#1E40AF',
    secondary: '#DC2626',
    accent: '#EAB308',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#18181B',
    border: '#E4E4E7',
  },
  dark: {
    primary: '#3B82F6',
    secondary: '#EF4444',
    accent: '#FACC15',
    background: '#18181B',
    surface: '#27272A',
    text: '#FAFAFA',
    border: '#3F3F46',
  },
};
```

### 🚀 Next Steps

1. **Deploy backend changes to Railway** (immediate)
2. **Get user approval for redesign scope** (before starting)
3. **Create detailed UI mockups** (optional, for approval)
4. **Begin Phase 1 implementation** (side drawer + themes)
5. **Iterate based on feedback**

---

## Questions for User

1. **Timeline**: How quickly do you need this redesign completed?
2. **Priorities**: Which features are most critical for launch?
3. **Specialist Features**: Should we prioritize specialist or customer features first?
4. **Design Review**: Do you want to review mockups before implementation?
5. **Testing**: Can you test on your iPhone as features are completed?

---

**Document Created**: 2025-10-29
**Last Updated**: 2025-10-29
**Status**: Awaiting user approval to begin redesign
