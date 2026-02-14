# MiyZapis Admin API Test Results

**Test Date:** 2026-02-05T10:01:07.993Z

**API URL:** https://miyzapis-backend-production.up.railway.app

---

## Summary

| Endpoint | Status | Success |
|----------|--------|----------|
| Dashboard Stats (30d) | 200 | ✅ |
| User Analytics | 200 | ✅ |
| Booking Analytics | 200 | ✅ |
| Financial Analytics | 200 | ✅ |
| Referral Analytics | 200 | ✅ |
| System Health | 200 | ✅ |
| Audit Logs | 200 | ✅ |

---

## Detailed Results

### Dashboard Stats (30d)

**URL:** `/api/v1/admin/dashboard/stats?period=30d`

**Description:** Get overall dashboard statistics including user counts, bookings, revenue, and growth metrics

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "stats": {
    "overview": {
      "totalUsers": 30,
      "totalSpecialists": 10,
      "totalServices": 7,
      "totalBookings": 10,
      "totalRevenue": 360,
      "activeUsers": 10,
      "completedBookings": 3,
      "conversionRate": 33.33333333333333
    },
    "growth": {
      "newUsers": {
        "current": 10,
        "previous": 16,
        "growthRate": -37.5
      },
      "newBookings": {
        "current": 8,
        "previous": 2,
        "growthRate": 300
      },
      "revenue": {
        "current": 360,
        "previous": 0,
        "growthRate": 100
      }
    },
    "recentActivity": {
      "bookings": [
        {
          "id": "cml7p728z0001o60c2e3qig86",
          "customerId": "cmh4su75c0000pf0cyxu55fpc",
          "specialistId": "cmksamhv9001gpa0chqxjchz3",
          "serviceId": "cmksciosg002gpa0cvclpy4xy",
          "promoCodeId": null,
          "status": "PENDING",
          "scheduledAt": "2026-02-05T09:00:00.000Z",
          "duration": 150
... (truncated)
```

---

### User Analytics

**URL:** `/api/v1/admin/analytics/users?period=30d`

**Description:** Get detailed user analytics including registration trends, engagement stats, and geographic distribution

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "userTrends": [
    {
      "date": {},
      "userType": "CUSTOMER",
      "count": 4
    },
    {
      "date": {},
      "userType": "SPECIALIST",
      "count": 1
    },
    {
      "date": {},
      "userType": "SPECIALIST",
      "count": 1
    },
    {
      "date": {},
      "userType": "CUSTOMER",
      "count": 1
    },
    {
      "date": {},
      "userType": "SPECIALIST",
      "count": 2
    },
    {
      "date": {},
      "userType": "admin",
      "count": 1
    }
  ],
  "engagementStats": [
    {
      "_count": {
        "id": 4
      },
      "userType": "CUSTOMER"
    },
    {
      "_count": {
        "id": 5
      },
      "userType": "SPECIALIST"
    },
    {
      "_count": {
        "id": 1
      },
      "userType": "admin"
    }
  ],
  "geographicStats": [
    {
      "_count": {
        "id": 30
      },
      "timezone": "UTC"
    }
  ],
  "platformStats": []
}
```

---

### Booking Analytics

**URL:** `/api/v1/admin/analytics/bookings?period=30d`

**Description:** Get booking statistics including status distribution, trends, popular services, and peak hours

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "statusStats": [
    {
      "_count": {
        "id": 7
      },
      "_sum": {
        "totalAmount": 1220
      },
      "status": "PENDING"
    },
    {
      "_count": {
        "id": 1
      },
      "_sum": {
        "totalAmount": 120
      },
      "status": "COMPLETED"
    }
  ],
  "bookingTrends": [
    {
      "date": {},
      "status": "COMPLETED",
      "count": 1,
      "avg_amount": 120
    },
    {
      "date": {},
      "status": "PENDING",
      "count": 3,
      "avg_amount": 120
    },
    {
      "date": {},
      "status": "PENDING",
      "count": 1,
      "avg_amount": 120
    },
    {
      "date": {},
      "status": "PENDING",
      "count": 1,
      "avg_amount": 120
    },
    {
      "date": {},
      "status": "PENDING",
      "count": 1,
      "avg_amount": 120
    },
    {
      "date": {},
      "status": "PENDING",
      "count": 1,
      "avg_amount": 500
    }
  ],
  "popularServices": [
    {
      "_count": {
        "id": 7
      },
     
... (truncated)
```

---

### Financial Analytics

**URL:** `/api/v1/admin/analytics/financial?period=30d`

**Description:** Get financial data including revenue trends, payment methods, currency distribution, and top earners

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "revenueTrends": [
    {
      "date": {},
      "type": "FULL_PAYMENT",
      "total_amount": 360,
      "transaction_count": 3
    }
  ],
  "paymentMethodStats": [
    {
      "_count": {
        "id": 3
      },
      "_sum": {
        "amount": 360
      },
      "paymentMethodType": "cash"
    }
  ],
  "currencyStats": [
    {
      "_count": {
        "id": 3
      },
      "_sum": {
        "amount": 360
      },
      "currency": "USD"
    }
  ],
  "topEarningSpecialists": [
    {
      "id": "cmj0u6ptf0002o20canq8vxp6",
      "businessName": "hair-colorist",
      "firstName": "Khidayotullo",
      "lastName": "Salakhitdinov",
      "email": "info@incognitogeneration.com",
      "total_earnings": 360,
      "transaction_count": 3,
      "avg_transaction": 120
    }
  ],
  "refundStats": {
    "_count": {
      "id": 0
    },
    "_sum": {
      "amount": null
    },
    "refundRate": 0
  }
}
```

---

### Referral Analytics

**URL:** `/api/v1/admin/analytics/referrals`

**Description:** Get referral program performance including conversion rates, rewards distributed, and top referrers

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "referralAnalytics": {
    "overview": {
      "totalReferrals": 3,
      "completedReferrals": 0,
      "pendingReferrals": 3,
      "expiredReferrals": 0,
      "conversionRate": 0
    },
    "byType": {
      "SPECIALIST_TO_CUSTOMER": 1,
      "CUSTOMER_TO_CUSTOMER": 1,
      "CUSTOMER_TO_SPECIALIST": 1
    },
    "recentActivity": {
      "newReferrals": 0,
      "completedReferrals": 0
    },
    "topReferrers": []
  }
}
```

---

### System Health

**URL:** `/api/v1/admin/system/health`

**Description:** Get system health status including database, Redis, system metrics, and application metrics

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "healthChecks": [
    {
      "name": "Database",
      "status": "healthy",
      "responseTime": "good"
    },
    {
      "name": "Redis",
      "status": "healthy",
      "responseTime": "good"
    }
  ],
  "systemMetrics": {
    "uptime": 206524.869710288,
    "memory": {
      "rss": 150261760,
      "heapTotal": 60792832,
      "heapUsed": 57665856,
      "external": 3595565,
      "arrayBuffers": 554643
    },
    "cpuUsage": {
      "user": 73010158,
      "system": 13048489
    },
    "version": "v18.20.8",
    "platform": "linux",
    "environment": "production"
  },
  "appMetrics": {
    "totalUsers": 30,
    "activeUsers": 1,
    "totalBookings": 10,
    "todayBookings": 0
  },
  "timestamp": "2026-02-05T10:01:07.887Z",
  "overallStatus": "healthy"
}
```

---

### Audit Logs

**URL:** `/api/v1/admin/audit-logs`

**Description:** Get audit logs of administrative actions

**Status:** 200

**Success:** ✅

**Response Structure:**

```json
{
  "auditLogs": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalItems": 0,
    "itemsPerPage": 50,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

## API Endpoints Reference

### Analytics Endpoints

#### Dashboard Stats
```
GET /api/v1/admin/dashboard/stats?period={period}
```

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response includes:**
- Overview: Total users, specialists, services, bookings, revenue
- Growth metrics: New users, bookings, revenue with growth rates
- Recent activity: Latest bookings and user registrations
- Analytics: Category stats and top specialists

#### User Analytics
```
GET /api/v1/admin/analytics/users?period={period}&userType={type}
```

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `userType` (optional): `CUSTOMER`, `SPECIALIST`, `ADMIN`

**Response includes:**
- User registration trends over time
- Engagement statistics by user type
- Geographic distribution

#### Booking Analytics
```
GET /api/v1/admin/analytics/bookings?period={period}
```

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response includes:**
- Status distribution (pending, confirmed, completed, cancelled)
- Booking trends over time
- Popular services
- Peak hours analysis
- Revenue by category

#### Financial Analytics
```
GET /api/v1/admin/analytics/financial?period={period}
```

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response includes:**
- Revenue trends over time
- Payment method distribution
- Currency statistics
- Top earning specialists
- Refund analysis

#### Referral Analytics
```
GET /api/v1/admin/analytics/referrals
```

**Response includes:**
- Referral performance summary
- Conversion rates
- Rewards distributed
- Top referrers

### System Endpoints

#### System Health
```
GET /api/v1/admin/system/health
```

**Response includes:**
- Database health check
- Redis health check
- System metrics (uptime, memory, CPU)
- Application metrics (users, bookings)

#### Audit Logs
```
GET /api/v1/admin/audit-logs
```

**Response includes:**
- Administrative action logs
- Pagination information

### Management Endpoints

#### User Management
```
POST /api/v1/admin/users/manage
```

**Body:**
```json
{
  "action": "activate|deactivate|delete",
  "userIds": ["uuid1", "uuid2"]
}
```

#### Referral Cleanup
```
POST /api/v1/admin/referrals/cleanup-expired
```

**Response includes:**
- Number of expired referrals cleaned up

### Authentication

All admin endpoints require:

1. **Authentication:** Bearer token in Authorization header
2. **Authorization:** User must have admin role (`userType: "ADMIN"` or `"admin"`)

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

