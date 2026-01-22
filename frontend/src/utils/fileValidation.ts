const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'image/avif',
];

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'jpe',
  'jfif',
  'png',
  'webp',
  'gif',
  'bmp',
  'tiff',
  'tif',
  'heic',
  'heif',
  'avif',
];

const IMAGE_MIME_TYPE_SET = new Set(IMAGE_MIME_TYPES);
const IMAGE_EXTENSION_SET = new Set(IMAGE_EXTENSIONS);

export const ALLOWED_IMAGE_MIME_TYPES = [...IMAGE_MIME_TYPES];
export const IMAGE_FILE_ACCEPT = '.jpg,.jpeg,.jpe,.jfif,.png,.webp,.gif,.bmp,.tiff,.tif,.heic,.heif,.avif';

const normalizeMimeType = (type: string): string => {
  const normalized = type.toLowerCase();
  const aliases: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'image/pjpeg': 'image/jpeg',
    'image/x-png': 'image/png',
    'image/x-ms-bmp': 'image/bmp',
    'image/tif': 'image/tiff',
    'image/heic-sequence': 'image/heic',
    'image/heif-sequence': 'image/heif',
    'image/avif-sequence': 'image/avif',
  };
  return aliases[normalized] || normalized;
};

const isAllowedImageExtension = (filename: string): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) {
    return false;
  }

  if (extension === 'svg' || extension === 'svgz') {
    return false;
  }

  return IMAGE_EXTENSION_SET.has(extension);
};

export const isAllowedImageFile = (file: File): boolean => {
  const normalizedType = normalizeMimeType(file.type || '');

  if (normalizedType) {
    if (normalizedType === 'image/svg+xml') {
      return false;
    }

    if (IMAGE_MIME_TYPE_SET.has(normalizedType)) {
      return true;
    }
  }

  return isAllowedImageExtension(file.name);
};
