# VicheaPro Frontend Redesign for Cambodia

## Overview
Complete frontend transformation from MiyZapis (Ukrainian) to VicheaPro (Cambodian) booking platform.

---

## Design System

### Color Palette

#### Primary Colors (Cambodian Red)
```css
--primary-50: #fef2f2
--primary-100: #fee2e2
--primary-200: #fecaca
--primary-300: #fca5a5
--primary-400: #f87171
--primary-500: #C8102E  /* Main Cambodian red */
--primary-600: #b91c1c
--primary-700: #991b1b
--primary-800: #7f1d1d
--primary-900: #650f1a
```

#### Secondary Colors (Temple Gold)
```css
--secondary-50: #fffef7
--secondary-100: #fffce8
--secondary-200: #fff9c2
--secondary-300: #fff38c
--secondary-400: #ffe74a
--secondary-500: #FFD700  /* Temple gold */
--secondary-600: #e6c200
--secondary-700: #c9a800
--secondary-800: #a38600
--secondary-900: #856d00
```

#### Accent Colors (Cambodian Blue)
```css
--accent-50: #eff6ff
--accent-100: #dbeafe
--accent-200: #bfdbfe
--accent-300: #93c5fd
--accent-400: #60a5fa
--accent-500: #003893  /* Cambodian blue */
--accent-600: #002d75
--accent-700: #002257
--accent-800: #001739
--accent-900: #000c1b
```

#### Background Colors (Cream)
```css
--cream-50: #fefefe
--cream-100: #fdfcfa
--cream-200: #faf8f5  /* Main background */
--cream-300: #f7f4ef
--cream-400: #f4f0e9
--cream-500: #f0ece3
```

### Typography

#### Khmer Fonts
```css
font-family: 'Khmer OS Siemreap', 'Noto Sans Khmer', 'Hanuman', 'Battambang', sans-serif;
```

#### Font Loading
Add to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

#### Font Sizes (Optimized for Khmer)
- Khmer text needs slightly larger sizes for readability
- Base size: 16px (1rem)
- Headings: 1.2rem - 3rem
- Body: 0.875rem - 1rem

### Cultural Design Elements

#### Angkor Wat Patterns
```svg
<!-- Temple spire pattern for decorative elements -->
<pattern id="temple-pattern">
  <path d="M10 0 L20 20 L15 20 L15 30 L5 30 L5 20 L0 20 Z" />
</pattern>

<!-- Lotus flower motif -->
<pattern id="lotus-pattern">
  <circle cx="10" cy="10" r="8" />
  <path d="M10 2 Q15 8 10 14 Q5 8 10 2" />
</pattern>
```

#### Decorative Borders
- Gold temple spire borders for premium content
- Lotus flower corners for cards
- Traditional Khmer geometric patterns

### Icons & Images

#### Logo Requirements
```
VicheaPro Logo:
- Incorporates Angkor Wat silhouette
- Color: Primary red (#C8102E) + Temple gold (#FFD700)
- Khmer text: វិជ្ជាប្រូ
- Modern, clean design
- Multiple versions: full, icon-only, monochrome
```

#### Cultural Icons
- Angkor Wat temple icon for premium features
- Lotus flower for wellness/beauty services
- Traditional Khmer patterns for backgrounds
- Apsara dancer silhouette for cultural elements

---

## Language Support

### Supported Languages

1. **Khmer (Primary)** - ភាសាខ្មែរ
2. **English (Secondary)** - English

### Remove Languages
- Ukrainian (українська)
- Russian (русский)

### Key Translation Categories

#### Navigation
```typescript
{
  'nav.home': {
    en: 'Home',
    kh: 'ទំព័រដើម'
  },
  'nav.services': {
    en: 'Services',
    kh: 'សេវាកម្ម'
  },
  'nav.specialists': {
    en: 'Specialists',
    kh: 'អ្នកជំនាញ'
  },
  'nav.bookings': {
    en: 'Bookings',
    kh: 'ការកក់'
  }
}
```

