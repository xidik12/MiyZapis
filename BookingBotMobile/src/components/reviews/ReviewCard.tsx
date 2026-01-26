/**
 * ReviewCard Component for React Native
 * Displays individual review with rating, comment, tags, and specialist response
 * Based on web ReviewCard with Panhaha design system
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../../utils/design';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Divider } from '../ui/Divider';
import { SpecialistResponse } from './SpecialistResponse';

export interface ReviewCardData {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVerified: boolean;
  helpfulCount: number;
  isHelpful?: boolean;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  service?: {
    id: string;
    name: string;
  };
  response?: {
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
  };
}

interface ReviewCardProps {
  review: ReviewCardData;
  onMarkHelpful?: (reviewId: string, helpful: boolean) => void;
  onMarkResponseHelpful?: (responseId: string, helpful: boolean) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onMarkHelpful,
  onMarkResponseHelpful,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [showFullComment, setShowFullComment] = useState(false);
  const [showResponse, setShowResponse] = useState(true);

  const customerName = `${review.customer.firstName} ${review.customer.lastName}`;
  const customerInitial = review.customer.firstName.charAt(0).toUpperCase();
  const isLongComment = review.comment && review.comment.length > 200;
  const displayComment = showFullComment || !isLongComment
    ? review.comment
    : review.comment?.substring(0, 200) + '...';

  const handleHelpfulClick = () => {
    if (onMarkHelpful) {
      onMarkHelpful(review.id, !review.isHelpful);
    }
  };

  // Render star rating
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              { color: star <= review.rating ? ACCENT_COLORS[500] : colors.border },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.card} elevation="md">
      {/* Header Section */}
      <View style={styles.header}>
        {/* Avatar */}
        {review.customer.avatar ? (
          <Image
            source={{ uri: review.customer.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: PRIMARY_COLORS[500] }]}>
            <Text style={styles.avatarText}>{customerInitial}</Text>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
              {customerName}
            </Text>
            {review.isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>

          {/* Star Rating */}
          {renderStars()}

          {/* Timestamp */}
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {/* Service Badge */}
      {review.service && (
        <Badge
          variant="neutral"
          size="sm"
          styleType="soft"
          style={styles.serviceBadge}
        >
          {review.service.name}
        </Badge>
      )}

      {/* Comment */}
      {review.comment && (
        <View style={styles.commentContainer}>
          <Text style={[styles.comment, { color: colors.text }]}>
            {displayComment}
          </Text>
          {isLongComment && (
            <TouchableOpacity onPress={() => setShowFullComment(!showFullComment)}>
              <Text style={[styles.readMore, { color: PRIMARY_COLORS[500] }]}>
                {showFullComment ? t('reviews.showLess') : t('reviews.readMore')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {review.tags.map((tag, idx) => (
            <Badge
              key={idx}
              variant="primary"
              size="sm"
              styleType="soft"
              style={styles.tag}
            >
              🏷️ {tag}
            </Badge>
          ))}
        </View>
      )}

      {/* Engagement Section */}
      <Divider spacing={SPACING.md} />
      <View style={styles.engagement}>
        <TouchableOpacity
          onPress={handleHelpfulClick}
          style={[
            styles.engagementButton,
            {
              backgroundColor: review.isHelpful
                ? PRIMARY_COLORS[500] + '20'
                : (isDark ? colors.surface : colors.border),
            },
          ]}
        >
          <Text style={styles.heartIcon}>{review.isHelpful ? '❤️' : '🤍'}</Text>
          <Text
            style={[
              styles.engagementText,
              {
                color: review.isHelpful ? PRIMARY_COLORS[500] : colors.textSecondary,
                fontWeight: review.isHelpful ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.normal,
              },
            ]}
          >
            {review.helpfulCount} {t('reviews.helpful')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.engagementButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
        >
          <Text style={styles.icon}>💬</Text>
          <Text style={[styles.engagementText, { color: colors.textSecondary }]}>
            {review.response ? t('reviews.commentSingle') : t('reviews.comment')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.engagementButton, { backgroundColor: isDark ? colors.surface : colors.border }]}
        >
          <Text style={styles.icon}>🔗</Text>
          <Text style={[styles.engagementText, { color: colors.textSecondary }]}>
            {t('reviews.share')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Specialist Response */}
      {review.response && (
        <SpecialistResponse
          response={review.response}
          onMarkHelpful={onMarkResponseHelpful}
          isExpanded={showResponse}
          onToggle={() => setShowResponse(!showResponse)}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
  },
  customerInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  customerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    flex: 1,
  },
  verifiedBadge: {
    fontSize: 16,
    color: SUCCESS_COLOR,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  commentContainer: {
    marginBottom: SPACING.md,
  },
  comment: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  readMore: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tag: {
    marginBottom: 0,
  },
  engagement: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  engagementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  heartIcon: {
    fontSize: 14,
  },
  icon: {
    fontSize: 14,
  },
  engagementText: {
    fontSize: FONT_SIZES.xs,
  },
});

export default ReviewCard;
