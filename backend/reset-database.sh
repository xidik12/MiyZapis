#!/bin/bash

# Database Reset Script for MiyZapis Platform
# This script will completely reset your Railway database for production use

set -e  # Exit on error

echo "🚨 DATABASE RESET SCRIPT 🚨"
echo "=============================="
echo ""
echo "⚠️  WARNING: This will DELETE ALL data in your Railway database!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Database reset cancelled."
    exit 0
fi

echo ""
echo "📋 Step 1: Resetting database schema..."
DATABASE_URL="postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway" npx prisma db push --force-reset --accept-data-loss

echo ""
echo "📋 Step 2: Generating Prisma Client..."
DATABASE_URL="postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway" npx prisma generate

echo ""
echo "📋 Step 3: Seeding database with essential data..."
DATABASE_URL="postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway" npm run db:seed

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Verify database schema: npm run db:studio"
echo "   2. Create admin user: npm run railway:create-admin"
echo "   3. Start the server: npm start"
echo ""
