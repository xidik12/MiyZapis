import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

/**
 * Compress an image file before uploading
 * This dramatically reduces file size and upload time
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  console.log('🗜️ Starting image compression:', {
    originalName: file.name,
    originalSize: file.size,
    originalSizeKB: (file.size / 1024).toFixed(2) + 'KB',
    type: file.type
  });

  // Default options optimized for fast uploads
  const defaultOptions = {
    maxSizeMB: 0.3, // Target 300KB max (very small for fast upload)
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true, // Use web worker for better performance
    fileType: 'image/webp', // WebP has best compression
    quality: 0.8, // 80% quality (good balance)
    initialQuality: 0.8,
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);

    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

    console.log('✅ Image compression complete:', {
      originalSize: file.size,
      originalSizeKB: (file.size / 1024).toFixed(2) + 'KB',
      compressedSize: compressedFile.size,
      compressedSizeKB: (compressedFile.size / 1024).toFixed(2) + 'KB',
      compressionRatio: compressionRatio + '%',
      newType: compressedFile.type
    });

    // If compression didn't help much, return original
    if (compressedFile.size >= file.size * 0.9) {
      console.log('⚠️ Compression ratio too low, using original file');
      return file;
    }

    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    console.warn('⚠️ Falling back to original file');
    return file; // Fall back to original file if compression fails
  }
}

/**
 * Compress image for avatars (very small, circular crop works best)
 */
export async function compressAvatar(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2, // 200KB max for avatars
    maxWidthOrHeight: 512, // Small size for avatars
    quality: 0.85
  });
}

/**
 * Compress image for portfolio (balance between quality and size)
 */
export async function compressPortfolio(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5, // 500KB max for portfolio
    maxWidthOrHeight: 1920,
    quality: 0.85
  });
}

/**
 * Compress image for services (similar to portfolio)
 */
export async function compressService(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.4, // 400KB max
    maxWidthOrHeight: 1600,
    quality: 0.8
  });
}

/**
 * Get file size in human-readable format
 */
export function getReadableFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
