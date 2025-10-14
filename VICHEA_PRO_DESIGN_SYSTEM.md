# VicheaPro Design System
## Complete UI/UX Transformation for Cambodian Booking Platform

---

## Table of Contents
1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Logo Design Concept](#logo-design-concept)
5. [Component Library](#component-library)
6. [Screen Designs](#screen-designs)
7. [User Flows](#user-flows)
8. [Mobile-First Patterns](#mobile-first-patterns)
9. [Cultural Design Guidelines](#cultural-design-guidelines)
10. [Implementation Guidelines](#implementation-guidelines)

---

## 1. Brand Identity

### Name & Tagline
- **Primary**: VicheaPro (វិជ្ជាប្រូ)
- **Meaning**: "Wisdom Professional" - Combining traditional knowledge with modern professionalism
- **Tagline**: "ភ្ជាប់គ្នាដោយជំនឿ" (Connected by Trust)

### Brand Voice
- **Trustworthy**: Family-oriented, reliable, professional
- **Cultural**: Respectful of Khmer traditions
- **Modern**: Tech-forward but approachable
- **Warm**: Friendly, helpful, community-focused

---

## 2. Color System

### Primary Palette

```css
:root {
  /* Primary - Cambodian Red */
  --color-primary-50: #FFF1F2;
  --color-primary-100: #FFE1E4;
  --color-primary-200: #FFC7CD;
  --color-primary-300: #FFA0AB;
  --color-primary-400: #FF6879;
  --color-primary-500: #F83B52;
  --color-primary-600: #E51939;
  --color-primary-700: #C8102E; /* Main Red */
  --color-primary-800: #A60D26;
  --color-primary-900: #8A0F24;

  /* Secondary - Temple Gold */
  --color-secondary-50: #FFFEF7;
  --color-secondary-100: #FFFBEB;
  --color-secondary-200: #FFF4C6;
  --color-secondary-300: #FFEA91;
  --color-secondary-400: #FFD951;
  --color-secondary-500: #FFD700; /* Main Gold */
  --color-secondary-600: #E5C200;
  --color-secondary-700: #C9A800;
  --color-secondary-800: #A38600;
  --color-secondary-900: #856C00;

  /* Accent - Cambodian Blue */
  --color-accent-50: #F0F5FF;
  --color-accent-100: #E0EAFF;
  --color-accent-200: #C7D9FF;
  --color-accent-300: #A4BFFF;
  --color-accent-400: #7A98FF;
  --color-accent-500: #5170FF;
  --color-accent-600: #2F4BF5;
  --color-accent-700: #003893; /* Main Blue */
  --color-accent-800: #002E75;
  --color-accent-900: #002660;

  /* Neutral - Warm Cream/Beige */
  --color-bg-primary: #FAF8F5;
  --color-bg-secondary: #F5F2ED;
  --color-bg-tertiary: #EDE9E3;
  --color-bg-card: #FFFFFF;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text Colors */
  --color-text-primary: #2D2520;
  --color-text-secondary: #5C534D;
  --color-text-tertiary: #8A827C;
  --color-text-inverse: #FFFFFF;
  --color-text-link: #003893;

  /* Semantic Colors */
  --color-success: #16A34A;
  --color-success-light: #BBF7D0;
  --color-warning: #F59E0B;
  --color-warning-light: #FDE68A;
  --color-error: #DC2626;
  --color-error-light: #FECACA;
  --color-info: #0891B2;
  --color-info-light: #BAE6FD;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(45, 37, 32, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(45, 37, 32, 0.1), 0 2px 4px -2px rgba(45, 37, 32, 0.08);
  --shadow-lg: 0 10px 15px -3px rgba(45, 37, 32, 0.1), 0 4px 6px -4px rgba(45, 37, 32, 0.08);
  --shadow-xl: 0 20px 25px -5px rgba(45, 37, 32, 0.1), 0 8px 10px -6px rgba(45, 37, 32, 0.08);
  --shadow-gold: 0 4px 14px 0 rgba(255, 215, 0, 0.25);
  --shadow-red: 0 4px 14px 0 rgba(200, 16, 46, 0.20);

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```

### Color Usage Guidelines

**Primary Red (#C8102E)**
- Primary buttons and CTAs
- Active states and selections
- Important notifications
- Brand elements and accents

**Secondary Gold (#FFD700)**
- Premium features and badges
- Special offers and promotions
- Success states (secondary)
- Decorative Khmer patterns

**Accent Blue (#003893)**
- Links and navigation
- Information displays
- Secondary buttons
- Trust indicators

**Background Cream (#FAF8F5)**
- Main background
- Creates warm, inviting atmosphere
- Reduces eye strain compared to pure white
- Complements cultural aesthetic

---

## 3. Typography

### Font System

#### Khmer Typography (Primary)

```css
@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@300;400;700;900&display=swap');

:root {
  /* Primary Khmer Font - Modern, clean */
  --font-khmer-primary: 'Kantumruy Pro', 'Noto Sans Khmer', sans-serif;

  /* Display Khmer Font - Traditional, decorative */
  --font-khmer-display: 'Battambang', 'Khmer OS Muol Light', serif;

  /* English/Latin Font */
  --font-latin: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Monospace for numbers/codes */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

#### Type Scale

```css
/* Display - For hero sections, landing pages */
.text-display-xl {
  font-size: 60px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.text-display-lg {
  font-size: 48px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.text-display-md {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Headings */
.text-h1 {
  font-size: 32px;
  line-height: 1.25;
  font-weight: 600;
}

.text-h2 {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 600;
}

.text-h3 {
  font-size: 24px;
  line-height: 1.35;
  font-weight: 600;
}

.text-h4 {
  font-size: 20px;
  line-height: 1.4;
  font-weight: 600;
}

.text-h5 {
  font-size: 18px;
  line-height: 1.45;
  font-weight: 600;
}

.text-h6 {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 600;
}

/* Body Text */
.text-body-lg {
  font-size: 18px;
  line-height: 1.6;
  font-weight: 400;
}

.text-body {
  font-size: 16px;
  line-height: 1.6;
  font-weight: 400;
}

.text-body-sm {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
}

.text-caption {
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .text-display-xl { font-size: 40px; }
  .text-display-lg { font-size: 36px; }
  .text-display-md { font-size: 28px; }
  .text-h1 { font-size: 28px; }
  .text-h2 { font-size: 24px; }
  .text-h3 { font-size: 20px; }
}
```

### Typography Guidelines

1. **Khmer Text**: Always use Kantumruy Pro for body text, Battambang for decorative headers
2. **Line Height**: Increase line height by 0.1-0.2 for Khmer text (better readability)
3. **Font Weight**: Be cautious with bold weights in Khmer (can look too heavy)
4. **Mixing Scripts**: When showing both Khmer and Latin, use 16px minimum
5. **Numbers**: Use Latin numerals with Khmer riel symbol (៛)

---

## 4. Logo Design Concept

### Primary Logo

```
Description of logo design:

┌─────────────────────────────────────┐
│  ╔══════════════════════════════╗  │
│  ║   ☸  VICHEA PRO  ☸         ║  │
│  ║      វិជ្ជាប្រូ              ║  │
│  ╚══════════════════════════════╝  │
└─────────────────────────────────────┘

LOGO ELEMENTS:

1. ICON (left):
   - Stylized Angkor Wat silhouette
   - Three central towers (symbolic of Angkor)
   - Simplified, modern geometric interpretation
   - Uses primary red (#C8102E)
   - Gold accent on central tower (#FFD700)
   - Can stand alone as app icon

2. WORDMARK:
   - "VICHEA PRO" in Latin
   - Khmer script below: "វិជ្ជាប្រូ"
   - Custom letterforms with subtle Khmer influence
   - Strong, professional typeface
   - Accent blue for "PRO" (#003893)

3. DECORATIVE ELEMENTS:
   - Subtle Khmer pattern border (gold)
   - Lotus flower motifs in corners
   - Can be removed for simplified version

VARIATIONS:

A. Full Logo (Horizontal)
   [Icon] VICHEA PRO
          វិជ្ជាប្រូ

B. Stacked Logo (Vertical)
        [Icon]
     VICHEA PRO
     វិជ្ជាប្រូ

C. Icon Only (App Icon)
   [Angkor Symbol]

D. Wordmark Only
   VICHEA PRO
   វិជ្ជាប្រូ

E. Monochrome Versions
   - All white (for dark backgrounds)
   - All red (single color applications)
   - All black (print/documentation)
```

### Logo Specifications

```css
.logo-full {
  width: 200px;
  height: 60px;
}

.logo-mobile {
  width: 140px;
  height: 42px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.logo-favicon {
  width: 32px;
  height: 32px;
}
```

### Usage Rules

1. **Clear Space**: Minimum clear space equals height of logo
2. **Minimum Size**: 100px wide (full logo), 32px (icon only)
3. **Background**: Works best on cream, white, or dark backgrounds
4. **Don't**: Rotate, distort, outline, or change colors
5. **File Formats**: SVG (primary), PNG (fallback), PDF (print)

---

## 5. Component Library

### 5.1 Buttons

#### Primary Button (CTA)

```css
.btn-primary {
  background: linear-gradient(135deg, #C8102E 0%, #E51939 100%);
  color: var(--color-text-inverse);
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 16px;
  border: none;
  box-shadow: var(--shadow-red);
  transition: all 0.3s ease;
  touch-action: manipulation;
  min-height: 48px; /* Touch-friendly */
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(200, 16, 46, 0.30);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

#### Secondary Button

```css
.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-primary-700);
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 16px;
  border: 2px solid var(--color-primary-700);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  min-height: 48px;
}

.btn-secondary:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-600);
}
```

#### Gold Premium Button

```css
.btn-premium {
  background: linear-gradient(135deg, #FFD700 0%, #E5C200 100%);
  color: var(--color-text-primary);
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 16px;
  border: none;
  box-shadow: var(--shadow-gold);
  transition: all 0.3s ease;
  min-height: 48px;
  position: relative;
  overflow: hidden;
}

.btn-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.btn-premium:hover::before {
  left: 100%;
}
```

#### Icon Button (Mobile)

```css
.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-bg-tertiary);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.btn-icon:active {
  transform: scale(0.95);
  background: var(--color-bg-secondary);
}
```

### 5.2 Cards

#### Business Card (Listing)

```css
.card-business {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  position: relative;
}

.card-business:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Card Structure */
.card-business-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  position: relative;
}

.card-business-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #FFD700, #E5C200);
  color: var(--color-text-primary);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 700;
  box-shadow: var(--shadow-gold);
}

.card-business-content {
  padding: 16px;
}

.card-business-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-business-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.card-business-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-secondary-500);
  font-weight: 600;
}

.card-business-price {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.card-business-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-bg-tertiary);
}
```

#### Khmer Pattern Card (Premium)

```css
.card-premium {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.card-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #C8102E 0%, #FFD700 50%, #003893 100%);
}

.card-premium::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background-image: url('data:image/svg+xml,...'); /* Khmer pattern */
  opacity: 0.05;
  transform: rotate(45deg);
}
```

### 5.3 Form Inputs

#### Text Input (Khmer-optimized)

```css
.input-text {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  font-size: 16px; /* Prevents zoom on iOS */
  font-family: var(--font-khmer-primary);
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  transition: all 0.2s ease;
  min-height: 48px; /* Touch-friendly */
}

.input-text:focus {
  outline: none;
  border-color: var(--color-primary-700);
  box-shadow: 0 0 0 4px rgba(200, 16, 46, 0.1);
}

.input-text::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

/* Khmer text input adjustments */
.input-text[lang="km"] {
  font-size: 18px; /* Slightly larger for Khmer readability */
  line-height: 1.6;
}
```

#### Select Dropdown

```css
.select-dropdown {
  width: 100%;
  padding: 14px 40px 14px 16px;
  border: 2px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: var(--font-khmer-primary);
  color: var(--color-text-primary);
  background: var(--color-bg-card) url('data:image/svg+xml,...') no-repeat right 12px center;
  background-size: 20px;
  appearance: none;
  cursor: pointer;
  min-height: 48px;
  transition: all 0.2s ease;
}

.select-dropdown:focus {
  outline: none;
  border-color: var(--color-primary-700);
  box-shadow: 0 0 0 4px rgba(200, 16, 46, 0.1);
}
```

### 5.4 Bottom Navigation (Mobile)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-bg-tertiary);
  padding: 8px 0 max(8px, env(safe-area-inset-bottom)); /* iOS safe area */
  display: flex;
  justify-content: space-around;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: all 0.2s ease;
  touch-action: manipulation;
  position: relative;
}

.bottom-nav-item-active {
  color: var(--color-primary-700);
}

.bottom-nav-item-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: var(--color-primary-700);
  border-radius: 0 0 3px 3px;
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
}
```

### 5.5 Modal / Bottom Sheet

```css
/* Full-screen modal for mobile */
.modal-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-primary);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-bg-tertiary);
  position: sticky;
  top: 0;
  background: var(--color-bg-card);
  z-index: 10;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Bottom sheet for quick actions */
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slideUp 0.3s ease-out;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--color-text-tertiary);
  border-radius: var(--radius-full);
  margin: -12px auto 20px;
  opacity: 0.3;
}
```

### 5.6 Date Picker (Khmer Calendar Aware)

```css
.datepicker {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-lg);
}

.datepicker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-bg-tertiary);
}

.datepicker-month {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.datepicker-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.datepicker-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch-friendly */
}

.datepicker-day:hover {
  background: var(--color-primary-50);
}

.datepicker-day-selected {
  background: var(--color-primary-700);
  color: var(--color-text-inverse);
}

.datepicker-day-today {
  border: 2px solid var(--color-primary-700);
}

.datepicker-day-disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.4;
}

/* Khmer calendar indicator */
.datepicker-khmer-date {
  text-align: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-bg-tertiary);
  font-size: 12px;
  color: var(--color-text-secondary);
}
```

### 5.7 Rating Component

```css
.rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-star {
  width: 16px;
  height: 16px;
  color: var(--color-secondary-500);
}

.rating-star-empty {
  color: var(--color-text-tertiary);
  opacity: 0.3;
}

.rating-count {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-left: 4px;
}

/* Large version for profile headers */
.rating-large .rating-star {
  width: 24px;
  height: 24px;
}

.rating-large .rating-count {
  font-size: 16px;
}
```

### 5.8 Badge / Pill

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  gap: 4px;
}

.badge-premium {
  background: linear-gradient(135deg, #FFD700, #E5C200);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-gold);
}

.badge-verified {
  background: var(--color-accent-700);
  color: var(--color-text-inverse);
}

.badge-new {
  background: var(--color-primary-700);
  color: var(--color-text-inverse);
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
}
```

### 5.9 Loading States

```css
/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Spinner with Khmer motif */
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-bg-tertiary);
  border-top-color: var(--color-primary-700);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(250, 248, 245, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 9999;
  backdrop-filter: blur(4px);
}
```

---

## 6. Screen Designs

### 6.1 Landing Page (Home)

#### Mobile Layout (375px - 768px)

```
┌─────────────────────────────┐
│  ┌──┐ VicheaPro    🔔  👤  │ Header (sticky)
│  │🏛│ វិជ្ជាប្រូ              │
└─────────────────────────────┘
┌─────────────────────────────┐
│   🔍 ស្វែងរកសេវាកម្ម...     │ Search bar
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│ Hero Banner
│  │    [Hero Image]         ││ (Swipeable)
│  │  ស្វាគមន៍មកកាន់ VicheaPro││
│  │  រកឃើញអ្នកជំនាញដ៏ល្អ    ││
│  │  [ចាប់ផ្តើមឥឡូវនេះ]      ││
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  ប្រភេទសេវាកម្ម             │ Categories
│  ┌─────┬─────┬─────┬─────┐ │ (Horizontal scroll)
│  │ 💇  │ 💆  │ 🔧  │ 🎨  │ │
│  │សក់  │ស្ប៉ា│ជួសជុល│សិល្ប៍│ │
│  └─────┴─────┴─────┴─────┘ │
└─────────────────────────────┘
┌─────────────────────────────┐
│  អាជីវកម្មពេញនិយម ⭐         │ Featured
│  ╭─────────────────────────╮│
│  │ [Image]                 ││ Business
│  │ ហាងកាត់សក់ VIP          ││ Card
│  │ ⭐ 4.9 (324) • 15,000៛  ││
│  │ [ចុះឈ្មោះ]               ││
│  ╰─────────────────────────╯│
│  ╭─────────────────────────╮│
│  │ [Image]                 ││
│  │ ស្ប៉ាទំនើប                ││
│  │ ⭐ 4.8 (189) • 25,000៛  ││
│  │ [ចុះឈ្មោះ]               ││
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  អ្នកជំនាញល្បីៗ 👨‍💼          │ Top
│  ┌──────┬──────┬──────┐     │ Specialists
│  │[👤]  │[👤]  │[👤]  │→    │ (Horizontal)
│  │នាម១  │នាម២  │នាម៣  │     │
│  │⭐4.9  │⭐4.8  │⭐4.9  │     │
│  └──────┴──────┴──────┘     │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [About VicheaPro section]  │ About
└─────────────────────────────┘
┌─────────────────────────────┐
│ ┌───┐ ┌────┐ ┌──┐ ┌───┐    │ Bottom Nav
│ │🏠 │ │🔍  │ │💼│ │👤 │    │ (Fixed)
│ │ទំព│ │ស្វែង│ │វគ្គ│ │គណ│    │
│ └───┘ └────┘ └──┘ └───┘    │
└─────────────────────────────┘
```

#### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────┐
│  ┌──┐ VicheaPro         ទំព័រដើម | សេវាកម្ម | អំពី    🔔 👤  │
│  │🏛│ វិជ្ជាប្រូ                                                │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│                   🔍 ស្វែងរកសេវាកម្ម, អាជីវកម្ម...            │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐│
│  │                        [Hero Image]                         ││
│  │              រកឃើញអ្នកជំនាញដ៏ល្អបំផុតនៅកម្ពុជា              ││
│  │          ភ្ជាប់ជាមួយអាជីវកម្មមានគុណភាពខ្ពស់ដោយទំនុកចិត្ត     ││
│  │              [ចាប់ផ្តើមឥឡូវនេះ] [ស្វែងយល់បន្ថែម]             ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│  ប្រភេទសេវាកម្ម                                                │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐           │
│  │ 💇  │ 💆  │ 🔧  │ 🎨  │ 🏥  │ 🏋️  │ 📚  │ 🍜  │           │
│  │សក់  │ស្ប៉ា │ជួសជុល│សិល្ប៍│សុខភាព│កីឡា │អប់រំ│អាហារ│           │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘           │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│  អាជីវកម្មពេញនិយម ⭐                                           │
│  ┌────────────┬────────────┬────────────┬────────────┐        │
│  │ [Image]    │ [Image]    │ [Image]    │ [Image]    │        │
│  │ ហាងកាត់សក់  │ ស្ប៉ាទំនើប   │ ជួសជុលម៉ូតូ  │ សិល្បៈក្រចក │        │
│  │ ⭐ 4.9     │ ⭐ 4.8     │ ⭐ 4.7     │ ⭐ 4.9     │        │
│  │ (324)      │ (189)      │ (456)      │ (278)      │        │
│  │ 15,000៛    │ 25,000៛    │ 50,000៛    │ 20,000៛    │        │
│  │ [ចុះឈ្មោះ]  │ [ចុះឈ្មោះ]  │ [ចុះឈ្មោះ]  │ [ចុះឈ្មោះ]  │        │
│  └────────────┴────────────┴────────────┴────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Business Listing Page

#### Mobile View

```
┌─────────────────────────────┐
│  ← ប្រភេទសេវាកម្ម  🔍  ≡    │ Header
└─────────────────────────────┘
┌─────────────────────────────┐
│  🏛 សក់ > ហាងកាត់សក់         │ Breadcrumb
└─────────────────────────────┘
┌─────────────────────────────┐
│  [ច្រោះ ▼] [តម្លៃ ▼] [⭐]  │ Filters
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│
│  │ [Business Image] ⭐ PRO ││ Business
│  │ ហាងកាត់សក់ VIP          ││ Card
│  │ ⭐ 4.9 • 324 ការវាយតម្លៃ ││
│  │ បុគ្គលិក: 5 នាក់          ││
│  │ 15,000៛ - 50,000៛       ││
│  │ ចំហរ: ភ្នំពេញ • 2.3km    ││
│  │ [ចុះឈ្មោះឥឡូវនេះ]        ││
│  ╰─────────────────────────╯│
│  ╭─────────────────────────╮│
│  │ [Business Image]        ││
│  │ ហាងកាត់សក់សុភាព          ││
│  │ ⭐ 4.7 • 189 ការវាយតម្លៃ ││
│  │ បុគ្គលិក: 3 នាក់          ││
│  │ 10,000៛ - 40,000៛       ││
│  │ ចំហរ: ភ្នំពេញ • 1.8km    ││
│  │ [ចុះឈ្មោះឥឡូវនេះ]        ││
│  ╰─────────────────────────╯│
│  [Load more...]             │
└─────────────────────────────┘
```

### 6.3 Business Profile Page

#### Mobile View

```
┌─────────────────────────────┐
│  ←           ⋮  ♡            │ Header
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│ Cover Image
│  │    [Cover Photo]        ││ (Swipeable
│  │                         ││  gallery)
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭───╮ ហាងកាត់សក់ VIP   ⭐  │ Profile
│  │[L]│                      │ Header
│  ╰───╯ ⭐ 4.9 (324)         │
│        ភ្នំពេញ • 2.3km      │
│  [ចុះឈ្មោះ] [ហៅទូរស័ព្ទ] [ចែក│
│   រំលែក]                    │
└─────────────────────────────┘
┌─────────────────────────────┐
│  📍 អាសយដ្ឋាន               │ Info
│  St. 163, Phnom Penh        │
│                             │
│  ⏰ ម៉ោងធ្វើការ              │
│  ច-អ: 8:00-18:00           │
│  អ-ស: 8:00-12:00           │
│                             │
│  ℹ️ អំពី                    │
│  ហាងកាត់សក់ជំនាញខ្ពស់...    │
│  [អានបន្ថែម]               │
└─────────────────────────────┘
┌─────────────────────────────┐
│  👥 បុគ្គលិក (5)            │ Employee
│  ╭─────────────────────────╮│ Section
│  │ [Photo] នាយសុភា         ││
│  │ អ្នកកាត់សក់ជាន់ខ្ពស់     ││
│  │ ⭐ 4.9 (124)            ││
│  │ [ជ្រើសរើស]               ││
│  ╰─────────────────────────╯│
│  ╭─────────────────────────╮│
│  │ [Photo] នាយវណ្ណៈ        ││
│  │ អ្នកកាត់សក់             ││
│  │ ⭐ 4.8 (98)             ││
│  │ [ជ្រើសរើស]               ││
│  ╰─────────────────────────╯│
│  [មើលបុគ្គលិកទាំងអស់]       │
└─────────────────────────────┘
┌─────────────────────────────┐
│  💰 សេវាកម្ម                │ Services
│  ┌─────────────────────────┐│
│  │ កាត់សក់បុរស            ││
│  │ 30 នាទី • 15,000៛      ││
│  │ [+]                    ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ កាត់សក់ស្រី             ││
│  │ 45 នាទី • 25,000៛      ││
│  │ [+]                    ││
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│  ⭐ ការវាយតម្លៃ (324)        │ Reviews
│  ╭─────────────────────────╮│
│  │ 👤 អ្នកប្រើប្រាស់១        ││
│  │ ⭐⭐⭐⭐⭐  2 ថ្ងៃមុន        ││
│  │ សេវាកម្មល្អណាស់!         ││
│  ╰─────────────────────────╯│
│  [មើលការវាយតម្លៃទាំងអស់]     │
└─────────────────────────────┘
```

### 6.4 Employee Selection Screen

```
┌─────────────────────────────┐
│  ← ជ្រើសរើសបុគ្គលិក          │ Header
└─────────────────────────────┘
┌─────────────────────────────┐
│  ហាងកាត់សក់ VIP             │ Context
│  សេវាកម្ម: កាត់សក់បុរស       │
│  រយៈពេល: 30 នាទី            │
│  តម្លៃ: 15,000៛             │
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│ Employee
│  │ ┌─────┐                 ││ Card
│  │ │[Img]│ នាយសុភា         ││ (Selectable)
│  │ └─────┘ អ្នកកាត់សក់ជាន់ខ្ពស៛││
│  │                         ││
│  │ ⭐ 4.9 (124 reviews)    ││
│  │ បទពិសោធន៍: 8 ឆ្នាំ        ││
│  │ ភាសា: ខ្មែរ, English     ││
│  │                         ││
│  │ ជាប់រវល់:               ││
│  │ [13:00] [14:30] [16:00] ││ Unavailable
│  │                         ││ time slots
│  │ ទំនេរ:                   ││
│  │ [9:00] [10:30] [15:00]  ││ Available
│  │                         ││ time slots
│  │ [ជ្រើសរើស] (Selected)    ││
│  ╰─────────────────────────╯│
│  ╭─────────────────────────╮│
│  │ ┌─────┐                 ││
│  │ │[Img]│ នាយវណ្ណៈ        ││
│  │ └─────┘ អ្នកកាត់សក់      ││
│  │ ⭐ 4.8 (98 reviews)     ││
│  │ [ជ្រើសរើស]               ││
│  ╰─────────────────────────╯│
│                             │
│  ┌─────────────────────────┐│
│  │ ឬជ្រើសរើសពេលវេលាជាមុន    ││ Option:
│  │ [ជ្រើសរើសពេលវេលា]        ││ Time first
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│  [បន្ទាប់] →                 │ CTA
└─────────────────────────────┘
```

### 6.5 Booking Flow

#### Step 1: Date & Time Selection

```
┌─────────────────────────────┐
│  ← ជ្រើសរើសកាលបរិច្ឆេទ       │
└─────────────────────────────┘
┌─────────────────────────────┐
│  ហាងកាត់សក់ VIP             │ Booking
│  បុគ្គលិក: នាយសុភា           │ Summary
│  សេវាកម្ម: កាត់សក់បុរស       │
│  រយៈពេល: 30 នាទី • 15,000៛ │
└─────────────────────────────┘
┌─────────────────────────────┐
│  📅 ជ្រើសរើសកាលបរិច្ឆេទ      │ Calendar
│  ┌─────────────────────────┐│
│  │ ← តុលា 2025 →           ││
│  │ អា ច អ ព ព្រ ស អា      ││
│  │     1  2  3  4  5  6    ││
│  │  7  8  9 10 11 12 13    ││
│  │ 14 [15] 16 17 18 19 20  ││ Selected
│  │ 21 22 23 24 25 26 27    ││ date
│  │ 28 29 30 31             ││
│  └─────────────────────────┘│
│  ថ្ងៃពុធ ១៥ តុលា ២០២៥      │ Khmer date
└─────────────────────────────┘
┌─────────────────────────────┐
│  ⏰ ជ្រើសរើសម៉ោង            │ Time Slots
│  ┌──────┬──────┬──────┐     │
│  │ 9:00 │10:30 │12:00 │     │ Available
│  └──────┴──────┴──────┘     │
│  ┌──────┬──────┬──────┐     │
│  │13:00 │[15:00]16:30│     │ Selected
│  └──────┴──────┴──────┘     │
│  ┌──────┬──────┬──────┐     │
│  │ 17:00│ 18:30│      │     │
│  └──────┴──────┴──────┘     │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [បន្ទាប់] →                 │ CTA
└─────────────────────────────┘
```

#### Step 2: Contact Information

```
┌─────────────────────────────┐
│  ← ព័ត៌មានទំនាក់ទំនង         │
└─────────────────────────────┘
┌─────────────────────────────┐
│  📝 ព័ត៌មានរបស់អ្នក           │
│  ┌─────────────────────────┐│
│  │ ឈ្មោះ *                  ││
│  │ [Input field]           ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ លេខទូរស័ព្ទ *             ││
│  │ [+855] [Input]          ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ អ៊ីមែល (ជម្រើស)          ││
│  │ [Input field]           ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ កំណត់ចំណាំ (ជម្រើស)      ││
│  │ [Textarea]              ││
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│  [ត្រឡប់] [បញ្ជាក់] →         │ Actions
└─────────────────────────────┘
```

#### Step 3: Payment

```
┌─────────────────────────────┐
│  ← ការបង់ប្រាក់               │
└─────────────────────────────┘
┌─────────────────────────────┐
│  💳 វិធីសាស្រ្តបង់ប្រាក់       │ Payment
│  ┌─────────────────────────┐│ Methods
│  │ ☐ បង់ប្រាក់តាម ABA      ││
│  │   [ABA logo]            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ☑ បង់ប្រាក់នៅហាង        ││ (Selected)
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│  📋 សង្ខេបការកក់            │ Summary
│  ┌─────────────────────────┐│
│  │ សេវាកម្ម:                ││
│  │ កាត់សក់បុរស              ││
│  │                         ││
│  │ កាលបរិច្ឆេទ:              ││
│  │ ថ្ងៃពុធ ១៥ តុលា ២០២៥    ││
│  │ ម៉ោង 15:00             ││
│  │                         ││
│  │ បុគ្គលិក:                ││
│  │ នាយសុភា                  ││
│  │                         ││
│  │ តម្លៃសេវាកម្ម:   15,000៛  ││
│  │ ────────────────────────││
│  │ សរុប:          15,000៛  ││
│  │                ($3.75)  ││
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│  [បញ្ជាក់ការកក់]             │ CTA
└─────────────────────────────┘
```

#### Step 4: Confirmation

```
┌─────────────────────────────┐
│  ✓ ការកក់ជោគជ័យ!            │ Success
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│
│  │         ✓               ││ Success
│  │   ការកក់របស់អ្នក         ││ Message
│  │   ត្រូវបានបញ្ជាក់ហើយ!   ││
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  📅 ថ្ងៃពុធ ១៥ តុលា ២០២៥   │ Booking
│  ⏰ 15:00 - 15:30          │ Details
│  🏛 ហាងកាត់សក់ VIP          │
│  👤 នាយសុភា                  │
│  💰 15,000៛                 │
│                             │
│  📍 St. 163, Phnom Penh     │
│  ☎️ +855 12 345 678         │
│                             │
│  កូដការកក់: #VP123456       │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [បន្ថែមទៅប្រតិទិន] [ចែករំលែក] │ Actions
│  [ទៅទំព័រដើម]               │
└─────────────────────────────┘
```

### 6.6 Business Owner Dashboard

#### Mobile View

```
┌─────────────────────────────┐
│  ☰ ផ្ទាំងគ្រប់គ្រង    🔔  👤  │ Header
└─────────────────────────────┘
┌─────────────────────────────┐
│  ហាងកាត់សក់ VIP ▼          │ Business
│  ⭐ 4.9 • ស្ថានភាព: កំពុងបើក │ Selector
└─────────────────────────────┘
┌─────────────────────────────┐
│  ┌──────────┬──────────┐    │ Stats
│  │    25    │    15    │    │
│  │ ការកក់ថ្ងៃនេះ កំពុងរង់ចាំ │    │
│  └──────────┴──────────┘    │
│  ┌──────────┬──────────┐    │
│  │ 2,500,000៛  98.5%    │    │
│  │ ប្រាក់ចំណូល   អត្រាមកដល់  │    │
│  └──────────┴──────────┘    │
└─────────────────────────────┘
┌─────────────────────────────┐
│  [ថ្ងៃនេះ ▼] [សប្តាហ៍] [ខែ]   │ Time Filter
└─────────────────────────────┘
┌─────────────────────────────┐
│  📅 ការកក់ថ្ងៃនេះ             │ Today's
│  ╭─────────────────────────╮│ Bookings
│  │ 9:00 - 9:30             ││
│  │ អតិថិជន: សុភា           ││
│  │ បុគ្គលិក: នាយវណ្ណៈ        ││
│  │ សេវាកម្ម: កាត់សក់         ││
│  │ [មើលពត៌មាន] [ទំនាក់ទំនង] ││
│  ╰─────────────────────────╯│
│  ╭─────────────────────────╮│
│  │ 10:30 - 11:00           ││
│  │ អតិថិជន: វិជ្ជា          ││
│  │ កំពុងរង់ចាំការបញ្ជាក់       ││
│  │ [ទទួលយក] [បដិសេធ]        ││
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  [+ បន្ថែមការកក់]            │ Quick
│  [គ្រប់គ្រងបុគ្គលិក]          │ Actions
│  [របាយការណ៍]                │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │ Bottom
│ │🏠│ │📅│ │👥│ │📊│    │ Nav
│ │ទំព│ │ការកក│ │បុគ្គ│ │របា│    │
│ └───┘ └───┘ └───┘ └───┘    │
└─────────────────────────────┘
```

### 6.7 Employee Schedule View

```
┌─────────────────────────────┐
│  ← កាលវិភាគរបស់ខ្ញុំ     ⚙️   │ Header
└─────────────────────────────┘
┌─────────────────────────────┐
│  ← តុលា 2025 →              │ Month
│  [អាទិត្យ] [ចន្ទ] [អង្គារ]...│ Selector
└─────────────────────────────┘
┌─────────────────────────────┐
│  ថ្ងៃពុធ ១៥ តុលា ២០២៥       │ Selected
│  ការកក់: 8 | ទំនេរ: 4         │ Day
└─────────────────────────────┘
┌─────────────────────────────┐
│  ╭─────────────────────────╮│ Schedule
│  │ 8:00 - 8:30             ││ Timeline
│  │ ────────────────────────││
│  │                         ││
│  │ 9:00 - 9:30 ●           ││
│  │ កាត់សក់បុរស              ││
│  │ អតិថិជន: សុភា           ││
│  │ [ចាប់ផ្តើម] [ទំនាក់ទំនង]  ││
│  │                         ││
│  │ 10:00 - 10:30           ││
│  │ ────────────────────────││
│  │                         ││
│  │ 11:00 - 11:30 ●         ││
│  │ កាត់ក្រចកសក់              ││
│  │ អតិថិជន: វិជ្ជា          ││
│  │ [ចាប់ផ្តើម]              ││
│  │                         ││
│  │ 12:00 - 13:00           ││
│  │ ☕ ម៉ោងសម្រាក            ││
│  │                         ││
│  │ 13:00 - 13:30 ●         ││
│  │ ...                     ││
│  ╰─────────────────────────╯│
└─────────────────────────────┘
┌─────────────────────────────┐
│  [កំណត់ម៉ោងសម្រាក] [អវត្តមាន] │ Actions
└─────────────────────────────┘
```

---

## 7. User Flows

### 7.1 Customer Booking Flow

```
START
  ↓
Landing Page
  ↓
[Search or Browse Categories]
  ↓
Business Listing Page
- Apply filters
- Sort results
- View business cards
  ↓
Select Business
  ↓
Business Profile
- View info
- See employees
- Check services
- Read reviews
  ↓
[Book Appointment]
  ↓
Choose Path:
  A) Select Employee First → Pick Time
  B) Select Time First → Pick Employee
  ↓
Review Booking
  ↓
Enter Contact Info
- Name
- Phone
- Email (optional)
- Notes (optional)
  ↓
Select Payment Method
- Pay via ABA
- Pay at location
  ↓
Confirm Booking
  ↓
[If ABA Payment] → ABA Payment Screen → Payment Success
  ↓
Booking Confirmation
- View details
- Add to calendar
- Share booking
  ↓
[Reminders sent via:]
- Telegram notification
- SMS (optional)
- Email (optional)
  ↓
END
```

### 7.2 Business Owner Onboarding Flow

```
START
  ↓
Register as Business
- Business name (Khmer + English)
- Category selection
- Location
- Phone/Email
  ↓
Verify Account
- Phone OTP
- Email verification
  ↓
Complete Business Profile
- Upload photos
- Add description
- Set business hours
- Add services (name, duration, price)
  ↓
Add Employees
- Employee name
- Role/specialty
- Working hours
- Upload photo
  ↓
Set Payment Methods
- Enable ABA payment
- Cash payment settings
  ↓
Preview Profile
  ↓
[Publish] or [Save Draft]
  ↓
Dashboard Tour
- View bookings
- Manage employees
- Check analytics
  ↓
[Optional: Upgrade to PRO]
- Premium badge
- Priority listing
- Advanced analytics
- Marketing tools
  ↓
Ready to Accept Bookings
  ↓
END
```

### 7.3 Specialist to Business Upgrade Flow

```
START (Existing Specialist Account)
  ↓
Dashboard → [Upgrade to Business]
  ↓
Upgrade Options Screen
- Compare features
- See benefits
- View pricing
  ↓
[Start Upgrade]
  ↓
Business Information
- Business name
- Business location
- Business hours
- Business photos
  ↓
Transfer Existing Data
- Migrate services
- Keep reviews
- Preserve ratings
- Transfer bookings
  ↓
Add Team Members
- Invite employees
- Set permissions
- Assign services
  ↓
Payment Setup
- Choose billing plan
- Enter payment method
  ↓
Review & Confirm
  ↓
Upgrade Processing
  ↓
Success!
- New business profile live
- Employee invites sent
- Old specialist profile redirects
  ↓
Business Dashboard
  ↓
END
```

---

## 8. Mobile-First Patterns

### 8.1 Touch Targets

```css
/* Minimum touch target sizes */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Spacing between interactive elements */
.touch-spacing {
  gap: 8px; /* Minimum gap between touchable items */
}
```

### 8.2 Swipe Gestures

**Gallery Swipe**
```
┌─────────────────────────────┐
│  ◄ ● ● ● ►                  │ Dots indicator
│  ╭─────────────────────────╮│
│  │    [Swipeable Image]    ││ ← Swipe →
│  ╰─────────────────────────╯│
└─────────────────────────────┘
```

**Swipe to Delete/Action**
```
┌─────────────────────────────┐
│  ╭─────────────────────────╮│
│  │ Booking Item            ││ ← Swipe left
│  ╰─────────────────────────╯│
│  [🗑 Delete] [✏️ Edit]       │ Reveal actions
└─────────────────────────────┘
```

### 8.3 Pull to Refresh

```css
.pull-to-refresh {
  padding-top: 60px;
  transition: padding-top 0.3s;
}

.ptr-indicator {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}
```

### 8.4 Bottom Sheet Pattern

Use for:
- Quick actions
- Filters
- Share options
- Time picker
- Confirmation dialogs

### 8.5 Infinite Scroll

```
┌─────────────────────────────┐
│  [Business Card 1]          │
│  [Business Card 2]          │
│  [Business Card 3]          │
│  [Business Card 4]          │
│  ...                        │
│  [Loading spinner]          │ Auto-load more
│  ↓                          │
└─────────────────────────────┘
```

### 8.6 Tab Navigation

```css
.tabs-mobile {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Hide scrollbar */
}

.tab-item {
  scroll-snap-align: start;
  flex-shrink: 0;
  padding: 12px 20px;
}
```

### 8.7 iOS Safe Area Support

```css
/* iPhone notch support */
.header {
  padding-top: max(16px, env(safe-area-inset-top));
}

.bottom-nav {
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.full-screen-modal {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 8.8 Responsive Images

```css
/* Serve appropriate image sizes */
.responsive-img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* Use srcset for different screen densities */
<img
  src="image.jpg"
  srcset="image@1x.jpg 1x, image@2x.jpg 2x, image@3x.jpg 3x"
  alt="Description"
/>
```

---

## 9. Cultural Design Guidelines

### 9.1 Khmer Pattern Library

**Pattern Types:**

1. **Floral Motifs** (ផ្កា)
   - Lotus flowers (sacred symbol)
   - Use in backgrounds, borders, dividers
   - Subtle, low opacity (5-10%)

2. **Geometric Patterns** (គំនូររាង)
   - Inspired by Angkor Wat carvings
   - Use in decorative elements
   - Premium features borders

3. **Wave Patterns** (រលក)
   - Flowing, organic shapes
   - Header/footer backgrounds
   - Section dividers

**Implementation:**
```css
.khmer-pattern-subtle {
  background-image: url('/patterns/khmer-lotus-pattern.svg');
  background-repeat: repeat;
  opacity: 0.05;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.khmer-border {
  border-image: url('/patterns/khmer-border.svg') 30 stretch;
  border-width: 4px;
  border-style: solid;
}
```

### 9.2 Color Symbolism

**Red (#C8102E)**
- Represents bravery and strength
- National color (Cambodian flag)
- Use for primary actions and important elements

**Gold (#FFD700)**
- Symbolizes prosperity and temple architecture
- Premium features and success states
- Buddhist cultural significance

**Blue (#003893)**
- Trust and professionalism
- Represents the Cambodian flag (sky and water)
- Use for information and secondary actions

**White/Cream**
- Purity and peace
- Buddhist influence
- Creates calm, open atmosphere

### 9.3 Iconography Guidelines

**Culturally Appropriate Icons:**

✅ DO USE:
- Lotus flower (spirituality)
- Angkor Wat silhouette (identity)
- Traditional tools in context
- Family imagery
- Temple/pagoda shapes

❌ AVOID:
- Feet pointing (disrespectful)
- Buddha imagery (can be sensitive)
- Finger-pointing gestures
- Head-touching imagery

### 9.4 Photography Style

**Image Guidelines:**

1. **People Photos:**
   - Cambodian people in natural settings
   - Diverse age groups (family-oriented)
   - Professional but approachable
   - Smiling, welcoming expressions

2. **Location Photos:**
   - Modern but with cultural elements
   - Clean, well-lit spaces
   - Cambodian architectural touches
   - Urban and traditional settings

3. **Service Photos:**
   - High-quality, professional shots
   - Show process and results
   - Include cultural context when relevant

4. **Backgrounds:**
   - Warm, natural lighting
   - Cream/beige tones preferred
   - Subtle Khmer patterns
   - Avoid overly busy backgrounds

### 9.5 Language Considerations

**Khmer Text Display:**

1. **Font Selection:**
   - Use web-safe Khmer fonts
   - Fallback fonts always specified
   - Test on multiple devices

2. **Line Spacing:**
   - Increase line height by 0.1-0.2
   - Allow more breathing room
   - Improve readability

3. **Text Wrapping:**
   - Khmer has no spaces between words
   - Use `word-break: normal;`
   - Test line breaks carefully

4. **Number Display:**
   - Use Arabic numerals (1, 2, 3)
   - Include Khmer currency symbol (៛)
   - Format: 15,000៛ ($3.75)

5. **Date Format:**
   - Gregorian primary: ថ្ងៃពុធ ១៥ តុលា ២០២៥
   - Khmer calendar reference when relevant
   - Buddhist era for formal contexts

### 9.6 Respectful Design Practices

1. **Religious Sensitivity:**
   - Handle Buddhist imagery carefully
   - Avoid placing sacred symbols low on page
   - Respect cultural taboos

2. **Family Values:**
   - Emphasize trust and community
   - Show multi-generational appeal
   - Use family-friendly messaging

3. **Hierarchy and Respect:**
   - Formal language for elders/professionals
   - Respectful tone in all communications
   - Honor traditional values while being modern

4. **Local Context:**
   - Show Cambodian locations
   - Use local business examples
   - Reference familiar landmarks

---

## 10. Implementation Guidelines

### 10.1 Tailwind Configuration

Update `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/frontend/tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VicheaPro color system
        primary: {
          50: '#FFF1F2',
          100: '#FFE1E4',
          200: '#FFC7CD',
          300: '#FFA0AB',
          400: '#FF6879',
          500: '#F83B52',
          600: '#E51939',
          700: '#C8102E', // Main Cambodian Red
          800: '#A60D26',
          900: '#8A0F24',
        },
        secondary: {
          50: '#FFFEF7',
          100: '#FFFBEB',
          200: '#FFF4C6',
          300: '#FFEA91',
          400: '#FFD951',
          500: '#FFD700', // Main Temple Gold
          600: '#E5C200',
          700: '#C9A800',
          800: '#A38600',
          900: '#856C00',
        },
        accent: {
          50: '#F0F5FF',
          100: '#E0EAFF',
          200: '#C7D9FF',
          300: '#A4BFFF',
          400: '#7A98FF',
          500: '#5170FF',
          600: '#2F4BF5',
          700: '#003893', // Main Cambodian Blue
          800: '#002E75',
          900: '#002660',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FAF8F5', // Main background
          200: '#F5F2ED',
          300: '#EDE9E3',
          400: '#E5E0D9',
          500: '#DDD7CF',
        }
      },
      fontFamily: {
        khmer: ['Kantumruy Pro', 'Noto Sans Khmer', 'sans-serif'],
        'khmer-display': ['Battambang', 'Khmer OS Muol Light', 'serif'],
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(255, 215, 0, 0.25)',
        'red': '0 4px 14px 0 rgba(200, 16, 46, 0.20)',
        'blue': '0 4px 14px 0 rgba(0, 56, 147, 0.20)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

### 10.2 Global Styles

Create/Update `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/frontend/src/styles/vichea-pro.css`:

```css
/* VicheaPro Global Styles */

@import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@300;400;700;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  /* VicheaPro Custom Properties */
  --color-primary: #C8102E;
  --color-secondary: #FFD700;
  --color-accent: #003893;
  --color-bg: #FAF8F5;

  --font-khmer: 'Kantumruy Pro', 'Noto Sans Khmer', sans-serif;
  --font-khmer-display: 'Battambang', 'Khmer OS Muol Light', serif;
  --font-latin: 'Inter', 'SF Pro Display', -apple-system, sans-serif;

  --radius-mobile: 14px;
  --touch-target: 48px;
}

* {
  -webkit-tap-highlight-color: rgba(200, 16, 46, 0.1);
}

body {
  font-family: var(--font-khmer);
  background-color: var(--color-bg);
  color: #2D2520;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Khmer text specific adjustments */
[lang="km"] {
  line-height: 1.7;
  letter-spacing: 0.01em;
}

/* Utility classes for VicheaPro design */
.bg-cambodia-gradient {
  background: linear-gradient(135deg, #C8102E 0%, #FFD700 50%, #003893 100%);
}

.text-gradient-gold {
  background: linear-gradient(135deg, #FFD700, #E5C200);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.khmer-pattern-bg {
  position: relative;
}

.khmer-pattern-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/patterns/khmer-subtle-pattern.svg');
  opacity: 0.05;
  pointer-events: none;
}

/* Premium badge with gold shimmer */
.badge-premium-animated {
  background: linear-gradient(135deg, #FFD700 0%, #E5C200 50%, #FFD700 100%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* Touch-friendly interactive elements */
.touch-friendly {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
  padding: 12px;
}

/* iOS safe area support */
@supports (padding: max(0px)) {
  .safe-top {
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .safe-bottom {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #F5F2ED;
}

::-webkit-scrollbar-thumb {
  background: #C8102E;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #A60D26;
}

/* Focus states for accessibility */
*:focus {
  outline: 2px solid #C8102E;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

/* Animation for page transitions */
.page-transition {
  animation: fadeIn 0.3s ease-out;
}

/* Loading skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    #F5F2ED 0%,
    #EDE9E3 50%,
    #F5F2ED 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 10.3 Component Implementation Priority

**Phase 1: Core Components (Week 1)**
1. Color system & typography
2. Button components
3. Card components
4. Form inputs
5. Bottom navigation

**Phase 2: Layout & Navigation (Week 2)**
6. Header/navigation
7. Modal/Bottom sheet
8. Tab navigation
9. Loading states

**Phase 3: Business Components (Week 3)**
10. Business cards
11. Employee cards
12. Service listings
13. Rating components
14. Badge system

**Phase 4: Booking Flow (Week 4)**
15. Date picker
16. Time slot selector
17. Booking summary
18. Payment integration (ABA)
19. Confirmation screens

**Phase 5: Dashboards (Week 5)**
20. Business dashboard
21. Employee schedule
22. Analytics components
23. Notification system

### 10.4 Testing Checklist

**Mobile Testing:**
- [ ] iPhone SE (375px) - smallest modern phone
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Android mid-range (360px)
- [ ] Android flagship (412px)

**Tablet Testing:**
- [ ] iPad Mini (768px)
- [ ] iPad Air (820px)
- [ ] iPad Pro (1024px)

**Desktop Testing:**
- [ ] Small laptop (1280px)
- [ ] Standard desktop (1440px)
- [ ] Large desktop (1920px)

**Khmer Text Testing:**
- [ ] Long business names
- [ ] Multi-line descriptions
- [ ] Mixed Khmer/English text
- [ ] Number formatting
- [ ] Date formatting

**Performance:**
- [ ] Image optimization
- [ ] Font loading strategy
- [ ] Animation performance
- [ ] Touch response time (<100ms)
- [ ] Page load time (<3s)

**Accessibility:**
- [ ] Touch target sizes (min 44x44px)
- [ ] Color contrast ratios (WCAG AA)
- [ ] Focus indicators
- [ ] Screen reader compatibility
- [ ] Keyboard navigation

### 10.5 Progressive Web App (PWA) Setup

**Manifest Configuration:**

```json
{
  "name": "VicheaPro - វិជ្ជាប្រូ",
  "short_name": "VicheaPro",
  "description": "ប្រព័ន្ធកក់ហេតុទំនើបរបស់កម្ពុជា - Modern Cambodian Booking Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#C8102E",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["business", "lifestyle"],
  "lang": "km",
  "dir": "ltr"
}
```

---

## Summary

This comprehensive design system provides VicheaPro with:

1. **Strong Cultural Identity**: Cambodian colors, Khmer patterns, and cultural sensitivity
2. **Mobile-First Approach**: Touch-friendly, gesture-based, PWA-ready
3. **Professional Quality**: Modern design with traditional touches
4. **Scalable System**: Well-documented components and patterns
5. **Family-Oriented**: Trustworthy, warm, community-focused design

**Next Steps:**
1. Implement the Tailwind configuration
2. Create component library following specifications
3. Update existing pages with new design system
4. Add Khmer fonts and cultural patterns
5. Test on real Cambodian users
6. Iterate based on feedback

**Key Files to Update:**
- `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/frontend/tailwind.config.js`
- `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/frontend/src/styles/vichea-pro.css`
- `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/frontend/public/manifest.json`

The design system is ready for implementation. All specifications are mobile-first, culturally appropriate, and optimized for the Cambodian market.
