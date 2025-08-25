#!/bin/bash

# Setup Local PostgreSQL for BookingBot Development
# This ensures we use PostgreSQL in ALL environments (never SQLite)

echo "🐘 Setting up local PostgreSQL for BookingBot development..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing via Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "📦 Installing PostgreSQL..."
    brew install postgresql@15
    brew services start postgresql@15
else
    echo "✅ PostgreSQL is already installed"
fi

# Create database and user
echo "🔧 Setting up database..."

# Create development database
createdb bookingbot_dev 2>/dev/null || echo "⚠️  Database 'bookingbot_dev' might already exist"

# Create user (if needed)
psql postgres -c "CREATE USER postgres WITH PASSWORD 'password';" 2>/dev/null || echo "⚠️  User 'postgres' might already exist"

# Grant privileges
psql postgres -c "ALTER USER postgres CREATEDB;" 2>/dev/null
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE bookingbot_dev TO postgres;" 2>/dev/null

echo "✅ PostgreSQL setup complete!"

# Test connection
echo "🧪 Testing database connection..."
if psql "postgresql://postgres:password@localhost:5432/bookingbot_dev" -c "SELECT version();" &>/dev/null; then
    echo "✅ Database connection successful!"
    
    echo "🔄 Running database migrations..."
    cd "$(dirname "$0")/backend"
    
    # Generate Prisma client for PostgreSQL
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    # Push schema to database (creates tables without migrations)
    echo "📋 Creating database schema..."
    npx prisma db push
    
    # Optional: Seed database
    echo "🌱 Seeding database..."
    npm run db:seed 2>/dev/null || echo "⚠️  Seeding skipped (run 'npm run db:seed' manually if needed)"
    
    echo "🎉 Development database is ready!"
    echo ""
    echo "💾 Database URL: postgresql://postgres:password@localhost:5432/bookingbot_dev"
    echo "🔗 You can connect with: psql postgresql://postgres:password@localhost:5432/bookingbot_dev"
    
else
    echo "❌ Database connection failed. Please check PostgreSQL installation."
    echo "   Try: brew services restart postgresql@15"
    exit 1
fi