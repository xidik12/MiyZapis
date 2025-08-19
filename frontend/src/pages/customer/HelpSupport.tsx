import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'chat';
  title: string;
  description: string;
  value: string;
  availability: string;
  icon: React.ComponentType<any>;
}

const CustomerHelpSupport: React.FC = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    email: '',
  });

  // Mock FAQ data
  const faqs: FAQ[] = [
    {
      id: '1',
      question: t('faq.howToBook'),
      answer: t('faq.howToBookAnswer'),
      category: 'booking',
    },
    {
      id: '2',
      question: t('faq.cancelReschedule'),
      answer: t('faq.cancelRescheduleAnswer'),
      category: 'booking',
    },
    {
      id: '3',
      question: t('faq.howPaymentsWork'),
      answer: t('faq.howPaymentsWorkAnswer'),
      category: 'payment',
    },
    {
      id: '4',
      question: t('faq.notSatisfied'),
      answer: t('faq.notSatisfiedAnswer'),
      category: 'general',
    },
    {
      id: '5',
      question: t('faq.specialistsVerified'),
      answer: t('faq.specialistsVerifiedAnswer'),
      category: 'general',
    },
    {
      id: '6',
      question: t('faq.leaveReview'),
      answer: t('faq.leaveReviewAnswer'),
      category: 'reviews',
    },
    {
      id: '7',
      question: t('faq.personalInfoSecure'),
      answer: t('faq.personalInfoSecureAnswer'),
      category: 'account',
    },
    {
      id: '8',
      question: t('faq.updateProfile'),
      answer: t('faq.updateProfileAnswer'),
      category: 'account',
    },
  ];

  const contactMethods: ContactMethod[] = [
    {
      id: '1',
      type: 'email',
      title: t('help.emailSupport'),
      description: t('help.getHelpViaEmail'),
      value: 'support@miyzapys.com',
      availability: t('help.responseWithin24h'),
      icon: EnvelopeIcon,
    },
    {
      id: '2',
      type: 'phone',
      title: t('help.phoneSupport'),
      description: t('help.speakWithSupport'),
      value: '+380 44 123 4567',
      availability: t('help.monFri9to6'),
      icon: PhoneIcon,
    },
    {
      id: '3',
      type: 'chat',
      title: t('help.liveChat'),
      description: t('help.chatRealTime'),
      value: t('help.startChat'),
      availability: t('help.monFri9to6'),
      icon: ChatBubbleLeftRightIcon,
    },
  ];

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

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the feedback
    alert(t('feedback.thankYou'));
    setFeedbackForm({
      subject: '',
      message: '',
      category: 'general',
      email: '',
    });
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
        alert(t('action.liveChatAlert'));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('customer.help.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('customer.help.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
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
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleFAQToggle(faq.id)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-3 text-gray-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Guides Section */}
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <BookOpenIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
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
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 mb-2">{guide.title}</h3>
                      <p className="text-sm text-gray-600">{guide.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Feedback Sidebar */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('customer.help.contact')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {contactMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => handleContactMethod(method)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start">
                          <Icon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {method.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {method.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {method.availability}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <PaperAirplaneIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('customer.help.feedback')}
                  </h2>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.email')}
                    </label>
                    <input
                      type="email"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('feedback.category')}
                    </label>
                    <select
                      value={feedbackForm.category}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">{t('feedback.general')}</option>
                      <option value="bug">{t('feedback.bugReport')}</option>
                      <option value="feature">{t('feedback.featureRequest')}</option>
                      <option value="complaint">{t('feedback.complaint')}</option>
                      <option value="compliment">{t('feedback.compliment')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('feedback.subject')}
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('feedback.message')}
                    </label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('help.supportStats')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('help.averageResponseTime')}</span>
                    <span className="text-sm font-medium text-gray-900">{t('help.2hours')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('help.resolutionRate')}</span>
                    <span className="text-sm font-medium text-gray-900">{t('help.98percent')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('help.customerSatisfaction')}</span>
                    <span className="text-sm font-medium text-gray-900">{t('help.49outof5')}</span>
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
