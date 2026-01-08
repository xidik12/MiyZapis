# Release Build Guide for iOS

## Prerequisites
1. Ensure you have Xcode installed
2. Ensure you have a valid Apple Developer account
3. Ensure CocoaPods is installed: `sudo gem install cocoapods`

## Steps to Build Release Version

### 1. Clean Previous Builds
```bash
cd BookingBotMobile
rm -rf ios/build
rm -rf node_modules/.cache
```

### 2. Install Dependencies
```bash
npm install
cd ios
pod install
cd ..
```

### 3. Generate Native Project (if not already done)
```bash
npx expo prebuild --clean --platform ios
```

### 4. Configure Release Build in Xcode

1. Open `BookingBotMobile/ios/BookingBotMobile.xcworkspace` in Xcode
2. Select your project in the navigator
3. Select the "BookingBotMobile" target
4. Go to "Signing & Capabilities"
5. Select your Team and ensure "Automatically manage signing" is checked
6. Update Bundle Identifier if needed (currently: `com.panhaha.bookingbot`)

### 5. Build for Release

**Option A: Archive and Distribute (for App Store)**
1. In Xcode, select "Any iOS Device" or your connected device
2. Product → Archive
3. Wait for archive to complete
4. Distribute App → App Store Connect / Ad Hoc / Development

**Option B: Build and Run on Device**
1. Connect your iPhone via USB
2. Select your device in Xcode
3. Product → Scheme → Edit Scheme
4. Set "Build Configuration" to "Release"
5. Product → Run (or Cmd+R)

### 6. Important Notes for Release Builds

- **All dynamic imports have been replaced with static imports** - this ensures proper bundling
- **Environment variables** are configured in `app.json` under `extra`:
  - `apiUrl`: Production API URL
  - `wsUrl`: Production WebSocket URL
  - `environment`: "production"

### 7. Verify Release Build

After building, verify:
- ✅ App launches without errors
- ✅ All screens are accessible
- ✅ API calls work correctly
- ✅ Navigation works properly
- ✅ No console errors in release mode

### 8. Common Issues and Solutions

**Issue: "No script URL provided"**
- Solution: This shouldn't happen in release builds as JS is bundled. If it does, ensure you're building Release configuration, not Debug.

**Issue: White/blank screen**
- Solution: Check that all imports are static (no dynamic imports)
- Verify `index.js` and `App.tsx` are properly set up
- Check Metro bundler is NOT running when building release

**Issue: Native module errors**
- Solution: Ensure `pod install` was run in `ios/` directory
- Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)

**Issue: Missing screens**
- Solution: Verify all screens are exported and imported statically
- Check `DrawerNavigator.tsx` has all screen imports
- Rebuild: Product → Clean Build Folder, then rebuild

### 9. Build Configuration Checklist

- [ ] All dynamic imports replaced with static imports
- [ ] `app.json` has correct bundle identifier
- [ ] iOS signing configured correctly
- [ ] Release configuration selected in Xcode
- [ ] All dependencies installed (`npm install` and `pod install`)
- [ ] Native project generated (`npx expo prebuild`)

### 10. Testing Release Build

Before submitting to App Store:
1. Test on physical device (not simulator)
2. Test all major flows:
   - Authentication (login, register)
   - Navigation (all screens accessible)
   - API calls (services load correctly)
   - Real-time features (if applicable)
3. Test with poor network conditions
4. Test app after force-quit and restart

## Build Scripts

You can also use these npm scripts:
```bash
# Build iOS release
npm run ios -- --configuration Release

# Or use Expo CLI
npx expo run:ios --configuration Release
```

## Troubleshooting

If you encounter issues:
1. Check Xcode console for native errors
2. Check device logs: Window → Devices and Simulators → Select device → View Device Logs
3. Verify all native modules are properly linked
4. Ensure Reanimated and Worklets are properly initialized (check `App.tsx` has `import 'react-native-reanimated';` at top)

