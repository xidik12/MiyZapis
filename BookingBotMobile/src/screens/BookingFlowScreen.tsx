// Booking Flow Screen - Create new booking
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createBooking } from '../store/slices/bookingSlice';
import { fetchService, selectCurrentService } from '../store/slices/serviceSlice';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService } from '../services/booking.service';
import { specialistService } from '../services/specialist.service';
import { Service, CreateBookingRequest } from '../types';
import { format } from 'date-fns';

export const BookingFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const serviceId = (route.params as any)?.serviceId;
  const service = useAppSelector(selectCurrentService);
  const user = useAppSelector((state) => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [notes, setNotes] = useState('');
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  useEffect(() => {
    if (service) {
      const specId = service.specialistId || (service.specialist as any)?.id;
      if (specId && !specialistId) {
        setSpecialistId(specId);
        loadAvailableDates(specId);
      }
    }
  }, [service]);

  useEffect(() => {
    if (specialistId && selectedDate) {
      loadAvailableSlots();
    }
  }, [specialistId, selectedDate]);

  const loadService = async () => {
    try {
      setLoading(true);
      await dispatch(fetchService(serviceId)).unwrap();
    } catch (error) {
      console.error('Failed to load service:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async (specId: string) => {
    try {
      // Get availability for next 30 days
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const availability = await specialistService.getAvailability(specId, startDate, endDate);
      
      // Extract available dates from availability data
      // The availability object should have availableSlots or similar structure
      const dates: Date[] = [];
      if (availability.availableSlots) {
        // Extract unique dates from available slots
        const uniqueDates = new Set<string>();
        availability.availableSlots.forEach((slot: any) => {
          if (slot.startTime) {
            const dateStr = slot.startTime.split('T')[0];
            uniqueDates.add(dateStr);
          }
        });
        dates.push(...Array.from(uniqueDates).map(d => new Date(d)));
      }
      
      // If no slots, generate dates from working hours
      if (dates.length === 0 && availability.workingHours) {
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dayName = format(date, 'EEEE').toLowerCase();
          if (availability.workingHours[dayName] && availability.workingHours[dayName].isAvailable) {
            dates.push(date);
          }
        }
      }
      
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Failed to load available dates:', error);
      // Fallback: generate next 7 days
      const dates: Date[] = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  };

  const loadAvailableSlots = async () => {
    if (!specialistId || !selectedDate || !serviceId) return;
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const nextDay = format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      // Get availability for the selected date
      const availability = await bookingService.getAvailability(
        specialistId,
        dateStr,
        nextDay,
        serviceId
      );
      
      // Extract time slots from availability
      const slots: string[] = [];
      if (availability.availableSlots) {
        availability.availableSlots.forEach((slot: any) => {
          if (slot.startTime) {
            const slotDate = new Date(slot.startTime);
            if (format(slotDate, 'yyyy-MM-dd') === dateStr) {
              slots.push(format(slotDate, 'HH:mm'));
            }
          }
        });
      }
      
      setAvailableSlots(slots.sort());
    } catch (error) {
      console.error('Failed to load available slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleCreateBooking = async () => {
    if (!service || !selectedDate || !selectedTime || !specialistId) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    try {
      setCreating(true);
      
      const bookingData: CreateBookingRequest = {
        serviceId: service.id,
        specialistId,
        scheduledAt: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
        notes: notes.trim() || undefined,
      };

      const result = await dispatch(createBooking(bookingData)).unwrap();
      
      Alert.alert(
        'Success',
        'Booking created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Navigate to bookings screen
              navigation.navigate('Bookings' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setCreating(false);
    }
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
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    serviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    servicePrice: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
    },
    dateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    dateButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
    },
    dateButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    dateButtonTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    timeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    timeButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
      alignItems: 'center',
    },
    timeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    timeButtonTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    notesInput: {
      height: 100,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      textAlignVertical: 'top',
    },
    submitButton: {
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.text }}>Loading service...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.error, fontSize: 16, textAlign: 'center' }}>
            Service not found
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, { marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.submitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.serviceCard}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>
              ${(service.price || service.basePrice || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateRow}>
              {availableDates.map((date, index) => {
                const isSelected = selectedDate?.getTime() === date.getTime();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateButton,
                      isSelected && styles.dateButtonSelected,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateButtonText,
                        isSelected && styles.dateButtonTextSelected,
                      ]}
                    >
                      {format(date, 'MMM dd')}
                    </Text>
                    <Text
                      style={[
                        styles.dateButtonText,
                        isSelected && styles.dateButtonTextSelected,
                        { fontSize: 12, marginTop: 4 },
                      ]}
                    >
                      {format(date, 'EEE')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeRow}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeButton,
                      isSelected && styles.timeButtonSelected,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        isSelected && styles.timeButtonTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {availableSlots.length === 0 && (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                No available slots for this date
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special requests or notes..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedDate || !selectedTime || creating) && styles.submitButtonDisabled,
          ]}
          onPress={handleCreateBooking}
          disabled={!selectedDate || !selectedTime || creating}
        >
          {creating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

