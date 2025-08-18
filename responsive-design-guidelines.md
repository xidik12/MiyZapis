# Responsive Design Guidelines & Mobile-First Specifications

## 1. Breakpoint Strategy

### Core Breakpoints
Based on device usage patterns and React/Tailwind best practices:

```css
/* Mobile First Approach */
/* xs: 0px - 475px (Small phones) */
.xs {
  /* Base styles - mobile first */
}

/* sm: 476px - 640px (Large phones) */
@media (min-width: 476px) {
  .sm { /* Styles */ }
}

/* md: 641px - 768px (Tablets portrait) */
@media (min-width: 641px) {
  .md { /* Styles */ }
}

/* lg: 769px - 1024px (Tablets landscape, small laptops) */
@media (min-width: 769px) {
  .lg { /* Styles */ }
}

/* xl: 1025px - 1440px (Desktops) */
@media (min-width: 1025px) {
  .xl { /* Styles */ }
}

/* 2xl: 1441px+ (Large desktops) */
@media (min-width: 1441px) {
  .xxl { /* Styles */ }
}
```

### Tailwind CSS Breakpoint Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '476px',
      'sm': '641px',
      'md': '769px',
      'lg': '1025px',
      'xl': '1441px',
    },
  },
}
```

## 2. Container & Grid Systems

### Container Specifications
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem; /* 16px base padding */
}

/* Responsive container sizes */
@media (min-width: 476px) {
  .container { 
    padding: 0 1.5rem; /* 24px */
  }
}

@media (min-width: 641px) {
  .container { 
    padding: 0 2rem; /* 32px */
  }
}

@media (min-width: 769px) {
  .container { 
    max-width: 1200px; 
    padding: 0 2.5rem; /* 40px */
  }
}

@media (min-width: 1441px) {
  .container { 
    max-width: 1400px; 
    padding: 0 3rem; /* 48px */
  }
}
```

### Grid Layout System
```css
/* Base grid - mobile first */
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr; /* Single column on mobile */
}

/* Responsive grid variants */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Responsive modifiers */
@media (min-width: 476px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 641px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 769px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lg\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
```

## 3. Component Responsive Specifications

### Header/Navigation Component

#### Mobile (xs - sm)
```css
.header-mobile {
  height: 60px;
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}

.header-mobile .logo {
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
}

.header-mobile .nav-menu {
  display: none; /* Hidden on mobile */
}

.header-mobile .mobile-menu-button {
  display: flex;
  width: 2.5rem;
  height: 2.5rem;
}

.header-mobile .user-avatar {
  width: 2rem;
  height: 2rem;
}

/* Mobile menu overlay */
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-menu.open {
  transform: translateX(0);
}

.mobile-menu .nav-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  font-size: 1.125rem;
}
```

#### Tablet (md)
```css
@media (min-width: 641px) {
  .header-tablet {
    height: 72px;
    padding: 0 2rem;
  }
  
  .header-tablet .logo {
    font-size: 1.5rem; /* 24px */
  }
  
  .header-tablet .nav-menu {
    display: flex;
    gap: 2rem;
  }
  
  .header-tablet .mobile-menu-button {
    display: none;
  }
  
  .header-tablet .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
  }
}
```

#### Desktop (lg+)
```css
@media (min-width: 769px) {
  .header-desktop {
    height: 80px;
    padding: 0 2.5rem;
  }
  
  .header-desktop .nav-menu {
    gap: 3rem;
  }
  
  .header-desktop .nav-item {
    font-size: 1rem;
    font-weight: 500;
  }
  
  .header-desktop .user-dropdown {
    position: relative;
  }
}
```

### Card Component Responsive Behavior

