# Troubleshooting Guide

## If screens are missing or errors persist:

### 1. Clear Metro Bundler Cache
```bash
cd BookingBotMobile
npx expo start --clear
```

### 2. Clear Node Modules and Reinstall
```bash
cd BookingBotMobile
rm -rf node_modules package-lock.json
npm install
```

### 3. Clear iOS Build Cache (if using Xcode)
```bash
cd BookingBotMobile/ios
rm -rf Pods Podfile.lock
pod install
```

### 4. Rebuild Native Project
```bash
cd BookingBotMobile
npx expo prebuild --clean
```

### 5. Verify All Screens Exist
All screens should be in:
- `src/screens/customer/`: ReferralsScreen.tsx, WalletScreen.tsx, MessagesScreen.tsx
- `src/screens/specialist/`: ScheduleScreen.tsx, LoyaltyScreen.tsx, AnalyticsScreen.tsx, ReferralsScreen.tsx, WalletScreen.tsx, MessagesScreen.tsx

### 6. Check Navigation Registration
All screens are registered in:
- `src/navigation/DrawerNavigator.tsx` - Drawer screens
- `src/navigation/AppNavigator.tsx` - Stack screens (ServiceDetail, SpecialistProfile)

### 7. Common Errors Fixed:
- ✅ SpecialistProfileScreen: Fixed `firstName` undefined error
- ✅ MessagesScreen: Fixed `participantName` undefined error
- ✅ DrawerNavigator: Fixed userType type mismatch
- ✅ RegisterScreen: Added missing Alert import

### 8. If Still Having Issues:
1. Stop Metro bundler (Ctrl+C)
2. Clear watchman: `watchman watch-del-all`
3. Clear Metro cache: `rm -rf /tmp/metro-*`
4. Restart Metro: `npx expo start --clear`
5. Rebuild app in Xcode

