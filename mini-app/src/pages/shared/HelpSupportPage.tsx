import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { helpSupportStrings, commonStrings } from '@/utils/translations';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQCategory {
  id: string;
  name: string;
}

export const HelpSupportPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [faqsData, categoriesData] = await Promise.allSettled([
        apiService.getFAQs({ language: locale }),
        apiService.getFAQCategories({ language: locale }),
      ]);

      if (faqsData.status === 'fulfilled') {
        const raw = faqsData.value as any;
        setFaqs(raw?.faqs || (Array.isArray(raw) ? raw : []));
      }
      if (categoriesData.status === 'fulfilled') {
        const raw = categoriesData.value as any;
        const cats = raw?.categories || (Array.isArray(raw) ? raw : []);
        setCategories(cats.map((c: any) => ({
          id: c.id || c.category || '',
          name: c.name || c.category || '',
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryChange = async (categoryId: string) => {
    hapticFeedback.selectionChanged();
    setActiveCategory(categoryId);
    setExpandedId(null);

    try {
      const params: { language: string; category?: string } = { language: locale };
      if (categoryId !== 'all') params.category = categoryId;
      const data = await apiService.getFAQs(params) as any;
      setFaqs(data?.faqs || (Array.isArray(data) ? data : []));
    } catch {
      // Keep current FAQs
    }
  };

  const handleToggleExpand = (id: string) => {
    hapticFeedback.impactLight();
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSubmitFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      dispatch(addToast({
        type: 'warning',
        title: t(commonStrings, 'error', locale),
        message: locale === 'uk' ? 'Заповніть усі поля' : locale === 'ru' ? 'Заполните все поля' : 'Please fill all fields',
      }));
      return;
    }

    try {
      setSubmitting(true);
      const userStr = localStorage.getItem('user');
      const userEmail = userStr ? JSON.parse(userStr)?.email : '';
      await apiService.submitFeedback({ subject, message, email: userEmail || 'user@miyzapis.app', category: 'general' });
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(helpSupportStrings, 'feedbackSent', locale),
      }));
      hapticFeedback.notificationSuccess();
      setSubject('');
      setMessage('');
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(helpSupportStrings, 'feedbackFailed', locale),
      }));
      hapticFeedback.notificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(
        faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(helpSupportStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t(helpSupportStrings, 'searchFAQ', locale)}
            icon={<Search size={18} />}
          />
        </div>

        {/* Category Pills */}
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {locale === 'uk' ? 'Все' : locale === 'ru' ? 'Все' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {cat.name}
              </button>
            ))}
            {/* Static pills if no categories loaded */}
            {categories.length === 0 && (
              <>
                <button
                  onClick={() => handleCategoryChange('general')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    activeCategory === 'general'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {t(helpSupportStrings, 'general', locale)}
                </button>
                <button
                  onClick={() => handleCategoryChange('bookings')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    activeCategory === 'bookings'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {t(helpSupportStrings, 'bookingsHelp', locale)}
                </button>
                <button
                  onClick={() => handleCategoryChange('payments')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    activeCategory === 'payments'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {t(helpSupportStrings, 'paymentsHelp', locale)}
                </button>
                <button
                  onClick={() => handleCategoryChange('account')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    activeCategory === 'account'
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {t(helpSupportStrings, 'accountHelp', locale)}
                </button>
              </>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="px-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
            {t(helpSupportStrings, 'faq', locale)}
          </h3>

          {filteredFaqs.length === 0 ? (
            <Card className="text-center py-8">
              <HelpCircle size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary text-sm">{t(commonStrings, 'noResults', locale)}</p>
            </Card>
          ) : (
            filteredFaqs.map(faq => (
              <Card key={faq.id}>
                <button
                  onClick={() => handleToggleExpand(faq.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle size={16} className="text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary">{faq.question}</h4>
                    {expandedId === faq.id && (
                      <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {expandedId === faq.id ? (
                      <ChevronUp size={16} className="text-text-secondary" />
                    ) : (
                      <ChevronDown size={16} className="text-text-secondary" />
                    )}
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>

        {/* Contact Support / Feedback Form */}
        <div className="px-4 pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary px-1">
            {t(helpSupportStrings, 'contactSupport', locale)}
          </h3>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  {t(helpSupportStrings, 'submitFeedback', locale)}
                </h4>
                <p className="text-xs text-text-secondary">
                  {locale === 'uk' ? 'Ми відповімо найближчим часом' : locale === 'ru' ? 'Мы ответим в ближайшее время' : 'We will respond shortly'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label={t(helpSupportStrings, 'subject', locale)}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={
                  locale === 'uk' ? 'Тема вашого запиту' : locale === 'ru' ? 'Тема вашего запроса' : 'Subject of your request'
                }
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t(helpSupportStrings, 'message', locale)}
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="input-telegram w-full rounded-xl text-sm resize-none"
                  placeholder={
                    locale === 'uk' ? 'Опишіть вашу проблему або запит...' : locale === 'ru' ? 'Опишите вашу проблему или запрос...' : 'Describe your issue or request...'
                  }
                />
              </div>

              <Button
                onClick={handleSubmitFeedback}
                className="w-full"
                disabled={submitting || !subject.trim() || !message.trim()}
              >
                {submitting ? (
                  t(commonStrings, 'loading', locale)
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    {t(helpSupportStrings, 'submitFeedback', locale)}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
