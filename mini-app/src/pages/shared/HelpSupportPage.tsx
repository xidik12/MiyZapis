import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Search,
  Phone,
  Mail,
  MessageCircle,
  BookOpen,
  Shield,
  CreditCard,
  Clock,
  CheckCircle,
  Star,
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

interface ContactMethod {
  id: string;
  type: string;
  title: string;
  description: string;
  value: string;
  availability: string;
}

export const HelpSupportPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hs = (key: string) => t(helpSupportStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [faqsData, categoriesData, contactData] = await Promise.allSettled([
        apiService.getFAQs({ language: locale }),
        apiService.getFAQCategories({ language: locale }),
        apiService.getContactMethods(),
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
      if (contactData.status === 'fulfilled') {
        const raw = contactData.value as any;
        setContactMethods(raw?.contactMethods || (Array.isArray(raw) ? raw : []));
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

  const handleContactAction = (method: ContactMethod) => {
    hapticFeedback.impactLight();
    if (method.type === 'email' || method.type === 'EMAIL') {
      window.open(`mailto:${method.value}`);
    } else if (method.type === 'phone' || method.type === 'PHONE') {
      window.open(`tel:${method.value}`);
    } else if (method.type === 'telegram' || method.type === 'TELEGRAM') {
      window.open(`https://t.me/${method.value.replace('@', '')}`);
    } else if (method.type === 'chat' || method.type === 'CHAT') {
      // Navigate to in-app chat or open link
      if (method.value.startsWith('http')) {
        window.open(method.value);
      }
    }
  };

  const getContactIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'email') return <Mail size={18} className="text-accent-primary" />;
    if (t === 'phone') return <Phone size={18} className="text-accent-green" />;
    if (t === 'telegram' || t === 'chat') return <MessageCircle size={18} className="text-blue-400" />;
    return <MessageSquare size={18} className="text-accent-primary" />;
  };

  const handleSubmitFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      dispatch(addToast({
        type: 'warning',
        title: c('error'),
        message: hs('fillAllFields'),
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
        title: c('success'),
        message: hs('feedbackSent'),
      }));
      hapticFeedback.notificationSuccess();
      setSubject('');
      setMessage('');
    } catch {
      dispatch(addToast({
        type: 'error',
        title: c('error'),
        message: hs('feedbackFailed'),
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

  const userGuides = [
    { icon: BookOpen, title: hs('guideBooking'), desc: hs('guideBookingDesc'), color: 'text-accent-primary bg-accent-primary/10' },
    { icon: CreditCard, title: hs('guidePayments'), desc: hs('guidePaymentsDesc'), color: 'text-accent-green bg-accent-green/10' },
    { icon: Shield, title: hs('guideSecurity'), desc: hs('guideSecurityDesc'), color: 'text-blue-400 bg-blue-400/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={hs('title')} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={hs('searchFAQ')}
            icon={<Search size={18} />}
          />
        </div>

        {/* Contact Methods */}
        {contactMethods.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
              {hs('contactMethods')}
            </h3>
            <div className="space-y-2">
              {contactMethods.map(method => (
                <Card key={method.id} hover onClick={() => handleContactAction(method)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                      {getContactIcon(method.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary">{method.title}</h4>
                      <p className="text-xs text-text-secondary">{method.description}</p>
                      {method.availability && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={10} className="text-text-muted" />
                          <span className="text-[10px] text-text-muted">{method.availability}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* User Guides */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
            {hs('userGuides')}
          </h3>
          <div className="space-y-2">
            {userGuides.map((guide, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${guide.color}`}>
                    <guide.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary">{guide.title}</h4>
                    <p className="text-xs text-text-secondary">{guide.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Stats */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
            {hs('supportStats')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <Card className="text-center py-3">
              <Clock size={16} className="text-accent-primary mx-auto mb-1" />
              <div className="text-sm font-bold text-text-primary">~2h</div>
              <div className="text-[10px] text-text-secondary">{hs('avgResponseTime')}</div>
            </Card>
            <Card className="text-center py-3">
              <CheckCircle size={16} className="text-accent-green mx-auto mb-1" />
              <div className="text-sm font-bold text-text-primary">98%</div>
              <div className="text-[10px] text-text-secondary">{hs('resolutionRate')}</div>
            </Card>
            <Card className="text-center py-3">
              <Star size={16} className="text-accent-yellow mx-auto mb-1" />
              <div className="text-sm font-bold text-text-primary">4.9/5</div>
              <div className="text-[10px] text-text-secondary">{hs('satisfaction')}</div>
            </Card>
          </div>
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
            {categories.length === 0 && (
              <>
                {['general', 'bookings', 'payments', 'account'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {hs(cat === 'bookings' ? 'bookingsHelp' : cat === 'payments' ? 'paymentsHelp' : cat === 'account' ? 'accountHelp' : 'general')}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="px-4 space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
            {hs('faq')}
          </h3>

          {filteredFaqs.length === 0 ? (
            <Card className="text-center py-8">
              <HelpCircle size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary text-sm">{c('noResults')}</p>
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
            {hs('contactSupport')}
          </h3>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  {hs('submitFeedback')}
                </h4>
                <p className="text-xs text-text-secondary">{hs('weWillRespond')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label={hs('subject')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={
                  locale === 'uk' ? 'Тема вашого запиту' : locale === 'ru' ? 'Тема вашего запроса' : 'Subject of your request'
                }
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {hs('message')}
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
                  c('loading')
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    {hs('submitFeedback')}
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
