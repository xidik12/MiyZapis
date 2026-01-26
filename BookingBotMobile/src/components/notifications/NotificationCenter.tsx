/**
 * Notification Center Component for React Native
 * Sliding panel with swipe-to-dismiss, category filters, and glassmorphism
 * Based on web NotificationCenter with Panhaha design system
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
} from '../../store/slices/notificationSlice';
import { Notification, NotificationType } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../../utils/design';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(SCREEN_WIDTH, 400); // Max 400px width
const SWIPE_THRESHOLD = 200; // Swipe 200px to close

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const dispatch = useAppDispatch();

  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotificationLoading);

  const [selectedFilter, setSelectedFilter] = useState<NotificationType | 'all'>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  // Animated value for slide-in/out
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes to the right
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping to the right (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe threshold exceeded, close panel
          handleClose();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications());
      // Slide in
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      // Reset position
      translateX.setValue(PANEL_WIDTH);
    }
  }, [isOpen]);

  // Filter notifications by category
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(n => {
        const type = (n.type || '').toLowerCase();
        const filter = selectedFilter.toLowerCase();
        return type.includes(filter);
      });
      setFilteredNotifications(filtered);
    }
  }, [notifications, selectedFilter]);

  const handleClose = () => {
    Animated.timing(translateX, {
      toValue: PANEL_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  const handleDeleteAll = () => {
    Alert.alert(
      t('notifications.clearConfirm.title') || 'Delete all notifications?',
      t('notifications.clearConfirm.message') || 'This cannot be undone.',
      [
        {
          text: t('notifications.clearConfirm.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('notifications.clearConfirm.confirm') || 'Delete all',
          style: 'destructive',
          onPress: () => {
            // Delete all notifications
            filteredNotifications.forEach(n => dispatch(removeNotification(n.id)));
          },
        },
      ]
    );
  };

  // Get notification icon emoji
  const getNotificationIcon = (type: NotificationType): string => {
    const category = getNotificationCategory(type);
    switch (category) {
      case 'booking':
        return '📅';
      case 'payment':
        return '💳';
      case 'review':
        return '⭐';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  // Get notification category
  const getNotificationCategory = (type: NotificationType): string => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('booking')) return 'booking';
    if (normalized.includes('payment')) return 'payment';
    if (normalized.includes('review')) return 'review';
    if (normalized.includes('system')) return 'system';
    return 'system';
  };

  // Get notification color
  const getNotificationColor = (type: NotificationType) => {
    const category = getNotificationCategory(type);
    switch (category) {
      case 'booking':
        return SECONDARY_COLORS[500]; // Deep Sea Blue
      case 'payment':
        return SUCCESS_COLOR; // Emerald Green
      case 'review':
        return ACCENT_COLORS[500]; // Gold
      case 'system':
        return colors.textSecondary; // Gray
      default:
        return colors.textSecondary;
    }
  };

  // Format time (5m ago, 2h ago, etc.)
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications.time.justNow') || 'Just now';
    if (diffMins < 60) {
      const tpl = t('notifications.time.minutesAgo') || '{n}m ago';
      return tpl.replace('{n}', String(diffMins));
    }
    if (diffHours < 24) {
      const tpl = t('notifications.time.hoursAgo') || '{n}h ago';
      return tpl.replace('{n}', String(diffHours));
    }
    if (diffDays < 7) {
      const tpl = t('notifications.time.daysAgo') || '{n}d ago';
      return tpl.replace('{n}', String(diffDays));
    }
    return date.toLocaleDateString();
  };

  // Localize notification content
  const localizeNotification = (n: Notification): { title: string; message: string } => {
    const service = n.data?.serviceName || '';
    const date = n.data?.date || '';
    const interp = (tpl: string, vars: Record<string, string | number>) =>
      (tpl || '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

    switch (n.type) {
      case 'booking_confirmed':
        return {
          title: t('notifications.bookingConfirmed.title') || 'Booking confirmed',
          message: interp(t('notifications.bookingConfirmed.message') || 'Booking for {service} on {date} confirmed.', { service, date }),
        };
      case 'new_booking':
        return {
          title: t('notifications.newBooking.title') || 'New booking request',
          message: interp(t('notifications.newBooking.message') || 'New booking for {service} on {date}.', { service, date }),
        };
      case 'booking_cancelled':
        return {
          title: t('notifications.bookingCancelled.title') || 'Booking cancelled',
          message: interp(t('notifications.bookingCancelled.message') || 'Booking for {service} on {date} cancelled.', { service, date }),
        };
      case 'booking_reminder':
        return {
          title: t('notifications.bookingReminder.title') || 'Booking reminder',
          message: interp(t('notifications.bookingReminder.message') || 'Reminder: {service} on {date}.', { service, date }),
        };
      case 'payment_received':
        return {
          title: t('notifications.paymentReceived.title') || 'Payment received',
          message: t('notifications.paymentReceived.message') || 'Payment completed successfully.',
        };
      case 'payment_failed':
        return {
          title: t('notifications.paymentFailed.title') || 'Payment failed',
          message: t('notifications.paymentFailed.message') || 'Payment failed. Please try again.',
        };
      case 'review_received':
        return {
          title: t('notifications.reviewReceived.title') || 'New Review',
          message: interp(t('notifications.reviewReceived.message') || '{rating}-star review for "{service}"', { rating: n.data?.rating || '', service }),
        };
      case 'booking_updated':
        return {
          title: t('notifications.bookingUpdated.title') || 'Booking updated',
          message: interp(t('notifications.bookingUpdated.message') || 'Booking for {service} on {date} updated.', { service, date }),
        };
      default:
        return { title: n.title, message: n.message };
    }
  };

  // Render notification item
  const renderNotification = ({ item: notification }: { item: Notification }) => {
    const { title, message } = localizeNotification(notification);
    const iconColor = getNotificationColor(notification.type);

    return (
      <View
        style={[
          styles.notificationCard,
          {
            backgroundColor: notification.isRead
              ? (isDark ? colors.surface + '66' : colors.surface + 'CC')
              : (isDark ? colors.surface + '99' : colors.surface),
            borderLeftWidth: notification.isRead ? 0 : 3,
            borderLeftColor: PRIMARY_COLORS[500],
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconColor + '20',
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{getNotificationIcon(notification.type)}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: notification.isRead ? colors.textSecondary : colors.text,
                  fontWeight: notification.isRead ? FONT_WEIGHTS.normal : FONT_WEIGHTS.semibold,
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!notification.isRead && (
              <View style={[styles.unreadDot, { backgroundColor: PRIMARY_COLORS[500] }]} />
            )}
          </View>

          <Text
            style={[styles.message, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {message}
          </Text>

          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!notification.isRead && (
            <TouchableOpacity
              onPress={() => handleMarkAsRead(notification.id)}
              style={[styles.actionButton, { backgroundColor: SUCCESS_COLOR + '20' }]}
            >
              <Text style={styles.actionIcon}>✓</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDelete(notification.id)}
            style={[styles.actionButton, { backgroundColor: ERROR_COLOR + '20' }]}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.skeletonItem}>
          <Skeleton variant="circular" height={48} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={14} style={{ marginTop: SPACING.sm }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        </TouchableOpacity>

        {/* Panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              backgroundColor: colors.background,
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Decorative gradient orbs */}
          <View style={styles.decorativeOrbs}>
            <View style={[styles.orb1, { backgroundColor: PRIMARY_COLORS[500] + '15' }]} />
            <View style={[styles.orb2, { backgroundColor: SECONDARY_COLORS[500] + '10' }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.bellIcon, { backgroundColor: PRIMARY_COLORS[500] + '20' }]}>
                <Text style={styles.bellEmoji}>🔔</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {t('notifications.title') || 'Notifications'}
                </Text>
                <Text style={[styles.headerHint, { color: colors.textSecondary }]}>
                  {t('notifications.swipeHint') || 'Swipe right to close'}
                </Text>
              </View>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm" styleType="solid" style={styles.unreadBadge}>
                  {unreadCount}
                </Badge>
              )}
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filters and Actions */}
          <View style={[styles.controls, { borderBottomColor: colors.border, backgroundColor: colors.surface + '80' }]}>
            {/* Category filters */}
            <View style={[styles.filterTabs, { backgroundColor: isDark ? colors.surface : colors.border }]}>
              {(['all', 'booking', 'payment', 'review', 'system'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter && { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: selectedFilter === filter ? colors.text : colors.textSecondary,
                        fontWeight: selectedFilter === filter ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.normal,
                      },
                    ]}
                  >
                    {filter === 'all' ? (t('notifications.filter.all') || 'All')
                      : filter === 'booking' ? (t('notifications.filter.booking') || 'Bookings')
                      : filter === 'payment' ? (t('notifications.filter.payment') || 'Payments')
                      : filter === 'review' ? (t('notifications.filter.review') || 'Reviews')
                      : (t('notifications.filter.system') || 'System')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              {unreadCount > 0 && (
                <Button
                  variant="subtle"
                  size="sm"
                  onPress={handleMarkAllAsRead}
                  style={styles.actionBtn}
                >
                  {t('notifications.markAllRead') || 'Mark all read'}
                </Button>
              )}
              {filteredNotifications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={handleDeleteAll}
                  style={styles.actionBtn}
                >
                  {t('notifications.clearAll') || 'Clear all'}
                </Button>
              )}
            </View>
          </View>

          {/* Notifications List */}
          <View style={styles.listContainer}>
            {loading ? (
              <LoadingSkeleton />
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                emoji="🔔"
                title={t('notifications.empty') || 'No notifications'}
                description={t('notifications.caughtUp') || "You're all caught up!"}
              />
            ) : (
              <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  decorativeOrbs: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 300,
    overflow: 'hidden',
    zIndex: 0,
  },
  orb1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  orb2: {
    position: 'absolute',
    top: 150,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  bellIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
  },
  headerHint: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  unreadBadge: {
    marginLeft: SPACING.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
  },
  controls: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: FONT_SIZES.xs,
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
  },
  actions: {
    gap: SPACING.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  skeletonContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NotificationCenter;
