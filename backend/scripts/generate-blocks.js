const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateBlocks() {
  const specialistId = 'cmf9hrees000254ezl1qfcvdu';

  const specialist = await prisma.specialist.findUnique({
    where: { id: specialistId }
  });

  const workingHours = JSON.parse(specialist.workingHours);
  console.log('Working hours:', JSON.stringify(workingHours, null, 2));

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 28);

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const slotDuration = 15;
  const newBlocks = [];

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayName = dayNames[date.getDay()];
    const daySchedule = workingHours[dayName];

    if (daySchedule && (daySchedule.isWorking || daySchedule.isOpen)) {
      const startTime = daySchedule.startTime || daySchedule.start || '09:00';
      const endTime = daySchedule.endTime || daySchedule.end || '17:00';

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      const dateStr = date.toISOString().split('T')[0];
      console.log(`${dayName} ${dateStr}: ${startTime}-${endTime}`);

      for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        // Calculate end time properly
        const endTotalMinutes = minutes + slotDuration;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMinute = endTotalMinutes % 60;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hourStr = String(hour).padStart(2, '0');
        const minuteStr = String(minute).padStart(2, '0');
        const endHourStr = String(endHour).padStart(2, '0');
        const endMinuteStr = String(endMinute).padStart(2, '0');

        const slotStart = new Date(`${year}-${month}-${day}T${hourStr}:${minuteStr}:00.000Z`);
        const slotEnd = new Date(`${year}-${month}-${day}T${endHourStr}:${endMinuteStr}:00.000Z`);

        newBlocks.push({
          specialistId,
          startDateTime: slotStart,
          endDateTime: slotEnd,
          isAvailable: true,
          reason: 'Available',
          isRecurring: false
        });
      }
    }
  }

  console.log(`Creating ${newBlocks.length} blocks...`);

  if (newBlocks.length > 0) {
    await prisma.availabilityBlock.createMany({
      data: newBlocks,
      skipDuplicates: true
    });
    console.log('✅ Blocks created successfully');
  }

  await prisma.$disconnect();
}

generateBlocks().catch(console.error);