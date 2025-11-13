# Logo Integration Guide

## 🎨 New Logo Overview

The new Panhaha logo features a stylized letter "P" in blue gradients with professional figures and tools representing various services. This guide explains how to integrate it across the web and mobile applications.

## 📁 Required Logo Files

You need to provide the logo in the following formats and sizes:

### Web Frontend (`frontend/public/`)

1. **logo.png** - Primary logo (recommended sizes: 512x512px, 1024x1024px)
   - Used in headers, auth pages, and throughout the app
   - Should be transparent background PNG

2. **logo.svg** - Vector version (fallback)
   - Scalable vector format for crisp display at any size
   - Used as fallback if PNG fails to load

3. **favicon.svg** - Favicon (32x32px or scalable SVG)
   - Browser tab icon
   - Should be simplified version of logo

4. **favicon.ico** - Legacy favicon (16x16, 32x32, 48x48px)
   - For older browsers

5. **apple-touch-icon.png** - iOS home screen icon (180x180px)
   - Used when users add site to iOS home screen

6. **og-image.png** - Social media preview (1200x630px)
   - Open Graph image for social sharing
   - Should include logo + branding

### Mobile App (`BookingBotMobile/assets/`)

1. **icon.png** - Main app icon (1024x1024px)
   - Used for iOS App Store and Android Play Store
   - Should be square with rounded corners (iOS will apply mask)

2. **adaptive-icon.png** - Android adaptive icon (1024x1024px)
   - Android adaptive icon foreground
   - Should be centered with safe zone (about 66% of canvas)

3. **splash-icon.png** - Splash screen icon (1024x1024px)
   - Shown during app startup
   - Should be centered on splash background

4. **favicon.png** - Web favicon (32x32px)
   - For web version of mobile app

## 🔧 Implementation Status

### ✅ Completed

1. **Logo Component Created** (`frontend/src/components/common/Logo.tsx`)
   - Reusable Logo component with size variants
   - LogoIcon component for icon-only display
   - Automatic fallback handling

2. **Web Components Updated**
   - ✅ `Header.tsx` - Main header logo
   - ✅ `AuthLayout.tsx` - Authentication pages logo
   - ✅ `MobileHeader.tsx` - Mobile header logo

### 📝 Still Need to Update

1. **Side Navigation** - Check if logo is used in sidebars
2. **Favicon & PWA Icons** - Update `index.html` and `vite.config.ts`
3. **Mobile App Icons** - Update `app.json` references
4. **Splash Screens** - Update mobile splash screen

## 🚀 Steps to Complete Integration

### Step 1: Add Logo Files

1. **Web Frontend:**
   ```bash
   # Place logo files in frontend/public/
   frontend/public/logo.png          # Main logo
   frontend/public/logo.svg          # Vector fallback
   frontend/public/favicon.svg      # Favicon
   frontend/public/favicon.ico      # Legacy favicon
   frontend/public/apple-touch-icon.png  # iOS icon
   frontend/public/og-image.png      # Social preview
   ```

2. **Mobile App:**
   ```bash
   # Place logo files in BookingBotMobile/assets/
   BookingBotMobile/assets/icon.png           # Main icon
   BookingBotMobile/assets/adaptive-icon.png  # Android adaptive
   BookingBotMobile/assets/splash-icon.png    # Splash screen
   BookingBotMobile/assets/favicon.png       # Web favicon
   ```

### Step 2: Update Configuration Files

#### Web Frontend (`frontend/vite.config.ts`)

Update PWA manifest icons:
```typescript
icons: [
  {
    src: 'logo.png',  // Changed from favicon.svg
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: 'logo.png',  // Changed from miyzapis_logo.png
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable'
  }
]
```

#### Web Frontend (`frontend/index.html`)

