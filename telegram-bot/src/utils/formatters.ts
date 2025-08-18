import { Specialist, Service, Booking, Language } from '../types';
import { getMessage } from '../locales';

export class MessageFormatter {
  static formatSpecialistProfile(specialist: Specialist, language: Language): string {
    const verifiedBadge = specialist.isVerified ? `\n${getMessage('specialist.verified', language)}` : '';
    const onlineStatus = specialist.isOnline ? '🟢' : '🔴';
    
    return `${specialist.profession} by ${specialist.name}

${onlineStatus} ⭐ ${specialist.rating}/5 (${specialist.reviewCount} ${getMessage('specialist.reviews', language)})${verifiedBadge}
📍 ${specialist.location}
📞 Contact available
💰 From $${specialist.priceFrom}

🕒 Available today
📱 Response time: ${specialist.responseTime} min

👋 About ${specialist.name.split(' ')[0]}:
${specialist.yearsExperience}+ years experience, ${specialist.completedJobs} completed jobs

💼 Specialties: ${specialist.specialties.join(', ')}`;
  }

  static formatServiceList(services: Service[], language: Language): string {
    if (services.length === 0) {
      return 'No services available';
    }

    let message = '💼 Available Services:\n\n';
    
    services.forEach((service, index) => {
      message += `${index + 1}. ${service.name}\n`;
      message += `   💰 $${service.price} • ⏱️ ${service.duration}min\n`;
      message += `   ${service.description}\n\n`;
    });

    return message.trim();
  }

  static formatBookingConfirmation(
    specialist: Specialist,
    service: Service,
    date: string,
    time: string,
    language: Language
  ): string {
    return `📋 Booking Summary

👤 Specialist: ${specialist.name}
💼 Service: ${service.name}
📅 Date: ${this.formatDate(date)}
🕐 Time: ${time}
⏱️ Duration: ${service.duration} minutes
💰 Price: $${service.price}
📍 Location: ${specialist.location}

Please confirm your booking or make changes using the buttons below.`;
  }

  static formatBookingDetails(booking: Booking, specialist: Specialist, service: Service, language: Language): string {
    const statusEmoji = this.getStatusEmoji(booking.status);
    const statusText = getMessage(`booking.${booking.status}` as any, language) || booking.status;

    return `📋 Booking Details

📋 ID: #${booking.id.slice(-8)}
${statusEmoji} Status: ${statusText}

👤 Specialist: ${specialist.name}
💼 Service: ${service.name}
📅 Date: ${this.formatDate(booking.date)}
🕐 Time: ${booking.time}
⏱️ Duration: ${booking.duration} minutes

💰 Total: $${booking.totalAmount}
${booking.depositAmount ? `💳 Deposit: $${booking.depositAmount}` : ''}
${booking.notes ? `📝 Notes: ${booking.notes}` : ''}

📍 Location: ${specialist.location}`;
  }

  static formatBookingsList(bookings: Booking[], language: Language): string {
    if (bookings.length === 0) {
      return 'You have no bookings yet.\n\nUse the "Browse Services" button to find specialists and book your first appointment!';
    }

    let message = '📅 Your Bookings:\n\n';
    
    bookings.slice(0, 5).forEach((booking, index) => {
      const statusEmoji = this.getStatusEmoji(booking.status);
      message += `${index + 1}. ${statusEmoji} ${this.formatDate(booking.date)} at ${booking.time}\n`;
      message += `   ID: #${booking.id.slice(-8)}\n\n`;
    });

    if (bookings.length > 5) {
      message += `... and ${bookings.length - 5} more bookings`;
    }

    return message.trim();
  }

  static formatSpecialistsList(specialists: Specialist[], language: Language): string {
    if (specialists.length === 0) {
      return 'No specialists found.\n\nTry adjusting your search criteria or browse different categories.';
    }

    let message = '👥 Found Specialists:\n\n';
    
    specialists.slice(0, 5).forEach((specialist, index) => {
      const onlineStatus = specialist.isOnline ? '🟢' : '🔴';
      const verifiedBadge = specialist.isVerified ? ' 🏆' : '';
      
      message += `${index + 1}. ${onlineStatus} ${specialist.name}${verifiedBadge}\n`;
      message += `   ⭐ ${specialist.rating}/5 (${specialist.reviewCount}) • $${specialist.priceFrom}+\n`;
      message += `   📍 ${specialist.location}\n\n`;
    });

    if (specialists.length > 5) {
      message += `... and ${specialists.length - 5} more specialists`;
    }

    return message.trim();
  }

