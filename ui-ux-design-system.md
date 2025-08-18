# Booking Platform UI/UX Design System

## 1. Design System Foundation

### Brand Identity & Visual Language

**Brand Personality:**
- Professional yet approachable
- Trustworthy and reliable
- Modern and efficient
- Human-centered and inclusive

**Design Principles:**
1. **Clarity First**: Every interface element should have a clear purpose
2. **Trust Through Transparency**: Prices, policies, and processes should be transparent
3. **Efficiency**: Minimize steps to complete key tasks (booking, profile setup)
4. **Accessibility**: Design for all users, all devices, all abilities
5. **Consistency**: Maintain visual and interaction patterns across platforms

### Color Palette

**Primary Colors:**
```css
/* Primary Blue - Trust, professionalism */
--primary-50: #eff6ff
--primary-100: #dbeafe
--primary-200: #bfdbfe
--primary-300: #93c5fd
--primary-400: #60a5fa
--primary-500: #3b82f6  /* Main brand color */
--primary-600: #2563eb
--primary-700: #1d4ed8
--primary-800: #1e40af
--primary-900: #1e3a8a

/* Secondary Teal - Success, availability */
--secondary-50: #f0fdfa
--secondary-100: #ccfbf1
--secondary-200: #99f6e4
--secondary-300: #5eead4
--secondary-400: #2dd4bf
--secondary-500: #14b8a6  /* Main secondary color */
--secondary-600: #0d9488
--secondary-700: #0f766e
--secondary-800: #115e59
--secondary-900: #134e4a
```

**Semantic Colors:**
```css
/* Success - Bookings confirmed, payments successful */
--success-50: #f0fdf4
--success-500: #22c55e
--success-600: #16a34a

/* Warning - Pending actions, upcoming deadlines */
--warning-50: #fffbeb
--warning-500: #f59e0b
--warning-600: #d97706

/* Error - Failed actions, validation errors */
--error-50: #fef2f2
--error-500: #ef4444
--error-600: #dc2626

/* Info - General information, tips */
--info-50: #f0f9ff
--info-500: #06b6d4
--info-600: #0891b2
```

**Neutral Palette:**
```css
/* Gray scale for text, backgrounds, borders */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

### Typography System

**Font Stack:**
```css
/* Primary font - Inter for exceptional readability */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;

/* Headings font - Inter with slightly different weight distribution */
--font-headings: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;

/* Monospace for codes, IDs */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', monospace;
```

**Type Scale:**
```css
/* Display - Hero sections, landing page */
--text-display-lg: 4.5rem;    /* 72px */
--text-display-md: 3.75rem;   /* 60px */
--text-display-sm: 3rem;      /* 48px */

/* Headings */
--text-h1: 2.25rem;           /* 36px */
--text-h2: 1.875rem;          /* 30px */
--text-h3: 1.5rem;            /* 24px */
--text-h4: 1.25rem;           /* 20px */
--text-h5: 1.125rem;          /* 18px */
--text-h6: 1rem;              /* 16px */

/* Body text */
--text-lg: 1.125rem;          /* 18px */
--text-base: 1rem;            /* 16px */
--text-sm: 0.875rem;          /* 14px */
--text-xs: 0.75rem;           /* 12px */

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Font weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

**Base Unit: 4px**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Border Radius & Shadows

**Border Radius:**
```css
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;  /* 6px - Buttons, inputs */
--radius-lg: 0.5rem;    /* 8px - Cards, containers */
--radius-xl: 0.75rem;   /* 12px - Larger cards */
--radius-2xl: 1rem;     /* 16px - Modals, panels */
--radius-full: 9999px;  /* Pills, avatar */
```

**Shadow System:**
```css
/* Elevation shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Colored shadows for interactive elements */
--shadow-primary: 0 4px 14px 0 rgb(59 130 246 / 0.15);
--shadow-success: 0 4px 14px 0 rgb(34 197 94 / 0.15);
--shadow-error: 0 4px 14px 0 rgb(239 68 68 / 0.15);
```

