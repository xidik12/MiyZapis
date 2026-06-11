/**
 * AutoMigrateAvatar Component
 * Automatically detects and migrates Google avatars to backend storage
 */

import React, { useEffect, useState } from 'react';
import { AvatarMigrationUtil } from '../utils/avatarMigration';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { InlineLoader } from '@/components/ui';
import { updateUserProfile } from '../store/slices/authSlice';

interface AutoMigrateAvatarProps {
  /** Whether to show migration status to user */
  showStatus?: boolean;
  /** Called when migration completes */
  onMigrationComplete?: (success: boolean, newAvatarUrl?: string) => void;
}

export const AutoMigrateAvatar: React.FC<AutoMigrateAvatarProps> = ({ 
  showStatus = false,
  onMigrationComplete
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [migrationStatus, setMigrationStatus] = useState<{
    isChecking: boolean;
    isMigrating: boolean;
    completed: boolean;
    error: string | null;
  }>({
    isChecking: false,
    isMigrating: false,
    completed: false,
    error: null
  });

  useEffect(() => {
    const checkAndMigrate = async () => {
      if (!user?.avatar || !user?.id) return;

      // Check if migration is needed
      const needsMigration = AvatarMigrationUtil.needsMigration(user.avatar);
      if (!needsMigration) return;

      // Check if we already completed migration for this user
      const lastMigrationKey = `avatar_migration_completed_${user.id}`;
      const migrationCompleted = localStorage.getItem(lastMigrationKey);
      if (migrationCompleted === 'true') {
        console.log('🔄 Auto-migration: Already completed for this user, skipping');
        return;
      }

      console.log('🔄 Auto-migration: Google avatar detected, starting migration...');

      setMigrationStatus(prev => ({ ...prev, isChecking: true }));

      try {
        // Wait a moment to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));

        setMigrationStatus(prev => ({
          ...prev,
          isChecking: false,
          isMigrating: true
        }));

        const newAvatarUrl = await AvatarMigrationUtil.migrateAvatar(user.avatar);

        if (newAvatarUrl) {
          // Record successful migration to prevent loops
          const lastMigrationKey = `avatar_migration_completed_${user.id}`;
          localStorage.setItem(lastMigrationKey, 'true');

          // Update user in Redux store
          dispatch(updateUserProfile({
            avatar: newAvatarUrl
          }));

          setMigrationStatus({
            isChecking: false,
            isMigrating: false,
            completed: true,
            error: null
          });

          // Hide success message after 3 seconds
          setTimeout(() => {
            setMigrationStatus(prev => ({
              ...prev,
              completed: false
            }));
          }, 3000);

          console.log('✅ Auto-migration completed successfully:', newAvatarUrl);
          onMigrationComplete?.(true, newAvatarUrl);
        } else {
          throw new Error('Migration returned empty result');
        }

      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('❌ Auto-migration failed:', error);

        setMigrationStatus({
          isChecking: false,
          isMigrating: false,
          completed: false,
          error: err.message
        });

        onMigrationComplete?.(false);
      }
    };

    // Run migration check after component mounts
    const timeoutId = setTimeout(checkAndMigrate, 2000);

    return () => clearTimeout(timeoutId);
  }, [user?.id]); // Only depend on user ID to prevent circular dependency

  // Don't render anything if not showing status
  if (!showStatus) return null;

  // Don't show anything if no migration needed
  if (!user?.avatar || !AvatarMigrationUtil.needsMigration(user.avatar)) {
    return null;
  }

  return (
    <div className="auto-migrate-avatar">
      {migrationStatus.isChecking && (
        <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
          <InlineLoader size="sm" color="current" className="mr-2" />
          Checking avatar storage...
        </div>
      )}

      {migrationStatus.isMigrating && (
        <div className="flex items-center text-sm text-orange-600 bg-orange-50 p-2 rounded">
          <InlineLoader size="sm" color="current" className="mr-2" />
          Migrating avatar to secure storage...
        </div>
      )}

      {migrationStatus.completed && (
        <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
          <svg className="mr-2 h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Avatar migrated successfully!
        </div>
      )}

      {migrationStatus.error && (
        <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded">
          <svg className="mr-2 h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Migration failed: {migrationStatus.error}
        </div>
      )}
    </div>
  );
};

export default AutoMigrateAvatar;