  static formatAvailableSlots(slots: { date: string; times: string[] }[], language: Language): string {
    if (slots.length === 0) {
      return 'No available slots found.\n\nPlease try a different date range or contact the specialist directly.';
    }

    let message = '📅 Available Appointments:\n\n';
    
    slots.forEach(slot => {
      message += `📅 ${this.formatDate(slot.date)}:\n`;
      message += `   ${slot.times.join(' • ')}\n\n`;
    });

    return message.trim();
  }

  static formatErrorMessage(error: string, language: Language): string {
    const errorKey = `errors.${error.toLowerCase()}` as any;
    return getMessage(errorKey, language) || getMessage('errors.general', language);
  }

  static formatWelcomeMessage(firstName: string, isNewUser: boolean, language: Language): string {
    const messageKey = isNewUser ? 'welcome.new_user' : 'welcome.returning_user';
    return getMessage(messageKey, language, { firstName });
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  private static getStatusEmoji(status: string): string {
    const statusEmojis: Record<string, string> = {
      'pending': '⏳',
      'confirmed': '✅',
      'in_progress': '🔄',
      'completed': '✅',
      'cancelled': '❌',
      'no_show': '⚠️'
    };
    
    return statusEmojis[status] || '❓';
  }

  static formatPaymentSummary(
    service: Service,
    totalAmount: number,
    language: Language,
    depositAmount?: number
  ): string {
    let message = `💳 Payment Summary\n\n`;
    message += `💼 Service: ${service.name}\n`;
    message += `💰 Total: $${totalAmount}\n`;
    
    if (depositAmount) {
      message += `💳 Deposit: $${depositAmount}\n`;
      message += `💵 Remaining: $${totalAmount - depositAmount} (pay at appointment)\n`;
    }
    
    message += `\n🔒 Secure payment powered by our payment processor`;
    
    return message;
  }

  static formatLocationSearch(latitude: number, longitude: number, language: Language): string {
    return `📍 Location Search\n\nSearching for specialists near:\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}\n\nRadius: 5km`;
  }

  static formatReviewsList(reviews: any[], language: Language): string {
    if (reviews.length === 0) {
      return 'No reviews yet.\n\nBe the first to leave a review after your appointment!';
    }

    let message = '⭐ Recent Reviews:\n\n';
    
    reviews.slice(0, 3).forEach((review, index) => {
      const stars = '⭐'.repeat(review.rating);
      message += `${index + 1}. ${stars} ${review.customerName}\n`;
      message += `   "${review.comment}"\n`;
      message += `   ${this.formatDate(review.date)}\n\n`;
    });

    return message.trim();
  }

  static formatEarnings(earnings: any, language: Language): string {
    if (!earnings) {
      return 'No earnings data available.';
    }

    let message = '💰 Earnings Summary\n\n';
    message += `💳 Total Earnings: $${earnings.totalEarnings || 0}\n`;
    message += `📅 This Month: $${earnings.monthlyEarnings || 0}\n`;
    message += `⏳ Pending: $${earnings.pendingEarnings || 0}\n`;
    message += `✅ Last Payout: $${earnings.lastPayout || 0}\n\n`;
    message += `📊 ${earnings.completedBookings || 0} completed bookings\n`;
    message += `⭐ ${earnings.averageRating || 0}/5 average rating`;

    return message;
  }

  static formatAnalytics(analytics: any, language: Language): string {
    if (!analytics) {
      return 'No analytics data available.';
    }

    let message = '📊 Analytics Overview\n\n';
    message += `📅 Total Bookings: ${analytics.totalBookings || 0}\n`;
    message += `💰 Total Revenue: $${analytics.totalRevenue || 0}\n`;
    message += `⭐ Rating: ${analytics.rating || 0}/5 (${analytics.reviewCount || 0} reviews)\n`;
    message += `✅ Completion Rate: ${analytics.completionRate || 0}%\n`;
    message += `⚡ Response Time: ${analytics.responseTime || 0} min\n\n`;
    message += `📈 This Month:\n`;
    message += `  • ${analytics.monthlyBookings || 0} bookings\n`;
    message += `  • $${analytics.monthlyRevenue || 0} revenue`;

    return message;
  }
}

export default MessageFormatter;