# Trial Period System Documentation

## Overview

The platform offers a **3-month free trial period** for all new users (both customers and specialists). This system automatically:

- Grants 3 months of free access upon registration
- Sends warning emails at 7 days and 3 days before trial expiration
- Automatically expires trials and sends notification emails
- Skips all fees during the trial period

## Features

### For Customers
- **No booking deposits** required during trial
- Full access to all platform features
- Book unlimited services with any specialist

### For Specialists
- **No platform fees** during trial (neither 20₴ per booking nor $10/month subscription)
- Build clientele and reputation risk-free
- Keep 100% of earnings during trial

## Implementation Details

### Database Schema

Trial fields in the `User` model:
```prisma
trialStartDate    DateTime?  // When trial started
trialEndDate      DateTime?  // When trial ends (3 months from start)
isInTrial         Boolean    // Quick check if user is in trial period
```

### Backend Services

1. **Email Templates** (`/src/services/email/templates.ts`)
   - `trialExpiringWarning`: Warning email (7 and 3 days before)
   - `trialExpired`: Expiration notification email
   - Available in English, Ukrainian, and Russian

2. **Email Service** (`/src/services/email/enhanced-email.ts`)
   - `sendTrialExpiringWarning(userId, language)`: Send warning email
   - `sendTrialExpired(userId, language)`: Send expiration email

3. **Trial Expiration Service** (`/src/services/trial-expiration.service.ts`)
   - `checkAndNotifySevenDayWarning()`: Check and notify 7-day warnings
   - `checkAndNotifyThreeDayWarning()`: Check and notify 3-day warnings
   - `checkAndExpireTrials()`: Check and expire trials
   - `runAllChecks()`: Run all checks together

4. **Payment Services**
   - **Booking Payment Service**: Automatically skips deposit payments for trial users
   - **Subscription Service**: Skips transaction fees for trial specialists

### Frontend Components

1. **Trial Status Banner** (`/frontend/src/components/trial/TrialStatusBanner.tsx`)
   - Displays remaining trial days
   - Shows urgency levels (low/medium/high)
   - Different messages for customers vs specialists
   - Link to trial info page

2. **Trial Info Page** (`/frontend/src/pages/TrialInfoPage.tsx`)
   - Comprehensive trial information
   - Benefits for customers and specialists
   - Progress tracker for authenticated users
   - Multi-language support

3. **Dashboard Integration**
   - Trial banner added to Customer Dashboard
   - Trial banner added to Specialist Dashboard

## Cron Job Setup

The trial expiration system requires scheduled jobs to run daily. Here are the setup options:

### Option 1: Using External Cron Service (Recommended for Production)

Services like **Railway**, **Vercel Cron**, **EasyCron**, or **cron-job.org** can call the endpoints daily.

#### Endpoints:

**Run all checks (recommended):**
```bash
POST https://your-api.com/api/v1/cron/trial-expiration-check
Headers:
  X-Cron-Secret: your-secret-key
```

**Individual endpoints:**
```bash
# 7-day warnings
POST https://your-api.com/api/v1/cron/seven-day-warnings
Headers: X-Cron-Secret: your-secret-key

# 3-day warnings
POST https://your-api.com/api/v1/cron/three-day-warnings
Headers: X-Cron-Secret: your-secret-key

# Expire trials
POST https://your-api.com/api/v1/cron/expire-trials
Headers: X-Cron-Secret: your-secret-key
```

#### Recommended Schedule:
- Run **once per day** at 9:00 AM server time
- Use the `/trial-expiration-check` endpoint (runs all checks)

### Option 2: Using node-cron (For Self-Hosted)

Install node-cron:
```bash
npm install node-cron
npm install @types/node-cron --save-dev
```

Create `/src/jobs/trial-cron.ts`:
```typescript
import cron from 'node-cron';
import { trialExpirationService } from '@/services/trial-expiration.service';
import { logger } from '@/utils/logger';

// Run every day at 9:00 AM
export function setupTrialExpirationCron() {
  cron.schedule('0 9 * * *', async () => {
    logger.info('Starting scheduled trial expiration checks');
    try {
      await trialExpirationService.runAllChecks();
      logger.info('Scheduled trial expiration checks completed');
    } catch (error) {
      logger.error('Scheduled trial expiration checks failed:', error);
    }
  });

  logger.info('Trial expiration cron job scheduled (daily at 9:00 AM)');
}
```

Then in your `server.ts` or `index.ts`:
```typescript
import { setupTrialExpirationCron } from './jobs/trial-cron';

// After server starts
setupTrialExpirationCron();
```

### Option 3: Railway Cron Jobs

Add to your Railway project:

