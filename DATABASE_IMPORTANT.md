# 🚨 CRITICAL DATABASE CONFIGURATION

## PostgreSQL ONLY - NO SQLite EVER

**IMPORTANT**: This project uses PostgreSQL for **ALL ENVIRONMENTS**:
- ✅ Development: PostgreSQL
- ✅ Production: PostgreSQL
- ❌ SQLite: **NEVER USED**

## Configuration Rules

### ✅ CORRECT Configuration
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# .env files
DATABASE_URL="postgresql://postgres:password@localhost:5432/bookingbot_dev"    # Development
DATABASE_URL="postgresql://postgres:xxx@host:5432/railway"                     # Production
```

### ❌ INCORRECT Configuration - DO NOT USE
```prisma
// NEVER USE THIS
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

```bash
# NEVER USE THIS
DATABASE_URL="file:./prisma/dev.db"
```

## Why PostgreSQL Only?

1. **Production Consistency**: Production uses PostgreSQL on Railway
2. **Feature Parity**: PostgreSQL features not available in SQLite
3. **Data Types**: Complex JSON fields, proper UUID support
4. **Performance**: Better query optimization and concurrent connections
5. **User Requirement**: Explicitly requested PostgreSQL for all environments

## Setup Instructions

Run the setup script to configure local PostgreSQL:
```bash
./setup-local-postgres.sh
```

## DO NOT CHANGE THIS CONFIGURATION

If you encounter database issues, debug them with PostgreSQL.
Do not switch to SQLite as a "quick fix" - it breaks production compatibility.

---

**Remember**: If anyone suggests changing the database provider to SQLite, 
direct them to this file and explain why PostgreSQL is required for ALL environments.