import fs from 'fs';
import path from 'path';

/**
 * Ensure upload directory exists and is writable
 *
 * This function:
 * - Creates the upload directory if it doesn't exist
 * - Creates subdirectories for different file types
 * - Tests write access to ensure files can be saved
 * - Returns the validated upload path
 */
export function ensureUploadDirectory(uploadPath: string): string {
  console.log(`🔍 [STORAGE] Checking upload directory: ${uploadPath}`);

  const directories = [
    uploadPath,
    path.join(uploadPath, 'avatar'),
    path.join(uploadPath, 'portfolio'),
    path.join(uploadPath, 'service'),
    path.join(uploadPath, 'document'),
    path.join(uploadPath, 'certificate'),
    path.join(uploadPath, 'payment')
  ];

  // Create all directories
  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`✅ [STORAGE] Created directory: ${dir}`);
      } else {
        console.log(`📁 [STORAGE] Directory exists: ${dir}`);
      }
    } catch (error) {
      console.error(`❌ [STORAGE] Failed to create ${dir}:`, error);
      // Don't throw, continue trying other directories
    }
  }

  // Test write access
  const testFile = path.join(uploadPath, '.write-test');
  try {
    fs.writeFileSync(testFile, 'test', { mode: 0o644 });
    fs.unlinkSync(testFile);
    console.log(`✅ [STORAGE] Write access confirmed: ${uploadPath}`);
    return uploadPath;
  } catch (error) {
    console.error(`❌ [STORAGE] No write access to ${uploadPath}:`, error);
    throw new Error(`Cannot write to upload directory: ${uploadPath}`);
  }
}

/**
 * Get the optimal upload directory
 *
 * Priority:
 * 1. UPLOAD_DIR environment variable (explicitly set path)
 * 2. /panhaha/uploads (Railway mounted volume)
 * 3. /tmp/uploads (fallback, not persistent)
 */
export function getUploadDirectory(): string {
  const options = [
    process.env.UPLOAD_DIR,
    '/panhaha/uploads',
    '/tmp/uploads'
  ].filter(Boolean) as string[];

  console.log(`🔍 [STORAGE] Testing upload directory options:`, options);

  for (const dir of options) {
    try {
      ensureUploadDirectory(dir);
      console.log(`✅ [STORAGE] Using upload directory: ${dir}`);
      return dir;
    } catch (error) {
      console.warn(`⚠️ [STORAGE] Directory ${dir} not accessible, trying next option...`);
      continue;
    }
  }

  throw new Error('No accessible upload directory found!');
}
