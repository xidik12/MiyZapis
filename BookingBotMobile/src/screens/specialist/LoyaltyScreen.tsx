// Loyalty Screen - Specialist loyalty program (matching web version)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { loyaltyService } from '../../services/loyalty.service';
import { Button } from '../../components/ui/Button';

export const LoyaltyScreen: React.FC = () => {
  const { colors } = useTheme();
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
      'Redeem Reward',
      `Are you sure you want to redeem this reward for ${pointsRequired} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              await loyaltyService.redeemPoints(pointsRequired);
              Alert.alert('Success', 'Reward redeemed successfully!');
              await loadLoyaltyData();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to redeem reward');
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
      case 'Diamond': return '#B9F2FF';
      case 'Platinum': return '#E5E4E2';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      default: return '#CD7F32';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    pointsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      borderWidth: 2,
    },
    tierBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
    },
    tierText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
    },
    pointsAmount: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    pointsLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    progressContainer: {
      width: '100%',
      marginTop: 16,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    rewardCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rewardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    rewardName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    rewardPoints: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    rewardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    transactionType: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    transactionPoints: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    transactionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading && !loyaltyAccount) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentPoints = loyaltyAccount?.currentPoints || user?.loyaltyPoints || 0;
  const tier = loyaltyAccount?.tier || getTier(currentPoints);
  const nextTierPoints = loyaltyAccount?.nextTierPoints || getNextTierPoints(currentPoints);
  const tierProgress = nextTierPoints > 0 ? ((currentPoints % 100) / 100) * 100 : 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Loyalty Rewards</Text>
          <Text style={styles.subtitle}>
            Earn points with every booking and redeem them for exclusive rewards
          </Text>
        </View>

        <View
          style={[
            styles.pointsCard,
            { borderColor: getTierColor(tier) },
          ]}
        >
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: getTierColor(tier) },
            ]}
          >
            <Text style={styles.tierText}>{tier} Tier</Text>
          </View>
          <Text style={styles.pointsAmount}>{currentPoints}</Text>
          <Text style={styles.pointsLabel}>Loyalty Points</Text>

          {nextTierPoints > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                {nextTierPoints} points to next tier
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${tierProgress}%` }]}
                />
              </View>
            </View>
          )}
        </View>

        {rewards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            {rewards.map((reward) => {
              const canRedeem = currentPoints >= reward.pointsRequired;
              return (
                <View key={reward.id} style={styles.rewardCard}>
                  <View style={styles.rewardHeader}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardPoints}>
                      {reward.pointsRequired} pts
                    </Text>
                  </View>
                  <Text style={styles.rewardDescription}>
                    {reward.description}
                  </Text>
                  <Button
                    variant={canRedeem ? 'primary' : 'secondary'}
                    onPress={() => handleRedeemReward(reward.id, reward.pointsRequired)}
                    disabled={!canRedeem}
                    style={{ marginTop: 8 }}
                  >
                    {canRedeem ? 'Redeem' : 'Insufficient Points'}
                  </Button>
                </View>
              );
            })}
          </>
        )}

        {transactions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>
                    {transaction.type.replace('_', ' ')}
                  </Text>
                  <Text
                    style={[
                      styles.transactionPoints,
                      {
                        color:
                          transaction.type === 'EARNED' || transaction.type === 'BONUS'
                            ? '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {transaction.type === 'EARNED' || transaction.type === 'BONUS' ? '+' : '-'}
                    {transaction.points}
                  </Text>
                </View>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