1. Go to your Railway project settings
2. Add a new service with cron schedule
3. Set schedule to `0 9 * * *` (daily at 9:00 AM)
4. Set command:
```bash
curl -X POST https://your-api.com/api/v1/cron/trial-expiration-check \
  -H "X-Cron-Secret: ${CRON_SECRET}"
```

## Environment Variables

Add to your `.env` file:

```env
# Cron Job Security
CRON_SECRET=your-secure-random-secret-key

# Email Service (if not already configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=MiyZapis <noreply@miyzapis.com>

# Frontend URL (for email links)
FRONTEND_URL=https://miyzapis.com
```

Generate a secure CRON_SECRET:
```bash
# Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

### Manual Testing

Test the cron endpoints manually:

```bash
# Test 7-day warnings
curl -X POST http://localhost:3000/api/v1/cron/seven-day-warnings \
  -H "X-Cron-Secret: your-secret-key"

# Test 3-day warnings
curl -X POST http://localhost:3000/api/v1/cron/three-day-warnings \
  -H "X-Cron-Secret: your-secret-key"

# Test trial expiration
curl -X POST http://localhost:3000/api/v1/cron/expire-trials \
  -H "X-Cron-Secret: your-secret-key"

# Test all checks
curl -X POST http://localhost:3000/api/v1/cron/trial-expiration-check \
  -H "X-Cron-Secret: your-secret-key"

# Health check (no auth required)
curl http://localhost:3000/api/v1/cron/health
```

### Creating Test Users with Expiring Trials

Use Prisma Studio or direct database access to create test users:

```sql
-- User with trial expiring in 7 days
UPDATE users
SET
  "isInTrial" = true,
  "trialStartDate" = NOW() - INTERVAL '83 days',
  "trialEndDate" = NOW() + INTERVAL '7 days'
WHERE email = 'test-7days@example.com';

-- User with trial expiring in 3 days
UPDATE users
SET
  "isInTrial" = true,
  "trialStartDate" = NOW() - INTERVAL '87 days',
  "trialEndDate" = NOW() + INTERVAL '3 days'
WHERE email = 'test-3days@example.com';

-- User with expired trial
UPDATE users
SET
  "isInTrial" = true,
  "trialStartDate" = NOW() - INTERVAL '91 days',
  "trialEndDate" = NOW() - INTERVAL '1 day'
WHERE email = 'test-expired@example.com';
```

Then run the cron endpoint to trigger notifications.

## Monitoring

### Check Email Logs

Query email logs to see what notifications were sent:

```sql
SELECT
  recipient,
  subject,
  status,
  "sentAt"
FROM "EmailLog"
WHERE subject LIKE '%Trial%'
ORDER BY "sentAt" DESC
LIMIT 50;
```

### Check Trial Status

Query users in trial:

```sql
-- Users in trial
SELECT
  email,
  "firstName",
  "lastName",
  "userType",
  "trialStartDate",
  "trialEndDate",
  "isInTrial",
  EXTRACT(DAY FROM ("trialEndDate" - NOW())) as days_remaining
FROM users
WHERE "isInTrial" = true
ORDER BY "trialEndDate" ASC;

-- Recently expired trials
SELECT
  email,
  "firstName",
  "userType",
  "trialEndDate"
FROM users
WHERE
  "isInTrial" = false
  AND "trialEndDate" IS NOT NULL
  AND "trialEndDate" > NOW() - INTERVAL '7 days'
ORDER BY "trialEndDate" DESC;
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP configuration in `.env`
2. Check email service logs:
   ```typescript
   const stats = await emailService.getEmailStats(30);
   console.log(stats);
   ```
3. Verify email templates exist in `templates.ts`
4. Check spam folder in recipient email

### Cron Job Not Running

1. Verify CRON_SECRET matches in `.env` and cron service
2. Check cron service logs
3. Test endpoints manually with curl
4. Verify cron schedule syntax
5. Check server timezone settings

### Users Not Getting Expired

1. Check database: `SELECT * FROM users WHERE "isInTrial" = true AND "trialEndDate" < NOW();`
2. Run expiration check manually
3. Check service logs for errors
4. Verify database connection

## Security Considerations

1. **CRON_SECRET**: Use a strong, unique secret key
2. **IP Whitelist**: In production, consider IP whitelisting for cron endpoints
3. **Rate Limiting**: Add rate limiting to cron endpoints
4. **Logging**: Monitor cron job execution logs
5. **Alerts**: Set up alerts for failed cron jobs

## Next Steps

After deployment:

1. Set up cron jobs on your hosting platform
2. Monitor email delivery rates
3. Track trial conversion rates
4. Gather user feedback on trial experience
5. Consider A/B testing trial duration (3 vs 2 vs 1 month)

## Support

For issues or questions:
- Check logs: `tail -f logs/app.log | grep trial`
- Review email logs in database
- Test endpoints manually
- Contact dev team

---

**Last Updated**: January 2025
**Version**: 1.0.0
