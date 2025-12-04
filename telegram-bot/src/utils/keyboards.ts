import { InlineKeyboard, Language } from '../types';
import { getMessage } from '../locales';

export class KeyboardBuilder {
  static mainMenu(language: Language): InlineKeyboard {
    return [
      [{ text: getMessage('main_menu.browse_services', language), callback_data: 'browse_services' }],
      [
        { text: getMessage('main_menu.my_bookings', language), callback_data: 'my_bookings' },
        { text: getMessage('main_menu.my_profile', language), callback_data: 'my_profile' }
      ],
      [{ text: getMessage('main_menu.help_support', language), callback_data: 'help_support' }]
    ];
  }

  static serviceCategories(language: Language): InlineKeyboard {
    return [
      [
        { text: getMessage('categories.hair_beauty', language), callback_data: 'category_hair_beauty' },
        { text: getMessage('categories.massage_spa', language), callback_data: 'category_massage_spa' }
      ],
      [
        { text: getMessage('categories.fitness_training', language), callback_data: 'category_fitness' },
        { text: getMessage('categories.beauty_nails', language), callback_data: 'category_beauty_nails' }
      ],
      [
        { text: getMessage('categories.tattoo_piercing', language), callback_data: 'category_tattoo' },
        { text: getMessage('categories.therapy_wellness', language), callback_data: 'category_therapy' }
      ],
      [{ text: '📍 Near Me', callback_data: 'location_search' }],
      [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
    ];
  }

  static specialistActions(specialistId: string, language: Language): InlineKeyboard {
    return [
      [
        { text: getMessage('buttons.call', language), callback_data: `call_${specialistId}` },
        { text: getMessage('buttons.message', language), callback_data: `message_${specialistId}` },
        { text: getMessage('buttons.view_portfolio', language), callback_data: `portfolio_${specialistId}` }
      ],
      [{ text: getMessage('buttons.book_now', language), callback_data: `book_${specialistId}` }],
      [
        { text: getMessage('buttons.back', language), callback_data: 'browse_services' },
        { text: '⭐ Reviews', callback_data: `reviews_${specialistId}` }
      ]
    ];
  }

  static bookingActions(bookingId: string, language: Language): InlineKeyboard {
    return [
      [{ text: '📝 View Details', callback_data: `booking_details_${bookingId}` }],
      [
        { text: '📅 Reschedule', callback_data: `reschedule_${bookingId}` },
        { text: getMessage('buttons.cancel', language), callback_data: `cancel_booking_${bookingId}` }
      ],
      [
        { text: '💬 Message Specialist', callback_data: `contact_specialist_${bookingId}` },
        { text: '📍 Get Directions', callback_data: `directions_${bookingId}` }
      ],
      [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
    ];
  }

  static serviceSelection(specialistId: string, services: any[], language: Language): InlineKeyboard {
    const keyboard: InlineKeyboard = [];
    
    services.forEach((service, index) => {
      keyboard.push([{
        text: `${service.name} - $${service.price} (${service.duration}min)`,
        callback_data: `select_service_${specialistId}_${service.id}`
      }]);
    });

    keyboard.push([
      { text: getMessage('buttons.back', language), callback_data: `specialist_${specialistId}` },
      { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
    ]);

    return keyboard;
  }

  static dateSelection(specialistId: string, serviceId: string, availableDates: string[], language: Language): InlineKeyboard {
    const keyboard: InlineKeyboard = [];
    
    // Add date buttons in rows of 2
    for (let i = 0; i < availableDates.length; i += 2) {
      const row = [];
      row.push({ text: availableDates[i], callback_data: `select_date_${specialistId}_${serviceId}_${availableDates[i]}` });
      
      if (i + 1 < availableDates.length) {
        row.push({ text: availableDates[i + 1], callback_data: `select_date_${specialistId}_${serviceId}_${availableDates[i + 1]}` });
      }
      
      keyboard.push(row);
    }

    keyboard.push([
      { text: getMessage('buttons.back', language), callback_data: `book_${specialistId}` },
      { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
    ]);

    return keyboard;
  }

  static timeSelection(specialistId: string, serviceId: string, date: string, availableTimes: string[], language: Language): InlineKeyboard {
    const keyboard: InlineKeyboard = [];
    
    // Add time buttons in rows of 3
    for (let i = 0; i < availableTimes.length; i += 3) {
      const row = [];
      for (let j = 0; j < 3 && i + j < availableTimes.length; j++) {
        const time = availableTimes[i + j];
        row.push({ text: time, callback_data: `select_time_${specialistId}_${serviceId}_${date}_${time}` });
      }
      keyboard.push(row);
    }

    keyboard.push([
      { text: getMessage('buttons.back', language), callback_data: `select_date_${specialistId}_${serviceId}_back` },
      { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
    ]);

    return keyboard;
  }

  static bookingConfirmation(specialistId: string, serviceId: string, date: string, time: string, language: Language): InlineKeyboard {
    return [
      [{ text: '✅ Confirm Booking', callback_data: `confirm_booking_${specialistId}_${serviceId}_${date}_${time}` }],
      [
        { text: 'ℹ️ Add Notes', callback_data: `add_notes_${specialistId}_${serviceId}_${date}_${time}` },
        { text: '🔄 Change Time', callback_data: `select_date_${specialistId}_${serviceId}_back` }
      ],
      [
        { text: getMessage('buttons.cancel', language), callback_data: 'main_menu' },
        { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
      ]
    ];
  }

  static pagination(currentPage: number, totalPages: number, baseCallback: string): InlineKeyboard {
    const keyboard: InlineKeyboard = [];
    const buttons = [];

    if (currentPage > 1) {
      buttons.push({ text: '◀️ Previous', callback_data: `${baseCallback}_page_${currentPage - 1}` });
    }

    buttons.push({ text: `${currentPage}/${totalPages}`, callback_data: 'current_page' });

    if (currentPage < totalPages) {
      buttons.push({ text: 'Next ▶️', callback_data: `${baseCallback}_page_${currentPage + 1}` });
    }

    if (buttons.length > 0) {
      keyboard.push(buttons);
    }

    return keyboard;
  }

  static languageSelection(): InlineKeyboard {
    return [
      [
        { text: '🇺🇦 Українська', callback_data: 'lang_uk' },
        { text: '🇬🇧 English', callback_data: 'lang_en' }
      ],
      [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }]
    ];
  }

  static backAndMain(backCallback: string, language: Language): InlineKeyboard {
    return [
      [
        { text: getMessage('buttons.back', language), callback_data: backCallback },
        { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
      ]
    ];
  }

  static retryAndSupport(retryCallback: string, language: Language): InlineKeyboard {
    return [
      [
        { text: '🔄 Retry', callback_data: retryCallback },
        { text: '💬 Contact Support', callback_data: 'contact_support' }
      ],
      [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
    ];
  }
}

export default KeyboardBuilder;