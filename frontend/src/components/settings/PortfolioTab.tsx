import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { specialistService } from '@/services/specialist.service';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { ImageIcon as PhotoIcon, PlusIcon, XCircleIcon } from '@/components/icons';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import type { SpecialistProfile } from '@/hooks/useSpecialistProfile';

interface PortfolioTabProps {
  profile: SpecialistProfile;
  onProfileChange: (field: string, value: unknown) => void;
  saving: boolean;
  onSave: () => Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PortfolioTab: React.FC<PortfolioTabProps> = ({
  profile,
  onProfileChange,
  saving,
  onSave,
}) => {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    event.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('portfolio.invalidFileType') || 'Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('portfolio.fileTooLarge') || 'Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const { imageUrl } = await specialistService.uploadPortfolioImage(file);

      const newItem = {
        id: 'portfolio_' + Date.now(),
        imageUrl,
        title: file.name,
        description: '',
        tags: [],
      };

      const updatedPortfolio = [...(profile.portfolio || []), newItem];
      onProfileChange('portfolio', updatedPortfolio);

      toast.success(t('portfolio.uploadSuccess') || 'Photo added successfully');
      logger.debug('Portfolio image uploaded:', { imageUrl, fileName: file.name });
    } catch (error) {
      logger.error('Portfolio image upload failed:', error);
      toast.error(t('portfolio.uploadError') || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (index: number) => {
    const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
    onProfileChange('portfolio', updatedPortfolio);
  };

  const portfolio = profile.portfolio || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('portfolio.title') || 'Portfolio'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('portfolio.subtitle') || 'Showcase your best work to attract clients'}
          </p>
        </div>

        <label
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors cursor-pointer
            ${isUploading
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t('portfolio.uploading') || 'Uploading...'}
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              {t('portfolio.addPhoto') || 'Add Photo'}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="sr-only"
          />
        </label>
      </div>

      {/* Image Grid or Empty State */}
      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.map((item, index) => (
            <div
              key={item.id || index}
              className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={getAbsoluteImageUrl(item.imageUrl)}
                  alt={item.title || t('portfolio.image') || 'Portfolio image'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Delete Button (visible on hover) */}
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="
                  absolute top-2 right-2
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
                  rounded-full p-1
                  text-red-500 hover:text-red-600
                  hover:bg-white dark:hover:bg-gray-900
                  shadow-sm
                "
                title={t('portfolio.delete') || 'Delete'}
              >
                <XCircleIcon className="h-6 w-6" />
              </button>

              {/* Info (title / description) */}
              {(item.title || item.description) && (
                <div className="p-3">
                  {item.title && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                  )}
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
          <PhotoIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h4 className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-300">
            {t('portfolio.emptyTitle') || 'Portfolio is empty'}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
            {t('portfolio.emptyDescription') || 'Upload photos of your work to showcase your skills and attract new clients.'}
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
            transition-colors
            ${saving
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {saving && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {saving
            ? (t('common.saving') || 'Saving...')
            : (t('common.save') || 'Save')
          }
        </button>
      </div>
    </div>
  );
};

export default PortfolioTab;