## 2. Component Library

### Button Components

**Button Variants:**
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-500);
  color: white;
  border: 1px solid var(--primary-500);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-600);
  border-color: var(--primary-600);
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: var(--gray-300);
  border-color: var(--gray-300);
  cursor: not-allowed;
  transform: none;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 1px solid var(--primary-500);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
}

.btn-secondary:hover {
  background: var(--primary-50);
  border-color: var(--primary-600);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-lg);
}

.btn-xl {
  padding: var(--space-5) var(--space-10);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}
```

### Form Components

**Input Fields:**
```css
.input-base {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: white;
  transition: all 0.2s ease;
}

.input-base:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.input-base:invalid {
  border-color: var(--error-500);
}

.input-base:disabled {
  background: var(--gray-50);
  color: var(--gray-500);
  cursor: not-allowed;
}

/* Input with icon */
.input-with-icon {
  position: relative;
}

.input-with-icon input {
  padding-left: var(--space-10);
}

.input-with-icon .icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

/* Label styling */
.label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.label.required::after {
  content: " *";
  color: var(--error-500);
}

/* Error message */
.error-message {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--error-500);
}

/* Helper text */
.helper-text {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--gray-500);
}
```

**Select & Dropdown:**
```css
.select-base {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><polyline points='6,9 12,15 18,9'></polyline></svg>");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  background-size: 1rem;
  padding-right: var(--space-10);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background: var(--gray-50);
}

.dropdown-item.selected {
  background: var(--primary-50);
  color: var(--primary-600);
}
```

### Card Components

**Base Card:**
```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-100);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-100);
}

/* Specialist Card */
.specialist-card {
  position: relative;
  cursor: pointer;
}

.specialist-card .avatar {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.specialist-card .verified-badge {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: var(--success-500);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.specialist-card .rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--gray-600);
}

