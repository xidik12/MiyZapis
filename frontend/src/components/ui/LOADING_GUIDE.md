# Loading Components Guide

A comprehensive guide to using the unified loading system across the MiyZapis platform.

## Overview

The platform provides multiple loading components for different contexts, all with smooth animations and consistent styling:

1. **FullScreenLoader** - For full-page loading states
2. **LoadingAnimation** - Versatile animated loaders with multiple types
3. **InlineLoader** - Compact loaders for buttons and inline contexts
4. **LoadingSpinner** - Legacy component (wraps LoadingAnimation)

## Animation Types

All loading components support these animation types:

- `spinner` - Classic spinning circle (default)
- `sandwatch` - Flipping sandwatch with falling sand particles
- `magnifying-glass` - Searching magnifying glass with particles
- `dots` - Three bouncing dots
- `pulse` - Pulsing circles

## Full Screen Loader

Use for page transitions, initial app loading, or long operations.

### Basic Usage

```tsx
import { FullScreenLoader } from '@/components/ui';

function MyPage() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <FullScreenLoader
        isOpen={loading}
        title="Loading your data"
        subtitle="This won't take long"
        animationType="magnifying-glass"
      />
      {/* Your content */}
    </>
  );
}
```

### With Progress Bar

```tsx
<FullScreenLoader
  isOpen={true}
  title="Uploading files"
  subtitle="Processing your documents"
  animationType="sandwatch"
  showProgress={true}
  progress={uploadProgress}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `true` | Show/hide the loader |
| `title` | string | `"Loading"` | Main title text |
| `subtitle` | string | - | Optional subtitle |
| `animationType` | LoadingAnimationType | `"spinner"` | Type of animation |
| `showProgress` | boolean | `false` | Show progress bar |
| `progress` | number | `0` | Progress percentage (0-100) |

## Loading Animation

Versatile component for any loading context. Perfect for cards, sections, or custom layouts.

### Basic Usage

```tsx
import { LoadingAnimation } from '@/components/ui';

<LoadingAnimation
  type="sandwatch"
  size="lg"
  color="primary"
  text="Loading bookings..."
/>
```

### In a Card

```tsx
<div className="card p-8">
  <LoadingAnimation
    type="magnifying-glass"
    size="xl"
    color="primary"
    text="Searching for specialists..."
  />
</div>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | LoadingAnimationType | `"spinner"` | Animation type |
| `size` | 'sm' \| 'md' \| 'lg' \| 'xl' | `"md"` | Size of animation |
| `color` | 'primary' \| 'secondary' \| 'white' \| 'gray' | `"primary"` | Color theme |
| `className` | string | - | Additional classes |
| `text` | string | - | Optional loading text |

## Inline Loader

Compact loader for buttons and tight spaces.

### In Buttons

```tsx
import { InlineLoader } from '@/components/ui';

<button disabled={loading} className="btn-primary">
  {loading && <InlineLoader size="sm" color="white" className="mr-2" />}
  {loading ? 'Saving...' : 'Save Changes'}
</button>
```

### In Text

```tsx
<p className="text-gray-600">
  Processing your request <InlineLoader size="xs" color="current" />
</p>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'xs' \| 'sm' \| 'md' | `"sm"` | Size of spinner |
| `color` | 'current' \| 'primary' \| 'white' \| 'gray' | `"current"` | Color (current = inherit) |
| `className` | string | - | Additional classes |

## Use Cases & Best Practices

### 1. Page Loading

```tsx
// Use FullScreenLoader with pulse or spinner
<FullScreenLoader
  isOpen={!dataLoaded}
  title="Loading Dashboard"
  animationType="pulse"
/>
```

### 2. Search Operations

```tsx
// Use magnifying-glass animation
<LoadingAnimation
  type="magnifying-glass"
  size="lg"
  text="Searching..."
/>
```

### 3. File Uploads

```tsx
// Use sandwatch with progress
<FullScreenLoader
  isOpen={uploading}
  title="Uploading Files"
  animationType="sandwatch"
  showProgress={true}
  progress={uploadProgress}
