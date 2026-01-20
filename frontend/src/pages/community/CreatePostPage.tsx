import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { communityService, CreatePostData, fileUploadService, POST_TYPES, Post } from '@/services';
import { PageLoader } from '@/components/ui';
import { ArrowLeftIcon, LinkIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CreatePostPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { postId } = useParams<{ postId: string }>();
  const isEditing = !!postId;

  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<CreatePostData>({
    type: 'DISCUSSION',
    title: '',
    content: '',
    price: undefined,
    currency: 'UAH',
    contactPhone: '',
    contactEmail: '',
    images: [],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;
      try {
        setLoading(true);
        const data = await communityService.getPostById(postId);
        setPost(data);
        setFormData({
          type: data.type,
          title: data.title,
          content: data.content,
          price: data.price ?? undefined,
          currency: data.currency || 'UAH',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          images: data.images || [],
        });
      } catch (err: any) {
        toast.error(err.message || t('community.loadFailed') || 'Failed to load post');
        navigate('/community');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleAddImageUrl = () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      toast.error(t('community.form.imageUrlRequired') || 'Image URL is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), trimmed],
    }));
    setImageUrl('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    setIsUploadingImages(true);
    setUploadError('');
    try {
      const uploads = await fileUploadService.uploadFiles(files, {
        type: 'portfolio',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      const uploadedUrls = uploads
        .map((file) => file.url)
        .filter((url): url is string => Boolean(url));

      if (uploadedUrls.length === 0) {
        throw new Error(t('community.form.imageUploadFailed') || 'Failed to upload image');
      }

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (err: any) {
      const message = err.message || t('community.form.imageUploadFailed') || 'Failed to upload image';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleOpenFilePicker = () => {
    if (!isUploadingImages) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error(t('community.form.titleRequired') || 'Title is required');
      return false;
    }
    if (formData.title.trim().length < 3) {
      toast.error(t('community.form.titleMin') || 'Title must be at least 3 characters');
      return false;
    }
    if (!formData.content.trim() || formData.content.trim().length < 10) {
      toast.error(t('community.form.contentMin') || 'Content must be at least 10 characters');
      return false;
    }
    if (formData.type === 'SALE' && formData.price !== undefined && formData.price < 0) {
      toast.error(t('community.form.priceInvalid') || 'Price cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload: CreatePostData = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim(),
        price: formData.type === 'SALE' ? formData.price : undefined,
        currency: formData.type === 'SALE' ? formData.currency : undefined,
        contactPhone: formData.type === 'SALE' ? formData.contactPhone : undefined,
        contactEmail: formData.type === 'SALE' ? formData.contactEmail : undefined,
        images: formData.images && formData.images.length > 0 ? formData.images : undefined,
      };

      const result = isEditing
        ? await communityService.updatePost(postId as string, payload)
        : await communityService.createPost(payload);

      toast.success(isEditing ? t('community.postUpdated') || 'Post updated' : t('community.postCreated') || 'Post published');
      navigate(`/community/post/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || t('community.publishFailed') || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing && !post) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/community" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-6">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {t('community.backToCommunity') || 'Back to Community'}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEditing ? t('community.editPost') || 'Edit Post' : t('community.createPost') || 'Create Post'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('community.form.type') || 'Type'}
              </label>
              <div className="flex gap-2">
                {POST_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.type === type
                        ? type === 'DISCUSSION'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type === 'DISCUSSION'
                      ? t('community.type.discussion') || 'Discussion'
                      : t('community.type.sale') || 'Marketplace'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('community.form.title') || 'Title'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder={t('community.form.titlePlaceholder') || 'Add a descriptive title'}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('community.form.content') || 'Content'}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={8}
                placeholder={t('community.form.contentPlaceholder') || 'Share your thoughts or listing details...'}
              />
            </div>

            {/* Sale Fields */}
            {formData.type === 'SALE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('community.form.price') || 'Price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('community.form.currency') || 'Currency'}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="UAH">UAH</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('community.form.contactPhone') || 'Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="+380..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('community.form.contactEmail') || 'Contact Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            )}

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('community.form.images') || 'Images'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder={t('community.form.imagePlaceholder') || 'Paste image URL'}
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleOpenFilePicker}
                  disabled={isUploadingImages}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? (
                    <span className="text-sm">{t('community.form.uploading') || 'Uploading...'}</span>
                  ) : (
                    <PhotoIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('community.form.imageHelp') || 'Max 10MB. JPG, PNG, WebP.'}
              </p>
              {uploadError && (
                <p className="text-xs text-red-500 mt-2">
                  {uploadError}
                </p>
              )}
              {formData.images && formData.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{image}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                to="/community"
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              >
                {t('common.cancel') || 'Cancel'}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60"
              >
                {loading
                  ? t('common.loading') || 'Loading...'
                  : isEditing
                  ? t('community.updatePost') || 'Update Post'
                  : t('community.form.publish') || 'Publish'}
              </button>
            </div>
          </form>

          {user && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              {t('community.postAs') || 'Posting as'} {user.firstName} {user.lastName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
