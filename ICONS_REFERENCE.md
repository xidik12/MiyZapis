# 🎨 MiyZapis Platform Icons Reference

## Icon Library
**[Heroicons v2](https://heroicons.com/)** by Tailwind Labs
- **Outline (24x24)**: Used for most UI elements, buttons, navigation
- **Solid (24x24)**: Used for active/selected states, emphasis

---

## 📋 Complete Icon Inventory

### Navigation & Core UI
| Icon | Usage | Type |
|------|-------|------|
| `HomeIcon` | Home navigation, dashboard | Outline/Solid |
| `MagnifyingGlassIcon` | Search functionality | Outline |
| `Bars3Icon` | Mobile menu toggle | Outline |
| `BellIcon` | Notifications | Outline/Solid |
| `UserCircleIcon` | User profile, account | Outline |
| `ArrowLeftIcon` | Back navigation | Outline |
| `XMarkIcon` | Close modals, dismiss | Outline |

### Content & Actions
| Icon | Usage | Type |
|------|-------|------|
| `HeartIcon` | Favorites, likes | Outline/Solid |
| `StarIcon` | Ratings, reviews | Outline/Solid |
| `ChatBubbleLeftIcon` | Messages, comments | Outline |
| `CalendarIcon` | Date selection, bookings | Outline |
| `ClockIcon` | Time, duration | Outline |
| `MapPinIcon` | Location, addresses | Outline |
| `CameraIcon` | Photo upload | Outline |
| `PhotoIcon` | Image placeholder | Outline |

### Settings & User Management
| Icon | Usage | Type |
|------|-------|------|
| `ShieldCheckIcon` | Security, password | Outline |
| `GlobeAltIcon` | Language selection | Outline |
| `CreditCardIcon` | Payments, billing | Outline |
| `DevicePhoneMobileIcon` | Phone settings | Outline |
| `EyeIcon` | Show password | Outline |
| `EyeSlashIcon` | Hide password | Outline |
| `PencilIcon` | Edit | Outline |
| `TrashIcon` | Delete | Outline |
| `PlusIcon` | Add new item | Outline |

### Search & Filters
| Icon | Usage | Type |
|------|-------|------|
| `AdjustmentsHorizontalIcon` | Filter settings | Outline |
| `FunnelIcon` | Filter toggle | Outline |
| `ListBulletIcon` | List view | Outline |
| `Squares2X2Icon` | Grid view | Outline |
| `CheckBadgeIcon` | Verified badge | Outline |

### Feedback & Status
| Icon | Usage | Type |
|------|-------|------|
| `CheckCircleIcon` | Success, completed | Outline |
| `XCircleIcon` | Error, failed | Outline |
| `CheckIcon` | Confirm, selected | Outline |
| `ExclamationTriangleIcon` | Warning | Outline |
| `FlagIcon` | Report | Outline |

### Communication
| Icon | Usage | Type |
|------|-------|------|
| `EnvelopeIcon` | Email | Outline |
| `UserIcon` | User mention, profile | Outline |

### Theme & Display
| Icon | Usage | Type |
|------|-------|------|
| `SunIcon` | Light theme | Outline |
| `MoonIcon` | Dark theme | Outline |
| `ChartBarIcon` | Analytics, stats | Outline/Solid |

---

## 🎯 Usage Guidelines

### Outline vs Solid
- **Outline**: Default state, inactive items, general UI
- **Solid**: Active state, selected items, emphasis

### Size Classes
```tsx
// Small (16px)
className="w-4 h-4"

// Medium (20px)
className="w-5 h-5"

// Large (24px)
className="w-6 h-6"

// Extra Large (32px)
className="w-8 h-8"

// Huge (48px)
className="w-12 h-12"
```

### Color Classes
```tsx
// Primary
className="text-primary-600 dark:text-primary-400"

// Success
className="text-green-600 dark:text-green-400"

// Warning
className="text-amber-600 dark:text-amber-400"

// Error
className="text-red-600 dark:text-red-400"

// Muted
className="text-gray-500 dark:text-gray-400"
```

---

## 📦 Import Examples

### Outline Icons
```tsx
import {
  UserCircleIcon,
  BellIcon,
  HeartIcon,
  StarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
```

### Solid Icons (Active States)
```tsx
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';
```

### Usage with State
```tsx
<button>
  {isFavorite ? (
    <HeartIconSolid className="w-5 h-5 text-red-500" />
  ) : (
    <HeartIcon className="w-5 h-5 text-gray-400" />
  )}
</button>
```

---

## 🔗 Resources
- [Heroicons Official Site](https://heroicons.com/)
- [Heroicons GitHub](https://github.com/tailwindlabs/heroicons)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)

---

**Total Icons Used**: 40+ unique icons
**Icon Library Version**: @heroicons/react v2
**Last Updated**: December 25, 2025
