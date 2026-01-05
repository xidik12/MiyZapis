// Email templates in multiple languages
export const emailTemplates = {
  // Welcome email for new users
  welcome: {
    en: {
      subject: 'Welcome to MiyZapis - Your Booking Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MiyZapis!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Your journey to seamless bookings starts here</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Hello {{firstName}}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for joining MiyZapis, the modern booking platform that connects customers with talented specialists across Ukraine.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li>Complete your profile to get personalized recommendations</li>
                <li>Browse our wide selection of specialists</li>
                <li>Book your first service and enjoy the experience</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Need help? Visit our <a href="{{helpUrl}}" style="color: #667eea;">Help Center</a> or reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to MiyZapis!
        
        Hello {{firstName}},
        
        Thank you for joining MiyZapis, the modern booking platform that connects customers with talented specialists across Ukraine.
        
        What's Next?
        - Complete your profile to get personalized recommendations
        - Browse our wide selection of specialists
        - Book your first service and enjoy the experience
        
        Visit your dashboard: {{dashboardUrl}}
        
        Need help? Visit our Help Center: {{helpUrl}}
      `
    },
    uk: {
      subject: 'Ласкаво просимо до МійЗапис - Вашої платформи для бронювання',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Ласкаво просимо до МійЗапис!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Ваша подорож до зручних бронювань починається тут</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привіт {{firstName}}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Дякуємо за приєднання до МійЗапис - сучасної платформи для бронювання, яка з'єднує клієнтів з талановитими спеціалістами по всій Україні.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Що далі?</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li>Заповніть свій профіль для отримання персональних рекомендацій</li>
                <li>Переглядайте наш широкий вибір спеціалістів</li>
                <li>Забронюйте свою першу послугу та насолоджуйтесь досвідом</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Перейти до кабінету
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Потрібна допомога? Відвідайте наш <a href="{{helpUrl}}" style="color: #667eea;">Центр допомоги</a> або відповідайте на цей лист.
            </p>
          </div>
        </div>
      `,
      text: `
        Ласкаво просимо до МійЗапис!
        
        Привіт {{firstName}},
        
        Дякуємо за приєднання до МійЗапис - сучасної платформи для бронювання.
        
        Що далі?
        - Заповніть свій профіль для отримання персональних рекомендацій
        - Переглядайте наш широкий вибір спеціалістів
        - Забронюйте свою першу послугу та насолоджуйтесь досвідом
        
        Відвідайте свій кабінет: {{dashboardUrl}}
        
        Потрібна допомога? Відвідайте наш Центр допомоги: {{helpUrl}}
      `
    },
    ru: {
      subject: 'Добро пожаловать в МойЗапись - Вашу платформу для бронирования',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Добро пожаловать в МойЗапись!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Ваше путешествие к удобным бронированиям начинается здесь</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привет {{firstName}}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Спасибо за присоединение к МойЗапись - современной платформе для бронирования, которая соединяет клиентов с талантливыми специалистами по всей Украине.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Что дальше?</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li>Заполните свой профиль для получения персональных рекомендаций</li>
                <li>Просматривайте наш широкий выбор специалистов</li>
                <li>Забронируйте свою первую услугу и наслаждайтесь опытом</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Перейти в кабинет
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Нужна помощь? Посетите наш <a href="{{helpUrl}}" style="color: #667eea;">Центр помощи</a> или ответьте на это письмо.
            </p>
          </div>
        </div>
      `,
      text: `
        Добро пожаловать в МойЗапись!
        
        Привет {{firstName}},
        
        Спасибо за присоединение к МойЗапись - современной платформе для бронирования.
        
        Что дальше?
        - Заполните свой профиль для получения персональных рекомендаций
        - Просматривайте наш широкий выбор специалистов
        - Забронируйте свою первую услугу и наслаждайтесь опытом
        
        Посетите свой кабинет: {{dashboardUrl}}
        
        Нужна помощь? Посетите наш Центр помощи: {{helpUrl}}
      `
    }
  },

  // Booking cancelled
  bookingCancelled: {
    en: {
      subject: 'Booking Cancelled - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Booking Cancelled</h2>
          <p>Hello {{name}},</p>
          <p>Your booking for <strong>{{serviceName}}</strong> on <strong>{{bookingDateTime}}</strong> has been cancelled.</p>
          {{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
        </div>
      `,
      text: `
        Booking Cancelled
        Hello {{name}},
        Your booking for {{serviceName}} on {{bookingDateTime}} has been cancelled.
        {{#if reason}}Reason: {{reason}}{{/if}}
      `
    },
    uk: {
      subject: 'Бронювання скасовано - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Бронювання скасовано</h2>
          <p>Привіт {{name}},</p>
          <p>Ваше бронювання <strong>{{serviceName}}</strong> на <strong>{{bookingDateTime}}</strong> було скасовано.</p>
          {{#if reason}}<p><strong>Причина:</strong> {{reason}}</p>{{/if}}
        </div>
      `,
      text: `
        Бронювання скасовано
        Привіт {{name}},
        Ваше бронювання {{serviceName}} на {{bookingDateTime}} було скасовано.
        {{#if reason}}Причина: {{reason}}{{/if}}
      `
    },
    ru: {
      subject: 'Бронирование отменено - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Бронирование отменено</h2>
          <p>Привет {{name}},</p>
          <p>Ваше бронирование <strong>{{serviceName}}</strong> на <strong>{{bookingDateTime}}</strong> было отменено.</p>
          {{#if reason}}<p><strong>Причина:</strong> {{reason}}</p>{{/if}}
        </div>
      `,
      text: `
        Бронирование отменено
        Привет {{name}},
        Ваше бронирование {{serviceName}} на {{bookingDateTime}} было отменено.
        {{#if reason}}Причина: {{reason}}{{/if}}
      `
    }
  },

  // Booking updated
  bookingUpdated: {
    en: {
      subject: 'Booking Updated - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Booking Updated</h2>
          <p>Hello {{name}},</p>
          <p>Your booking has been updated. Here are the latest details:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> {{serviceName}}</p>
            <p><strong>Specialist:</strong> {{specialistName}}</p>
            <p><strong>Date & Time:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Booking</a>
          </div>
        </div>
      `,
      text: `
        Booking Updated
        Hello {{name}},
        Your booking has been updated.
        - Service: {{serviceName}}
        - Specialist: {{specialistName}}
        - Date & Time: {{bookingDateTime}}
        View your booking: {{bookingUrl}}
      `
    },
    uk: {
      subject: 'Бронювання оновлено - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Бронювання оновлено</h2>
          <p>Привіт {{name}},</p>
          <p>Ваше бронювання було оновлено. Останні деталі:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Послуга:</strong> {{serviceName}}</p>
            <p><strong>Спеціаліст:</strong> {{specialistName}}</p>
            <p><strong>Дата і час:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Переглянути запис</a>
          </div>
        </div>
      `,
      text: `
        Бронювання оновлено
        Привіт {{name}},
        Ваше бронювання було оновлено.
        - Послуга: {{serviceName}}
        - Спеціаліст: {{specialistName}}
        - Дата і час: {{bookingDateTime}}
        Переглянути запис: {{bookingUrl}}
      `
    },
    ru: {
      subject: 'Бронирование обновлено - {{serviceName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Бронирование обновлено</h2>
          <p>Привет {{name}},</p>
          <p>Ваше бронирование было обновлено. Последние детали:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Услуга:</strong> {{serviceName}}</p>
            <p><strong>Специалист:</strong> {{specialistName}}</p>
            <p><strong>Дата и время:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Посмотреть запись</a>
          </div>
        </div>
      `,
      text: `
        Бронирование обновлено
        Привет {{name}},
        Ваше бронирование было обновлено.
        - Услуга: {{serviceName}}
        - Специалист: {{specialistName}}
        - Дата и время: {{bookingDateTime}}
        Посмотреть запись: {{bookingUrl}}
      `
    }
  },

  // Booking reminder (24h)
  bookingReminder: {
    en: {
      subject: 'Booking Reminder - {{serviceName}} on {{bookingDateTime}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Booking Reminder</h2>
          <p>Hello {{customerName}},</p>
          <p>This is a reminder that you have a booking tomorrow:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> {{serviceName}}</p>
            <p><strong>Specialist:</strong> {{specialistName}}</p>
            <p><strong>Date & Time:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Booking</a>
          </div>
        </div>
      `,
      text: `
        Booking Reminder

        Hello {{customerName}},

        This is a reminder that you have a booking tomorrow:
        - Service: {{serviceName}}
        - Specialist: {{specialistName}}
        - Date & Time: {{bookingDateTime}}

        View your booking: {{bookingUrl}}
      `
    },
    uk: {
      subject: 'Нагадування про запис - {{serviceName}} {{bookingDateTime}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Нагадування про ваш запис</h2>
          <p>Привіт {{customerName}},</p>
          <p>Нагадуємо, що у вас є запис завтра:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Послуга:</strong> {{serviceName}}</p>
            <p><strong>Спеціаліст:</strong> {{specialistName}}</p>
            <p><strong>Дата і час:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Переглянути запис</a>
          </div>
        </div>
      `,
      text: `
        Нагадування про запис

        Привіт {{customerName}},

        Нагадуємо, що у вас є запис завтра:
        - Послуга: {{serviceName}}
        - Спеціаліст: {{specialistName}}
        - Дата і час: {{bookingDateTime}}

        Переглянути запис: {{bookingUrl}}
      `
    },
    ru: {
      subject: 'Напоминание о записи - {{serviceName}} {{bookingDateTime}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Напоминание о вашей записи</h2>
          <p>Привет {{customerName}},</p>
          <p>Напоминаем, что у вас есть запись завтра:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Услуга:</strong> {{serviceName}}</p>
            <p><strong>Специалист:</strong> {{specialistName}}</p>
            <p><strong>Дата и время:</strong> {{bookingDateTime}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Посмотреть запись</a>
          </div>
        </div>
      `,
      text: `
        Напоминание о записи

        Привет {{customerName}},

        Напоминаем, что у вас есть запись завтра:
        - Услуга: {{serviceName}}
        - Специалист: {{specialistName}}
        - Дата и время: {{bookingDateTime}}

        Посмотреть запись: {{bookingUrl}}
      `
    }
  },

  // Generic notification
  notificationGeneric: {
    en: {
      subject: '{{title}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;"><h1>{{title}}</h1></div>
          <p>Hello {{firstName}}!</p>
          <p>{{message}}</p>
          {{detailsHtml}}
        </div>
      `,
      text: `
        {{title}}
        
        Hello {{firstName}}!
        
        {{message}}
      `
    },
    uk: {
      subject: '{{title}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;"><h1>{{title}}</h1></div>
          <p>Привіт {{firstName}}!</p>
          <p>{{message}}</p>
          {{detailsHtml}}
        </div>
      `,
      text: `
        {{title}}
        
        Привіт {{firstName}}!
        
        {{message}}
      `
    },
    ru: {
      subject: '{{title}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;"><h1>{{title}}</h1></div>
          <p>Привет {{firstName}}!</p>
          <p>{{message}}</p>
          {{detailsHtml}}
        </div>
      `,
      text: `
        {{title}}
        
        Привет {{firstName}}!
        
        {{message}}
      `
    }
  },

  // Email verification
  emailVerification: {
    en: {
      subject: 'Verify Your Email Address - MiyZapis',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Verify Your Email Address</h1>
            <p style="color: #6b7280;">Please confirm your email to complete registration</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Hello {{firstName}},</p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              To complete your registration, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you're having trouble with the button, copy and paste this URL into your browser:
              <br><a href="{{verificationUrl}}" style="color: #667eea; word-break: break-all;">{{verificationUrl}}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Verify Your Email Address
        
        Hello {{firstName}},
        
        To complete your registration, please verify your email address by visiting:
        {{verificationUrl}}
        
        This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
      `
    },
    uk: {
      subject: 'Підтвердьте свою електронну адресу - МійЗапис',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Підтвердьте свою електронну адресу</h1>
            <p style="color: #6b7280;">Будь ласка, підтвердьте свою електронну пошту для завершення реєстрації</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Привіт {{firstName}},</p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              Для завершення реєстрації, будь ласка, підтвердьте свою електронну адресу, натиснувши кнопку нижче:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Підтвердити електронну адресу
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Це посилання діє 24 години. Якщо ви не запитували підтвердження, проігноруйте цей лист.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Якщо у вас проблеми з кнопкою, скопіюйте це посилання у ваш браузер:
              <br><a href="{{verificationUrl}}" style="color: #667eea; word-break: break-all;">{{verificationUrl}}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Підтвердьте свою електронну адресу
        
        Привіт {{firstName}},
        
        Для завершення реєстрації, підтвердьте свою електронну адресу за посиланням:
        {{verificationUrl}}
        
        Це посилання діє 24 години. Якщо ви не запитували підтвердження, проігноруйте цей лист.
      `
    },
    ru: {
      subject: 'Подтвердите свой электронный адрес - МойЗапись',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Подтвердите свой электронный адрес</h1>
            <p style="color: #6b7280;">Пожалуйста, подтвердите свою электронную почту для завершения регистрации</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Привет {{firstName}},</p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              Для завершения регистрации, пожалуйста, подтвердите свой электронный адрес, нажав кнопку ниже:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Подтвердить электронный адрес
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Эта ссылка действует 24 часа. Если вы не запрашивали подтверждение, проигнорируйте это письмо.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Если у вас проблемы с кнопкой, скопируйте эту ссылку в ваш браузер:
              <br><a href="{{verificationUrl}}" style="color: #667eea; word-break: break-all;">{{verificationUrl}}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Подтвердите свой электронный адрес
        
        Привет {{firstName}},
        
        Для завершения регистрации, подтвердите свой электронный адрес по ссылке:
        {{verificationUrl}}
        
        Эта ссылка действует 24 часа. Если вы не запрашивали подтверждение, проигнорируйте это письмо.
      `
    }
  },

  // Booking confirmation
  bookingConfirmation: {
    en: {
      subject: 'Booking Confirmed - {{serviceName}} with {{specialistName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            <p style="color: #dcfce7; margin: 10px 0 0 0;">Your appointment is scheduled</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Hello {{customerName}}!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Great news! Your booking has been confirmed. Here are the details:
            </p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #374151; margin-top: 0;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Service:</strong> {{serviceName}}</p>
              <p style="margin: 5px 0;"><strong>Specialist:</strong> {{specialistName}}</p>
              <p style="margin: 5px 0;"><strong>Date & Time:</strong> {{bookingDateTime}}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> {{duration}} minutes</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> {{totalAmount}} {{currency}}</p>
              {{#if customerNotes}}<p style="margin: 5px 0;"><strong>Your Notes:</strong> {{customerNotes}}</p>{{/if}}
            </div>

            {{#if serviceLocation}}
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #374151; margin-top: 0;">📍 Service Location</h3>
              <p style="margin: 5px 0; color: #374151; font-size: 16px;"><strong>{{serviceLocation}}</strong></p>
              {{#if locationNotes}}
              <p style="margin: 10px 0 5px 0; color: #6b7280; font-style: italic;">{{locationNotes}}</p>
              {{/if}}
              {{#if latitude}}
              <div style="margin-top: 15px;">
                <a href="https://www.google.com/maps?q={{latitude}},{{longitude}}"
                   style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                  Open in Google Maps
                </a>
              </div>
              {{/if}}
            </div>
            {{/if}}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{bookingUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                View Booking
              </a>
              <a href="{{chatUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Chat with Specialist
              </a>
            </div>
            
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Important:</strong> Please arrive 10 minutes before your scheduled time. If you need to reschedule or cancel, please do so at least 24 hours in advance.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Booking Confirmed!

        Hello {{customerName}},

        Great news! Your booking has been confirmed.

        Booking Details:
        - Service: {{serviceName}}
        - Specialist: {{specialistName}}
        - Date & Time: {{bookingDateTime}}
        - Duration: {{duration}} minutes
        - Total Amount: {{totalAmount}} {{currency}}
        {{#if customerNotes}}- Your Notes: {{customerNotes}}{{/if}}

        {{#if serviceLocation}}
        📍 Service Location:
        {{serviceLocation}}
        {{#if locationNotes}}
        Additional Instructions: {{locationNotes}}
        {{/if}}
        {{#if latitude}}
        View on Google Maps: https://www.google.com/maps?q={{latitude}},{{longitude}}
        {{/if}}

        {{/if}}
        View your booking: {{bookingUrl}}
        Chat with specialist: {{chatUrl}}

        Important: Please arrive 10 minutes before your scheduled time. If you need to reschedule or cancel, please do so at least 24 hours in advance.
      `
    },
    // Add Ukrainian and Russian versions...
  },

  // Password reset
  passwordReset: {
    en: {
      subject: 'Reset Your Password - MiyZapis',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #374151; margin-bottom: 10px;">Reset Your Password</h1>
            <p style="color: #6b7280;">You requested a password reset</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <p style="color: #6b7280; margin-bottom: 20px;">Hello {{firstName}},</p>

            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you're having trouble with the button, copy and paste this URL into your browser:
              <br><a href="{{resetUrl}}" style="color: #667eea; word-break: break-all;">{{resetUrl}}</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Reset Your Password

        Hello {{firstName}},

        We received a request to reset your password. Visit this link to create a new password:
        {{resetUrl}}

        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
      `
    },
    // Add Ukrainian and Russian versions...
  },

  // Trial expiration warning (7 days before)
  trialExpiringWarning: {
    en: {
      subject: 'Your Free Trial is Ending Soon - {{daysRemaining}} Days Left',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Trial Ending Soon</h1>
            <p style="color: #fef3c7; margin: 10px 0 0 0;">{{daysRemaining}} days left in your free trial</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Hello {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              We hope you've been enjoying your 3-month free trial! We wanted to remind you that your trial period will end in <strong>{{daysRemaining}} days</strong> on <strong>{{trialEndDate}}</strong>.
            </p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">What happens after the trial?</h3>
              {{#if isCustomer}}
              <p style="color: #92400e; margin: 5px 0;">• Small deposits will be required when booking services (typically 10-20%)</p>
              <p style="color: #92400e; margin: 5px 0;">• You'll continue to have full access to all features</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #92400e; margin: 5px 0;">• Choose a pricing plan: Pay-per-use (20₴/booking) or Monthly subscription ($10/month)</p>
              <p style="color: #92400e; margin: 5px 0;">• Keep growing your business with all platform features</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{trialInfoUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Learn More About Pricing
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Have questions? <a href="{{helpUrl}}" style="color: #667eea;">Contact our support team</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Your Free Trial is Ending Soon

        Hello {{firstName}},

        We hope you've been enjoying your 3-month free trial! Your trial period will end in {{daysRemaining}} days on {{trialEndDate}}.

        What happens after the trial?
        {{#if isCustomer}}
        • Small deposits will be required when booking services (typically 10-20%)
        • You'll continue to have full access to all features
        {{/if}}
        {{#if isSpecialist}}
        • Choose a pricing plan: Pay-per-use (20₴/booking) or Monthly subscription ($10/month)
        • Keep growing your business with all platform features
        {{/if}}

        Learn more: {{trialInfoUrl}}

        Have questions? Contact our support: {{helpUrl}}
      `
    },
    uk: {
      subject: 'Ваш безкоштовний пробний період закінчується - {{daysRemaining}} днів залишилось',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Пробний період скоро закінчиться</h1>
            <p style="color: #fef3c7; margin: 10px 0 0 0;">{{daysRemaining}} днів залишилось у вашому пробному періоді</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привіт {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Сподіваємося, вам сподобався ваш 3-місячний безкоштовний пробний період! Нагадуємо, що ваш пробний період закінчиться через <strong>{{daysRemaining}} днів</strong> - <strong>{{trialEndDate}}</strong>.
            </p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">Що відбудеться після пробного періоду?</h3>
              {{#if isCustomer}}
              <p style="color: #92400e; margin: 5px 0;">• Потрібні будуть невеликі депозити при бронюванні (зазвичай 10-20%)</p>
              <p style="color: #92400e; margin: 5px 0;">• Ви продовжите мати повний доступ до всіх функцій</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #92400e; margin: 5px 0;">• Оберіть тарифний план: Оплата за використання (20₴/бронювання) або Місячна підписка ($10/місяць)</p>
              <p style="color: #92400e; margin: 5px 0;">• Продовжуйте розвивати свій бізнес з усіма функціями платформи</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{trialInfoUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Дізнатися більше про ціни
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Є питання? <a href="{{helpUrl}}" style="color: #667eea;">Зверніться до нашої служби підтримки</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Ваш безкоштовний пробний період закінчується

        Привіт {{firstName}},

        Сподіваємося, вам сподобався ваш 3-місячний безкоштовний пробний період! Ваш пробний період закінчиться через {{daysRemaining}} днів - {{trialEndDate}}.

        Що відбудеться після пробного періоду?
        {{#if isCustomer}}
        • Потрібні будуть невеликі депозити при бронюванні (зазвичай 10-20%)
        • Ви продовжите мати повний доступ до всіх функцій
        {{/if}}
        {{#if isSpecialist}}
        • Оберіть тарифний план: Оплата за використання (20₴/бронювання) або Місячна підписка ($10/місяць)
        • Продовжуйте розвивати свій бізнес з усіма функціями платформи
        {{/if}}

        Дізнатися більше: {{trialInfoUrl}}

        Є питання? Зверніться до служби підтримки: {{helpUrl}}
      `
    },
    ru: {
      subject: 'Ваш бесплатный пробный период заканчивается - {{daysRemaining}} дней осталось',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Пробный период скоро закончится</h1>
            <p style="color: #fef3c7; margin: 10px 0 0 0;">{{daysRemaining}} дней осталось в вашем пробном периоде</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привет {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Надеемся, вам понравился ваш 3-месячный бесплатный пробный период! Напоминаем, что ваш пробный период закончится через <strong>{{daysRemaining}} дней</strong> - <strong>{{trialEndDate}}</strong>.
            </p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">Что произойдет после пробного периода?</h3>
              {{#if isCustomer}}
              <p style="color: #92400e; margin: 5px 0;">• Потребуются небольшие депозиты при бронировании (обычно 10-20%)</p>
              <p style="color: #92400e; margin: 5px 0;">• Вы продолжите иметь полный доступ ко всем функциям</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #92400e; margin: 5px 0;">• Выберите тарифный план: Оплата за использование (20₴/бронирование) или Ежемесячная подписка ($10/месяц)</p>
              <p style="color: #92400e; margin: 5px 0;">• Продолжайте развивать свой бизнес со всеми функциями платформы</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{trialInfoUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Узнать больше о ценах
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Есть вопросы? <a href="{{helpUrl}}" style="color: #667eea;">Обратитесь в нашу службу поддержки</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Ваш бесплатный пробный период заканчивается

        Привет {{firstName}},

        Надеемся, вам понравился ваш 3-месячный бесплатный пробный период! Ваш пробный период закончится через {{daysRemaining}} дней - {{trialEndDate}}.

        Что произойдет после пробного периода?
        {{#if isCustomer}}
        • Потребуются небольшие депозиты при бронировании (обычно 10-20%)
        • Вы продолжите иметь полный доступ ко всем функциям
        {{/if}}
        {{#if isSpecialist}}
        • Выберите тарифный план: Оплата за использование (20₴/бронирование) или Ежемесячная подписка ($10/месяц)
        • Продолжайте развивать свой бизнес со всеми функциями платформы
        {{/if}}

        Узнать больше: {{trialInfoUrl}}

        Есть вопросы? Обратитесь в службу поддержки: {{helpUrl}}
      `
    }
  },

  // Trial expired
  trialExpired: {
    en: {
      subject: 'Your Free Trial Has Ended - Thank You for Trying MiyZapis',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Trying MiyZapis!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Your 3-month free trial has ended</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Hello {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Your 3-month free trial ended on <strong>{{trialEndDate}}</strong>. We hope you enjoyed exploring all the features of MiyZapis!
            </p>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
              {{#if isCustomer}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Continue browsing and booking services</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ A small deposit (10-20%) will now be required for bookings</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ All other features remain fully accessible</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Continue providing services and growing your business</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Choose your preferred pricing plan</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ All platform features remain available</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Go to Dashboard
              </a>
              {{#if isSpecialist}}
              <a href="{{pricingUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Pricing Plans
              </a>
              {{/if}}
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Questions? <a href="{{helpUrl}}" style="color: #667eea;">Contact our support team</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Thank You for Trying MiyZapis!

        Hello {{firstName}},

        Your 3-month free trial ended on {{trialEndDate}}. We hope you enjoyed exploring all the features!

        What's Next?
        {{#if isCustomer}}
        ✓ Continue browsing and booking services
        ✓ A small deposit (10-20%) will now be required for bookings
        ✓ All other features remain fully accessible
        {{/if}}
        {{#if isSpecialist}}
        ✓ Continue providing services and growing your business
        ✓ Choose your preferred pricing plan
        ✓ All platform features remain available
        {{/if}}

        Dashboard: {{dashboardUrl}}
        {{#if isSpecialist}}Pricing Plans: {{pricingUrl}}{{/if}}

        Questions? Contact support: {{helpUrl}}
      `
    },
    uk: {
      subject: 'Ваш безкоштовний пробний період завершився - Дякуємо за користування МійЗапис',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Дякуємо за користування МійЗапис!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Ваш 3-місячний безкоштовний пробний період завершився</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привіт {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Ваш 3-місячний безкоштовний пробний період завершився <strong>{{trialEndDate}}</strong>. Сподіваємося, вам сподобалося знайомство з усіма функціями МійЗапис!
            </p>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #374151; margin-top: 0;">Що далі?</h3>
              {{#if isCustomer}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Продовжуйте переглядати та бронювати послуги</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Тепер потрібен невеликий депозит (10-20%) для бронювань</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Всі інші функції залишаються повністю доступними</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Продовжуйте надавати послуги та розвивати свій бізнес</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Оберіть зручний тарифний план</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Всі функції платформи залишаються доступними</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Перейти до кабінету
              </a>
              {{#if isSpecialist}}
              <a href="{{pricingUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Переглянути тарифні плани
              </a>
              {{/if}}
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Є питання? <a href="{{helpUrl}}" style="color: #667eea;">Зверніться до служби підтримки</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Дякуємо за користування МійЗапис!

        Привіт {{firstName}},

        Ваш 3-місячний безкоштовний пробний період завершився {{trialEndDate}}. Сподіваємося, вам сподобалося!

        Що далі?
        {{#if isCustomer}}
        ✓ Продовжуйте переглядати та бронювати послуги
        ✓ Тепер потрібен невеликий депозит (10-20%) для бронювань
        ✓ Всі інші функції залишаються повністю доступними
        {{/if}}
        {{#if isSpecialist}}
        ✓ Продовжуйте надавати послуги та розвивати свій бізнес
        ✓ Оберіть зручний тарифний план
        ✓ Всі функції платформи залишаються доступними
        {{/if}}

        Кабінет: {{dashboardUrl}}
        {{#if isSpecialist}}Тарифні плани: {{pricingUrl}}{{/if}}

        Є питання? Підтримка: {{helpUrl}}
      `
    },
    ru: {
      subject: 'Ваш бесплатный пробный период завершился - Спасибо за использование МойЗапись',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Спасибо за использование МойЗапись!</h1>
            <p style="color: #e0e8ff; margin: 10px 0 0 0;">Ваш 3-месячный бесплатный пробный период завершился</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">Привет {{firstName}}!</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Ваш 3-месячный бесплатный пробный период завершился <strong>{{trialEndDate}}</strong>. Надеемся, вам понравилось знакомство со всеми функциями МойЗапись!
            </p>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #374151; margin-top: 0;">Что дальше?</h3>
              {{#if isCustomer}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Продолжайте просматривать и бронировать услуги</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Теперь требуется небольшой депозит (10-20%) для бронирований</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Все остальные функции остаются полностью доступными</p>
              {{/if}}
              {{#if isSpecialist}}
              <p style="color: #6b7280; margin: 5px 0;">✓ Продолжайте предоставлять услуги и развивать свой бизнес</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Выберите удобный тарифный план</p>
              <p style="color: #6b7280; margin: 5px 0;">✓ Все функции платформы остаются доступными</p>
              {{/if}}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Перейти в кабинет
              </a>
              {{#if isSpecialist}}
              <a href="{{pricingUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Посмотреть тарифные планы
              </a>
              {{/if}}
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Есть вопросы? <a href="{{helpUrl}}" style="color: #667eea;">Обратитесь в службу поддержки</a>
            </p>
          </div>
        </div>
      `,
      text: `
        Спасибо за использование МойЗапись!

        Привет {{firstName}},

        Ваш 3-месячный бесплатный пробный период завершился {{trialEndDate}}. Надеемся, вам понравилось!

        Что дальше?
        {{#if isCustomer}}
        ✓ Продолжайте просматривать и бронировать услуги
        ✓ Теперь требуется небольшой депозит (10-20%) для бронирований
        ✓ Все остальные функции остаются полностью доступными
        {{/if}}
        {{#if isSpecialist}}
        ✓ Продолжайте предоставлять услуги и развивать свой бизнес
        ✓ Выберите удобный тарифный план
        ✓ Все функции платформы остаются доступными
        {{/if}}

        Кабинет: {{dashboardUrl}}
        {{#if isSpecialist}}Тарифные планы: {{pricingUrl}}{{/if}}

        Есть вопросы? Поддержка: {{helpUrl}}
      `
    }
  }
};

// Helper function to get template by key and language
export function getEmailTemplate(templateKey: string, language: string = 'en') {
  const template = emailTemplates[templateKey as keyof typeof emailTemplates];
  if (!template) {
    throw new Error(`Email template '${templateKey}' not found`);
  }

  const languageTemplate = template[language as keyof typeof template] || template.en;
  return languageTemplate;
}

// Helper function to replace placeholders in template
export function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Replace simple placeholders
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, data[key] || '');
  });

  // Handle conditional blocks (simplified Handlebars-like syntax)
  result = result.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  return result;
}
