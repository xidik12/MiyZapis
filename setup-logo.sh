#!/bin/bash

# Logo Setup Script
# This script copies a single logo image to all necessary locations

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎨 Panhaha Logo Setup Script${NC}"
echo ""

# Check if logo file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Please provide the path to your logo image${NC}"
    echo ""
    echo "Usage: ./setup-logo.sh /path/to/your/logo.png"
    echo ""
    echo "Example: ./setup-logo.sh ~/Downloads/panhaha-logo.png"
    exit 1
fi

LOGO_FILE="$1"

# Check if file exists
if [ ! -f "$LOGO_FILE" ]; then
    echo -e "${RED}❌ Error: Logo file not found: $LOGO_FILE${NC}"
    exit 1
fi

# Get file extension
EXTENSION="${LOGO_FILE##*.}"
FILENAME=$(basename "$LOGO_FILE" ".$EXTENSION")

echo -e "${YELLOW}📁 Copying logo to all necessary locations...${NC}"
echo ""

# Web Frontend - Public directory
echo "📱 Web Frontend (frontend/public/):"
mkdir -p frontend/public/images

# Main logo (PNG)
cp "$LOGO_FILE" "frontend/public/logo.png" 2>/dev/null && echo "  ✅ logo.png" || echo "  ⚠️  logo.png (check permissions)"

# SVG version (if original is SVG, copy it; otherwise create a note)
if [ "$EXTENSION" = "svg" ]; then
    cp "$LOGO_FILE" "frontend/public/logo.svg" 2>/dev/null && echo "  ✅ logo.svg" || echo "  ⚠️  logo.svg"
    cp "$LOGO_FILE" "frontend/public/favicon.svg" 2>/dev/null && echo "  ✅ favicon.svg" || echo "  ⚠️  favicon.svg"
else
    # If PNG, copy as favicon too
    cp "$LOGO_FILE" "frontend/public/favicon.svg" 2>/dev/null && echo "  ⚠️  favicon.svg (PNG used, consider creating SVG version)" || true
fi

# Apple touch icon (iOS home screen)
cp "$LOGO_FILE" "frontend/public/apple-touch-icon.png" 2>/dev/null && echo "  ✅ apple-touch-icon.png" || echo "  ⚠️  apple-touch-icon.png"

# OG image (social media preview) - use same logo
cp "$LOGO_FILE" "frontend/public/og-image.png" 2>/dev/null && echo "  ✅ og-image.png" || echo "  ⚠️  og-image.png"

# Legacy favicon
cp "$LOGO_FILE" "frontend/public/favicon.ico" 2>/dev/null && echo "  ⚠️  favicon.ico (PNG used, consider creating ICO version)" || true

echo ""
echo "📱 Mobile App (BookingBotMobile/assets/):"
mkdir -p BookingBotMobile/assets

# App icon
cp "$LOGO_FILE" "BookingBotMobile/assets/icon.png" 2>/dev/null && echo "  ✅ icon.png" || echo "  ⚠️  icon.png"

# Adaptive icon (Android)
cp "$LOGO_FILE" "BookingBotMobile/assets/adaptive-icon.png" 2>/dev/null && echo "  ✅ adaptive-icon.png" || echo "  ⚠️  adaptive-icon.png"

# Splash screen icon
cp "$LOGO_FILE" "BookingBotMobile/assets/splash-icon.png" 2>/dev/null && echo "  ✅ splash-icon.png" || echo "  ⚠️  splash-icon.png"

# Favicon
cp "$LOGO_FILE" "BookingBotMobile/assets/favicon.png" 2>/dev/null && echo "  ✅ favicon.png" || echo "  ⚠️  favicon.png"

echo ""
echo -e "${GREEN}✅ Logo setup complete!${NC}"
echo ""
echo "📝 Notes:"
echo "  • All files have been copied from: $LOGO_FILE"
echo "  • If your logo is PNG, consider creating SVG versions for better scalability"
echo "  • For iOS/Android, ensure logo is 1024x1024px for best results"
echo "  • For favicon.ico, you may want to create a proper ICO file"
echo ""
echo "🚀 Next steps:"
echo "  1. Rebuild the web app: cd frontend && npm run build"
echo "  2. Rebuild mobile app: cd BookingBotMobile && npx expo prebuild --clean"
echo "  3. Test the logo in both web and mobile apps"

