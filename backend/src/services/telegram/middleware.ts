import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { BotContext } from './types';

/**
 * Middleware to ensure user exists in DB and set session user type.
 */
export async function ensureUserAndType(ctx: BotContext, showUserTypeSelection: (ctx: BotContext) => Promise<void>) {
  if (!ctx.from) return;

  try {
    const telegramId = ctx.from.id.toString();

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        specialist: {
          select: {
            id: true,
            businessName: true,
            isVerified: true,
          },
        },
      },
    });

    if (user) {
      ctx.session.user = user;

      // Determine user type based on account setup
      if (user.userType === 'ADMIN') {
        ctx.session.userType = 'ADMIN';
      } else if (user.specialist) {
        // User has specialist profile - check if they also have customer access
        const hasCustomerRole = user.userType === 'CUSTOMER' || user.userType === 'ADMIN';
        const hasSpecialistRole = true; // Has specialist profile

        if (hasCustomerRole && hasSpecialistRole && !ctx.session.userType) {
          // Multi-role user - needs to select type
          await showUserTypeSelection(ctx);
          return;
        }

        ctx.session.userType = ctx.session.userType || 'SPECIALIST';
      } else {
        ctx.session.userType = 'CUSTOMER';
      }

      // Set language from user preferences
      if (user.language && !ctx.session.language) {
        ctx.session.language = user.language;
      }
    }

  } catch (error) {
    logger.error('Error ensuring user in Enhanced Telegram bot:', error);
  }
}
