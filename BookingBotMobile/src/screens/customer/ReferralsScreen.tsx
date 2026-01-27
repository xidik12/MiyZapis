/**
 * ReferralsScreen - Redesigned with Panhaha design system
 * Customer referral program with analytics and sharing
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Modal,
  TextInput,
  FlatList,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  referralService,
  ReferralConfigResponse,
  ReferralAnalytics,
  Referral,
  CreateReferralRequest,
} from '../../services/referral.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  WARNING_COLOR,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format } from 'date-fns';

export const CustomerReferralsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [config, setConfig] = useState<ReferralConfigResponse | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newReferralType, setNewReferralType] = useState('');
  const [newReferralMessage, setNewReferralMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, analyticsData, referralsData] = await Promise.all([
        referralService.getConfig().catch(() => null),
        referralService.getAnalytics().catch(() => null),
        referralService.getMyReferrals({ limit: 10 }).catch(() => ({ referrals: [], total: 0 })),
      ]);

      setConfig(configData);
      setAnalytics(analyticsData);
      setReferrals(referralsData.referrals || []);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      Alert.alert(t('common.error'), t('referrals.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateReferral = async () => {
    if (!newReferralType) {
      Alert.alert(t('common.error'), t('referrals.selectType'));
      return;
    }

    try {
      setCreating(true);
      const data: CreateReferralRequest = {
        type: newReferralType,
        customMessage: newReferralMessage || undefined,
      };

      const newReferral = await referralService.createReferral(data);
      await loadData();

      Alert.alert(t('common.success'), t('referrals.createSuccess'));
      setCreateModalOpen(false);
      setNewReferralType('');
      setNewReferralMessage('');

      // Auto-share referral link
      const shared = await referralService.shareReferral(newReferral);
      if (shared) {
        Alert.alert(t('common.success'), t('referrals.shareSuccess'));
      }
    } catch (error: any) {
      console.error('Failed to create referral:', error);
      Alert.alert(t('common.error'), error?.message || t('referrals.createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleShareReferral = async (referral: Referral) => {
    try {
      await referralService.shareReferral(referral);
    } catch (error) {
      console.error('Failed to share referral:', error);
    }
  };

  const handleCopyCode = async (code: string) => {
    Clipboard.setString(code);
    Alert.alert(t('common.success'), t('referrals.codeCopied'));
  };

  const canCreateReferral = config
    ? config.limits.dailyUsed < config.limits.dailyLimit &&
      config.limits.pendingUsed < config.limits.pendingLimit
    : false;

  const getStatusVariant = (
    status: string
  ): 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[ACCENT_COLORS[500], ACCENT_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>🎁</Text>
          <Text style={styles.heroTitle}>{t('referrals.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('referrals.customerSubtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsGrid = () => {
    if (!analytics) return null;

    return (
      <View style={styles.statsGrid}>
        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={[styles.statValue, { color: SECONDARY_COLORS[600] }]}>
            {analytics.overview.totalReferrals}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('referrals.totalReferrals')}
          </Text>
        </Card>

        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
            {analytics.overview.completedReferrals}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('referrals.completed')}
          </Text>
        </Card>

        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={[styles.statValue, { color: PRIMARY_COLORS[500] }]}>
            {referralService.formatConversionRate(analytics.overview.conversionRate)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('referrals.conversionRate')}
          </Text>
        </Card>

        <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
          <Text style={styles.statEmoji}>💎</Text>
          <Text style={[styles.statValue, { color: ACCENT_COLORS[600] }]}>
            {analytics.overview.totalPointsEarned}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('referrals.pointsEarned')}
          </Text>
        </Card>
      </View>
    );
  };

  const renderCodeCard = () => {
    if (!config) return null;

    return (
      <Card style={styles.codeCard} borderVariant="accent" elevation="lg">
        <LinearGradient
          colors={
            isDark
              ? [ACCENT_COLORS[900] + '40', ACCENT_COLORS[800] + '20']
              : [ACCENT_COLORS[50], ACCENT_COLORS[100]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.codeGradient}
        >
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
            {t('referrals.yourCode')}
          </Text>
          <TouchableOpacity onPress={() => handleCopyCode(config.referralCode)}>
            <Text style={[styles.codeValue, { color: ACCENT_COLORS[700] }]}>{config.referralCode}</Text>
          </TouchableOpacity>

          <View style={styles.codeActions}>
            <Button
              variant="primary"
              onPress={() => {
                const referralLink = `https://panhaha.com/register?ref=${config.referralCode}`;
                Share.share({
                  message: `${t('referrals.customerShareMessage')} ${config.referralCode}\n${referralLink}`,
                  title: t('referrals.shareTitle'),
                });
              }}
              style={styles.shareButton}
            >
              {t('referrals.shareLink')}
            </Button>
            <Button
              variant="secondary"
              onPress={() => setCreateModalOpen(true)}
              disabled={!canCreateReferral}
              style={styles.createButton}
            >
              {t('referrals.create')}
            </Button>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  const renderLimitsCard = () => {
    if (!config) return null;

    return (
      <Card style={styles.limitsCard} borderVariant="subtle" elevation="sm">
        <Text style={[styles.limitsTitle, { color: colors.text }]}>{t('referrals.currentLimits')}</Text>

        <View style={styles.limitRow}>
          <View style={styles.limitHeader}>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              {t('referrals.dailyReferrals')}
            </Text>
            <Text style={[styles.limitValue, { color: colors.text }]}>
              {config.limits.dailyUsed} / {config.limits.dailyLimit}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((config.limits.dailyUsed / config.limits.dailyLimit) * 100, 100)}%`,
                  backgroundColor: SECONDARY_COLORS[500],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.limitRow}>
          <View style={styles.limitHeader}>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              {t('referrals.pendingReferrals')}
            </Text>
            <Text style={[styles.limitValue, { color: colors.text }]}>
              {config.limits.pendingUsed} / {config.limits.pendingLimit}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((config.limits.pendingUsed / config.limits.pendingLimit) * 100, 100)}%`,
                  backgroundColor: WARNING_COLOR,
                },
              ]}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderReferralCard = ({ item }: { item: Referral }) => (
    <Card style={styles.referralCard} borderVariant="subtle" elevation="sm">
      <View style={styles.referralHeader}>
        <Text style={[styles.referralCode, { color: colors.text }]}>{item.referralCode}</Text>
        <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
      </View>

      <View style={styles.referralMeta}>
        <Text style={[styles.referralDate, { color: colors.textSecondary }]}>
          {t('referrals.created')}: {format(new Date(item.createdAt), 'MMM d, yyyy')}
        </Text>
        {item.usedAt && (
          <Text style={[styles.referralDate, { color: SUCCESS_COLOR }]}>
            {t('referrals.used')}: {format(new Date(item.usedAt), 'MMM d, yyyy')}
          </Text>
        )}
      </View>

      {item.customMessage && (
        <Text style={[styles.customMessage, { color: colors.textSecondary }]}>"{item.customMessage}"</Text>
      )}

      <Button
        variant="secondary"
        onPress={() => handleShareReferral(item)}
        style={styles.shareReferralButton}
      >
        {t('referrals.share')}
      </Button>
    </Card>
  );

  const renderModal = () => (
    <Modal
      visible={createModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateModalOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent} borderVariant="subtle" elevation="lg">
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t('referrals.createReferral')}</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('referrals.referralType')}</Text>
            {config?.availableTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: newReferralType === type ? SECONDARY_COLORS[500] : colors.background,
                    borderColor: newReferralType === type ? SECONDARY_COLORS[500] : colors.border,
                  },
                ]}
                onPress={() => setNewReferralType(type)}
              >
                <Text
                  style={[
                    styles.typeText,
                    {
                      color: newReferralType === type ? '#FFFFFF' : colors.text,
                      fontWeight: newReferralType === type ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.normal,
                    },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('referrals.customMessage')}</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              value={newReferralMessage}
              onChangeText={setNewReferralMessage}
              placeholder={t('referrals.messagePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.modalButtons}>
            <Button
              variant="secondary"
              onPress={() => {
                setCreateModalOpen(false);
                setNewReferralType('');
                setNewReferralMessage('');
              }}
              style={styles.modalButton}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onPress={handleCreateReferral}
              disabled={!newReferralType || creating}
              style={styles.modalButton}
            >
              {creating ? t('referrals.creating') : t('referrals.create')}
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="48%"
                height={100}
                style={{ marginBottom: SPACING.md }}
              />
            ))}
          </View>
          <Skeleton variant="rectangular" width="100%" height={180} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={120}
              style={{ marginBottom: SPACING.md }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLORS[500]}
            colors={[ACCENT_COLORS[500]]}
          />
        }
      >
        {renderStatsGrid()}
        {renderCodeCard()}
        {renderLimitsCard()}

        {referrals.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('referrals.recent')}</Text>
            <FlatList
              data={referrals}
              renderItem={renderReferralCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          </>
        ) : (
          <EmptyState
            emoji="🎁"
            title={t('referrals.noReferrals')}
            description={t('referrals.noReferralsDesc')}
            actionLabel={t('referrals.createFirst')}
            onAction={() => setCreateModalOpen(true)}
          />
        )}
      </ScrollView>
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 160,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 140,
    height: 140,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 110,
    height: 110,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    padding: SPACING.md,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  codeCard: {
    marginBottom: SPACING.lg,
  },
  codeGradient: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  codeActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  shareButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  limitsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  limitsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  limitRow: {
    marginBottom: SPACING.md,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  limitLabel: {
    fontSize: FONT_SIZES.sm,
  },
  limitValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  progressBar: {
    height: 8,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  referralCard: {
    padding: SPACING.md,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  referralCode: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  referralMeta: {
    marginBottom: SPACING.sm,
  },
  referralDate: {
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  customMessage: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  shareReferralButton: {
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight as any,
    marginBottom: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  typeOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
  },
  typeText: {
    fontSize: FONT_SIZES.base,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
  },
});
