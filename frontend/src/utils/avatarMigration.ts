/**
 * Avatar Migration Utility
 * Handles migration of external avatars (especially Google avatars) to backend storage
 */

import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';

export class AvatarMigrationUtil {
  /**
   * Check if user has an external avatar that needs to be saved to backend
   */
  static needsMigration(avatarUrl: string | null | undefined): boolean {
    if (!avatarUrl) return false;
    
    // Check for Google avatars
    if (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('google.com')) {
      return true;
    }
    
    // Check for other external services
    if (avatarUrl.startsWith('http') && !avatarUrl.includes('miyzapis-backend-production.up.railway.app')) {
      return true;
    }
    
    return false;
  }

  /**
   * Migrate user's avatar to backend storage
   */
  static async migrateAvatar(currentAvatarUrl: string): Promise<string | null> {
    try {
      console.log('🔄 Starting avatar migration for:', currentAvatarUrl);
      
      // Save the external image to backend
      const savedAvatar = await userService.saveExternalImage(currentAvatarUrl, 'avatar');
      
      // Update user profile with the new backend URL
      await userService.updateProfile({ avatar: savedAvatar.avatarUrl });
      
      console.log('✅ Avatar migration completed:', savedAvatar.avatarUrl);
      return savedAvatar.avatarUrl;
      
    } catch (error) {
      console.error('❌ Avatar migration failed:', error);
      return null;
    }
  }

  /**
   * Check and migrate avatar if needed
   */
  static async checkAndMigrateIfNeeded(avatarUrl: string | null | undefined): Promise<string | null> {
    if (!this.needsMigration(avatarUrl)) {
      return avatarUrl || null;
    }

    console.log('🔄 Avatar migration needed for:', avatarUrl);
    return await this.migrateAvatar(avatarUrl!);
  }

  /**
   * Batch migrate multiple portfolio images
   */
  static async migratePortfolioImages(portfolioImages: string[]): Promise<string[]> {
    const migrationPromises = portfolioImages.map(async (imageUrl) => {
      if (this.needsMigration(imageUrl)) {
        try {
          const saved = await userService.saveExternalImage(imageUrl, 'portfolio');
          return saved.avatarUrl;
        } catch (error) {
          console.warn('⚠️ Failed to migrate portfolio image:', imageUrl, error);
          return imageUrl; // Return original URL as fallback
        }
      }
      return imageUrl;
    });

    return await Promise.all(migrationPromises);
  }

  /**
   * Create a React hook for avatar migration
   */
  static createMigrationHook() {
    return {
      needsMigration: this.needsMigration,
      migrateAvatar: this.migrateAvatar,
      checkAndMigrate: this.checkAndMigrateIfNeeded
    };
  }
}

export default AvatarMigrationUtil;