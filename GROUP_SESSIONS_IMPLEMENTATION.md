# Group Sessions Implementation Plan

## Overview
Add support for group bookings where multiple customers can book the same time slot for services like yoga classes, art classes, etc.

## Database Changes ✅ COMPLETED

### Services Table
- `isGroupSession` BOOLEAN (default false) - Whether service supports group bookings
- `maxParticipants` INTEGER (nullable) - Max participants (NULL = unlimited)
- `minParticipants` INTEGER (default 1) - Minimum participants required

### Bookings Table
- `participantCount` INTEGER (default 1) - Number of participants in this booking
- `groupSessionId` TEXT (nullable) - Links multiple bookings to same group session
  - Format: `{serviceId}_{timestamp}`

### Indexes Added
- `services(isGroupSession)`
- `bookings(groupSessionId)`
- `bookings(scheduledAt, serviceId)`

## Backend Changes

### 1. Group Session Utilities ✅ COMPLETED
File: `backend/src/utils/groupSessions.ts`
- `generateGroupSessionId()` - Create unique ID for group session
- `getAvailableSpots()` - Check available spots in group session
- `canAccommodateParticipants()` - Validate if booking can be accommodated
- `getGroupSessionBookings()` - Get all bookings for a session
- `logGroupSessionInfo()` - Logging helper

### 2. Booking Service Updates (IN PROGRESS)
File: `backend/src/services/booking/index.ts`

#### CreateBookingData Interface
```typescript
interface CreateBookingData {
  // ... existing fields
  participantCount?: number; // Number of participants (default 1)
}
```

#### createBooking() Method Changes
1. Fetch service with group session fields
2. Validate participant count:
   - If `isGroupSession = false`, participantCount must be 1
   - If `isGroupSession = true`, validate against maxParticipants
3. For group sessions:
   - Generate groupSessionId
   - Check available spots using `canAccommodateParticipants()`
   - Skip conflict check (multiple bookings allowed)
4. For individual sessions:
   - Keep existing conflict check logic
   - Ensure participantCount = 1
5. Create booking with:
   - `participantCount` field
   - `groupSessionId` for group sessions

### 3. API Endpoints
File: `backend/src/routes/bookings.ts`

Add new endpoints:
- `GET /bookings/group-sessions/:serviceId/:scheduledAt` - Get group session details
- `GET /services/:id/availability?date=YYYY-MM-DD` - Check available spots for group sessions

### 4. Service Controller Updates
File: `backend/src/controllers/services.ts`

Update service creation/update to include:
- `isGroupSession`
- `maxParticipants`
- `minParticipants`

## Frontend Changes

### 1. Service Form Component
File: `frontend/src/components/specialist/ServiceForm.tsx`

Add fields:
- Checkbox: "This is a group session"
- Number input: "Maximum participants" (shown if group session)
- Number input: "Minimum participants" (shown if group session)

### 2. Booking Form Component
File: `frontend/src/components/booking/BookingForm.tsx`

For group sessions:
- Show available spots
- Add participant count selector
- Show pricing per participant vs total
- Display "Join [X] others in this session" if others booked

### 3. Service Display
Update service cards/details to show:
- "Group Session" badge
- "Up to [X] participants"
- Current availability: "[Y] spots left"

### 4. Specialist Dashboard
File: `frontend/src/pages/specialist/Bookings.tsx`

Group view for group sessions:
- Show all participants in one session together
- Display participant count
- List all customers in the session

## Example Use Cases

### Yoga Class
- isGroupSession: true
- maxParticipants: 20
- minParticipants: 5
- Multiple customers can book same 10:00 AM slot
- Shows "15 spots left" when 5 booked

### Art Workshop
- isGroupSession: true
- maxParticipants: 10
- minParticipants: 3
- Session runs only if 3+ participants book

### Personal Training
- isGroupSession: false
- One customer per time slot (existing behavior)

## Migration Status

✅ Database schema updated
✅ Migration applied to production
✅ Prisma schema updated
✅ Group session utilities created
🔄 Booking service updates (in progress)
⏳ API endpoints (pending)
⏳ Frontend components (pending)
⏳ Testing (pending)

## Next Steps

1. Complete booking service conflict check logic
2. Add group session endpoints
3. Update service CRUD operations
4. Create frontend components
5. Test end-to-end flow
6. Deploy and verify
