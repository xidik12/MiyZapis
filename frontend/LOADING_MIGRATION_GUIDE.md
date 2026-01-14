# Loading States Migration Guide

## Problem
The platform has inconsistent loading indicators appearing in different locations and with different designs across pages and modals.

## Solution
Use standardized `PageLoader` and `ContentLoader` components that always appear in the **exact middle of the screen** with uniform design.

## Components to Use

### 1. PageLoader - For Full Pages
Use when the entire page is loading.

```tsx
import { PageLoader } from '@/components/ui';

if (loading) {
  return <PageLoader text="Loading dashboard..." />;
}
```

### 2. ContentLoader - For Modals/Cards/Sections
Use when a section, modal, or card is loading.

```tsx
import { ContentLoader } from '@/components/ui';

{loading ? (
  <ContentLoader text="Loading data..." />
) : (
  <YourContent />
)}
```

## Anti-Patterns to Replace

### ❌ WRONG: Custom spinning div
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
```

### ✅ CORRECT: PageLoader
```tsx
if (loading) {
  return <PageLoader text="Loading..." />;
}
```

---

### ❌ WRONG: Text with custom styling
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
```

### ✅ CORRECT: PageLoader with text
```tsx
if (loading) {
  return <PageLoader text="Loading..." />;
}
```

---

### ❌ WRONG: LoadingSpinner in custom div
```tsx
if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
```

### ✅ CORRECT: PageLoader
```tsx
if (isLoading) {
  return <PageLoader />;
}
```

---

### ❌ WRONG: Loading in modal body
```tsx
<Modal>
  <div className="p-8">
    {loading ? (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    ) : (
      <ModalContent />
    )}
  </div>
</Modal>
```

### ✅ CORRECT: ContentLoader
```tsx
<Modal>
  <div className="p-8">
    {loading ? (
      <ContentLoader minHeight="300px" />
    ) : (
      <ModalContent />
    )}
  </div>
</Modal>
```

## Files That Need Updating

Run this command to find all files with custom loading states:

```bash
grep -r "animate-spin\|Loading\.\.\.\|loading\.\.\." frontend/src/pages --include="*.tsx" -l
```

### Priority Files to Update:

1. ✅ **frontend/src/pages/SpecialistProfilePage.tsx** - DONE
2. ✅ **frontend/src/pages/admin/AdminDashboard.tsx** - DONE
3. ✅ **frontend/src/pages/customer/Badges.tsx** - DONE
4. ✅ **frontend/src/pages/customer/Loyalty.tsx** - DONE
5. ✅ **frontend/src/pages/customer/Dashboard.tsx** - DONE
6. ✅ **frontend/src/pages/customer/Settings.tsx** - No page-level loading (only button states)
7. ✅ **frontend/src/pages/customer/Profile.tsx** - DONE (migrated inline loading to ContentLoader)
8. ✅ **frontend/src/pages/specialist/Bookings.tsx** - Already uses FullScreenHandshakeLoader
9. ✅ **frontend/src/pages/specialist/Settings.tsx** - No page-level loading (only button states)
10. ✅ **frontend/src/pages/specialist/Profile.tsx** - Already uses FullScreenHandshakeLoader
11. ✅ **frontend/src/pages/specialist/Loyalty.tsx** - DONE
12. ✅ **frontend/src/pages/booking/BookingFlow.tsx** - DONE
13. ✅ **frontend/src/pages/SearchPage.tsx** - Uses skeleton loaders (correct pattern)
14. ✅ **frontend/src/pages/auth/AuthCallbackPage.tsx** - DONE

## Migration Steps

### Step 1: Add Import
```tsx
import { PageLoader } from '@/components/ui';
// or
import { ContentLoader } from '@/components/ui';
```

### Step 2: Replace Loading State