#### Specialist Cards
```css
/* Mobile: Full width stacked */
.specialist-card-mobile {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

.specialist-card-mobile .card-layout {
  display: flex;
  gap: 1rem;
}

.specialist-card-mobile .avatar {
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
}

.specialist-card-mobile .content {
  flex: 1;
  min-width: 0; /* Prevents text overflow */
}

.specialist-card-mobile .title {
  font-size: 1.125rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.specialist-card-mobile .subtitle {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.specialist-card-mobile .meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.specialist-card-mobile .actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.specialist-card-mobile .btn-primary {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Tablet: 2 column grid */
@media (min-width: 641px) {
  .specialist-card-tablet {
    padding: 1.5rem;
  }
  
  .specialist-card-tablet .card-layout {
    display: block;
    text-align: center;
  }
  
  .specialist-card-tablet .avatar {
    width: 5rem;
    height: 5rem;
    margin: 0 auto 1rem;
  }
  
  .specialist-card-tablet .actions {
    justify-content: center;
  }
}

/* Desktop: 3-4 column grid */
@media (min-width: 769px) {
  .specialist-card-desktop {
    padding: 2rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .specialist-card-desktop:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  .specialist-card-desktop .avatar {
    width: 6rem;
    height: 6rem;
  }
}
```

### Search Results Layout

#### Mobile Layout
```css
.search-results-mobile {
  padding: 1rem;
}

.search-results-mobile .filters {
  display: none; /* Hidden by default */
  position: fixed;
  inset: 0;
  z-index: 100;
  background: white;
  padding: 1rem;
  overflow-y: auto;
}

.search-results-mobile .filters.open {
  display: block;
}

.search-results-mobile .filter-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--primary-500);
  color: white;
  box-shadow: var(--shadow-lg);
}

.search-results-mobile .results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
}

.search-results-mobile .sort-dropdown {
  font-size: 0.875rem;
}

.search-results-mobile .results-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-results-mobile .load-more {
  margin-top: 2rem;
  width: 100%;
  padding: 0.75rem;
}
```