#### Common Actions
```typescript
{
  'action.book': {
    en: 'Book Now',
    kh: 'កក់ឥឡូវនេះ'
  },
  'action.search': {
    en: 'Search',
    kh: 'ស្វែងរក'
  },
  'action.save': {
    en: 'Save',
    kh: 'រក្សាទុក'
  },
  'action.cancel': {
    en: 'Cancel',
    kh: 'បោះបង់'
  }
}
```

#### Service Categories (Cambodian Context)
```typescript
{
  'category.beauty': {
    en: 'Beauty & Wellness',
    kh: 'សម្រស់និងសុខភាព'
  },
  'category.dental': {
    en: 'Dental Services',
    kh: 'សេវាធ្មេញ'
  },
  'category.medical': {
    en: 'Medical Services',
    kh: 'សេវាពេទ្យ'
  },
  'category.massage': {
    en: 'Massage & Spa',
    kh: 'ម៉ាស្សានិងស្ប៉ា'
  },
  'category.fitness': {
    en: 'Fitness & Training',
    kh: 'កាយសម្ព័ន្ធនិងបណ្តុះបណ្តាល'
  }
}
```

---

## Component Redesign

### Header Component

#### Before (MiyZapis)
- Blue and yellow Ukrainian colors
- Ukrainian flag elements
- "MiyZapis" branding

#### After (VicheaPro)
```tsx
<header className="bg-cream-200 border-b border-primary-200">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo with Angkor Wat */}
      <div className="flex items-center space-x-2">
        <AngkorWatIcon className="w-10 h-10 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-primary-500">VicheaPro</h1>
          <p className="text-xs text-accent-500 font-khmer">វិជ្ជាប្រូ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex space-x-6">
        <a className="text-gray-700 hover:text-primary-500">
          {t('nav.home')}
        </a>
        <a className="text-gray-700 hover:text-primary-500">
          {t('nav.services')}
        </a>
        <a className="text-gray-700 hover:text-primary-500">
          {t('nav.specialists')}
        </a>
      </nav>

      {/* Language & User Menu */}
      <div className="flex items-center space-x-4">
        <LanguageToggle languages={['kh', 'en']} />
        <UserDropdown />
      </div>
    </div>
  </div>
</header>
```

### Homepage Redesign