**Before:**
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CustomLoadingDiv />
    </div>
  );
}
```

**After:**
```tsx
if (loading) {
  return <PageLoader text="Loading..." />;
}
```

### Step 3: Test
- Loading indicator appears in **exact middle of screen**
- Animation is smooth and consistent
- Text (if provided) appears below animation
- Dark mode works correctly

## Props Reference

### PageLoader Props
```tsx
interface PageLoaderProps {
  type?: 'spinner' | 'sandwatch' | 'magnifying-glass' | 'dots' | 'pulse';
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: string;
  className?: string;
}
```

**Defaults:**
- `type`: 'pulse'
- `size`: 'xl'
- `minHeight`: 'min-h-screen'

### ContentLoader Props
```tsx
interface ContentLoaderProps {
  type?: 'spinner' | 'sandwatch' | 'magnifying-glass' | 'dots' | 'pulse';
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: string;
  className?: string;
}
```

**Defaults:**
- `type`: 'dots'
- `size`: 'md'
- `minHeight`: '200px'

## Common Scenarios

### Scenario 1: Page with Loading State
```tsx
function MyPage() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <PageLoader text="Loading page..." />;
  }

  return <PageContent />;
}
```

### Scenario 2: Modal with Loading State
```tsx
function MyModal({ isOpen }) {
  const [loading, setLoading] = useState(true);

  return (
    <Modal isOpen={isOpen}>
      {loading ? (
        <ContentLoader text="Loading data..." />
      ) : (
        <ModalBody />
      )}
    </Modal>
  );
}
```

### Scenario 3: Card with Loading State
```tsx
function StatsCard() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="card p-6">
      {loading ? (
        <ContentLoader minHeight="150px" />
      ) : (
        <CardStats />
      )}
    </div>
  );
}
```

### Scenario 4: Search Results
```tsx
function SearchResults({ loading, results }) {
  if (loading) {
    return (
      <div className="py-12">
        <PageLoader
          type="magnifying-glass"
          text="Searching..."
          minHeight="400px"
        />
      </div>
    );
  }

  return <ResultsList results={results} />;
}
```

## Testing Checklist

After migrating, verify:

- [ ] Loading indicator appears in **exact middle** of container
- [ ] Animation is smooth (60fps)
- [ ] Design matches other loading states
- [ ] Dark mode works correctly
- [ ] Text appears below animation (if provided)
- [ ] No layout shift when loading completes
- [ ] Accessible (screen reader announces loading)

## Benefits

✅ **Consistency** - Same design everywhere
✅ **Predictability** - Always in middle of screen
✅ **Maintainability** - One place to update
✅ **Accessibility** - Built-in ARIA labels
✅ **Performance** - Optimized animations
✅ **DX** - Simple API, one import

## Migration Progress

Track migration progress:

```bash
# Count remaining custom loading states
grep -r "animate-spin\|min-h-screen.*flex.*items-center.*justify-center.*Loading" frontend/src/pages --include="*.tsx" | wc -l
```

Target: **0 custom loading states**

### ✅ MIGRATION COMPLETE!

**All page-level custom loading states have been migrated to use standardized components:**

**Migrated to PageLoader:**
- ✅ customer/Badges.tsx
- ✅ customer/Loyalty.tsx
- ✅ customer/Dashboard.tsx
- ✅ specialist/Loyalty.tsx
- ✅ booking/BookingFlow.tsx
- ✅ auth/AuthCallbackPage.tsx

**Migrated to ContentLoader:**
- ✅ customer/Profile.tsx (inline loyalty section loading)

**Already Using Correct Components:**
- ✅ SpecialistProfilePage.tsx
- ✅ admin/AdminDashboard.tsx
- ✅ specialist/Bookings.tsx (FullScreenHandshakeLoader)
- ✅ specialist/Profile.tsx (FullScreenHandshakeLoader)
- ✅ specialist/Schedule.tsx (FullScreenHandshakeLoader)

**No Page-Level Loading States (Button/Action States Only):**
- ✅ customer/Settings.tsx
- ✅ specialist/Settings.tsx

**Using Alternative Correct Patterns:**
- ✅ SearchPage.tsx (skeleton loaders)

**Result:** All loading indicators now appear in the **exact middle of the screen** with **uniform design** across the entire platform! 🎉

## Questions?

See:
- `frontend/src/components/ui/LOADING_GUIDE.md` - Full loading system docs
- `frontend/src/components/ui/PageLoader.tsx` - Component source
- `frontend/src/components/ui/ContentLoader.tsx` - Component source
- `frontend/src/components/ui/LoadingShowcase.tsx` - Live examples
