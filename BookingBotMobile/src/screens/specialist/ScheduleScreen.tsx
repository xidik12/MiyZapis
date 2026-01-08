// Schedule Screen - Specialist availability management (matching web version)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { specialistService } from '../../services/specialist.service';
import { BlockedSlot } from '../../types';
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';

interface DaySchedule {
  date: Date;
  blocks: BlockedSlot[];
}

export const ScheduleScreen: React.FC = () => {
  const { colors } = useTheme();
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
      const endDateStr = format(addDays(weekEnd, 1), 'yyyy-MM-dd'); // Include end day

      const blocks = await specialistService.getAvailabilityBlocks(startDateStr, endDateStr);
      
      // Group blocks by day
      const daySchedules: DaySchedule[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dayBlocks = blocks.filter(block => {
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
      Alert.alert('Error', 'Failed to load schedule');
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
        Alert.alert('Success', 'Time block updated successfully');
      } else {
        await specialistService.createAvailabilityBlock({
          startDateTime,
          endDateTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason || undefined,
          isRecurring: formData.isRecurring,
        });
        Alert.alert('Success', 'Time block added successfully');
      }

      setModalVisible(false);
      await loadSchedule();
    } catch (error: any) {
      console.error('Failed to save block:', error);
      Alert.alert('Error', error?.message || 'Failed to save time block');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this time block?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await specialistService.deleteAvailabilityBlock(blockId);
              Alert.alert('Success', 'Time block deleted');
              await loadSchedule();
            } catch (error: any) {
              console.error('Failed to delete block:', error);
              Alert.alert('Error', error?.message || 'Failed to delete time block');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    weekNavigator: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
    },
    navButton: {
      padding: 8,
    },
    navButtonText: {
      fontSize: 24,
      color: colors.primary,
      fontWeight: 'bold',
    },
    weekText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    todayButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    todayButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    dayCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    dayTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    blocksList: {
      gap: 8,
    },
    timeBlock: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeBlockAvailable: {
      borderLeftWidth: 4,
      borderLeftColor: '#10B981',
    },
    timeBlockUnavailable: {
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
    },
    blockContent: {
      flex: 1,
    },
    blockTime: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    blockStatus: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    blockActions: {
      flexDirection: 'row',
      gap: 8,
    },
    editButton: {
      padding: 8,
    },
    editButtonText: {
      color: colors.primary,
      fontSize: 16,
    },
    deleteButton: {
      padding: 8,
    },
    deleteButtonText: {
      color: '#EF4444',
      fontSize: 20,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 12,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading && !schedule.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Schedule</Text>
              <Text style={styles.subtitle}>
                Manage your availability and time blocks
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSelectedDate(new Date());
                setEditingBlock(null);
                setFormData({
                  startTime: '09:00',
                  endTime: '17:00',
                  isAvailable: true,
                  reason: '',
                  isRecurring: false,
                });
                setModalVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekNavigator}>
          <TouchableOpacity style={styles.navButton} onPress={handlePreviousWeek}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.weekText}>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </Text>
            <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.navButton} onPress={handleNextWeek}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {schedule.map((day) => (
          <View key={day.date.toISOString()} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {format(day.date, 'EEEE, MMM d')}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddBlock(day.date)}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {day.blocks.length > 0 ? (
              <View style={styles.blocksList}>
                {day.blocks.map((block) => (
                  <View
                    key={block.id}
                    style={[
                      styles.timeBlock,
                      block.isAvailable
                        ? styles.timeBlockAvailable
                        : styles.timeBlockUnavailable,
                    ]}
                  >
                    <View style={styles.blockContent}>
                      <Text style={styles.blockTime}>
                        {format(parseISO(block.startDateTime), 'HH:mm')} -{' '}
                        {format(parseISO(block.endDateTime), 'HH:mm')}
                      </Text>
                      <Text style={styles.blockStatus}>
                        {block.isAvailable ? 'Available' : block.reason || 'Unavailable'}
                        {block.isRecurring && ' • Recurring'}
                      </Text>
                    </View>
                    <View style={styles.blockActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditBlock(block)}
                      >
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteBlock(block.id)}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No time blocks set</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBlock ? 'Edit Time Block' : 'Add Time Block'}
            </Text>

            {selectedDate && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <Text style={{ color: colors.text, fontSize: 16 }}>
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={formData.startTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, startTime: text })
                }
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                value={formData.endTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, endTime: text })
                }
                placeholder="17:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Available</Text>
                <Switch
                  value={formData.isAvailable}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isAvailable: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            {!formData.isAvailable && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reason}
                  onChangeText={(text) =>
                    setFormData({ ...formData, reason: text })
                  }
                  placeholder="Out of office"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Recurring</Text>
                <Switch
                  value={formData.isRecurring}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isRecurring: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveBlock}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {editingBlock ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
