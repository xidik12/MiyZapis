import React from 'react';
import { ArrowPathIcon, GiftIcon, CheckCircleIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { RecurringBookingModal, type RecurrenceData } from '@/components/modals/RecurringBookingModal';
import type { UserLoyalty } from '@/services/loyalty.service';
import type { RewardRedemption } from '@/services/rewards.service';

interface BookingDetailsProps {
  service: Record<string, unknown>;
  specialist: Record<string, unknown>;
  selectedDate: Date | null;
  selectedTime: string;

  // Details
  bookingNotes: string;
  onBookingNotesChange: (value: string) => void;
  participantCount: number;
  onParticipantCountChange: (value: number) => void;

  // Recurring
  isRecurring: boolean;
  recurrenceData: RecurrenceData | null;
  showRecurringModal: boolean;
  onToggleRecurring: () => void;
  onShowRecurringModal: () => void;
  onCloseRecurringModal: () => void;
  onSaveRecurrence: (data: RecurrenceData) => void;

  // Rewards
  redemptions: RewardRedemption[];
  selectedRedemptionId: string;
  onSelectedRedemptionIdChange: (value: string) => void;
  discount: number;
  finalPrice: number;

  // Loyalty
  loyaltyData: UserLoyalty | null;
  pointsToEarn: number;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  service,
  specialist,
  selectedDate,
  selectedTime,
  bookingNotes,
  onBookingNotesChange,
  participantCount,
  onParticipantCountChange,
  isRecurring,
  recurrenceData,
  showRecurringModal,
  onToggleRecurring,
  onShowRecurringModal,
  onCloseRecurringModal,
  onSaveRecurrence,
  redemptions,
  selectedRedemptionId,
  onSelectedRedemptionIdChange,
  discount,
  finalPrice,
  loyaltyData,
  pointsToEarn,
}) => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.bookingDetails')}
        </h3>

        <div className="space-y-4">
          {/* Participant Count for Group Sessions */}
          {service?.isGroupSession && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('booking.participantCount')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max={service.maxParticipants || 999}
                  value={participantCount}
                  onChange={(e) => onParticipantCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                {service.maxParticipants && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {`${t('booking.participantCountHint')} ${service.maxParticipants}`}
                  </span>
                )}
              </div>
              {service.minParticipants && participantCount < service.minParticipants && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  {`${t('booking.minParticipantsWarning')} ${service.minParticipants}`}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('booking.additionalNotes')}
            </label>
            <textarea
              value={bookingNotes}
              onChange={(e) => onBookingNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('booking.notesPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Recurring Booking Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <ArrowPathIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t('booking.makeRecurring') || 'Make this recurring'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('booking.makeRecurringDesc') || 'Automatically schedule this booking on a regular basis'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isRecurring}
            onClick={onToggleRecurring}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isRecurring ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isRecurring ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Recurrence Summary */}
        {isRecurring && recurrenceData && (
          <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-900 dark:text-primary-300">
                  {recurrenceData.frequency === 'daily' && 'Every day'}
                  {recurrenceData.frequency === 'weekly' && (
                    recurrenceData.daysOfWeek && recurrenceData.daysOfWeek.length > 0
                      ? `Every week on ${recurrenceData.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`
                      : 'Every week'
                  )}
                  {recurrenceData.frequency === 'biweekly' && 'Every 2 weeks'}
                  {recurrenceData.frequency === 'monthly' && 'Every month'}
                </p>
                <p className="text-xs text-primary-700 dark:text-primary-400 mt-0.5">
                  {recurrenceData.endType === 'never' && 'Repeats indefinitely (up to 52 times)'}
                  {recurrenceData.endType === 'after' && `${recurrenceData.occurrences || 10} occurrences`}
                  {recurrenceData.endType === 'on' && recurrenceData.endDate && `Until ${recurrenceData.endDate}`}
                </p>
              </div>
              <button
                onClick={onShowRecurringModal}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {t('common.edit') || 'Edit'}
              </button>
            </div>
          </div>
        )}

        {isRecurring && !recurrenceData && (
          <div className="mt-4">
            <button
              onClick={onShowRecurringModal}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {t('booking.configureRecurrence') || 'Configure recurrence pattern...'}
            </button>
          </div>
        )}
      </div>

      {/* Recurring Booking Modal */}
      <RecurringBookingModal
        isOpen={showRecurringModal}
        onClose={onCloseRecurringModal}
        onSave={onSaveRecurrence}
        initialData={recurrenceData || undefined}
      />

      {/* Reward Selection */}
      {redemptions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <GiftIcon className="w-6 h-6 mr-3 text-purple-600" />
            {t('booking.applyReward') || 'Apply a Reward'}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('booking.selectReward') || 'Choose a reward to apply'}
              </label>
              <select
                value={selectedRedemptionId}
                onChange={(e) => onSelectedRedemptionIdChange(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                  selectedRedemptionId ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' : ''
                } text-gray-900 dark:text-white`}
              >
                <option value="">{t('booking.noRewardSelected') || 'No reward selected'}</option>
                {redemptions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.reward.title} • {r.reward.type === 'PERCENTAGE_OFF' && r.reward.discountPercent ? `${r.reward.discountPercent}%` : r.reward.type === 'DISCOUNT_VOUCHER' && r.reward.discountAmount ? `-$${r.reward.discountAmount}` : r.reward.type === 'FREE_SERVICE' ? t('booking.freeService') || 'Free service' : t('booking.reward') || 'Reward'}
                    {r.expiresAt ? ` • ${t('booking.expires') || 'Expires'} ${new Date(r.expiresAt).toLocaleDateString()}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Show confirmation when reward is selected */}
            {selectedRedemptionId && discount > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('booking.rewardApplied') || 'Reward Applied!'}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('booking.youSave') || 'You save'} {formatPrice(discount, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.summary')}
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.specialist')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {specialist.user?.firstName} {specialist.user?.lastName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.service')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {service.name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.dateTime')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedDate?.toLocaleDateString(language || 'en')} {selectedTime}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.duration')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {service.duration} {t('time.minutes')}
            </span>
          </div>

          {isRecurring && recurrenceData && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('booking.recurrence') || 'Recurrence'}</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {recurrenceData.frequency === 'daily' && 'Daily'}
                {recurrenceData.frequency === 'weekly' && 'Weekly'}
                {recurrenceData.frequency === 'biweekly' && 'Biweekly'}
                {recurrenceData.frequency === 'monthly' && 'Monthly'}
                {recurrenceData.endType === 'after' && ` (${recurrenceData.occurrences}x)`}
                {recurrenceData.endType === 'on' && recurrenceData.endDate && ` until ${recurrenceData.endDate}`}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            {/* Show discount breakdown if reward is selected */}
            {discount > 0 && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('booking.originalPrice') || 'Original Price'}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatPrice(service.price || service.basePrice || 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-green-600 dark:text-green-400">{t('booking.discount') || 'Reward Discount'}</span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    -{formatPrice(discount, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                  </span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mb-2"></div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{t('booking.total')}</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(discount > 0 ? finalPrice : (service.price || service.basePrice || 0), (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
              </span>
            </div>

            {/* Loyalty Points to Earn */}
            {loyaltyData && pointsToEarn > 0 && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2">
                  <GiftIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Points you'll earn
                  </span>
                </div>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  +{pointsToEarn} points
                </span>
              </div>
            )}

            {/* Current Loyalty Points */}
            {loyaltyData && (
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Your current points
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {loyaltyData?.currentPoints?.toLocaleString() || '0'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
