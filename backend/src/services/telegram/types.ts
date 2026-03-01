import { Context } from 'telegraf';

export interface BotContext extends Context {
  session: {
    user?: Record<string, unknown>;
    userType?: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';
    state?: string | null;
    data?: Record<string, unknown>;
    language?: string;
    step?: string | null;
    tempData?: Record<string, unknown>;
    broadcastTarget?: string | null;
  };
}

export interface TelegramBotUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}