#### Hero Section
```tsx
<section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 text-white py-20">
  {/* Angkor Wat pattern overlay */}
  <div className="absolute inset-0 opacity-10">
    <TemplePattern />
  </div>

  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-5xl md:text-6xl font-bold mb-6">
        {t('hero.title')} {/* "Find Expert Services in Cambodia" */}
      </h1>
      <p className="text-xl md:text-2xl mb-8 font-khmer">
        {t('hero.subtitle')} {/* "រកសេវាកម្មអ្នកជំនាញនៅកម្ពុជា" */}
      </p>

      {/* Search bar with Cambodian styling */}
      <div className="bg-white rounded-2xl shadow-2xl p-2">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            className="flex-1 px-6 py-4 border-none focus:ring-0"
          />
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold">
            {t('action.search')}
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### Popular Services Section
```tsx
<section className="py-16 bg-cream-100">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12 text-primary-500">
      {t('services.popular')}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map(category => (
        <div
          key={category.id}
          className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
        >
          {/* Gold border on hover */}
          <div className="absolute inset-0 border-2 border-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />

          <div className="p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-4">
              <category.icon className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
            <p className="text-sm text-gray-600 font-khmer">{category.nameKh}</p>
            <p className="text-xs text-gray-500 mt-2">
              {category.count} {t('services.available')}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### Service Card Component

```tsx
<div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
  {/* Premium badge with gold */}
  {service.isPremium && (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
        <TempleIcon className="w-3 h-3" />
        <span>{t('service.premium')}</span>
      </div>
    </div>
  )}

  {/* Service image with overlay */}
  <div className="relative h-48 overflow-hidden">
    <img
      src={service.image}
      alt={service.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

    {/* Price badge */}
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
      <p className="text-2xl font-bold text-primary-500">
        ${service.price}
      </p>
    </div>
  </div>

  {/* Service details */}
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2 text-gray-900">
      {service.name}
    </h3>
    <p className="text-sm text-gray-600 font-khmer mb-4">
      {service.nameKh}
    </p>

    {/* Specialist info */}
    <div className="flex items-center space-x-3 mb-4">
      <img
        src={service.specialist.avatar}
        alt={service.specialist.name}
        className="w-10 h-10 rounded-full border-2 border-secondary-500"
      />
      <div>
        <p className="font-medium text-gray-900">{service.specialist.name}</p>
        <div className="flex items-center space-x-1">
          <StarIcon className="w-4 h-4 text-secondary-500" />
          <span className="text-sm text-gray-600">{service.rating}</span>
        </div>
      </div>
    </div>

    {/* Book button */}
    <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold transition-colors">
      {t('action.book')}
    </button>
  </div>
</div>
```

### Footer Component

```tsx
<footer className="bg-primary-900 text-white py-12">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Brand */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <AngkorWatIcon className="w-8 h-8 text-secondary-500" />
          <div>
            <h3 className="text-xl font-bold">VicheaPro</h3>
            <p className="text-xs font-khmer">វិជ្ជាប្រូ</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">
          {t('footer.tagline')}
        </p>
      </div>

      {/* Links */}
      <div>
        <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="/about" className="text-gray-300 hover:text-secondary-500">{t('footer.about')}</a></li>
          <li><a href="/careers" className="text-gray-300 hover:text-secondary-500">{t('footer.careers')}</a></li>
          <li><a href="/contact" className="text-gray-300 hover:text-secondary-500">{t('footer.contact')}</a></li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="/help" className="text-gray-300 hover:text-secondary-500">{t('footer.help')}</a></li>
          <li><a href="/faq" className="text-gray-300 hover:text-secondary-500">{t('footer.faq')}</a></li>
          <li><a href="/terms" className="text-gray-300 hover:text-secondary-500">{t('footer.terms')}</a></li>
        </ul>
      </div>

      {/* Social */}
      <div>
        <h4 className="font-semibold mb-4">{t('footer.social')}</h4>
        <div className="flex space-x-4">
          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-secondary-500 rounded-lg flex items-center justify-center transition-colors">
            <FacebookIcon className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-secondary-500 rounded-lg flex items-center justify-center transition-colors">
            <TelegramIcon className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-secondary-500 rounded-lg flex items-center justify-center transition-colors">
            <InstagramIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>

    {/* Copyright */}
    <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
      <p>© 2025 VicheaPro (វិជ្ជាប្រូ). {t('footer.rights')}</p>
    </div>
  </div>
</footer>
```

---

## Mobile Responsive Design

### Khmer Text Considerations
- Larger touch targets (min 44x44px) for Khmer characters
- Increased line-height (1.6-1.8) for readability
- Generous padding around text

### Navigation
```tsx
<MobileNav>
  <div className="bg-cream-200 border-b border-primary-200">
    <div className="flex items-center justify-between p-4">
      <AngkorWatIcon className="w-8 h-8 text-primary-500" />
      <button className="p-2">
        <MenuIcon className="w-6 h-6 text-primary-500" />
      </button>
    </div>
  </div>

  {/* Slide-out menu with traditional pattern overlay */}
  <MobileMenu className="bg-white">
    <div className="absolute inset-0 opacity-5">
      <LotusPattern />
    </div>
    {/* Menu items */}
  </MobileMenu>
</MobileNav>
```

---

## Animation & Interactions

### Cambodian-Themed Animations

#### Temple Glow Effect
```css
@keyframes temple-glow {
  0%, 100% {
    box-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #C8102E;
  }
  50% {
    box-shadow: 0 0 40px #FFD700, 0 0 80px #FFD700, 0 0 100px #C8102E;
  }
}

.premium-card {
  animation: temple-glow 3s ease-in-out infinite;
}
```

#### Cambodia Wave
```css
@keyframes cambodia-wave {
  0%, 100% {
    background: linear-gradient(45deg, #C8102E 0%, #FFD700 100%);
    transform: rotate(0deg);
  }
  50% {
    background: linear-gradient(225deg, #C8102E 0%, #FFD700 100%);
    transform: rotate(5deg);
  }
}
```

---

## Currency & Payment

### Display
- Primary: USD ($)
- Secondary: KHR (៛) - Cambodian Riel
- Conversion rate display

### Format
```typescript
{
  currency: 'USD',
  symbol: '$',
  khr: {
    symbol: '៛',
    rate: 4100 // 1 USD = ~4,100 KHR
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Design System ✅
- [x] Update Tailwind config with Cambodian colors
- [x] Add Khmer font families
- [x] Create Cambodian animations
- [ ] Design Angkor Wat logo
- [ ] Create temple pattern SVGs

### Phase 2: Language System
- [ ] Add Khmer language to LanguageContext
- [ ] Translate all UI strings to Khmer
- [ ] Remove Ukrainian/Russian languages
- [ ] Update language selector component
- [ ] Add font loading for Khmer scripts

### Phase 3: Component Redesign
- [ ] Update Header with VicheaPro branding
- [ ] Redesign Homepage hero section
- [ ] Update service cards with Cambodian styling
- [ ] Redesign Footer with cultural elements
- [ ] Update all buttons/inputs with new colors

### Phase 4: Cultural Elements
- [ ] Add Angkor Wat icon component
- [ ] Create lotus flower decorations
- [ ] Implement temple spire borders
- [ ] Add traditional Khmer patterns
- [ ] Create premium badge with gold styling

### Phase 5: Mobile Optimization
- [ ] Test Khmer text rendering on mobile
- [ ] Optimize touch targets for Khmer input
- [ ] Update mobile navigation
- [ ] Test responsive layouts

### Phase 6: Content & Assets
- [ ] Replace all Ukrainian references with Cambodian
- [ ] Update category names for Cambodian market
- [ ] Create culturally appropriate stock images
- [ ] Update service descriptions
- [ ] Localize all marketing copy

---

## File Structure

```
frontend/
├── public/
│   ├── assets/
│   │   ├── logos/
│   │   │   ├── vichea-pro-full.svg
│   │   │   ├── vichea-pro-icon.svg
│   │   │   └── angkor-wat-icon.svg
│   │   ├── patterns/
│   │   │   ├── temple-pattern.svg
│   │   │   ├── lotus-pattern.svg
│   │   │   └── khmer-border.svg
│   │   └── images/
│   │       ├── hero-cambodia.jpg
│   │       └── cultural-elements/
│   └── fonts/
│       ├── KhmerOSSiemreap.woff2
│       └── NotoSansKhmer.woff2
├── src/
│   ├── components/
│   │   ├── cultural/
│   │   │   ├── AngkorWatIcon.tsx
│   │   │   ├── LotusPattern.tsx
│   │   │   ├── TempleSpireBorder.tsx
│   │   │   └── KhmerDecoration.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx (updated)
│   │   │   ├── Footer.tsx (updated)
│   │   │   └── MobileNav.tsx (updated)
│   │   └── ui/
│   │       ├── Button.tsx (updated colors)
│   │       ├── Card.tsx (updated styling)
│   │       └── Badge.tsx (gold premium badge)
│   ├── contexts/
│   │   └── LanguageContext.tsx (add Khmer)
│   ├── styles/
│   │   ├── globals.css (updated)
│   │   ├── khmer.css (new)
│   │   └── cambodian-patterns.css (new)
│   └── translations/
│       ├── kh.json (Khmer translations)
│       └── en.json (English translations)
```

---

## Notes

- All Khmer text should use proper Unicode encoding
- Test rendering on iOS/Android devices
- Ensure RTL/LTR text handling works correctly
- Maintain accessibility standards (WCAG 2.1 AA)
- Optimize Khmer font loading for performance
- Cultural sensitivity review by native Cambodians recommended
- Color contrast ratios meet accessibility requirements
- Premium features use temple gold highlighting
- Mobile-first approach for Cambodian market

---

## Next Steps

1. Complete Tailwind color system updates ✅
2. Design and implement VicheaPro logo
3. Add Khmer language translations
4. Update all components with new design system
5. Create cultural SVG assets (Angkor Wat, Lotus, etc.)
6. Test on multiple devices and browsers
7. Get feedback from Cambodian users
8. Optimize performance for Cambodia internet speeds
