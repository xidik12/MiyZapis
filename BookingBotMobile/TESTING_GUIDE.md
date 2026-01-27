# Testing & Optimization Guide

## 📋 Table of Contents

1. [Performance Testing](#performance-testing)
2. [Manual Testing Checklist](#manual-testing-checklist)
3. [Performance Optimization](#performance-optimization)
4. [Memory Management](#memory-management)
5. [Bundle Size Analysis](#bundle-size-analysis)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## 🚀 Performance Testing

### Using Performance Monitoring Tools

The app includes built-in performance monitoring utilities in `src/utils/performance.ts`.

#### Measure Component Render Time

```typescript
import { useRenderTime } from '../utils/performance';

const MyComponent = () => {
  useRenderTime('MyComponent');

  return <View>...</View>;
};
```

#### Get Performance Report

```typescript
import { getPerformanceReport, printPerformanceReport } from '../utils/performance';

// In development console or debug screen
printPerformanceReport();
```

### Performance Targets

- **Screen Load Time:** < 1 second
- **Component Render Time:** < 16ms (60 FPS)
- **Scroll Performance:** 60 FPS consistently
- **Memory Usage:** < 200MB for typical usage
- **Bundle Size:** < 50MB

### Tools for Performance Testing

1. **React DevTools Profiler**
   - Identify slow renders
   - Find unnecessary re-renders
   - Measure component performance

2. **Flipper (React Native Debugger)**
   - Monitor network requests
   - Inspect Redux state
   - View layout hierarchy
   - Track memory usage

3. **Xcode Instruments (iOS)**
   - Profile CPU usage
   - Detect memory leaks
   - Measure energy impact

4. **Android Profiler (Android Studio)**
   - CPU profiling
   - Memory profiling
   - Network profiling

---

## ✅ Manual Testing Checklist

### Phase 1: Authentication & Onboarding

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Register new account (all user types: customer, specialist, business)
- [ ] Google Sign-In integration
- [ ] Forgot password flow
- [ ] Email validation
- [ ] Password strength validation
- [ ] Terms & conditions checkbox

### Phase 2: Customer Screens

#### Home Screen
- [ ] Hero gradient renders correctly
- [ ] Quick actions work (Book, Search, Favorites, Messages)
- [ ] Category pills are scrollable
- [ ] Featured services load with Skeleton
- [ ] Popular services grid displays correctly
- [ ] Pull-to-refresh works
- [ ] Empty state when no services
- [ ] Dark mode toggle

#### Search Screen
- [ ] Search input works
- [ ] Category filters work
- [ ] Grid/List view toggle
- [ ] Service cards display correctly
- [ ] Skeleton loading shows during fetch
- [ ] Empty state with "Clear Filters" action
- [ ] Pull-to-refresh works
- [ ] Navigation to ServiceDetail works

#### Dashboard
- [ ] Stats cards display correct data
- [ ] Quick actions navigate correctly
- [ ] Next appointment card shows correct info
- [ ] Recent bookings list works
- [ ] Favorite specialists scroll horizontally
- [ ] Pull-to-refresh updates data

#### Bookings
- [ ] Tab navigation (Upcoming/Completed/Cancelled)
- [ ] Booking cards show correct details
- [ ] Status badges display correctly
- [ ] Action buttons work (Cancel, Reschedule, Review)
- [ ] Empty state when no bookings
- [ ] Pull-to-refresh works

#### Favorites
- [ ] Tab navigation (Services/Specialists)
- [ ] Service cards display correctly
- [ ] Remove from favorites (💔 button) works
- [ ] Empty state when no favorites
- [ ] Pull-to-refresh works

#### Wallet
- [ ] Balance card with show/hide toggle
- [ ] Stats grid (Earned/Spent) shows correct amounts
- [ ] Transaction list displays correctly
- [ ] Color-coded transaction amounts (green/red)
- [ ] Pull-to-refresh updates balance

#### Messages
- [ ] Conversation list displays
- [ ] Unread badges show correct count
- [ ] Tap conversation opens chat
- [ ] Message bubbles display correctly (sent/received)
- [ ] Send message works
- [ ] KeyboardAvoidingView works on iOS/Android
- [ ] Search conversations works

### Phase 3: Specialist Screens

#### Dashboard
- [ ] Personalized greeting displays
- [ ] 4-stat grid shows correct data
- [ ] Quick actions navigate correctly
- [ ] Upcoming bookings list
- [ ] Completed bookings list
- [ ] Pull-to-refresh updates data

#### Calendar
- [ ] Week navigation (prev/next arrows)
- [ ] Horizontal week scroll works
- [ ] Day headers show booking count badges
- [ ] Booking cards display with status colors
- [ ] Tap booking shows details

#### Schedule
- [ ] Week navigation with Today badge
- [ ] Day cards display time blocks
- [ ] Color-coded borders (green/red)
- [ ] Add time block modal works
- [ ] Edit time block works
- [ ] Delete time block works
- [ ] Recurring schedule support

#### Analytics
- [ ] Period selector (Week/Month/Year)
- [ ] 4-stat grid updates with period
- [ ] Popular services list displays
- [ ] Monthly trends cards show data
- [ ] Charts render correctly (if implemented)

#### Earnings
- [ ] Earnings card with growth badge
- [ ] Transaction cards with emoji icons
- [ ] Period filters work
- [ ] Transaction list displays correctly
- [ ] Pull-to-refresh updates data

#### Reviews
- [ ] Stats card (Average, Total, Response Rate)
- [ ] Filter tabs with pending badge
- [ ] Review cards expand/collapse
- [ ] Specialist response functionality works
- [ ] Helpful button works
- [ ] Pull-to-refresh loads new reviews

#### My Services
- [ ] Service cards with images/emoji
- [ ] Category badge displays
- [ ] Duration display correct
- [ ] Edit button navigates to edit screen
- [ ] Delete button shows confirmation
- [ ] Add new service works

#### My Clients
- [ ] Client tier system (VIP/Regular/New)
- [ ] Client cards show booking stats
- [ ] Last booking timestamp
- [ ] Search functionality works
- [ ] Stats card shows correct totals

#### Employees (Business only)
- [ ] Employee cards with avatars
- [ ] Role badges display correctly
- [ ] Active status indicator (green dot)
- [ ] Add employee modal works
- [ ] Edit employee works
- [ ] Remove employee shows confirmation
- [ ] Search employees works

#### Loyalty
- [ ] Points balance displays
- [ ] Tier system with emojis (💎🏆🥇🥈🥉)
- [ ] Progress bar for next tier
- [ ] Reward cards display
- [ ] Redeem functionality works
- [ ] Transaction history (➕/➖ icons)

### Phase 4: Common Features

#### Profile Screen
- [ ] Avatar upload with camera button
- [ ] Image compression works
- [ ] Edit/Cancel toggle
- [ ] Editable fields update correctly
- [ ] Read-only email displays
- [ ] Quick action menu navigates correctly
- [ ] Logout shows confirmation dialog

#### Settings Screen
- [ ] Settings categories render
- [ ] Toggle switches work
- [ ] Language selection (English/Khmer)
- [ ] Theme selection (Light/Dark/System)
- [ ] Currency selection
- [ ] Notification preferences save
- [ ] Account management options work
- [ ] Logout functionality

#### Navigation Drawer
- [ ] Drawer opens/closes smoothly
- [ ] User info header displays
- [ ] Role badge shows correct color
- [ ] Notification badge shows unread count
- [ ] Active menu item highlighted
- [ ] All menu items navigate correctly
- [ ] Footer displays app version
- [ ] Dark mode adapts drawer colors

### Phase 5: Animations & Interactions

#### Haptic Feedback
- [ ] Button press haptic (light impact)
- [ ] Important actions haptic (medium impact)
- [ ] Errors haptic (notification)
- [ ] Success haptic (success)

#### Animations
- [ ] Button press scale animation (0.95)
- [ ] Card press scale animation (0.98)
- [ ] Skeleton shimmer gradient effect
- [ ] Pull-to-refresh animation
- [ ] Tab switch animation
- [ ] Modal slide-up animation
- [ ] Screen transition animation

#### Loading States
- [ ] Skeleton screens display correctly
- [ ] Skeleton shimmer animates smoothly
- [ ] Loading indicators show during fetch
- [ ] Empty states display when no data
- [ ] Error states show retry option

### Phase 6: i18n (Internationalization)

- [ ] Switch language to Khmer
- [ ] All screens show Khmer text
- [ ] No missing translation keys
- [ ] Fallback to English for missing keys
- [ ] Numbers format correctly (dates, currency)
- [ ] RTL layout support (if needed)

### Phase 7: Dark Mode

- [ ] Toggle dark mode in settings
- [ ] All screens adapt to dark mode
- [ ] Colors contrast properly
- [ ] Gradients adjust for dark mode
- [ ] Shadows/elevation visible
- [ ] Status bar updates (light/dark content)

### Phase 8: Edge Cases

- [ ] No internet connection (error handling)
- [ ] Slow network (loading states)
- [ ] Empty data (empty states)
- [ ] Very long text (truncation, wrapping)
- [ ] Large images (compression, placeholder)
- [ ] Deep linking (if implemented)
- [ ] Background/foreground transitions
- [ ] Notification tap navigation

---

## ⚡ Performance Optimization

### Component Optimization

#### Use React.memo for Pure Components

```typescript
import React, { memo } from 'react';

const MyComponent = memo(({ data }) => {
  return <View>...</View>;
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return prevProps.data === nextProps.data;
});
```

#### Use useMemo for Expensive Calculations

```typescript
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.date - a.date);
}, [data]);
```

#### Use useCallback for Event Handlers

```typescript
const handlePress = useCallback(() => {
  navigation.navigate('Details', { id });
}, [id, navigation]);
```

### List Optimization

#### FlatList Best Practices

```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  // Performance props
  removeClippedSubviews={true} // Unmount off-screen items
  maxToRenderPerBatch={10} // Render 10 items per batch
  updateCellsBatchingPeriod={50} // Update every 50ms
  windowSize={21} // Items to render outside visible area
  initialNumToRender={10} // Items to render initially
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })} // If items have fixed height
/>
```

#### Memoize List Items

```typescript
const ItemCard = memo(({ item }) => {
  return <Card>{item.name}</Card>;
});
```

### Image Optimization

- Use `expo-image` for better caching and performance
- Compress images before upload using `expo-image-manipulator`
- Use placeholder images during load
- Implement lazy loading for image grids

### Network Optimization

- Implement request caching
- Use pagination for large lists
- Debounce search inputs
- Cancel pending requests on unmount

---

## 💾 Memory Management

### Common Memory Leaks

1. **Event Listeners Not Removed**
   ```typescript
   useEffect(() => {
     const subscription = eventEmitter.addListener('event', handler);

     return () => {
       subscription.remove(); // Always cleanup!
     };
   }, []);
   ```

2. **Timers Not Cleared**
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => {}, 1000);

     return () => {
       clearTimeout(timer); // Always clear timers!
     };
   }, []);
   ```

3. **State Updates on Unmounted Components**
   ```typescript
   const isMounted = useIsMounted(); // Use our custom hook

   const fetchData = async () => {
     const data = await api.getData();

     if (isMounted()) {
       setData(data); // Only update if mounted
     }
   };
   ```

### Memory Profiling

Use Xcode Instruments or Android Profiler to:
- Detect memory leaks
- Track memory allocations
- Identify memory spikes
- Monitor heap size

---

## 📦 Bundle Size Analysis

### Check Bundle Size

```bash
# Build production bundle
npx expo export --platform ios
npx expo export --platform android

# Analyze bundle
du -sh dist/bundles/*
```

### Reduce Bundle Size

1. **Remove unused dependencies**
   ```bash
   npm prune
   npx depcheck
   ```

2. **Enable Hermes (iOS/Android)**
   ```json
   // app.json
   {
     "expo": {
       "jsEngine": "hermes"
     }
   }
   ```

3. **Use dynamic imports for large libraries**
   ```typescript
   const Charts = React.lazy(() => import('victory-native'));
   ```

4. **Optimize images**
   - Use WebP format
   - Compress images
   - Use appropriate sizes

---

## 🐛 Common Issues & Solutions

### Issue: Slow List Scrolling

**Solution:**
- Use `getItemLayout` for fixed height items
- Memoize list items with `React.memo`
- Reduce `windowSize` prop
- Enable `removeClippedSubviews`

### Issue: App Crashes on Older Devices

**Solution:**
- Reduce animations on low-end devices (check with `isLowEndDevice()`)
- Lower image quality (use `getOptimalImageQuality()`)
- Optimize memory usage
- Test on real devices, not just simulators

### Issue: Slow Screen Transitions

**Solution:**
- Use `InteractionManager.runAfterInteractions()`
- Defer heavy computations
- Optimize component render times
- Reduce animation complexity

### Issue: Memory Leaks

**Solution:**
- Always cleanup event listeners
- Clear timers in useEffect cleanup
- Use `useIsMounted()` hook
- Cancel network requests on unmount

### Issue: Large Bundle Size

**Solution:**
- Remove unused dependencies
- Enable Hermes engine
- Use code splitting
- Optimize images and assets

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| App Launch | < 3s | < 5s |
| Screen Load | < 1s | < 2s |
| List Scroll FPS | 60 | 50 |
| Memory Usage | < 200MB | < 300MB |
| Bundle Size (iOS) | < 30MB | < 50MB |
| Bundle Size (Android) | < 25MB | < 40MB |

### Monitoring Tools

- **Flipper:** Real-time performance monitoring
- **Reactotron:** Redux state inspection
- **Xcode Instruments:** iOS profiling
- **Android Profiler:** Android profiling
- **React DevTools:** Component profiling

---

## 🚦 Testing Sign-Off Checklist

Before considering Phase 10 complete:

- [ ] All manual tests pass
- [ ] Performance targets met
- [ ] No memory leaks detected
- [ ] Bundle size under target
- [ ] Error boundaries implemented
- [ ] Performance monitoring active
- [ ] Tested on physical devices (iOS + Android)
- [ ] Tested on low-end devices
- [ ] Dark mode works correctly
- [ ] i18n works for both languages
- [ ] All animations smooth (60 FPS)
- [ ] No console warnings/errors
- [ ] Tested offline scenarios
- [ ] Push notifications work
- [ ] Image compression works
- [ ] Haptic feedback works

---

*Last Updated: January 27, 2026*
*Testing Guide v1.0*