#### Tablet Layout
```css
@media (min-width: 641px) {
  .search-results-tablet {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    padding: 2rem;
  }
  
  .search-results-tablet .filters {
    position: static;
    display: block;
    background: var(--gray-50);
    border-radius: 0.5rem;
    padding: 1.5rem;
    height: fit-content;
    top: 2rem;
    position: sticky;
  }
  
  .search-results-tablet .filter-toggle {
    display: none;
  }
  
  .search-results-tablet .results-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

#### Desktop Layout
```css
@media (min-width: 769px) {
  .search-results-desktop {
    grid-template-columns: 300px 1fr;
    gap: 3rem;
    padding: 2.5rem;
  }
  
  .search-results-desktop .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 1025px) {
  .search-results-desktop .results-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Booking Flow Responsive Design

#### Mobile Booking Steps
```css
.booking-flow-mobile {
  padding: 1rem;
}

.booking-flow-mobile .progress-bar {
  margin-bottom: 1.5rem;
}

.booking-flow-mobile .step-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.booking-flow-mobile .form-group {
  margin-bottom: 1.5rem;
}

.booking-flow-mobile .form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-flow-mobile .calendar {
  width: 100%;
  font-size: 0.875rem;
}

.booking-flow-mobile .time-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.booking-flow-mobile .time-slot {
  aspect-ratio: 2/1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.booking-flow-mobile .navigation {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: 1rem;
}

.booking-flow-mobile .btn-back {
  flex: 1;
}

.booking-flow-mobile .btn-continue {
  flex: 2;
}
```

#### Tablet Booking Layout
```css
@media (min-width: 641px) {
  .booking-flow-tablet {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .booking-flow-tablet .form-row {
    flex-direction: row;
  }
  
  .booking-flow-tablet .form-row > * {
    flex: 1;
  }
  
  .booking-flow-tablet .time-slots {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .booking-flow-tablet .navigation {
    position: static;
    justify-content: space-between;
    border-top: none;
    padding-top: 2rem;
  }
  
  .booking-flow-tablet .btn-back,
  .booking-flow-tablet .btn-continue {
    flex: none;
    min-width: 120px;
  }
}
```

#### Desktop Booking Layout
```css
@media (min-width: 769px) {
  .booking-flow-desktop {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem;
  }
  
  .booking-flow-desktop .step-content {
    padding: 2rem;
  }
  
  .booking-flow-desktop .summary-sidebar {
    background: var(--gray-50);
    border-radius: 0.75rem;
    padding: 2rem;
    height: fit-content;
    position: sticky;
    top: 2rem;
  }
  
  .booking-flow-desktop .time-slots {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

## 4. Typography Responsive Scale

### Heading Responsive Sizes
```css
/* Mobile base sizes */
.heading-display { font-size: 2.25rem; line-height: 1.2; }
.heading-h1 { font-size: 1.875rem; line-height: 1.3; }
.heading-h2 { font-size: 1.5rem; line-height: 1.4; }
.heading-h3 { font-size: 1.25rem; line-height: 1.4; }
.heading-h4 { font-size: 1.125rem; line-height: 1.5; }

/* Tablet adjustments */
@media (min-width: 641px) {
  .heading-display { font-size: 3rem; }
  .heading-h1 { font-size: 2.25rem; }
  .heading-h2 { font-size: 1.875rem; }
  .heading-h3 { font-size: 1.5rem; }
  .heading-h4 { font-size: 1.25rem; }
}

/* Desktop scaling */
@media (min-width: 769px) {
  .heading-display { font-size: 4rem; }
  .heading-h1 { font-size: 2.5rem; }
  .heading-h2 { font-size: 2rem; }
  .heading-h3 { font-size: 1.625rem; }
  .heading-h4 { font-size: 1.375rem; }
}

/* Large desktop */
@media (min-width: 1441px) {
  .heading-display { font-size: 4.5rem; }
  .heading-h1 { font-size: 3rem; }
}
```

### Body Text Responsive Scale
```css
/* Mobile base */
.text-lg { font-size: 1rem; line-height: 1.6; }
.text-base { font-size: 0.875rem; line-height: 1.6; }
.text-sm { font-size: 0.75rem; line-height: 1.5; }

/* Tablet and up */
@media (min-width: 641px) {
  .text-lg { font-size: 1.125rem; }
  .text-base { font-size: 1rem; }
  .text-sm { font-size: 0.875rem; }
}

/* Desktop */
@media (min-width: 769px) {
  .text-lg { font-size: 1.25rem; }
}
```

## 5. Spacing Responsive System

### Margin & Padding Scale
```css
/* Mobile spacing (base) */
.space-section { margin: 2rem 0; }
.space-component { margin: 1rem 0; }
.space-element { margin: 0.5rem 0; }

.padding-section { padding: 1rem; }
.padding-component { padding: 0.75rem; }
.padding-element { padding: 0.5rem; }

/* Tablet spacing */
@media (min-width: 641px) {
  .space-section { margin: 3rem 0; }
  .space-component { margin: 1.5rem 0; }
  
  .padding-section { padding: 1.5rem; }
  .padding-component { padding: 1rem; }
}

/* Desktop spacing */
@media (min-width: 769px) {
  .space-section { margin: 4rem 0; }
  .space-component { margin: 2rem 0; }
  
  .padding-section { padding: 2rem; }
  .padding-component { padding: 1.5rem; }
}

/* Large desktop */
@media (min-width: 1441px) {
  .space-section { margin: 5rem 0; }
  .padding-section { padding: 3rem; }
}
```

## 6. Interactive Element Specifications

### Button Responsive Sizing
```css
/* Mobile buttons */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  min-height: 44px; /* iOS touch target */
  min-width: 44px;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  min-height: 36px;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
  min-height: 48px;
}

/* Tablet adjustments */
@media (min-width: 641px) {
  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    min-height: 40px;
  }
  
  .btn-lg {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    min-height: 44px;
  }
}

/* Desktop refinements */
@media (min-width: 769px) {
  .btn {
    padding: 0.5rem 1rem;
    min-height: 36px;
  }
  
  .btn-lg {
    padding: 0.75rem 1.5rem;
    min-height: 40px;
  }
}
```

### Form Input Responsive Sizing
```css
/* Mobile form inputs */
.input {
  padding: 0.75rem 1rem;
  font-size: 1rem; /* Prevents zoom on iOS */
  border-radius: 0.375rem;
  min-height: 44px;
  width: 100%;
}

.input-sm {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  min-height: 40px;
}

.input-lg {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
  min-height: 48px;
}

/* Tablet adjustments */
@media (min-width: 641px) {
  .input {
    font-size: 0.875rem;
    min-height: 40px;
  }
  
  .input-lg {
    font-size: 1rem;
    min-height: 44px;
  }
}

