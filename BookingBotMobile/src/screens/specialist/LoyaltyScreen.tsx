/**
 * LoyaltyScreen - Redesigned with Panhaha design system
 * Loyalty rewards with tier system, points, and redeemable rewards
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { loyaltyService } from '../../services/loyalty.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Divider } from '../../components/ui/Divider';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format } from 'date-fns';

export const LoyaltyScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loyaltyAccount, setLoyaltyAccount] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [account, rewardsData, transactionsData] = await Promise.all([
        loyaltyService.getAccount().catch(() => null),
        loyaltyService.getRewards().catch(() => []),
        loyaltyService.getTransactions({ limit: 10 }).catch(() => ({ transactions: [] })),
      ]);

      setLoyaltyAccount(account);
      setRewards(rewardsData);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLoyaltyData();
    setRefreshing(false);
  };

  const handleRedeemReward = async (rewardId: string, pointsRequired: number) => {
    Alert.alert(
      t('loyalty.redeemTitle'),
      t('loyalty.redeemMessage', { points: pointsRequired }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('loyalty.redeem'),
          onPress: async () => {
            try {
              await loyaltyService.redeemPoints(pointsRequired);
              Alert.alert(t('common.success'), t('loyalty.redeemSuccess'));
              await loadLoyaltyData();
            } catch (error: any) {
              Alert.alert(t('common.error'), error?.message || t('loyalty.redeemError'));
            }
          },
        },
      ]
    );
  };

  const getTier = (points: number): string => {
    if (points >= 1000) return 'Diamond';
    if (points >= 500) return 'Platinum';
    if (points >= 200) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  };

  const getNextTierPoints = (points: number): number => {
    if (points >= 1000) return 0;
    if (points >= 500) return 1000 - points;
    if (points >= 200) return 500 - points;
    if (points >= 100) return 200 - points;
    return 100 - points;
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'Diamond':
        return '#B9F2FF';
      case 'Platinum':
        return '#E5E4E2';
      case 'Gold':
        return ACCENT_COLORS[500];
      case 'Silver':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  const getTierEmoji = (tier: string): string => {
    switch (tier) {
      case 'Diamond':
        return '💎';
      case 'Platinum':
        return '🏆';
      case 'Gold':
        return '🥇';
      case 'Silver':
        return '🥈';
      default:
        return '🥉';
    }
  };

  const currentPoints = loyaltyAccount?.currentPoints || user?.loyaltyPoints || 0;
  const tier = loyaltyAccount?.tier || getTier(currentPoints);
  const nextTierPoints = loyaltyAccount?.nextTierPoints || getNextTierPoints(currentPoints);
  const tierProgress = nextTierPoints > 0 ? ((currentPoints % 100) / 100) * 100 : 100;

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
          <Text style={styles.heroTitle}>{t('loyalty.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('loyalty.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPointsCard = () => (
    <Card
      style={[styles.pointsCard, { borderColor: getTierColor(tier), borderWidth: 2 }]}
      borderVariant="none"
      elevation="lg"
    >
      <LinearGradient
        colors={
          isDark
            ? [ACCENT_COLORS[900] + '40', ACCENT_COLORS[800] + '20']
            : [ACCENT_COLORS[50], ACCENT_COLORS[100]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsGradient}
      >
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(tier) }]}>
          <Text style={styles.tierEmoji}>{getTierEmoji(tier)}</Text>
          <Text style={styles.tierText}>{tier} {t('loyalty.tier')}</Text>
        </View>

        <Text style={[styles.pointsAmount, { color: ACCENT_COLORS[700] }]}>{currentPoints}</Text>
        <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
          {t('loyalty.points')}
        </Text>

        {nextTierPoints > 0 && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {nextTierPoints} {t('loyalty.pointsToNext')}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${tierProgress}%`, backgroundColor: getTierColor(tier) }]} />
            </View>
          </View>
        )}
      </LinearGradient>
    </Card>
  );

  const renderRewardCard = ({ item }: { item: any }) => {
    const canRedeem = currentPoints >= item.pointsRequired;

    return (
      <Card style={styles.rewardCard} borderVariant="subtle" elevation="sm">
        <View style={styles.rewardHeader}>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.rewardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.rewardMeta}>
            <Badge label={`${item.pointsRequired} pts`} variant="accent" size="sm" />
          </View>
        </View>

        <Button
          variant={canRedeem ? 'primary' : 'secondary'}
          onPress={() => handleRedeemReward(item.id, item.pointsRequired)}
          disabled={!canRedeem}
          style={{ marginTop: SPACING.sm }}
        >
          {canRedeem ? t('loyalty.redeem') : t('loyalty.insufficientPoints')}
        </Button>
      </Card>
    );
  };

  const renderTransactionCard = ({ item }: { item: any }) => {
    const isPositive = item.type === 'EARNED' || item.type === 'BONUS';

    return (
      <Card style={styles.transactionCard} borderVariant="subtle" elevation="sm">
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: isPositive ? SUCCESS_COLOR + '20' : ERROR_COLOR + '20' },
              ]}
            >
              <Text style={styles.transactionEmoji}>{isPositive ? '➕' : '➖'}</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={[styles.transactionType, { color: colors.text }]}>
                {item.type.replace('_', ' ')}
              </Text>
              <Text style={[styles.transactionDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                {format(new Date(item.createdAt), 'MMM dd, yyyy • hh:mm a')}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.transactionPoints,
              { color: isPositive ? SUCCESS_COLOR : ERROR_COLOR },
            ]}
          >
            {isPositive ? '+' : '-'}
            {item.points}
          </Text>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={200} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: SPACING.md }} />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.md }} />
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
        {renderPointsCard()}

        {rewards.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('loyalty.availableRewards')}
            </Text>
            <FlatList
              data={rewards}
              renderItem={renderRewardCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          </View>
        )}

        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('loyalty.recentTransactions')}
            </Text>
            <FlatList
              data={transactions}
              renderItem={renderTransactionCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          </View>
        )}

        {rewards.length === 0 && transactions.length === 0 && (
          <EmptyState
            emoji="🎁"
            title={t('loyalty.noActivity')}
            description={t('loyalty.noActivityDesc')}
          />
        )}
      </ScrollView>
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
  pointsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pointsGradient: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tierEmoji: {
    fontSize: 20,
  },
  tierText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#000000',
  },
  pointsAmount: {
    fontSize: 56,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  pointsLabel: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  rewardCard: {
    padding: SPACING.md,
  },
  rewardHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  rewardName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  rewardDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  rewardMeta: {
    alignItems: 'flex-end',
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionType: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'capitalize',
  },
  transactionDescription: {
    fontSize: FONT_SIZES.sm,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
  },
  transactionPoints: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
