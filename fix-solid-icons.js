const fs = require('fs');
const path = require('path');

const filesToFix = [
  'frontend/src/pages/SpecialistProfilePage.tsx',
  'frontend/src/pages/SearchPage.tsx',
  'frontend/src/pages/customer/Favorites.tsx',
  'frontend/src/pages/customer/Reviews.tsx',
  'frontend/src/pages/customer/Badges.tsx',
  'frontend/src/pages/customer/Loyalty.tsx',
  'frontend/src/pages/customer/Dashboard.tsx',
  'frontend/src/pages/specialist/Reviews.tsx',
  'frontend/src/pages/specialist/Dashboard.tsx',
  'frontend/src/pages/specialist/Loyalty.tsx',
];

// List of icons to fix - mapping from Solid to regular
const iconReplacements = [
  'StarIconSolid',
  'HeartIconSolid',
  'TrophyIconSolid',
  'SparklesIconSolid',
  'GiftIconSolid',
  'FireIconSolid',
  'CrownIconSolid',
  'CheckCircleIconSolid',
  'CalendarIconSolid',
];

function fixFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Pattern 1: Replace <IconSolid className="..." /> with <Icon className="..." active />
  iconReplacements.forEach(solidIcon => {
    const regularIcon = solidIcon.replace('Solid', '');

    // Pattern: <IconSolid with className and closing />
    const pattern1 = new RegExp(`<${solidIcon}\\s+className=`, 'g');
    if (pattern1.test(content)) {
      content = content.replace(pattern1, `<${regularIcon} className=`);
      // Find the /> and add active before it
      content = content.replace(
        new RegExp(`(<${regularIcon}\\s+className="[^"]*")\\s*/>`, 'g'),
        '$1 active />'
      );
      modified = true;
      console.log(`  ✓ Replaced direct usage of ${solidIcon}`);
    }

    // Pattern 2: Replace {condition ? <IconSolid /> : <Icon />} with <Icon active={condition} />
    // This is complex, so we'll handle it case by case

    // Pattern 3: icon={IconSolid} - used in props
    const pattern3 = new RegExp(`icon=\\{${solidIcon}\\}`, 'g');
    if (pattern3.test(content)) {
      content = content.replace(pattern3, `icon={${regularIcon}}`);
      modified = true;
      console.log(`  ✓ Replaced icon prop reference to ${solidIcon}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`  No changes needed`);
  }
}

console.log('🔧 Fixing solid icon references...\n');

filesToFix.forEach(fixFile);

console.log('\n✨ Done! Manual fixes may still be needed for conditional rendering patterns.');
