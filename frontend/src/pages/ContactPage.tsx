import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { helpService } from '@/services/help.service';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await helpService.submitFeedback({
        email: data.email,
        subject: `[Contact] ${data.name} - ${data.subject}`,
        message: data.message,
        category: 'contact',
      });
      toast.success(t('contact.success'));
      reset();
    } catch {
      toast.error(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('contact.form.name')}
              </label>
              <input
                id="name"
                type="text"
                placeholder={t('contact.form.namePlaceholder')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                {...register('name', { required: t('contact.form.nameRequired') })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('contact.form.email')}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t('contact.form.emailPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                {...register('email', {
                  required: t('contact.form.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('contact.form.emailInvalid'),
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('contact.form.subject')}
              </label>
              <input
                id="subject"
                type="text"
                placeholder={t('contact.form.subjectPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.subject
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors`}
                {...register('subject', { required: t('contact.form.subjectRequired') })}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('contact.form.message')}
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder={t('contact.form.messagePlaceholder')}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.message
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-colors resize-vertical`}
                {...register('message', {
                  required: t('contact.form.messageRequired'),
                  minLength: { value: 10, message: t('contact.form.messageMinLength') },
                })}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
            </button>
          </form>

          {/* Contact Info */}
          <div className="mt-12 bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('contact.info.title')}
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                <strong>{t('privacy.contactInfo.email')}</strong>{' '}
                <a href={`mailto:${t('contact.info.email')}`} className="text-primary-600 hover:underline">
                  {t('contact.info.email')}
                </a>
              </p>
              <p>
                <strong>Telegram:</strong>{' '}
                <span className="text-primary-600">{t('contact.info.telegram')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
