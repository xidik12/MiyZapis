# 🎨 Heroicons → Phosphor Icons Mapping

## Icon Weight Strategy
- **Regular**: Default/inactive state (replaces Heroicons outline)
- **Fill**: Active/selected state (replaces Heroicons solid)

## Complete Icon Mapping

| Current (Heroicons) | New (Phosphor) | File Names |
|-------------------|---------------|-----------|
| **Navigation & Layout** |
| HomeIcon | House | `house.svg` / `house-fill.svg` |
| MagnifyingGlassIcon | MagnifyingGlass | `magnifying-glass.svg` / `magnifying-glass-fill.svg` |
| Bars3Icon | List | `list.svg` / `list-fill.svg` |
| BellIcon | Bell | `bell.svg` / `bell-fill.svg` |
| UserCircleIcon | UserCircle | `user-circle.svg` / `user-circle-fill.svg` |
| ArrowLeftIcon | ArrowLeft | `arrow-left.svg` / `arrow-left-fill.svg` |
| XMarkIcon | X | `x.svg` / `x-fill.svg` |
| **Content & Actions** |
| HeartIcon | Heart | `heart.svg` / `heart-fill.svg` |
| StarIcon | Star | `star.svg` / `star-fill.svg` |
| ChatBubbleLeftIcon | ChatCircle | `chat-circle.svg` / `chat-circle-fill.svg` |
| CalendarIcon | Calendar | `calendar.svg` / `calendar-fill.svg` |
| ClockIcon | Clock | `clock.svg` / `clock-fill.svg` |
| MapPinIcon | MapPin | `map-pin.svg` / `map-pin-fill.svg` |
| CameraIcon | Camera | `camera.svg` / `camera-fill.svg` |
| PhotoIcon | Image | `image.svg` / `image-fill.svg` |
| **Settings & User** |
| ShieldCheckIcon | ShieldCheck | `shield-check.svg` / `shield-check-fill.svg` |
| GlobeAltIcon | Globe | `globe.svg` / `globe-fill.svg` |
| CreditCardIcon | CreditCard | `credit-card.svg` / `credit-card-fill.svg` |
| DevicePhoneMobileIcon | DeviceMobile | `device-mobile.svg` / `device-mobile-fill.svg` |
| EyeIcon | Eye | `eye.svg` / `eye-fill.svg` |
| EyeSlashIcon | EyeSlash | `eye-slash.svg` / `eye-slash-fill.svg` |
| PencilIcon | Pencil | `pencil.svg` / `pencil-fill.svg` |
| TrashIcon | Trash | `trash.svg` / `trash-fill.svg` |
| PlusIcon | Plus | `plus.svg` / `plus-fill.svg` |
| **Search & Filters** |
| AdjustmentsHorizontalIcon | Sliders | `sliders.svg` / `sliders-fill.svg` |
| FunnelIcon | Funnel | `funnel.svg` / `funnel-fill.svg` |
| ListBulletIcon | ListBullets | `list-bullets.svg` / `list-bullets-fill.svg` |
| Squares2X2Icon | SquaresFour | `squares-four.svg` / `squares-four-fill.svg` |
| CheckBadgeIcon | SealCheck | `seal-check.svg` / `seal-check-fill.svg` |
| **Feedback & Status** |
| CheckCircleIcon | CheckCircle | `check-circle.svg` / `check-circle-fill.svg` |
| XCircleIcon | XCircle | `x-circle.svg` / `x-circle-fill.svg` |
| CheckIcon | Check | `check.svg` / `check-fill.svg` |
| ExclamationTriangleIcon | Warning | `warning.svg` / `warning-fill.svg` |
| FlagIcon | Flag | `flag.svg` / `flag-fill.svg` |
| **Communication** |
| EnvelopeIcon | Envelope | `envelope.svg` / `envelope-fill.svg` |
| UserIcon | User | `user.svg` / `user-fill.svg` |
| **Theme & Display** |
| SunIcon | Sun | `sun.svg` / `sun-fill.svg` |
| MoonIcon | Moon | `moon.svg` / `moon-fill.svg` |
| ChartBarIcon | ChartBar | `chart-bar.svg` / `chart-bar-fill.svg` |

## File Paths

### Regular (Default State)
```
/Users/salakhitdinovkhidayotullo/MiyZapis/MiyZapis/frontend/icons/phosphor-icons/SVGs/regular/
```

### Fill (Active State)
```
/Users/salakhitdinovkhidayotullo/MiyZapis/MiyZapis/frontend/icons/phosphor-icons/SVGs/fill/
```

## Usage Example

```typescript
// Component path: frontend/src/components/icons/HeartIcon.tsx
import React from 'react';
import HeartRegular from '../../../icons/phosphor-icons/SVGs/regular/heart.svg?react';
import HeartFill from '../../../icons/phosphor-icons/SVGs/fill/heart.svg?react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const HeartIcon: React.FC<IconProps> = ({ className = '', active = false }) => {
  const Icon = active ? HeartFill : HeartRegular;
  return <Icon className={className} />;
};
```
