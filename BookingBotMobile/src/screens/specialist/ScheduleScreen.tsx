/**
 * ScheduleScreen - Redesigned with Panhaha design system
 * Availability management with week navigation and time blocks
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { specialistService } from '../../services/specialist.service';
import { BlockedSlot } from '../../types';
import { format, addDays, startOfWeek, endOfWeek, parseISO, isToday } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Divider } from '../../components/ui/Divider';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

interface DaySchedule {
  date: Date;
  blocks: BlockedSlot[];
}

export const ScheduleScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    reason: '',
    isRecurring: false,
  });

  useEffect(() => {
    loadSchedule();
  }, [weekStart]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const startDateStr = format(weekStart, 'yyyy-MM-dd');
      const endDateStr = format(addDays(weekEnd, 1), 'yyyy-MM-dd');

      const blocks = await specialistService.getAvailabilityBlocks(startDateStr, endDateStr);

      // Group blocks by day
      const daySchedules: DaySchedule[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dayBlocks = blocks.filter((block) => {
          const blockDate = parseISO(block.startDateTime);
          return format(blockDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });
        daySchedules.push({
          date,
          blocks: dayBlocks,
        });
      }

      setSchedule(daySchedules);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      Alert.alert(t('common.error'), t('schedule.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleAddBlock = (date: Date) => {
    setSelectedDate(date);
    setEditingBlock(null);
    setFormData({
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      reason: '',
      isRecurring: false,
    });
    setModalVisible(true);
  };

  const handleEditBlock = (block: BlockedSlot) => {
    setEditingBlock(block);
    const startDate = parseISO(block.startDateTime);
    const endDate = parseISO(block.endDateTime);
    setSelectedDate(startDate);
    setFormData({
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      isAvailable: block.isAvailable,
      reason: block.reason || '',
      isRecurring: block.isRecurring || false,
    });
    setModalVisible(true);
  };

  const handleSaveBlock = async () => {
    if (!selectedDate) return;

    try {
      const startDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${formData.startTime}:00`;
      const endDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${formData.endTime}:00`;

      if (editingBlock) {
        await specialistService.updateAvailabilityBlock(editingBlock.id, {
          startDateTime,
          endDateTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason || undefined,
          isRecurring: formData.isRecurring,
        });
        Alert.alert(t('common.success'), t('schedule.updateSuccess'));
      } else {
        await specialistService.createAvailabilityBlock({
          startDateTime,
          endDateTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason || undefined,
          isRecurring: formData.isRecurring,
        });
        Alert.alert(t('common.success'), t('schedule.addSuccess'));
      }

      setModalVisible(false);
      await loadSchedule();
    } catch (error: any) {
      console.error('Failed to save block:', error);
      Alert.alert(t('common.error'), error?.message || t('schedule.saveError'));
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    Alert.alert(
      t('schedule.confirmDelete'),
      t('schedule.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await specialistService.deleteAvailabilityBlock(blockId);
              Alert.alert(t('common.success'), t('schedule.deleteSuccess'));
              await loadSchedule();
            } catch (error: any) {
              console.error('Failed to delete block:', error);
              Alert.alert(t('common.error'), error?.message || t('schedule.deleteError'));
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>📅</Text>
          <Text style={styles.heroTitle}>{t('schedule.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('schedule.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderWeekNavigator = () => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    return (
      <View style={styles.weekNavigator}>
        <TouchableOpacity
          onPress={handlePreviousWeek}
          style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.navButtonText, { color: SECONDARY_COLORS[500] }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={[styles.weekText, { color: colors.text }]}>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Text>
          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: SECONDARY_COLORS[500] }]}
            onPress={handleToday}
          >
            <Text style={styles.todayButtonText}>{t('schedule.today')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleNextWeek}
          style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.navButtonText, { color: SECONDARY_COLORS[500] }]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDayCard = (day: DaySchedule) => {
    const dayIsToday = isToday(day.date);

    return (
      <Card
        key={day.date.toISOString()}
        style={[
          styles.dayCard,
          dayIsToday && { borderColor: SECONDARY_COLORS[500], borderWidth: 2 },
        ]}
        borderVariant="subtle"
        elevation="sm"
      >
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleContainer}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              {format(day.date, 'EEEE')}
            </Text>
            <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
              {format(day.date, 'MMM d')}
            </Text>
            {dayIsToday && (
              <Badge label={t('schedule.today')} variant="secondary" size="sm" />
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: SECONDARY_COLORS[500] }]}
            onPress={() => handleAddBlock(day.date)}
          >
            <Text style={styles.addButtonText}>+ {t('schedule.add')}</Text>
          </TouchableOpacity>
        </View>

        {day.blocks.length > 0 ? (
          <View style={styles.blocksList}>
            {day.blocks.map((block, index) => (
              <View key={block.id}>
                {index > 0 && <Divider spacing={SPACING.sm} />}
                <View
                  style={[
                    styles.timeBlock,
                    {
                      borderLeftColor: block.isAvailable ? SUCCESS_COLOR : ERROR_COLOR,
                      borderLeftWidth: 3,
                    },
                  ]}
                >
                  <View style={styles.blockContent}>
                    <View style={styles.blockTimeRow}>
                      <Text style={[styles.blockTime, { color: colors.text }]}>
                        {format(parseISO(block.startDateTime), 'HH:mm')} -{' '}
                        {format(parseISO(block.endDateTime), 'HH:mm')}
                      </Text>
                      {block.isRecurring && (
                        <Badge label={t('schedule.recurring')} variant="secondary" size="sm" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.blockStatus,
                        { color: block.isAvailable ? SUCCESS_COLOR : colors.textSecondary },
                      ]}
                    >
                      {block.isAvailable
                        ? t('schedule.available')
                        : block.reason || t('schedule.unavailable')}
                    </Text>
                  </View>
                  <View style={styles.blockActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditBlock(block)}
                    >
                      <Text style={[styles.actionIcon, { color: SECONDARY_COLORS[500] }]}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteBlock(block.id)}
                    >
                      <Text style={[styles.actionIcon, { color: ERROR_COLOR }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('schedule.noBlocks')}
          </Text>
        )}
      </Card>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent} borderVariant="subtle" elevation="lg">
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingBlock ? t('schedule.editBlock') : t('schedule.addBlock')}
          </Text>

          {selectedDate && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('schedule.date')}</Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {format(selectedDate, 'EEEE, MMM d, yyyy')}
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('schedule.startTime')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={formData.startTime}
              onChangeText={(text) => setFormData({ ...formData, startTime: text })}
              placeholder="09:00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('schedule.endTime')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={formData.endTime}
              onChangeText={(text) => setFormData({ ...formData, endTime: text })}
              placeholder="17:00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('schedule.available')}</Text>
              <Switch
                value={formData.isAvailable}
                onValueChange={(value) => setFormData({ ...formData, isAvailable: value })}
                trackColor={{ false: colors.border, true: SUCCESS_COLOR }}
                thumbColor={formData.isAvailable ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>

          {!formData.isAvailable && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('schedule.reason')} ({t('common.optional')})
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={formData.reason}
                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                placeholder={t('schedule.reasonPlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('schedule.recurring')}</Text>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
                trackColor={{ false: colors.border, true: SECONDARY_COLORS[500] }}
                thumbColor={formData.isRecurring ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: SECONDARY_COLORS[500] }]}
              onPress={handleSaveBlock}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {editingBlock ? t('common.update') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={80} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.md }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SECONDARY_COLORS[500]}
            colors={[SECONDARY_COLORS[500]]}
          />
        }
      >
        {renderWeekNavigator()}
        {schedule.map((day) => renderDayCard(day))}
      </ScrollView>
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 160,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 140,
    height: 140,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 110,
    height: 110,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  weekText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  todayButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  dayCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dayTitleContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  dayTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  dayDate: {
    fontSize: FONT_SIZES.sm,
  },
  addButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  blocksList: {
    gap: SPACING.xs,
  },
  timeBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.md,
  },
  blockContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  blockTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  blockTime: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  blockStatus: {
    fontSize: FONT_SIZES.sm,
  },
  blockActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  actionIcon: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight as any,
    marginBottom: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: FONT_SIZES.base,
    paddingVertical: SPACING.xs,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  buttonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});
