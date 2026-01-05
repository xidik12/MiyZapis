import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  HeartIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BriefcaseIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';

interface SpecialistResponseData {
  id: string;
  responseText: string;
  createdAt: string;
  respondedBy: {
    id: string;
    businessName?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  helpfulCount?: number;
  isHelpful?: boolean;
}

interface SpecialistResponseProps {
  response: SpecialistResponseData;
  onMarkHelpful?: (responseId: string, helpful: boolean) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const SpecialistResponse: React.FC<SpecialistResponseProps> = ({
  response,
  onMarkHelpful,
  isExpanded = true,
  onToggle
}) => {
  const businessName = response.respondedBy.businessName || `${response.respondedBy.firstName} ${response.respondedBy.lastName}`;
  const initial = response.respondedBy.firstName.charAt(0).toUpperCase();
  const hasAvatar = response.respondedBy.avatar;

  const handleHelpfulClick = () => {
    if (onMarkHelpful) {
      onMarkHelpful(response.id, !response.isHelpful);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
      {/* Response Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            SPECIALIST RESPONSE
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            • {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Response Content (collapsible) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              {/* Specialist Info */}
              <div className="flex items-start gap-3 mb-3">
                {hasAvatar ? (
                  <Avatar
                    src={response.respondedBy.avatar}
                    alt={businessName}
                    size="md"
                    className="w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {initial}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    {businessName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Specialist
                  </p>
                </div>
              </div>

              {/* Response Text */}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 pl-13 whitespace-pre-wrap">
                {response.responseText}
              </p>

              {/* Helpful Button */}
              {response.helpfulCount !== undefined && (
                <div className="pl-13">
                  <button
                    onClick={handleHelpfulClick}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                      response.isHelpful
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <HeartIcon
                      className={`w-4 h-4 ${response.isHelpful ? 'text-primary-600 dark:text-primary-400' : ''}`}
                      active={response.isHelpful}
                    />
                    <span className="text-xs font-semibold">
                      {response.helpfulCount} Helpful
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