.specialist-card .price {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

/* Service Card */
.service-card {
  border-left: 4px solid var(--primary-500);
}

.service-card .duration {
  background: var(--gray-100);
  color: var(--gray-600);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

/* Booking Card */
.booking-card .status-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.booking-card .status-pending {
  background: var(--warning-50);
  color: var(--warning-600);
}

.booking-card .status-confirmed {
  background: var(--success-50);
  color: var(--success-600);
}

.booking-card .status-completed {
  background: var(--gray-100);
  color: var(--gray-600);
}

.booking-card .status-cancelled {
  background: var(--error-50);
  color: var(--error-600);
}
```

### Modal & Dialog Components

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal-content {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: between;
}

.modal-title {
  font-size: var(--text-h4);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Confirmation Dialog */
.confirmation-dialog .icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirmation-dialog .icon.warning {
  background: var(--warning-50);
  color: var(--warning-500);
}

.confirmation-dialog .icon.error {
  background: var(--error-50);
  color: var(--error-500);
}

.confirmation-dialog .icon.success {
  background: var(--success-50);
  color: var(--success-500);
}
```

### Navigation Components

**Header Navigation:**
```css
.header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  sticky: top 0;
  z-index: 40;
  backdrop-filter: blur(8px);
  background: rgb(255 255 255 / 0.95);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: between;
  height: 4rem;
}

.logo {
  font-size: var(--text-h5);
  font-weight: var(--font-bold);
  color: var(--primary-500);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.nav-link {
  color: var(--gray-600);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--primary-500);
}

.nav-link.active {
  color: var(--primary-500);
}

/* User dropdown */
.user-dropdown {
  position: relative;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.user-avatar:hover {
  border-color: var(--primary-500);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  min-width: 12rem;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--gray-700);
  text-decoration: none;
  font-size: var(--text-sm);
}

.user-dropdown-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.user-dropdown-item.danger {
  color: var(--error-600);
}

.user-dropdown-item.danger:hover {
  background: var(--error-50);
}
```

**Sidebar Navigation (Dashboard):**
```css
.sidebar {
  width: 16rem;
  background: white;
  border-right: 1px solid var(--gray-200);
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.sidebar-nav {
  padding: var(--space-4);
}

.sidebar-group {
  margin-bottom: var(--space-6);
}

.sidebar-group-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
  padding: 0 var(--space-3);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--gray-600);
  text-decoration: none;
  font-weight: var(--font-medium);
  margin-bottom: var(--space-1);
  transition: all 0.2s ease;
}

.sidebar-link:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.sidebar-link.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

.sidebar-link-badge {
  margin-left: auto;
  background: var(--gray-200);
  color: var(--gray-600);
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.sidebar-link.active .sidebar-link-badge {
  background: var(--primary-200);
  color: var(--primary-700);
}
```

### Calendar & Date Picker

```css
.calendar {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: var(--space-4);
}

.calendar-nav-btn {
  background: none;
  border: none;
  color: var(--gray-600);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.calendar-nav-btn:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

.calendar-month-year {
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
}

.calendar-day-header {
  padding: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gray-500);
  text-align: center;
  text-transform: uppercase;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all 0.15s ease;
}

.calendar-day:hover {
  background: var(--gray-100);
}

.calendar-day.selected {
  background: var(--primary-500);
  color: white;
}

.calendar-day.today {
  background: var(--primary-50);
  color: var(--primary-600);
  font-weight: var(--font-semibold);
}

.calendar-day.unavailable {
  color: var(--gray-300);
  cursor: not-allowed;
}

.calendar-day.has-bookings {
  position: relative;
}

.calendar-day.has-bookings::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--secondary-500);
  border-radius: 50%;
}

/* Time slot picker */
.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.time-slot {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.time-slot:hover {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.time-slot.selected {
  background: var(--primary-500);
  border-color: var(--primary-500);
  color: white;
}

.time-slot.unavailable {
  background: var(--gray-100);
  color: var(--gray-400);
  cursor: not-allowed;
}
```

### Toast Notifications

```css
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 24rem;
}

.toast {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  animation: slideIn 0.3s ease;
}

.toast.success {
  border-left: 4px solid var(--success-500);
}

.toast.error {
  border-left: 4px solid var(--error-500);
}

.toast.warning {
  border-left: 4px solid var(--warning-500);
}

.toast.info {
  border-left: 4px solid var(--info-500);
}

.toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: var(--font-medium);
  color: var(--gray-900);
  margin-bottom: var(--space-1);
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--gray-600);
}

.toast-close {
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--gray-600);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Loading States

```css
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.sm {
  width: 1rem;
  height: 1rem;
  border-width: 1.5px;
}

.spinner.lg {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: var(--space-2);
}

.skeleton-text.lg {
  height: 1.25rem;
}

.skeleton-text.sm {
  height: 0.75rem;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-full);
}

.skeleton-button {
  height: 2.5rem;
  width: 6rem;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgb(255 255 255 / 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
```

## 3. Icon System

**Icon Guidelines:**
- Use consistent stroke width (2px for most icons)
- 24px default size with sm (16px) and lg (32px) variants
- Outline style for consistency
- Use Heroicons or Lucide as base icon library

**Icon Usage:**
```css
.icon {
  width: 1.5rem;
  height: 1.5rem;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon.sm {
  width: 1rem;
  height: 1rem;
  stroke-width: 1.5;
}

.icon.lg {
  width: 2rem;
  height: 2rem;
}

.icon.xl {
  width: 2.5rem;
  height: 2.5rem;
}
```

**Key Icons Needed:**
- Navigation: home, search, calendar, user, menu, arrow-left, arrow-right
- Actions: plus, edit, delete, save, star, heart, share, filter
- Status: check, x, alert-circle, info, clock, check-circle
- Communication: mail, phone, message-circle, video
- Business: map-pin, dollar-sign, credit-card, briefcase, award
- UI: chevron-down, chevron-up, eye, eye-off, external-link

This comprehensive design system provides the foundation for creating consistent, accessible, and visually appealing interfaces across the booking platform. Each component is designed with mobile-first principles, accessibility in mind, and clear interaction patterns.