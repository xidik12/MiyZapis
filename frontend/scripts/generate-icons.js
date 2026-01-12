/**
 * Automated Icon Generator for Panhaha
 * Converts Heroicons to Phosphor icon wrappers
 */

const fs = require('fs');
const path = require('path');

// Icon mapping: Heroicon name → Phosphor name
const iconMappings = {
  // Navigation & Layout
  'HomeIcon': { phosphor: 'House', hasVariants: true },
  'MagnifyingGlassIcon': { phosphor: 'MagnifyingGlass', hasVariants: false },
  'ListIcon': { phosphor: 'List', hasVariants: false },
  'BellIcon': { phosphor: 'Bell', hasVariants: true },
  'UserCircleIcon': { phosphor: 'UserCircle', hasVariants: true },
  'ArrowLeftIcon': { phosphor: 'ArrowLeft', hasVariants: false },
  'XMarkIcon': { phosphor: 'X', hasVariants: false },
  'ChevronDownIcon': { phosphor: 'CaretDown', hasVariants: false },
  'ChevronUpIcon': { phosphor: 'CaretUp', hasVariants: false },
  'ChevronLeftIcon': { phosphor: 'CaretLeft', hasVariants: false },
  'ChevronRightIcon': { phosphor: 'CaretRight', hasVariants: false },

  // Content & Actions
  'HeartIcon': { phosphor: 'Heart', hasVariants: true },
  'StarIcon': { phosphor: 'Star', hasVariants: true },
  'ChatBubbleLeftIcon': { phosphor: 'ChatCircle', hasVariants: true },
  'ChatBubbleLeftEllipsisIcon': { phosphor: 'ChatCircleText', hasVariants: true },
  'ChatBubbleLeftRightIcon': { phosphor: 'ChatCircleDots', hasVariants: true },
  'CalendarIcon': { phosphor: 'Calendar', hasVariants: true },
  'CalendarDaysIcon': { phosphor: 'CalendarBlank', hasVariants: true },
  'ClockIcon': { phosphor: 'Clock', hasVariants: true },
  'MapPinIcon': { phosphor: 'MapPin', hasVariants: true },
  'CameraIcon': { phosphor: 'Camera', hasVariants: true },
  'PhotoIcon': { phosphor: 'Image', hasVariants: true },

  // Settings & User
  'ShieldCheckIcon': { phosphor: 'ShieldCheck', hasVariants: true },
  'GlobeAltIcon': { phosphor: 'Globe', hasVariants: true },
  'CreditCardIcon': { phosphor: 'CreditCard', hasVariants: true },
  'DevicePhoneMobileIcon': { phosphor: 'DeviceMobile', hasVariants: true },
  'EyeIcon': { phosphor: 'Eye', hasVariants: true },
  'EyeSlashIcon': { phosphor: 'EyeSlash', hasVariants: true },
  'PencilIcon': { phosphor: 'PencilSimple', hasVariants: true },
  'PencilSquareIcon': { phosphor: 'PencilSimpleLine', hasVariants: true },
  'TrashIcon': { phosphor: 'Trash', hasVariants: true },
  'PlusIcon': { phosphor: 'Plus', hasVariants: false },
  'MinusIcon': { phosphor: 'Minus', hasVariants: false },
  'CheckIcon': { phosphor: 'Check', hasVariants: false },

  // Search & Filters
  'AdjustmentsHorizontalIcon': { phosphor: 'Sliders', hasVariants: true },
  'FunnelIcon': { phosphor: 'Funnel', hasVariants: true },
  'Bars3Icon': { phosphor: 'List', hasVariants: false },
  'Squares2X2Icon': { phosphor: 'SquaresFour', hasVariants: true },
  'CheckCircleIcon': { phosphor: 'CheckCircle', hasVariants: true },

  // Feedback & Status
  'XCircleIcon': { phosphor: 'XCircle', hasVariants: true },
  'ExclamationTriangleIcon': { phosphor: 'Warning', hasVariants: true },
  'FlagIcon': { phosphor: 'Flag', hasVariants: true },
  'InformationCircleIcon': { phosphor: 'Info', hasVariants: true },

  // Communication
  'EnvelopeIcon': { phosphor: 'Envelope', hasVariants: true },
  'PaperAirplaneIcon': { phosphor: 'PaperPlaneRight', hasVariants: true },
  'UserIcon': { phosphor: 'User', hasVariants: true },
  'UsersIcon': { phosphor: 'Users', hasVariants: true },
  'UserGroupIcon': { phosphor: 'UsersThree', hasVariants: true },
  'UserPlusIcon': { phosphor: 'UserPlus', hasVariants: true },

  // Theme & Display
  'SunIcon': { phosphor: 'Sun', hasVariants: true },
  'MoonIcon': { phosphor: 'Moon', hasVariants: true },
  'ChartBarIcon': { phosphor: 'ChartBar', hasVariants: true },
  'PresentationChartLineIcon': { phosphor: 'ChartLine', hasVariants: true },

  // Additional
  'Cog6ToothIcon': { phosphor: 'Gear', hasVariants: true },
  'QuestionMarkCircleIcon': { phosphor: 'Question', hasVariants: true },
  'ArrowRightOnRectangleIcon': { phosphor: 'SignOut', hasVariants: true },
  'AcademicCapIcon': { phosphor: 'GraduationCap', hasVariants: true },
  'ArchiveBoxIcon': { phosphor: 'Archive', hasVariants: true },
  'ArrowDownIcon': { phosphor: 'ArrowDown', hasVariants: false },
  'ArrowUpIcon': { phosphor: 'ArrowUp', hasVariants: false },
  'ArrowRightIcon': { phosphor: 'ArrowRight', hasVariants: false },
  'ArrowPathIcon': { phosphor: 'ArrowsClockwise', hasVariants: false },
  'BookOpenIcon': { phosphor: 'BookOpen', hasVariants: true },
  'BriefcaseIcon': { phosphor: 'Briefcase', hasVariants: true },
  'BuildingOfficeIcon': { phosphor: 'Buildings', hasVariants: true },
  'BuildingStorefrontIcon': { phosphor: 'Storefront', hasVariants: true },
  'CurrencyDollarIcon': { phosphor: 'CurrencyDollar', hasVariants: false },
  'DocumentIcon': { phosphor: 'File', hasVariants: true },
  'DocumentCheckIcon': { phosphor: 'FileCheck', hasVariants: false },
  'EllipsisHorizontalIcon': { phosphor: 'DotsThree', hasVariants: false },
  'EllipsisVerticalIcon': { phosphor: 'DotsThreeVertical', hasVariants: false },
  'FireIcon': { phosphor: 'Fire', hasVariants: true },
  'GiftIcon': { phosphor: 'Gift', hasVariants: true },
  'IdentificationIcon': { phosphor: 'IdentificationCard', hasVariants: true },
  'InboxIcon': { phosphor: 'Tray', hasVariants: true },
  'KeyIcon': { phosphor: 'Key', hasVariants: true },
  'LifebuoyIcon': { phosphor: 'Lifebuoy', hasVariants: true },
  'LinkIcon': { phosphor: 'Link', hasVariants: false },
  'LockClosedIcon': { phosphor: 'Lock', hasVariants: true },
  'NoSymbolIcon': { phosphor: 'Prohibit', hasVariants: true },
  'PaperClipIcon': { phosphor: 'Paperclip', hasVariants: false },
  'PhoneIcon': { phosphor: 'Phone', hasVariants: true },
  'PlayIcon': { phosphor: 'Play', hasVariants: true },
  'ShareIcon': { phosphor: 'ShareNetwork', hasVariants: true },
  'SparklesIcon': { phosphor: 'Sparkle', hasVariants: true },
  'TrophyIcon': { phosphor: 'Trophy', hasVariants: true },
  'VideoCameraIcon': { phosphor: 'VideoCamera', hasVariants: true },
  'WalletIcon': { phosphor: 'Wallet', hasVariants: true },
  'WrenchScrewdriverIcon': { phosphor: 'Wrench', hasVariants: true },
};

