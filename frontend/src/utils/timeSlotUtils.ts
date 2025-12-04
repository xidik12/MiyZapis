/**
 * Utility functions for handling time slots and booking durations
 */

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if enough consecutive slots are available for a given duration
 * @param slots - Array of available time slot strings (e.g., ['09:00', '09:15', '09:30'])
 * @param startTime - Start time string (e.g., '09:00')
 * @param durationMinutes - Duration in minutes (e.g., 47)
 * @param slotDuration - Duration of each slot in minutes (default: 15)
 * @returns boolean - true if enough consecutive slots are available
 */
export const hasConsecutiveSlots = (
  slots: string[],
  startTime: string,
  durationMinutes: number,
  slotDuration: number = 15
): boolean => {
  if (durationMinutes <= slotDuration) {
    // For durations <= 15 minutes, just check if the start slot is available
    return slots.includes(startTime);
  }

  const startMinutes = timeToMinutes(startTime);
  const slotsNeeded = Math.ceil(durationMinutes / slotDuration);

  // Check if we have consecutive slots starting from startTime
  for (let i = 0; i < slotsNeeded; i++) {
    const requiredTime = minutesToTime(startMinutes + (i * slotDuration));
    if (!slots.includes(requiredTime)) {
      return false;
    }
  }

  return true;
};

/**
 * Filter available slots to only show those that can accommodate the full duration
 * @param slots - Array of available time slot strings
 * @param durationMinutes - Duration in minutes
 * @param slotDuration - Duration of each slot in minutes (default: 15)
 * @returns Array of valid start times for the given duration
 */
export const filterSlotsByDuration = (
  slots: string[],
  durationMinutes: number,
  slotDuration: number = 15
): string[] => {
  if (durationMinutes <= slotDuration) {
    // For short durations, all available slots are valid
    return slots;
  }

  const slotsNeeded = Math.ceil(durationMinutes / slotDuration);
  const validStartTimes: string[] = [];

  for (const slot of slots) {
    if (hasConsecutiveSlots(slots, slot, durationMinutes, slotDuration)) {
      validStartTimes.push(slot);
    }
  }

  return validStartTimes;
};

/**
 * Get the slots that would be blocked by a booking starting at a given time
 * @param startTime - Start time string (e.g., '09:00')
 * @param durationMinutes - Duration in minutes
 * @param slotDuration - Duration of each slot in minutes (default: 15)
 * @returns Array of slot times that would be blocked
 */
export const getBlockedSlots = (
  startTime: string,
  durationMinutes: number,
  slotDuration: number = 15
): string[] => {
  const startMinutes = timeToMinutes(startTime);
  const slotsNeeded = Math.ceil(durationMinutes / slotDuration);
  const blockedSlots: string[] = [];

  for (let i = 0; i < slotsNeeded; i++) {
    const slotTime = minutesToTime(startMinutes + (i * slotDuration));
    blockedSlots.push(slotTime);
  }

  return blockedSlots;
};

/**
 * Calculate the end time for a booking
 * @param startTime - Start time string (e.g., '09:00')
 * @param durationMinutes - Duration in minutes
 * @returns End time string (e.g., '09:47')
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
};