/>
```

### 4. Button Loading States

```tsx
// Use InlineLoader
<button disabled={submitting}>
  {submitting && <InlineLoader size="sm" color="white" className="mr-2" />}
  Submit Form
</button>
```

### 5. Data Fetching in Cards

```tsx
// Use LoadingAnimation with dots
{loading ? (
  <LoadingAnimation
    type="dots"
    size="md"
    text="Loading services..."
  />
) : (
  <ServicesList data={services} />
)}
```

### 6. Background Processes

```tsx
// Use pulse animation
<LoadingAnimation
  type="pulse"
  size="sm"
  color="secondary"
/>
```

## Animation Type Guidelines

| Animation | Best For | Use Case |
|-----------|----------|----------|
| **spinner** | General loading | Default for most situations |
| **sandwatch** | Time-based operations | Uploads, processing, waiting |
| **magnifying-glass** | Search operations | Search, filtering, discovery |
| **dots** | Compact spaces | Cards, small sections, lists |
| **pulse** | Background operations | Auto-save, sync, real-time updates |

## Color Guidelines

- **primary** - Main actions, important operations
- **secondary** - Alternative actions, less critical
- **white** - Dark backgrounds, colored buttons
- **gray** - Subtle loading, neutral contexts
- **current** - Inherit from parent (InlineLoader only)

## Accessibility

All loading components include:
- `role="status"` for screen readers
- `aria-label` or `aria-live` attributes
- Screen reader-only text for context
- Reduced motion support (via Framer Motion)

## Performance Tips

1. **Lazy Load** - Import components only when needed
2. **Conditional Render** - Only render when actually loading
3. **Memoize** - Use `React.memo()` for complex loading states
4. **Progress Feedback** - Show progress bars for operations >3 seconds

## Examples

### Complete Page Loading Example

```tsx
import { useState, useEffect } from 'react';
import { FullScreenLoader } from '@/components/ui';

function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await fetchDashboardData();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <FullScreenLoader
        isOpen={true}
        title="Loading Dashboard"
        subtitle="Preparing your data"
        animationType="pulse"
      />
    );
  }

  return <DashboardContent />;
}
```

### Search with Loading

```tsx
import { LoadingAnimation } from '@/components/ui';

function SearchResults({ query, results, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingAnimation
          type="magnifying-glass"
          size="xl"
          text={`Searching for "${query}"...`}
        />
      </div>
    );
  }

  return <ResultsList results={results} />;
}
```

### Button with Loading State

```tsx
import { InlineLoader } from '@/components/ui';

function SubmitButton() {
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      await saveData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={saving}
      className="btn-primary"
    >
      {saving && <InlineLoader size="sm" color="white" className="mr-2" />}
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  );
}
```

## Migration from Old Loaders

### Old LoadingSpinner

```tsx
// Before
<LoadingSpinner size="md" color="primary" />

// After (still works)
<LoadingSpinner size="md" color="primary" type="spinner" />

// Better
<LoadingAnimation type="spinner" size="md" color="primary" />
```

### Old FullScreenHandshakeLoader

```tsx
// Before
<FullScreenHandshakeLoader
  title="Loading"
  subtitle="Please wait"
/>

// After (still works)
<FullScreenHandshakeLoader
  title="Loading"
  subtitle="Please wait"
  animationType="pulse"
/>

// Better
<FullScreenLoader
  isOpen={true}
  title="Loading"
  subtitle="Please wait"
  animationType="pulse"
/>
```

## Troubleshooting

### Animation Not Showing

- Check that Framer Motion is installed
- Verify the component is actually rendering
- Check console for React errors

### Performance Issues

- Reduce animation complexity in large lists
- Use `dots` or `pulse` for better performance
- Consider debouncing loading states

### Styling Issues

- Use `className` prop to override styles
- Check dark mode compatibility
- Verify Tailwind classes are being generated

## Support

For issues or questions about loading components, check:
- Component source code in `/frontend/src/components/ui/`
- Tailwind configuration for custom classes
- Framer Motion documentation for animation details
