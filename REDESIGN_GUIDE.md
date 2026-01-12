# Panhaha Redesign Guide - MiyZapis Style

## Overview

This guide documents the redesign of Panhaha to match MiyZapis design patterns while maintaining all functionality and using Blue/Red colors instead of Blue/Yellow.

---

## Phase 1: Icon System Migration ✅ IN PROGRESS

### Current State
- **Panhaha**: Uses `@heroicons/react` (outline/solid variants)
- **MiyZapis**: Uses `phosphor-react` with custom wrapper components

### Installation Complete
```bash
✅ npm install phosphor-react
```

### Icon Component Structure

MiyZapis creates wrapper components for each icon with regular/fill variants:

**Example: CalendarIcon.tsx**
```typescript
import React from 'react';
import { Calendar, CalendarBlank } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const CalendarIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? Calendar : CalendarBlank;
  return <Icon className={className} weight={active ? 'fill' : 'regular'} />;
};
```

### Icon Mapping: Heroicons → Phosphor

| Heroicon | Phosphor Equivalent |
|----------|---------------------|
| CalendarIcon | Calendar |
| ClockIcon | Clock |
| PlusIcon | Plus |
| XMarkIcon | X |
| CheckIcon | Check |
| TrashIcon | Trash |
| PencilIcon | PencilSimple |
| ChevronLeftIcon | CaretLeft |
| ChevronRightIcon | CaretRight |
| ChevronDownIcon | CaretDown |
| ChevronUpIcon | CaretUp |
| UserIcon | User |
| EnvelopeIcon | Envelope |
| StarIcon | Star |
| HeartIcon | Heart |
| ChatBubbleLeftIcon | ChatCircle |
| MagnifyingGlassIcon | MagnifyingGlass |
| HomeIcon | House |
| BellIcon | Bell |
| CogIcon | Gear |
| ShieldCheckIcon | ShieldCheck |
| CreditCardIcon | CreditCard |
| WalletIcon | Wallet |

**Full icon mapping**: Create 100+ icon wrapper components in `/src/components/icons/`

---

## Phase 2: Design Pattern Updates

### 1. Border Radius Changes

**MiyZapis Pattern:**
```css
/* Buttons, cards, containers */
rounded-2xl  /* 1rem = 16px */

/* Modals, large panels */
rounded-3xl  /* 1.5rem = 24px */

/* Pills, badges */
rounded-full
```

**Current Panhaha:**
```css
rounded-lg   /* 14px */
rounded-xl   /* 18px */
```

**Action**: Update all components to use rounder corners

### 2. Shadow System

**MiyZapis Pattern:**
```css
/* Cards */
shadow-md hover:shadow-xl

/* Modals */
shadow-2xl

/* Buttons */
shadow-lg
```

**Specific Usage:**
- Review cards: `shadow-md hover:shadow-xl transition-shadow duration-300`
- Modals: `shadow-2xl`
- Floating elements: `shadow-lg`

### 3. Color Application

**MiyZapis uses:**
```css
/* Primary color (Sky Blue) */
bg-primary-500
text-primary-600
from-primary-500 to-primary-600

/* Secondary color (Yellow) */
bg-yellow-500
text-yellow-700
```

**Panhaha should use:**
```css
/* Primary color (Navy Blue) */
bg-primary-500  /* #1E40AF */
text-primary-600
from-primary-500 to-primary-600

/* Secondary color (Red) */
bg-secondary-500  /* #DC2626 */
text-secondary-600
from-secondary-500 to-secondary-600

/* Keep yellow for warnings/pending */
bg-yellow-500 (for status badges only)
```

### 4. Spacing & Layout

**MiyZapis Pattern:**
```css
/* Card padding */
p-6 pb-4

/* Section gaps */
gap-4 (default)
gap-6 (larger sections)

/* Margins */
mb-4 (default spacing)
mb-6 (section spacing)
```

---

## Phase 3: Component-Specific Designs

### Reviews Page