// Template for icon component
const generateIconComponent = (heroName, phosphorName, hasVariants) => {
  return `import React from 'react';
import { ${phosphorName} } from 'phosphor-react';

interface IconProps {
  className?: string;
  active?: boolean;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export const ${heroName}: React.FC<IconProps> = ({
  className = '',
  active = false,
  weight
}) => {
  const iconWeight = weight || (active && ${hasVariants} ? 'fill' : 'regular');

  return <${phosphorName} className={className} weight={iconWeight} />;
};
`;
};

// Generate index.ts export file
const generateIndexFile = (icons) => {
  const exports = Object.keys(icons)
    .sort()
    .map(iconName => `export { ${iconName} } from './${iconName}';`)
    .join('\n');

  return `// Auto-generated icon exports
// Generated on ${new Date().toISOString()}

${exports}
`;
};

// Main execution
const outputDir = path.join(__dirname, '../src/components/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating Phosphor icon components...\n');

let generated = 0;
let skipped = 0;

// Generate each icon component
Object.entries(iconMappings).forEach(([heroName, { phosphor, hasVariants }]) => {
  const filePath = path.join(outputDir, `${heroName}.tsx`);

  // Skip if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${heroName} (already exists)`);
    skipped++;
    return;
  }

  const content = generateIconComponent(heroName, phosphor, hasVariants);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated ${heroName}`);
  generated++;
});

// Generate index file
const indexContent = generateIndexFile(iconMappings);
fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent, 'utf8');

console.log(`\n✨ Icon generation complete!`);
console.log(`📊 Generated: ${generated} icons`);
console.log(`⏭️  Skipped: ${skipped} icons`);
console.log(`📁 Location: ${outputDir}`);
console.log(`\n🚀 Next steps:`);
console.log(`1. Update imports in your components from '@heroicons/react/24/outline' to '@/components/icons'`);
console.log(`2. Test icon rendering`);
console.log(`3. Adjust weights as needed (regular, fill, bold, etc.)`);
