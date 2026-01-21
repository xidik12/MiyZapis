/**
 * Avatar Migration Utility
 * Handles migration of external avatars (especially Google avatars) to backend storage
 */

import { userService } from '../services/user.service';
import { environment } from '../config/environment';

export class AvatarMigrationUtil {
  private static getInternalHosts(): string[] {
    const hosts = new Set<string>();
    const apiUrl = environment.API_URL || '';
    const apiBase = apiUrl.replace(/\/api\/v1\/?$/, '');

    if (apiUrl) hosts.add(apiUrl);
    if (apiBase) hosts.add(apiBase);

    try {
      if (apiUrl.startsWith('http')) hosts.add(new URL(apiUrl).origin);
      if (apiBase.startsWith('http')) hosts.add(new URL(apiBase).origin);
    } catch {
      // Ignore URL parsing errors and fall back to raw strings.
    }

    return Array.from(hosts);
  }

  private static normalizeUrl(value: string): string {
    return value
      .trim()
      .replace(/&#x2F;/gi, '/')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#x27;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  /**
   * Check if user has an external avatar that needs to be saved to backend
   */
  static needsMigration(avatarUrl: string | null | undefined): boolean {
    if (!avatarUrl) return false;
    const normalizedUrl = this.normalizeUrl(avatarUrl);
    if (normalizedUrl === '' || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) {
      return false;
    }
    
    // Check for Google avatars
    if (normalizedUrl.includes('googleusercontent.com') || normalizedUrl.includes('google.com')) {
      return true;
    }
    
    // Check for other external services, but exclude S3 URLs which are already migrated
    if (normalizedUrl.startsWith('http')) {
      const internalHosts = this.getInternalHosts();
      const isInternalHost = internalHosts.some((host) => normalizedUrl.startsWith(host));
      const isInternalStorage = normalizedUrl.includes('/uploads/') ||
        normalizedUrl.includes('/files/') ||
        normalizedUrl.includes('/s3-proxy/');
      const isKnownS3 = normalizedUrl.includes('miyzapis-storage.s3.ap-southeast-2.amazonaws.com');

      if (isInternalHost || isInternalStorage || isKnownS3) {
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Migrate user's avatar to backend storage
   */
  static async migrateAvatar(currentAvatarUrl: string): Promise<string | null> {
    try {
      const normalizedUrl = this.normalizeUrl(currentAvatarUrl);
      console.log('🔄 Starting avatar migration for:', normalizedUrl);
      
      // Save the external image to backend
      const savedAvatar = await userService.saveExternalImage(normalizedUrl, 'avatar');
      
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
