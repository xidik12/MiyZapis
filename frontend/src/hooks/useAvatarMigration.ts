/**
 * React Hook for Avatar Migration
 * Automatically detects and migrates external avatars to backend storage
 */

import { useState, useEffect, useCallback } from 'react';
import { AvatarMigrationUtil } from '../utils/avatarMigration';

interface UseAvatarMigrationResult {
  migratedAvatarUrl: string | null;
  isMigrating: boolean;
  migrationError: string | null;
  needsMigration: boolean;
  triggerMigration: () => Promise<void>;
}

export function useAvatarMigration(originalAvatarUrl: string | null | undefined): UseAvatarMigrationResult {
  const [migratedAvatarUrl, setMigratedAvatarUrl] = useState<string | null>(originalAvatarUrl || null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  // Check if migration is needed
  useEffect(() => {
    const migrationNeeded = AvatarMigrationUtil.needsMigration(originalAvatarUrl);
    setNeedsMigration(migrationNeeded);
    setMigratedAvatarUrl(originalAvatarUrl || null);
  }, [originalAvatarUrl]);

  // Trigger migration
  const triggerMigration = useCallback(async () => {
    if (!originalAvatarUrl || !needsMigration || isMigrating) {
      return;
    }

    setIsMigrating(true);
    setMigrationError(null);

    try {
      const newAvatarUrl = await AvatarMigrationUtil.migrateAvatar(originalAvatarUrl);
      if (newAvatarUrl) {
        setMigratedAvatarUrl(newAvatarUrl);
        setNeedsMigration(false);
      } else {
        setMigrationError('Failed to migrate avatar');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      setMigrationError(errorMessage);
    } finally {
      setIsMigrating(false);
    }
  }, [originalAvatarUrl, needsMigration, isMigrating]);

  // Auto-migrate on mount if needed (optional - can be disabled)
  useEffect(() => {
    // Auto-migration can be enabled by uncommenting the following:
    // if (needsMigration && !isMigrating) {
    //   triggerMigration();
    // }
  }, [needsMigration, triggerMigration, isMigrating]);

  return {
    migratedAvatarUrl,
    isMigrating,
    migrationError,
    needsMigration,
    triggerMigration
  };
}

export default useAvatarMigration;