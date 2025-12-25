# 🎨 Custom Icons Implementation Guide

## 📐 Icon Specifications

### Required Format
- **Format**: SVG (Scalable Vector Graphics)
- **Why SVG**: Resolution-independent, small file size, customizable with CSS

### Size Requirements
- **Canvas Size**: 24x24 pixels (matches Heroicons)
- **Viewbox**: `viewBox="0 0 24 24"`
- **Stroke Width**: 1.5px for outline style, solid fill for filled style
- **Padding**: 1-2px safe area from edges

### Style Variants
You need **TWO versions** of each icon:

1. **Outline** (Default/Inactive state)
   - Stroke-based, no fill
   - `stroke="currentColor"`
   - `fill="none"`
   - Stroke width: 1.5

2. **Solid** (Active/Selected state)
   - Fill-based, no stroke
   - `fill="currentColor"`
   - `stroke="none"`

---

## 📁 File Structure

```
frontend/src/
├── assets/
│   └── icons/
│       ├── outline/
│       │   ├── home.svg
│       │   ├── heart.svg
│       │   ├── search.svg
│       │   └── ...
│       └── solid/
│           ├── home.svg
│           ├── heart.svg
│           ├── search.svg
│           └── ...
├── components/
│   └── icons/
│       ├── index.ts          # Export all icons
│       ├── HomeIcon.tsx
│       ├── HeartIcon.tsx
│       └── SearchIcon.tsx
```

---

## 🎯 SVG Template

### Outline Icon Template
```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  stroke-width="1.5"
  stroke="currentColor"
>
  <!-- Your icon path here -->
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M12 4.5v15m7.5-7.5h-15"
  />
</svg>
```

### Solid Icon Template
```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
>
  <!-- Your icon path here -->
  <path
    fill-rule="evenodd"
    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
    clip-rule="evenodd"
  />
</svg>
```

---

## 🔧 Implementation

### Step 1: Create Icon Component

**File**: `frontend/src/components/icons/HeartIcon.tsx`

```typescript
import React from 'react';

interface IconProps {
  className?: string;
  solid?: boolean;
}

export const HeartIcon: React.FC<IconProps> = ({ className = '', solid = false }) => {
  if (solid) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
};
```

### Step 2: Export All Icons

**File**: `frontend/src/components/icons/index.ts`

```typescript
export { HeartIcon } from './HeartIcon';
export { HomeIcon } from './HomeIcon';
export { SearchIcon } from './SearchIcon';
export { UserIcon } from './UserIcon';
export { BellIcon } from './BellIcon';
// ... export all your custom icons
```

### Step 3: Use in Components

```typescript
// Before (Heroicons)
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

// After (Custom)
import { HeartIcon } from '@/components/icons';

// Usage
<HeartIcon className="w-5 h-5" />              {/* Outline */}
<HeartIcon solid className="w-5 h-5" />        {/* Solid */}
```

---

## 🎨 Where to Find/Create Custom Icons

### Free Icon Resources
1. **[Iconoir](https://iconoir.com/)** - 1,300+ SVG icons
2. **[Tabler Icons](https://tabler-icons.io/)** - 4,000+ SVG icons
3. **[Lucide](https://lucide.dev/)** - Fork of Feather Icons
4. **[Phosphor Icons](https://phosphoricons.com/)** - 6,000+ icons
5. **[Bootstrap Icons](https://icons.getbootstrap.com/)** - 1,800+ icons
6. **[Feather Icons](https://feathericons.com/)** - 280+ icons

### Icon Design Tools
1. **[Figma](https://figma.com)** - Design custom icons
2. **[Inkscape](https://inkscape.org/)** - Free SVG editor
3. **[Adobe Illustrator](https://adobe.com/illustrator)** - Professional tool
4. **[Sketch](https://sketch.com)** - Mac-only design tool

### Icon Optimization
After creating/downloading, optimize with:
- **[SVGO](https://github.com/svg/svgo)** - SVG optimizer
- **[SVGOMG](https://jakearchibald.github.io/svgomg/)** - Online SVG optimizer

---

## 📝 Design Guidelines

### Consistency Checklist
- ✅ All icons use same viewBox (0 0 24 24)
- ✅ Consistent stroke width (1.5px for outline)
- ✅ Rounded line caps and joins for outline
- ✅ Same visual weight across all icons
- ✅ Centered in 24x24 canvas with 1-2px padding
- ✅ Use currentColor for stroke/fill (makes them colorable via CSS)

### Good Practices
```svg
<!-- ✅ GOOD - Uses currentColor -->
<svg fill="currentColor" viewBox="0 0 24 24">
  <path d="..."/>
</svg>

<!-- ❌ BAD - Hard-coded color -->
<svg fill="#000000" viewBox="0 0 24 24">
  <path d="..."/>
</svg>

<!-- ✅ GOOD - Proper viewBox -->
<svg viewBox="0 0 24 24">
  <path d="..."/>
</svg>

<!-- ❌ BAD - Wrong viewBox -->
<svg viewBox="0 0 512 512">
  <path d="..."/>
</svg>
```

---

## 🔄 Migration Strategy

### Gradual Replacement
1. Create custom icon components one by one
2. Replace in non-critical components first
3. Test thoroughly
4. Replace in critical components
5. Remove Heroicons dependency when done

### Search & Replace
```bash
# Find all Heroicons imports
grep -r "@heroicons/react" frontend/src

# Replace one icon at a time
# Example: Replace HeartIcon
find frontend/src -name "*.tsx" -exec sed -i '' \
  "s/@heroicons\/react\/24\/outline/@\/components\/icons/g" {} +
```

---

## 💡 Example: Complete Custom Icon Set

### HomeIcon.tsx
```typescript
import React from 'react';

interface IconProps {
  className?: string;
  solid?: boolean;
}

export const HomeIcon: React.FC<IconProps> = ({ className = '', solid = false }) => {
  if (solid) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
      </svg>
    );
  }

  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
};
```

---

## 🎯 Quick Start Checklist

- [ ] Choose icon source (custom design or icon library)
- [ ] Create `frontend/src/components/icons/` directory
- [ ] Download/create icons in SVG format (24x24, outline + solid)
- [ ] Optimize SVGs with SVGO
- [ ] Create React component for each icon
- [ ] Export all icons from index.ts
- [ ] Replace Heroicons imports gradually
- [ ] Test in all screen sizes and themes
- [ ] Remove Heroicons dependency

---

## 🚀 Benefits of Custom Icons

✅ **Brand Consistency** - Match your brand style
✅ **File Size** - Only include icons you use
✅ **Customization** - Full control over design
✅ **No External Dependency** - Faster builds
✅ **Unique Look** - Stand out from other platforms

---

**Need Help?** I can help you:
1. Convert your custom SVGs to React components
2. Set up the icon system
3. Migrate from Heroicons to custom icons
4. Optimize your icon files
