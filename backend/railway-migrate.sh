#!/bin/bash
# Script to run Prisma migrations on Railway database

echo "🚀 Running Prisma migrations..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  exit 1
fi

npx prisma migrate deploy

echo ""
echo "✅ Migrations completed!"
echo "🔄 Restart your Railway backend service if needed"
