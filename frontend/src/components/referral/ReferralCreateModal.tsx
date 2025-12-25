import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { XIcon as XMarkIcon, UserGroupIcon, BriefcaseIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ShareIcon, LinkIcon, DeviceMobileIcon as DevicePhoneMobileIcon } from '@/components/icons';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  ReferralModalProps,
  CreateReferralRequest,
  ReferralFormData,
  ReferralType,
  InviteChannel,
} from '../../types/referral';
import { referralService } from '../../services/referral.service';

const ReferralCreateModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  config,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ReferralFormData>({
    referralType: 'CUSTOMER_TO_CUSTOMER',
    targetUserType: 'CUSTOMER',
    inviteChannel: 'LINK',
    customMessage: '',
    expiresInDays: config.config.DEFAULT_EXPIRY_DAYS,
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        referralType: 'CUSTOMER_TO_CUSTOMER',
        targetUserType: 'CUSTOMER',
        inviteChannel: 'LINK',
        customMessage: '',
        expiresInDays: config.config.DEFAULT_EXPIRY_DAYS,
      });
      setErrors([]);
    }
  }, [isOpen, config.config.DEFAULT_EXPIRY_DAYS]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = referralService.validateReferralForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    await onSubmit(formData);
  };

  const handleReferralTypeChange = (type: ReferralType) => {
    setFormData(prev => ({
      ...prev,
      referralType: type,
      targetUserType: type === 'CUSTOMER_TO_SPECIALIST' ? 'SPECIALIST' : 'CUSTOMER',
    }));
  };

  const getChannelIcon = (channel: InviteChannel) => {
    switch (channel) {
      case 'EMAIL':
        return <EnvelopeIcon className="h-5 w-5" />;
      case 'SMS':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
      case 'SOCIAL':
        return <ShareIcon className="h-5 w-5" />;
      case 'DIRECT':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      case 'LINK':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <ShareIcon className="h-5 w-5" />;
    }
  };

  const getChannelLabel = (channel: InviteChannel) => {
    switch (channel) {
      case 'EMAIL':
        return 'Email';
      case 'SMS':
        return 'SMS';
      case 'SOCIAL':
        return 'Social Media';
      case 'DIRECT':
        return 'Direct Message';
      case 'LINK':
        return 'Share Link';
      default:
        return channel;
    }
  };

  if (!isOpen) return null;

  const availableChannels: InviteChannel[] = ['LINK', 'EMAIL', 'SMS', 'SOCIAL', 'DIRECT'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Referral
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="text-sm text-red-700 dark:text-red-400">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Referral Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Referral Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {config.availableTypes.map((type) => {
                    const rewards = config.config.REWARDS[type];
                    const isSelected = formData.referralType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleReferralTypeChange(type)}
                        className={clsx(
                          'text-left p-4 border-2 rounded-xl transition-all',
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-start">
                          <div className={clsx(
                            'p-2 rounded-xl mr-3',
                            type === 'CUSTOMER_TO_SPECIALIST'
                              ? 'bg-purple-100 dark:bg-purple-900/20'
                              : 'bg-blue-100 dark:bg-blue-900/20'
                          )}>
                            {type === 'CUSTOMER_TO_SPECIALIST' ? (
                              <BriefcaseIcon className={clsx(
                                'h-5 w-5',
                                type === 'CUSTOMER_TO_SPECIALIST'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              )} />
                            ) : (
                              <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {referralService.getReferralTypeDisplayName(type)}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              You earn: {referralService.getRewardDisplayText(rewards.referrerRewardType, rewards.referrerRewardValue)}
                              {' • '}
                              They get: {referralService.getRewardDisplayText(rewards.referredRewardType, rewards.referredRewardValue)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Invite Channel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How will you share this?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableChannels.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, inviteChannel: channel }))}
                      className={clsx(
                        'flex items-center p-3 border rounded-xl transition-all text-sm',
                        formData.inviteChannel === channel
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {getChannelIcon(channel)}
                      <span className="ml-2">{getChannelLabel(channel)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Add a personal message to your referral..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.customMessage.length}/500 characters
                </div>
              </div>

              {/* Expiry Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expires In (Days)
                </label>
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (Default)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Create Referral
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReferralCreateModal;