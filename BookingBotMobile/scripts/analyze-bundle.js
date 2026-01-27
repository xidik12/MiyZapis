#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes the production bundle size and reports metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const TARGETS = {
  ios: 30 * 1024 * 1024, // 30MB
  android: 25 * 1024 * 1024, // 25MB
  critical: {
    ios: 50 * 1024 * 1024, // 50MB
    android: 40 * 1024 * 1024, // 40MB
  },
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get directory size recursively
 */
function getDirSize(dirPath) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += getDirSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }

  return totalSize;
}

/**
 * Print status with color
 */
function printStatus(label, size, target, critical) {
  const percentage = (size / target) * 100;
  let color = COLORS.green;
  let status = 'GOOD';

  if (size > critical) {
    color = COLORS.red;
    status = 'CRITICAL';
  } else if (size > target) {
    color = COLORS.yellow;
    status = 'WARNING';
  }

  console.log(
    `${label.padEnd(20)} ${color}${formatBytes(size).padEnd(12)}${COLORS.reset} ` +
    `(${percentage.toFixed(1)}% of target) - ${color}${status}${COLORS.reset}`
  );
}

/**
 * Main analysis function
 */
function analyzeBundles() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}📦 Bundle Size Analysis${COLORS.reset}\n`);
  console.log('━'.repeat(70));

  // Check if dist directory exists
  const distPath = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.log(`${COLORS.yellow}⚠️  No dist directory found. Run 'npx expo export' first.${COLORS.reset}\n`);
    return;
  }

  // Analyze iOS bundle
  const iosBundlePath = path.join(distPath, 'bundles', 'ios-*.js');
  const iosAssetPath = path.join(distPath, 'assets');

  console.log(`\n${COLORS.blue}iOS Bundle:${COLORS.reset}`);

  try {
    const iosBundleSize = getDirSize(path.join(distPath, 'bundles'));
    const iosAssetSize = fs.existsSync(iosAssetPath) ? getDirSize(iosAssetPath) : 0;
    const iosTotalSize = iosBundleSize + iosAssetSize;

    console.log(`  JS Bundle:         ${formatBytes(iosBundleSize)}`);
    console.log(`  Assets:            ${formatBytes(iosAssetSize)}`);
    console.log(`  Total:             ${COLORS.bright}${formatBytes(iosTotalSize)}${COLORS.reset}`);
    console.log();
    printStatus('iOS Status:', iosTotalSize, TARGETS.ios, TARGETS.critical.ios);
  } catch (error) {
    console.log(`${COLORS.red}Error analyzing iOS bundle${COLORS.reset}`);
  }

  // Analyze Android bundle
  console.log(`\n${COLORS.blue}Android Bundle:${COLORS.reset}`);

  try {
    const androidBundleSize = getDirSize(path.join(distPath, 'bundles'));
    const androidAssetSize = fs.existsSync(iosAssetPath) ? getDirSize(iosAssetPath) : 0;
    const androidTotalSize = androidBundleSize + androidAssetSize;

    console.log(`  JS Bundle:         ${formatBytes(androidBundleSize)}`);
    console.log(`  Assets:            ${formatBytes(androidAssetSize)}`);
    console.log(`  Total:             ${COLORS.bright}${formatBytes(androidTotalSize)}${COLORS.reset}`);
    console.log();
    printStatus('Android Status:', androidTotalSize, TARGETS.android, TARGETS.critical.android);
  } catch (error) {
    console.log(`${COLORS.red}Error analyzing Android bundle${COLORS.reset}`);
  }

  // Analyze node_modules size (for reference)
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    console.log(`\n${COLORS.blue}Dependencies:${COLORS.reset}`);
    const nodeModulesSize = getDirSize(nodeModulesPath);
    console.log(`  node_modules:      ${formatBytes(nodeModulesSize)}`);
  }

  console.log('\n━'.repeat(70));

  // Recommendations
  console.log(`\n${COLORS.cyan}💡 Recommendations:${COLORS.reset}`);
  console.log('  • Enable Hermes engine for smaller bundle size');
  console.log('  • Use code splitting for large libraries');
  console.log('  • Optimize images (WebP format, compression)');
  console.log('  • Remove unused dependencies');
  console.log('  • Use dynamic imports for non-critical features');
  console.log();
}

// Run analysis
try {
  analyzeBundles();
} catch (error) {
  console.error(`${COLORS.red}Error:${COLORS.reset}`, error.message);
  process.exit(1);
}
