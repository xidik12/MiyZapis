import React from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  CheckCircleIcon as CheckBadgeIcon,
  ChatCircleIcon as ChatBubbleLeftIcon,
  ChartBarIcon
} from '@/components/icons';

export interface ReviewStatsData {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedReviewsCount: number;
  recommendationRate: number;
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({ stats }) => {
  const verifiedPercentage = stats.totalReviews > 0
    ? Math.round((stats.verifiedReviewsCount / stats.totalReviews) * 100)
    : 0;

  const responseCount = 0; // Placeholder - would need to be passed from parent

  const statCards = [
    {
      icon: <StarIcon className="w-8 h-8 text-yellow-500" active />,
      label: 'Average',
      value: stats.averageRating.toFixed(1),
      unit: '⭐',
      color: 'from-yellow-500/10 to-yellow-600/5'
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      label: 'Total Reviews',
      value: stats.totalReviews.toString(),
      unit: '',
      color: 'from-blue-500/10 to-blue-600/5'
    },
    {
      icon: <CheckBadgeIcon className="w-8 h-8 text-green-600 dark:text-green-400" />,
      label: 'Verified',
      value: `${verifiedPercentage}%`,
      unit: '',
      color: 'from-green-500/10 to-green-600/5'
    },
    {
      icon: <ChatBubbleLeftIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      label: 'Responses',
      value: responseCount.toString(),
      unit: '',
      color: 'from-purple-500/10 to-purple-600/5'
    }
  ];

  return (
    <div className="mb-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
                {stat.unit && <span className="text-xl ml-1">{stat.unit}</span>}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rating Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200/50 dark:border-gray-700/50"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0
              ? (count / stats.totalReviews) * 100
              : 0;

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {rating}
                  </span>
                  <StarIcon className="w-4 h-4 text-yellow-500" active />
                </div>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.5 + (5 - rating) * 0.1, duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      rating >= 4
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : rating === 3
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
