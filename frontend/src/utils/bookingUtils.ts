import { Booking } from '../types';

export const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
  pending_payment: 'bg-orange-100 text-orange-800 border-orange-200',
  // Legacy lowercase support for compatibility
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  inProgress: 'bg-purple-100 text-purple-800 border-purple-200',
  noShow: 'bg-gray-100 text-gray-800 border-gray-200'
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
  return booking.specialist?.profileImage || booking.specialist?.user?.avatar;
};

export const getSpecialistRating = (booking: Booking): number => {
  return booking.specialist?.rating || 5;
};

export const getBookingCurrency = (booking: Booking): 'USD' | 'KHR' | 'UAH' | 'EUR' => {
  const detected = (booking.service?.currency || (booking as any)?.currency || '').toUpperCase();
  if (detected === 'KHR') return 'KHR';
  if (detected === 'EUR') return 'EUR';
  if (detected === 'UAH') return 'UAH';
  return 'USD';
};

export const canCancelBooking = (booking: Booking): boolean => {
  const scheduledDate = new Date(booking.scheduledAt);
  const isUpcoming = ['PENDING', 'CONFIRMED'].includes(booking.status) && scheduledDate > new Date();
  return isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const canRescheduleBooking = (booking: Booking): boolean => {
  const scheduledDate = new Date(booking.scheduledAt);
  const isUpcoming = ['PENDING', 'CONFIRMED'].includes(booking.status) && scheduledDate > new Date();
  return isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const canReviewBooking = (booking: Booking): boolean => {
  return booking.status === 'COMPLETED' && !booking.review;
};

export const canBookAgain = (booking: Booking): boolean => {
  return booking.status === 'COMPLETED';
};
