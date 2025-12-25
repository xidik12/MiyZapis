import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { SparklesIcon, ClockIcon, ShieldCheckIcon, CreditCardIcon, UserGroupIcon, CheckCircleIcon, RocketLaunchIcon, GiftIcon, ArrowRightIcon } from '@/components/icons';
import { Card } from '../components/ui/Card';

const TrialInfoPage: React.FC = () => {
  const { t, language } = useLanguage();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const trialInfo = useMemo(() => {
    if (!user?.isInTrial || !user?.trialEndDate) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(user.trialEndDate);
    const startDate = user.trialStartDate ? new Date(user.trialStartDate) : null;
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = startDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 90; // Default to 90 days if no start date

    return {
      daysRemaining: Math.max(0, daysRemaining),
      totalDays,
      endDate: endDate.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      progress: Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100),
    };
  }, [user, language]);

  const customerBenefits = [
    {
      icon: CreditCardIcon,
      title: t('trial.info.customerBenefits.noDeposits.title'),
      description: t('trial.info.customerBenefits.noDeposits.description'),
    },
    {
      icon: SparklesIcon,
      title: t('trial.info.customerBenefits.fullAccess.title'),
      description: t('trial.info.customerBenefits.fullAccess.description'),
    },
    {
      icon: ShieldCheckIcon,
      title: t('trial.info.customerBenefits.noCommitment.title'),
      description: t('trial.info.customerBenefits.noCommitment.description'),
    },
  ];

  const specialistBenefits = [
    {
      icon: GiftIcon,
      title: t('trial.info.specialistBenefits.noFees.title'),
      description: t('trial.info.specialistBenefits.noFees.description'),
    },
    {
      icon: UserGroupIcon,
      title: t('trial.info.specialistBenefits.buildClientele.title'),
      description: t('trial.info.specialistBenefits.buildClientele.description'),
    },
    {
      icon: RocketLaunchIcon,
      title: t('trial.info.specialistBenefits.growBusiness.title'),
      description: t('trial.info.specialistBenefits.growBusiness.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full mb-4 sm:mb-6">
              <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {t('trial.info.hero.title')} 🎉
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-3xl mx-auto">
              {t('trial.info.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Trial Status Card (if authenticated and in trial) */}
        {isAuthenticated && trialInfo && trialInfo.daysRemaining > 0 && (
          <Card className="mb-8 sm:mb-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('trial.info.yourTrial.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('trial.info.yourTrial.subtitle')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
                    {trialInfo.daysRemaining}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {trialInfo.daysRemaining === 1 ? t('trial.banner.dayLeft') : t('trial.banner.daysLeft')}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{t('trial.info.yourTrial.progress')}</span>
                  <span>{trialInfo.endDate}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${trialInfo.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span>
                  {t('trial.info.yourTrial.endDate')}: {trialInfo.endDate}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* What is the Trial Period */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trial.info.whatIs.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('trial.info.whatIs.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                  <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('trial.info.features.duration.title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t('trial.info.features.duration.description')}
                </p>
              </div>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-success-100 dark:bg-success-900/30 rounded-full mb-4">
                  <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-success-600 dark:text-success-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('trial.info.features.automatic.title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t('trial.info.features.automatic.description')}
                </p>
              </div>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full mb-4">
                  <RocketLaunchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-warning-600 dark:text-warning-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('trial.info.features.fullAccess.title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t('trial.info.features.fullAccess.description')}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Customer Benefits */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trial.info.forCustomers.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('trial.info.forCustomers.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <benefit.icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 dark:text-primary-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Specialist Benefits */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trial.info.forSpecialists.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('trial.info.forSpecialists.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialistBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <benefit.icon className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-600 dark:text-secondary-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* After Trial */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('trial.info.afterTrial.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6">
              {t('trial.info.afterTrial.description')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('trial.info.afterTrial.customers.title')}
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="w-5 h-5 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{t('trial.info.afterTrial.customers.item1')}</span>
                  </li>
                  <li className="flex items-start text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="w-5 h-5 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{t('trial.info.afterTrial.customers.item2')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {t('trial.info.afterTrial.specialists.title')}
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="w-5 h-5 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{t('trial.info.afterTrial.specialists.item1')}</span>
                  </li>
                  <li className="flex items-start text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="w-5 h-5 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{t('trial.info.afterTrial.specialists.item2')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="mt-12 sm:mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0">
              <div className="p-8 sm:p-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  {t('trial.info.cta.title')}
                </h2>
                <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                  {t('trial.info.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/auth/register"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
                  >
                    {t('trial.info.cta.signUpButton')}
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors font-semibold text-lg"
                  >
                    {t('trial.info.cta.loginButton')}
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialInfoPage;
