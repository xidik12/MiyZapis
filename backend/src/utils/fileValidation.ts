/**
 * File validation utilities for enhanced upload security
 * Validates files using magic numbers (file signatures) to prevent malicious uploads
 */

// File magic numbers (first bytes that identify file types)
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG JFIF
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE1]), // JPEG EXIF
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE2]), // JPEG
    Buffer.from([0xFF, 0xD8, 0xFF, 0xE3]), // JPEG
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
  ],
  'image/gif': [
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
  ],
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (WebP uses RIFF container)
  ],
  'application/pdf': [
    Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  ],
  'application/msword': [
    Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), // MS Office (old format)
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (DOCX uses ZIP)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (XLSX uses ZIP)
  ],
};

/**
 * Validate file type using magic numbers
 * Returns true if file matches expected mime type
 */
export const validateFileSignature = (
  buffer: Buffer,
  mimeType: string
): boolean => {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) {
    // If we don't have signatures for this type, allow it
    // but log a warning
    console.warn(`No file signature validation for MIME type: ${mimeType}`);
    return true;
  }

  // Check if buffer starts with any of the valid signatures
  return signatures.some(signature => {
    if (buffer.length < signature.length) return false;
    return buffer.subarray(0, signature.length).equals(signature);
  });
};

/**
 * Validate WebP specifically (needs additional check after RIFF)
 */
export const validateWebP = (buffer: Buffer): boolean => {
  if (buffer.length < 12) return false;

  // Check for RIFF
  if (!buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46]))) {
    return false;
  }

  // Check for WEBP identifier at bytes 8-11
  return buffer.subarray(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]));
};

/**
 * Comprehensive file validation
 */
export const validateFile = (
  buffer: Buffer,
  mimeType: string,
  filename: string,
  maxSize: number
): { valid: boolean; error?: string } => {
  // Check size
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size ${buffer.length} exceeds maximum ${maxSize} bytes`,
    };
  }

  // Check filename for dangerous patterns
  if (containsDangerousFilename(filename)) {
    return {
      valid: false,
      error: 'Filename contains dangerous patterns',
    };
  }

  // Special handling for WebP
  if (mimeType === 'image/webp') {
    if (!validateWebP(buffer)) {
      return {
        valid: false,
        error: 'File signature does not match WebP format',
      };
    }
    return { valid: true };
  }

  // Validate file signature
  if (!validateFileSignature(buffer, mimeType)) {
    return {
      valid: false,
      error: 'File signature does not match declared MIME type',
    };
  }

  // Check for embedded scripts in image files
  if (mimeType.startsWith('image/') && containsEmbeddedScripts(buffer)) {
    return {
      valid: false,
      error: 'File contains potentially malicious embedded content',
    };
  }

  return { valid: true };
};

/**
 * Check if filename contains dangerous patterns
 */
const containsDangerousFilename = (filename: string): boolean => {
  const dangerousPatterns = [
    /\.\./,  // Path traversal
    /[<>:"|?*]/,  // Invalid filename chars
    /\.exe$/i,  // Executable
    /\.bat$/i,  // Batch file
    /\.cmd$/i,  // Command file
    /\.sh$/i,  // Shell script
    /\.ps1$/i,  // PowerShell
    /\.php$/i,  // PHP script
    /\.jsp$/i,  // JSP
    /\.asp$/i,  // ASP
    /^\./, // Hidden files
  ];

  return dangerousPatterns.some(pattern => pattern.test(filename));
};

/**
 * Check for embedded scripts in file content
 * Looks for common script patterns that might be embedded in images
 */
const containsEmbeddedScripts = (buffer: Buffer): boolean => {
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));

  const scriptPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /\.\.\//, // Path traversal in SVG or metadata
  ];

  return scriptPatterns.some(pattern => pattern.test(content));
};

/**
 * Sanitize filename for safe storage
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'file';

  // Remove dangerous characters
  const cleaned = basename
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '');

  // Limit length
  const maxLength = 255;
  if (cleaned.length > maxLength) {
    const ext = cleaned.split('.').pop() || '';
    const nameWithoutExt = cleaned.substring(0, cleaned.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 1);
    return `${truncatedName}.${ext}`;
  }

  return cleaned || 'file';
};

/**
 * Get safe MIME type from buffer
 * Returns null if type cannot be determined or is dangerous
 */
export const getMimeTypeFromBuffer = (buffer: Buffer): string | null => {
  // Check against known signatures
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.some(sig => buffer.subarray(0, sig.length).equals(sig))) {
      // Special case for WebP
      if (mimeType === 'image/webp') {
        return validateWebP(buffer) ? mimeType : null;
      }
      return mimeType;
    }
  }

  return null;
};

/**
 * Validate image dimensions to prevent decompression bombs
 */
export const validateImageDimensions = (
  width: number,
  height: number,
  maxWidth: number = 10000,
  maxHeight: number = 10000,
  maxPixels: number = 100000000 // 100 megapixels
): boolean => {
  if (width > maxWidth || height > maxHeight) {
    return false;
  }

  const totalPixels = width * height;
  if (totalPixels > maxPixels) {
    return false;
  }

  return true;
};

/**
 * Check if file is within allowed aspect ratio
 */
export const validateAspectRatio = (
  width: number,
  height: number,
  minRatio: number = 0.1,
  maxRatio: number = 10
): boolean => {
  const ratio = width / height;
  return ratio >= minRatio && ratio <= maxRatio;
};
