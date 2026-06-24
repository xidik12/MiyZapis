import { Booking } from '../types';

export const statusColors = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  CONFIRMED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  IN_PROGRESS: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  NO_SHOW: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  // Legacy lowercase support for compatibility
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  inProgress: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  noShow: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
} as const;

export const serviceNameMapping: Record<string, string> = {
  'Консультація з психології': 'service.consultation',
  'Індивідуальна терапія': 'service.individualTherapy',
  'Сімейна консультація': 'service.familyConsultation',
  'Групова терапія': 'service.groupTherapy',
  'Експрес-консультація': 'service.expressConsultation',
  'Підліткова психологія': 'service.teenPsychology',
  'Терапія пар': 'service.coupleTherapy',
  'Психологічна консультація': 'service.psychologyConsultation',
};

export const getTranslatedServiceName = (serviceName: string, t: (key: string) => string): string => {
  return serviceNameMapping[serviceName] ? t(serviceNameMapping[serviceName]) : serviceName;
};

export const getTranslatedDuration = (duration: string | number, t: (key: string) => string): string => {
  const durationStr = typeof duration === 'string' ? duration : `${duration} хв`;
  return durationStr.replace(/\s*хв\s*$/i, ` ${t('time.minutes')}`);
};

export const getSpecialistName = (booking: Booking): string => {
  return booking.specialist?.firstName && booking.specialist?.lastName
    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
    : booking.specialistName || 'Unknown Specialist';
};

export const getSpecialistAvatar = (booking: Booking): string | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (booking.specialist as any)?.profileImage || booking.specialist?.user?.avatar;
};

export const getSpecialistRating = (booking: Booking): number => {
  return booking.specialist?.rating || 5;
};

export const getBookingCurrency = (booking: Booking): 'USD' | 'EUR' | 'UAH' => {
  return (booking.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH';
};

export const canCancelBooking = (booking: Booking): boolean => {
  const scheduledDate = new Date(booking.scheduledAt as string | number | Date);
  const isUpcoming = (['PENDING', 'CONFIRMED'] as string[]).includes(booking.status) && scheduledDate > new Date();
  return isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const canRescheduleBooking = (booking: Booking): boolean => {
  const scheduledDate = new Date(booking.scheduledAt as string | number | Date);
  const isUpcoming = (['PENDING', 'CONFIRMED'] as string[]).includes(booking.status) && scheduledDate > new Date();
  return isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const canReviewBooking = (booking: Booking): boolean => {
  return booking.status === 'COMPLETED' && !booking.review;
};

export const canBookAgain = (booking: Booking): boolean => {
  return booking.status === 'COMPLETED';
};