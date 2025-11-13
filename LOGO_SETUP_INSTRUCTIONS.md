# Logo Setup Instructions

## 🎨 Quick Setup

You have **one logo image**. Follow these steps to add it everywhere:

### Step 1: Run the Setup Script

```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot
./setup-logo.sh /path/to/your/logo.png
```

**Example:**
```bash
./setup-logo.sh ~/Downloads/panhaha-logo.png
./setup-logo.sh ~/Desktop/logo.png
```

The script will automatically copy your logo to:
- ✅ Web frontend (`frontend/public/`)
- ✅ Mobile app (`BookingBotMobile/assets/`)

### Step 2: Supported Formats

Your logo can be:
- **PNG** (recommended) - `.png`
- **SVG** (best for scalability) - `.svg`
- **JPG/JPEG** - `.jpg` or `.jpeg`

**Recommended:** Use PNG at 1024x1024px or larger for best quality.

### Step 3: After Running the Script

1. **Web Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Mobile App:**
   ```bash
   cd BookingBotMobile
   npx expo prebuild --clean
   npx expo run:ios  # or npx expo run:android
   ```

## 📁 Files Created

The script will create these files from your single logo:

### Web Frontend (`frontend/public/`)
- `logo.png` - Main logo
- `logo.svg` - Vector version (if original is SVG)
- `favicon.svg` - Browser favicon
- `apple-touch-icon.png` - iOS home screen icon
- `og-image.png` - Social media preview
- `favicon.ico` - Legacy favicon

### Mobile App (`BookingBotMobile/assets/`)
- `icon.png` - Main app icon
- `adaptive-icon.png` - Android adaptive icon
- `splash-icon.png` - Splash screen icon
- `favicon.png` - Web favicon

## 🎯 Manual Setup (Alternative)

If you prefer to do it manually:

1. **Copy to Web Frontend:**
   ```bash
   cp /path/to/your/logo.png frontend/public/logo.png
   cp /path/to/your/logo.png frontend/public/apple-touch-icon.png
   cp /path/to/your/logo.png frontend/public/og-image.png
   ```

2. **Copy to Mobile App:**
   ```bash
   cp /path/to/your/logo.png BookingBotMobile/assets/icon.png
   cp /path/to/your/logo.png BookingBotMobile/assets/adaptive-icon.png
   cp /path/to/your/logo.png BookingBotMobile/assets/splash-icon.png
   cp /path/to/your/logo.png BookingBotMobile/assets/favicon.png
   ```

## ✅ Verification

After setup, verify:

1. **Web:**
   - Logo appears in header
   - Favicon shows in browser tab
   - Logo appears on auth pages

2. **Mobile:**
   - App icon shows correctly
   - Splash screen displays logo
   - Adaptive icon works on Android

## 🐛 Troubleshooting

**Logo not showing?**
- Check file paths are correct
- Clear browser/app cache
- Verify file permissions
- Check browser console for 404 errors

**Logo looks blurry?**
- Use higher resolution (1024x1024px or larger)
- Use PNG format for better quality
- Consider SVG for perfect scalability

**Script doesn't work?**
- Make sure script is executable: `chmod +x setup-logo.sh`
- Check file path is correct
- Verify you have write permissions

---

**Ready?** Just run: `./setup-logo.sh /path/to/your/logo.png`

