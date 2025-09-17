import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { helpService, FAQ, ContactMethod } from '../../services/help.service';
import { 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Interfaces are now imported from the service

const CustomerHelpSupport: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    email: '',
  });

  useEffect(() => {
    const fetchHelpData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [faqsResponse, contactResponse] = await Promise.all([
          helpService.getFAQs(activeCategory === 'all' ? undefined : activeCategory, language),
          helpService.getContactMethods(language)
        ]);
        
        setFaqs(faqsResponse.faqs);
        setContactMethods(contactResponse.contactMethods);
      } catch (error: any) {
        console.error('Failed to fetch help data:', error);
        setError(error.message || 'Failed to load help data');
        // Set empty arrays on error to show empty states
        setFaqs([]);
        setContactMethods([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHelpData();
  }, [activeCategory, language]);

  const categories = [
    { id: 'all', label: t('help.allTopics') },
    { id: 'booking', label: t('help.bookingScheduling') },
    { id: 'payment', label: t('help.paymentsBilling') },
    { id: 'account', label: t('help.accountProfile') },
    { id: 'reviews', label: t('help.reviewsRatings') },
    { id: 'general', label: t('help.generalQuestions') },
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await helpService.submitFeedback(feedbackForm);
      
      toast.success(t('feedback.thankYou'));
      setFeedbackForm({
        subject: '',
        message: '',
        category: 'general',
        email: '',
      });
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const handleContactMethod = (method: ContactMethod) => {
    switch (method.type) {
      case 'email':
        window.location.href = `mailto:${method.value}`;
        break;
      case 'phone':
        window.location.href = `tel:${method.value}`;
        break;
      case 'chat':
        // In a real app, this would open a chat widget
        toast.info(t('action.liveChatAlert'));
        break;
    }
  };

  const getContactMethodIcon = (type: string) => {
    switch (type) {
      case 'email':
        return EnvelopeIcon;
      case 'phone':
        return PhoneIcon;
      case 'chat':
        return ChatBubbleLeftRightIcon;
      default:
        return ChatBubbleLeftRightIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">
            {t('customer.help.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-400 max-w-2xl mx-auto">
            {t('customer.help.subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-800 dark:text-red-200">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center mb-4">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('customer.help.faq')}
                  </h2>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        activeCategory === category.id
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-8">
                    <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('help.noFAQsAvailable')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('help.faqsWillBeAddedSoon')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => handleFAQToggle(faq.id)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100">{faq.question}</span>
                          {expandedFAQ === faq.id ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                        {expandedFAQ === faq.id && (
                          <div className="px-4 pb-3 text-gray-600 dark:text-gray-400">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Guides Section */}
            <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg shadow mt-8">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <BookOpenIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('customer.help.guides')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: t('guides.gettingStarted'),
                      description: t('guides.gettingStartedDesc'),
                      link: '#',
                    },
                    {
                      title: t('guides.bookingProcess'),
                      description: t('guides.bookingProcessDesc'),
                      link: '#',
                    },
                    {
                      title: t('guides.paymentMethods'),
                      description: t('guides.paymentMethodsDesc'),
                      link: '#',
                    },
                    {
                      title: t('guides.accountSecurity'),
                      description: t('guides.accountSecurityDesc'),
                      link: '#',
                    },
                  ].map((guide, index) => (
                    <a
                      key={index}
                      href={guide.link}
                      className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{guide.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{guide.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Feedback Sidebar */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('customer.help.contact')}
                  </h2>
                </div>

                {contactMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('help.noContactMethodsAvailable')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('help.contactMethodsWillBeAddedSoon')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactMethods.map((method) => {
                      const Icon = getContactMethodIcon(method.type);
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleContactMethod(method)}
                          className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <div className="flex items-start">
                            <Icon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {method.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {method.description}
                              </p>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {method.availability}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Form */}
            <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <PaperAirplaneIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('customer.help.feedback')}
                  </h2>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.email')}
                    </label>
                    <input
                      type="email"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('feedback.category')}
                    </label>
                    <select
                      value={feedbackForm.category}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">{t('feedback.general')}</option>
                      <option value="bug">{t('feedback.bugReport')}</option>
                      <option value="feature">{t('feedback.featureRequest')}</option>
                      <option value="complaint">{t('feedback.complaint')}</option>
                      <option value="compliment">{t('feedback.compliment')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('feedback.subject')}
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('feedback.message')}
                    </label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t('feedback.sendFeedback')}
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('help.supportStats')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('help.averageResponseTime')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('help.2hours')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('help.resolutionRate')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('help.98percent')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('help.customerSatisfaction')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('help.49outof5')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHelpSupport;