/* Desktop refinements */
@media (min-width: 769px) {
  .input {
    min-height: 36px;
  }
  
  .input-lg {
    min-height: 40px;
  }
}
```

## 7. Image & Media Responsive Guidelines

### Image Optimization by Breakpoint
```css
/* Mobile optimized images */
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 0.375rem;
}

/* Specialist avatar sizes */
.avatar-sm { width: 2rem; height: 2rem; }
.avatar-md { width: 3rem; height: 3rem; }
.avatar-lg { width: 4rem; height: 4rem; }
.avatar-xl { width: 6rem; height: 6rem; }

/* Responsive avatar scaling */
@media (min-width: 641px) {
  .avatar-responsive {
    width: 3rem; 
    height: 3rem;
  }
}

@media (min-width: 769px) {
  .avatar-responsive {
    width: 4rem; 
    height: 4rem;
  }
}

/* Portfolio image grids */
.portfolio-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

@media (min-width: 641px) {
  .portfolio-grid-tablet {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
}

@media (min-width: 769px) {
  .portfolio-grid-desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}
```

### Video Content Responsive
```css
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  border-radius: 0.5rem;
}

.video-container iframe,
.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Different aspect ratios for different screens */
@media (min-width: 641px) {
  .video-container-square {
    padding-bottom: 100%; /* 1:1 aspect ratio */
  }
}

@media (min-width: 769px) {
  .video-container-wide {
    padding-bottom: 42.85%; /* 21:9 aspect ratio */
  }
}
```

## 8. Performance Considerations

### Lazy Loading Implementation
```css
/* Progressive image enhancement */
.image-placeholder {
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
}

.image-loading {
  filter: blur(5px);
  transition: filter 0.3s ease;
}

.image-loaded {
  filter: blur(0);
}

/* Skeleton loaders for responsive content */
.skeleton-card-mobile {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
}

.skeleton-card-mobile .skeleton-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--gray-200);
  margin-bottom: 1rem;
}

.skeleton-card-mobile .skeleton-text {
  height: 1rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-card-mobile .skeleton-text:last-child {
  width: 60%;
}

@media (min-width: 641px) {
  .skeleton-card-tablet .skeleton-avatar {
    width: 5rem;
    height: 5rem;
    margin: 0 auto 1rem;
  }
}
```

### Critical CSS Loading Strategy
```css
/* Critical above-the-fold styles */
.critical-header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  z-index: 50;
}

.critical-hero {
  padding: 2rem 1rem;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
}

/* Non-critical styles loaded asynchronously */
.non-critical-animations {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.non-critical-animations:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

## 9. Touch & Interaction Guidelines

### Touch Target Specifications
```css
/* Minimum touch targets for mobile */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Interactive elements spacing */
.touch-list .touch-item {
  padding: 0.75rem 1rem;
  margin-bottom: 2px;
  background: white;
  border-bottom: 1px solid var(--gray-100);
}

.touch-list .touch-item:active {
  background: var(--gray-50);
}

/* Swipe gesture areas */
.swipe-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.swipe-container::-webkit-scrollbar {
  display: none;
}

.swipe-content {
  display: flex;
  gap: 1rem;
  padding: 0 1rem;
}

.swipe-item {
  flex: 0 0 280px; /* Fixed width for consistent scrolling */
}

@media (min-width: 641px) {
  .swipe-item {
    flex: 0 0 320px;
  }
}
```

### Hover States for Desktop
```css
/* Progressive enhancement for hover */
@media (hover: hover) {
  .card-interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    transition: all 0.2s ease;
  }
  
  .button-interactive:hover {
    background: var(--primary-600);
    transition: background-color 0.2s ease;
  }
  
  .link-interactive:hover {
    color: var(--primary-600);
    text-decoration: underline;
  }
}

/* Focus states for keyboard navigation */
.interactive-element:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.interactive-element:focus:not(:focus-visible) {
  outline: none;
}
```

This comprehensive responsive design system ensures that the booking platform provides optimal user experiences across all devices while maintaining performance and accessibility standards.