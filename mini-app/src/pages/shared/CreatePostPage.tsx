import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Send,
  Camera,
  Type,
  FileText,
  X,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { communityStrings, commonStrings, createPostStrings } from '@/utils/translations';

const POST_TYPES = ['DISCUSSION', 'SALE'] as const;

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();
  const { postId } = useParams<{ postId: string }>();
  const isEditing = !!postId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('DISCUSSION');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState('UAH');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const cm = (key: string) => t(communityStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);
  const cp = (key: string) => t(createPostStrings, key, locale);

  // Load existing post for editing
  useEffect(() => {
    if (!postId) return;
    const loadPost = async () => {
      try {
        setLoading(true);
        const data = await apiService.getCommunityPost(postId) as any;
        setTitle(data.title || '');
        setContent(data.content || '');
        setType(data.type || 'DISCUSSION');
        setPrice(data.price != null ? String(data.price) : '');
        setCurrency(data.currency || 'UAH');
        setContactPhone(data.contactPhone || '');
        setContactEmail(data.contactEmail || '');
        // Parse images
        if (Array.isArray(data.images)) {
          setImages(data.images);
        } else if (typeof data.images === 'string') {
          try { setImages(JSON.parse(data.images)); } catch { setImages([]); }
        }
      } catch {
        dispatch(addToast({ type: 'error', title: c('error'), message: '' }));
        navigate('/community');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Validate
        if (file.size > 10 * 1024 * 1024) {
          dispatch(addToast({ type: 'error', title: c('error'), message: cp('fileTooLarge') }));
          continue;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          dispatch(addToast({ type: 'error', title: c('error'), message: cp('invalidFileType') }));
          continue;
        }

        const result = await apiService.uploadFile(file, 'portfolio');
        setImages(prev => [...prev, result.url]);
      }
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: c('error'), message: cp('uploadFailed') }));
      hapticFeedback.notificationError();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    hapticFeedback.selectionChanged();
  };

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length < 3) {
      dispatch(addToast({
        type: 'warning',
        title: cm('missingFields'),
        message: cp('titleMinLength'),
      }));
      hapticFeedback.notificationError();
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      dispatch(addToast({
        type: 'warning',
        title: cm('missingFields'),
        message: cp('contentMinLength'),
      }));
      hapticFeedback.notificationError();
      return;
    }

    if (type === 'SALE' && price && Number(price) < 0) {
      dispatch(addToast({
        type: 'warning',
        title: c('error'),
        message: cp('priceNegative'),
      }));
      return;
    }

    try {
      setSubmitting(true);
      hapticFeedback.impactLight();

      const postData: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        type,
      };

      if (type === 'SALE') {
        if (price) postData.price = Number(price);
        postData.currency = currency;
        if (contactPhone.trim()) postData.contactPhone = contactPhone.trim();
        if (contactEmail.trim()) postData.contactEmail = contactEmail.trim();
      }

      if (images.length > 0) {
        postData.images = images;
      }

      if (isEditing) {
        await apiService.updateCommunityPost(postId!, postData);
        dispatch(addToast({ type: 'success', title: cp('updated'), message: '' }));
        hapticFeedback.notificationSuccess();
        navigate(`/community/post/${postId}`);
      } else {
        const newPost = await apiService.createCommunityPost(postData) as any;
        dispatch(addToast({ type: 'success', title: cp('posted'), message: '' }));
        hapticFeedback.notificationSuccess();
        // Navigate to the newly created post if we got an ID back, otherwise to the list
        if (newPost?.id) {
          navigate(`/community/post/${newPost.id}`, { replace: true });
        } else {
          navigate('/community');
        }
      }
    } catch (error: unknown) {
      const msg = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : String(error)) || cp('failedToPublish');
      dispatch(addToast({ type: 'error', title: c('error'), message: msg }));
      hapticFeedback.notificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = title.trim().length >= 3 && content.trim().length >= 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        showBackButton
        title={isEditing ? cm('editPost') : cm('createPost')}
      />

      <div className="flex-1 overflow-y-auto pb-36 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {cm('type')}
            </label>
            <div className="flex gap-2">
              {POST_TYPES.map(postType => (
                <button
                  key={postType}
                  onClick={() => { setType(postType); hapticFeedback.selectionChanged(); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                    type === postType
                      ? postType === 'DISCUSSION'
                        ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                        : 'bg-accent-green text-white shadow-lg shadow-accent-green/25'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {postType === 'DISCUSSION' ? cm('discussion') : cm('sale')}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input
            label={cm('postTitle')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={cp('titlePlaceholder')}
            icon={<Type size={18} />}
          />

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {cm('content')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-text-muted">
                <FileText size={18} />
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="input-telegram w-full rounded-xl text-sm resize-none pl-10"
                placeholder={cm('whatsOnMind')}
              />
            </div>
            <p className="text-xs text-text-muted mt-1 text-right">
              {content.length} / 2000
            </p>
          </div>

          {/* SALE-specific fields */}
          {type === 'SALE' && (
            <Card>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-accent-green uppercase tracking-wide">
                  {cm('sale')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={cm('price')}
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    icon={<DollarSign size={18} />}
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {cm('currency')}
                    </label>
                    <div className="flex gap-1.5">
                      {['UAH', 'USD', 'EUR'].map(cur => (
                        <button
                          key={cur}
                          onClick={() => { setCurrency(cur); hapticFeedback.selectionChanged(); }}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                            currency === cur
                              ? 'bg-accent-primary text-white'
                              : 'bg-bg-secondary text-text-secondary'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Input
                  label={cm('contactPhone')}
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+380..."
                  icon={<Phone size={18} />}
                />

                <Input
                  label={cm('contactEmail')}
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                />
              </div>
            </Card>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {cm('images')}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-colors touch-manipulation ${
                uploading
                  ? 'border-accent-primary/30 bg-accent-primary/5 text-accent-primary'
                  : 'border-white/10 bg-bg-secondary text-text-secondary hover:border-accent-primary/50'
              }`}
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">{cm('uploading')}</span>
                </>
              ) : (
                <>
                  <Camera size={20} />
                  <span className="text-sm font-medium">{cm('uploadImages')}</span>
                </>
              )}
            </button>
            <p className="text-xs text-text-muted mt-1">{cm('imageHelp')}</p>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-bg-secondary">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Submit — above BottomNavigation (h-14) */}
      <div className="fixed bottom-14 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/5 p-4 z-40">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!isValid || submitting}
          loading={submitting}
        >
          <Send size={16} className="mr-2" />
          {submitting
            ? cp('publishing')
            : isEditing ? cm('updatePost') : cm('publishPost')
          }
        </Button>
      </div>
    </div>
  );
};