Update favicon reference:
```html
<link rel="icon" type="image/png" href="/logo.png" />
<!-- Keep SVG as fallback -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

Update structured data logo:
```html
"logo": "https://panhaha.com/logo.png"
```

#### Mobile App (`BookingBotMobile/app.json`)

Icons are already configured correctly - just replace the files:
- `icon.png` - Already referenced
- `adaptive-icon.png` - Already referenced  
- `splash-icon.png` - Already referenced
- `favicon.png` - Already referenced

### Step 3: Update Any Remaining Components

Check and update:
- Side navigation logos
- Footer logos
- Email templates (if any)
- PDF documents (if any)
- Social media assets

### Step 4: Test

1. **Web:**
   - Check logo displays in header
   - Check favicon in browser tab
   - Check PWA installation icon
   - Check social media preview (og-image)

2. **Mobile:**
   - Build app and check app icon
   - Check splash screen
   - Check adaptive icon on Android
   - Check favicon in web view

## 🎨 Logo Usage Guidelines

### Size Variants

The Logo component supports these sizes:
- `sm`: 32px - Mobile headers, compact spaces
- `md`: 48px - Default, standard headers
- `lg`: 64px - Auth pages, prominent displays
- `xl`: 96px - Landing pages, splash screens

### Usage Examples

```tsx
// Full logo with text and tagline
<Logo size="lg" showText showTagline />

// Logo with text only
<Logo size="md" showText />

// Icon only (compact)
<LogoIcon size={32} />

// Custom size icon
<LogoIcon size={64} className="my-custom-class" />
```

### Color Scheme

The logo should work with:
- **Light backgrounds**: Use full-color logo
- **Dark backgrounds**: Use full-color logo (should have good contrast)
- **Gradient backgrounds**: Use full-color logo
- **Monochrome contexts**: Consider providing a white/black variant

## 📱 Mobile App Specific Notes

### iOS App Icon
- Must be 1024x1024px PNG
- No transparency (iOS will add rounded corners)
- Keep important content in center (safe zone)
- Avoid text unless it's part of the logo design

### Android Adaptive Icon
- 1024x1024px PNG
- Foreground image (logo) should be centered
- Leave ~33% margin on all sides (safe zone)
- Background color configured in `app.json`

### Splash Screen
- 1024x1024px PNG
- Centered on splash background
- Background color: `#ffffff` (configured in `app.json`)

## 🔍 Current Logo References

### Web Frontend
- ✅ Header component (`Header.tsx`)
- ✅ Auth layout (`AuthLayout.tsx`)
- ✅ Mobile header (`MobileHeader.tsx`)
- ⚠️ Side navigation (check if logo is used)
- ⚠️ Footer (if exists)

### Mobile App
- ⚠️ App icon (`icon.png`)
- ⚠️ Adaptive icon (`adaptive-icon.png`)
- ⚠️ Splash screen (`splash-icon.png`)
- ⚠️ Favicon (`favicon.png`)

## ✅ Checklist

- [ ] Logo files created in all required sizes
- [ ] Logo files placed in correct directories
- [ ] Web favicon updated
- [ ] PWA manifest icons updated
- [ ] Mobile app icons replaced
- [ ] Splash screen icon replaced
- [ ] Social media preview image created
- [ ] All components using Logo component
- [ ] Tested on web (desktop + mobile)
- [ ] Tested on iOS app
- [ ] Tested on Android app
- [ ] Verified favicon displays correctly
- [ ] Verified PWA installation icon
- [ ] Verified social media preview

## 🐛 Troubleshooting

### Logo Not Displaying
1. Check file paths are correct
2. Check file names match exactly (case-sensitive)
3. Clear browser/app cache
4. Check browser console for 404 errors
5. Verify fallback is working (should show "P" letter)

### Logo Looks Blurry
1. Use PNG at 2x or 3x resolution for retina displays
2. Use SVG for scalable logos
3. Check image quality/sharpen if needed

### Favicon Not Updating
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Check favicon file is in `public/` directory
4. Verify HTML link tag is correct

## 📞 Support

If you encounter issues:
1. Check file paths and names
2. Verify file formats (PNG, SVG, ICO)
3. Check browser/app console for errors
4. Test fallback mechanism (should show "P" letter)

---

**Last Updated**: After logo component creation and header updates
**Status**: Ready for logo files to be added