**MiyZapis Design:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
>
  {/* Avatar - Gradient if no image */}
  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
    <span className="text-white font-bold text-lg">{initial}</span>
  </div>

  {/* Stars */}
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(star => (
      <StarIcon
        className={`w-5 h-5 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
        active={star <= rating}
      />
    ))}
  </div>

  {/* Tags */}
  <span className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
    🏷️ {tag}
  </span>

  {/* Helpful button */}
  <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:scale-105 ${
    isHelpful
      ? 'bg-primary-100 text-primary-700'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`}>
    <HeartIcon className="w-4 h-4" active={isHelpful} />
    <span className="text-xs font-semibold">{count}</span>
  </button>
</motion.div>
```

### Schedule Page

**MiyZapis Design:**
```tsx
{/* Modal */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h2>

      {/* Input fields with rounded-xl */}
      <input
        type="date"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700"
      />

      {/* Grid layout for time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Time
          </label>
          <input type="time" className="w-full px-3 py-2 border rounded-xl..." />
        </div>
      </div>
    </div>
  </div>
</div>
```

### Bookings Page

**MiyZapis Design:**
```tsx
{/* Status badges */}
<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
  status === 'CONFIRMED'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : status === 'PENDING'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-green-100 text-green-800 border-green-200'
}`}>
  {status}
</span>

{/* Cards */}
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6">
  {/* Content */}
</div>
```

### Messages Page

**MiyZapis Design:**
Uses a custom `MessageInterface` component with:
- Rounded message bubbles: `rounded-2xl rounded-br-sm` (for sender)
- Avatar gradients
- Smooth animations
- Real-time updates

---

## Phase 4: Animation System

### Framer Motion Integration

MiyZapis uses `framer-motion` extensively:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Card entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1, duration: 0.3, ease: 'easeOut' }}
>

// Button interactions
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>

// List animations
<AnimatePresence>
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: i * 0.05 }}
    >
  ))}
</AnimatePresence>
```

---

## Implementation Checklist

### Icon System
- [ ] Create `/src/components/icons/` directory
- [ ] Create 100+ icon wrapper components
- [ ] Create index.ts export file
- [ ] Update all imports across codebase

### Design Updates
- [ ] Update tailwind.config.js border radius
- [ ] Verify shadow utilities
- [ ] Update color variables

### Page Updates
- [ ] Schedule page redesign
- [ ] Bookings page redesign
- [ ] Messages page redesign
- [ ] Reviews page redesign
- [ ] Update all other specialist pages
- [ ] Update all customer pages
- [ ] Update common pages

### Component Updates
- [ ] Avatar component (gradient fallback)
- [ ] Button components (hover effects)
- [ ] Card components (shadows)
- [ ] Modal components (rounded corners)
- [ ] Form inputs (rounded-xl)
- [ ] Badge/pill components

### Testing
- [ ] Visual regression testing
- [ ] Component functionality testing
- [ ] Dark mode verification
- [ ] Mobile responsiveness
- [ ] Animation performance

---

## Estimated Effort

- **Icon System**: 4-6 hours (100+ components)
- **Design Pattern Updates**: 2-3 hours
- **Component Library Updates**: 3-4 hours
- **Page Redesigns**: 8-10 hours (all pages)
- **Testing & QA**: 2-3 hours

**Total**: ~20-25 hours

---

## Next Steps

1. **Create Icon Component Generator Script** to automate icon wrapper creation
2. **Update Core Components** (Avatar, Button, Card, Modal)
3. **Redesign Priority Pages** (Schedule, Bookings, Messages, Reviews)
4. **Systematic Update** of remaining pages
5. **Visual QA** and refinement

---

## Notes

- All functionality MUST remain identical
- Color scheme: Blue (#1E40AF) + Red (#DC2626) + Gold accents
- Design inspiration: MiyZapis (Sky Blue + Yellow)
- Icons: Phosphor (replacing Heroicons)
- Animations: Framer Motion (already installed)
- Border radius: Larger/rounder (rounded-2xl, rounded-3xl)
- Shadows: More prominent (shadow-md → shadow-xl on hover)
