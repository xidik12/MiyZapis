#!/bin/bash
# Script to run Prisma migrations on NEW Panhaha Railway database

echo "🚀 Running Prisma migrations on Panhaha database..."
echo ""

# Run migrations on NEW Panhaha database
DATABASE_URL="postgresql://postgres:hNAJSsKnZmhQDAKZJbvZmKIvEVnVbACA@yamabiko.proxy.rlwy.net:22742/railway" npx prisma migrate deploy

echo ""
echo "✅ Migrations completed!"
echo ""
echo "📝 IMPORTANT: Update Railway environment variables:"
echo "   DATABASE_URL=postgresql://postgres:hNAJSsKnZmhQDAKZJbvZmKIvEVnVbACA@yamabiko.proxy.rlwy.net:22742/railway"
echo "   REDIS_URL=redis://default:SPfDOFacFwXrYWFIPqwcFzTlWAWPKhFP@switchback.proxy.rlwy.net:59070"
echo ""
echo "🔄 Then restart your Railway backend service"
