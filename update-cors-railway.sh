#!/bin/bash

# Script to update CORS configuration for Railway deployment
echo "🔧 Updating CORS configuration for Railway..."

# Update CORS_ORIGIN environment variable on Railway
echo "Setting CORS_ORIGIN to include production domains..."
railway variables set CORS_ORIGIN="http://localhost:3000,http://localhost:5173,https://miyzapis.com,https://www.miyzapis.com,https://miyzapis-frontend-production.up.railway.app"

echo "✅ CORS configuration updated!"
echo ""
echo "🚀 Now redeploy your backend service:"
echo "   railway up"
echo ""
echo "🌐 Allowed origins:"
echo "   - http://localhost:3000 (local development)"
echo "   - http://localhost:5173 (Vite dev server)"
echo "   - https://miyzapis.com (production frontend)"
echo "   - https://www.miyzapis.com (production frontend with www)"
echo "   - https://miyzapis-frontend-production.up.railway.app (Railway frontend)"
