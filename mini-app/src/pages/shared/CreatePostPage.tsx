import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Send,
  Image,
  Type,
  FileText,
  LinkIcon,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { communityStrings, commonStrings } from '@/utils/translations';

const POST_TYPES = ['DISCUSSION', 'TIP', 'QUESTION', 'SHOWCASE', 'EVENT'];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('DISCUSSION');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cm = (key: string) => t(communityStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const getTypeName = (postType: string) => {
    const key = postType.toLowerCase();
    const nameMap: Record<string, string> = {
      discussion: cm('discussion'),
      tip: cm('tip'),
      question: cm('question'),
      showcase: cm('showcase'),
      event: cm('event'),
    };
    return nameMap[key] || postType.charAt(0) + postType.slice(1).toLowerCase();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      const msg = locale === 'uk'
        ? 'Заголовок та вміст обов\'язкові'
        : locale === 'ru'
          ? 'Заголовок и содержание обязательны'
          : 'Title and content are required';
      dispatch(addToast({
        type: 'warning',
        title: locale === 'uk' ? 'Відсутні поля' : locale === 'ru' ? 'Отсутствующие поля' : 'Missing fields',
        message: msg,
      }));
      hapticFeedback.notificationError();
      return;
    }

    try {
      setSubmitting(true);
      hapticFeedback.impactLight();

      const postData: { title: string; content: string; type: string; image?: string } = {
        title: title.trim(),
        content: content.trim(),
        type,
      };
      if (imageUrl.trim()) {
        postData.image = imageUrl.trim();
      }

      await apiService.createCommunityPost(postData);

      const successTitle = locale === 'uk' ? 'Опубліковано!' : locale === 'ru' ? 'Опубликовано!' : 'Posted!';
      const successMsg = locale === 'uk' ? 'Ваш пост опубліковано' : locale === 'ru' ? 'Ваш пост опубликован' : 'Your post has been published';
      dispatch(addToast({ type: 'success', title: successTitle, message: successMsg }));
      hapticFeedback.notificationSuccess();
      navigate('/community');
    } catch {
      const errorMsg = locale === 'uk'
        ? 'Не вдалося створити пост'
        : locale === 'ru'
          ? 'Не удалось создать пост'
          : 'Failed to create post';
      dispatch(addToast({ type: 'error', title: c('error'), message: errorMsg }));
      hapticFeedback.notificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        showBackButton
        title={cm('createPost')}
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Title */}
          <Input
            label={cm('postTitle')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={locale === 'uk' ? 'Заголовок посту' : locale === 'ru' ? 'Заголовок поста' : 'Post title'}
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

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {cm('type')}
            </label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map(postType => (
                <button
                  key={postType}
                  onClick={() => { setType(postType); hapticFeedback.selectionChanged(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation ${
                    type === postType
                      ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {getTypeName(postType)}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <Input
            label={locale === 'uk' ? 'URL зображення (необов\'язково)' : locale === 'ru' ? 'URL изображения (необязательно)' : 'Image URL (optional)'}
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            icon={<Image size={18} />}
          />

          {/* Image Preview */}
          {imageUrl.trim() && (
            <Card padding="sm">
              <p className="text-xs text-text-muted mb-2">
                {locale === 'uk' ? 'Попередній перегляд' : locale === 'ru' ? 'Предпросмотр' : 'Preview'}
              </p>
              <div className="rounded-xl overflow-hidden bg-bg-hover max-h-48">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </Card>
          )}

          {/* Post Preview */}
          {(title.trim() || content.trim()) && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {locale === 'uk' ? 'Попередній перегляд' : locale === 'ru' ? 'Предпросмотр' : 'Preview'}
              </label>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-accent-primary/15 text-accent-primary rounded-full text-xs font-medium">
                    {getTypeName(type)}
                  </span>
                </div>
                {title.trim() && (
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
                )}
                {content.trim() && (
                  <p className="text-sm text-text-secondary line-clamp-3">{content}</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/5 p-4 z-20">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!isValid || submitting}
          loading={submitting}
        >
          <Send size={16} className="mr-2" />
          {submitting
            ? (locale === 'uk' ? 'Публікація...' : locale === 'ru' ? 'Публикация...' : 'Publishing...')
            : cm('publishPost')
          }
        </Button>
      </div>
    </div>
  );
};
