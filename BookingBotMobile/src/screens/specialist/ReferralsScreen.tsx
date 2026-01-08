// Referrals Screen - Specialist referral program (matching web version)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { referralService, ReferralConfigResponse, ReferralAnalytics, Referral, CreateReferralRequest } from '../../services/referral.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { format } from 'date-fns';

export const SpecialistReferralsScreen: React.FC = () => {
  const { colors } = useTheme();
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
      Alert.alert('Error', 'Failed to load referral data');
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
      Alert.alert('Error', 'Please select a referral type');
      return;
    }

    try {
      setCreating(true);
      const data: CreateReferralRequest = {
        type: newReferralType,
        customMessage: newReferralMessage || undefined,
      };
      
      const newReferral = await referralService.createReferral(data);
      
      // Refresh data
      await loadData();
      
      Alert.alert('Success', 'Referral created successfully!');
      setCreateModalOpen(false);
      setNewReferralType('');
      setNewReferralMessage('');

      // Auto-share referral link
      const shared = await referralService.shareReferral(newReferral);
      if (shared) {
        Alert.alert('Success', 'Referral link shared!');
      }
    } catch (error: any) {
      console.error('Failed to create referral:', error);
      Alert.alert('Error', error?.message || 'Failed to create referral');
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

  const canCreateReferral = config 
    ? config.limits.dailyUsed < config.limits.dailyLimit &&
      config.limits.pendingUsed < config.limits.pendingLimit
    : false;

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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    headerText: {
      flex: 1,
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
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    overviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    overviewIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    overviewLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    overviewValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    codeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    codeLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    codeValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 16,
      letterSpacing: 2,
    },
    limitsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    limitsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    limitRow: {
      marginBottom: 12,
    },
    limitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    limitLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    limitValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
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
    referralCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    referralHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    referralCode: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    referralStatus: {
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      fontWeight: '600',
    },
    referralDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading && !config && !analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.headerText}>
            <Text style={styles.title}>Referral Program</Text>
            <Text style={styles.subtitle}>
              Earn rewards by referring other specialists
            </Text>
          </View>
          <Button
            variant="primary"
            onPress={() => setCreateModalOpen(true)}
            disabled={!canCreateReferral}
            style={{ marginLeft: 12 }}
          >
            Create
          </Button>
        </View>

        {analytics && (
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>👥</Text>
              <Text style={styles.overviewLabel}>Total Referrals</Text>
              <Text style={styles.overviewValue}>{analytics.overview.totalReferrals}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>✅</Text>
              <Text style={styles.overviewLabel}>Completed</Text>
              <Text style={styles.overviewValue}>{analytics.overview.completedReferrals}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>📊</Text>
              <Text style={styles.overviewLabel}>Conversion Rate</Text>
              <Text style={styles.overviewValue}>
                {referralService.formatConversionRate(analytics.overview.conversionRate)}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewIcon}>🎁</Text>
              <Text style={styles.overviewLabel}>Points Earned</Text>
              <Text style={styles.overviewValue}>{analytics.overview.totalPointsEarned}</Text>
            </View>
          </View>
        )}

        {config && (
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <Text style={styles.codeValue}>{config.referralCode}</Text>
              <Button
                variant="primary"
                onPress={() => {
                  const referralLink = `https://panhaha.com/register?ref=${config.referralCode}`;
                  Share.share({
                    message: `Join Panhaha as a specialist and earn more! Use my referral code: ${config.referralCode}\n${referralLink}`,
                    title: 'Referral Link',
                  });
                }}
                style={{ width: '100%', marginTop: 12 }}
              >
                Share Referral Link
              </Button>
            </View>

            <View style={styles.limitsCard}>
              <Text style={styles.limitsTitle}>Current Limits</Text>
              <View style={styles.limitRow}>
                <View style={styles.limitHeader}>
                  <Text style={styles.limitLabel}>Daily Referrals</Text>
                  <Text style={styles.limitValue}>
                    {config.limits.dailyUsed} / {config.limits.dailyLimit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((config.limits.dailyUsed / config.limits.dailyLimit) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.limitRow}>
                <View style={styles.limitHeader}>
                  <Text style={styles.limitLabel}>Pending Referrals</Text>
                  <Text style={styles.limitValue}>
                    {config.limits.pendingUsed} / {config.limits.pendingLimit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((config.limits.pendingUsed / config.limits.pendingLimit) * 100, 100)}%`,
                        backgroundColor: '#FFA500',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {referrals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            {referrals.map((referral) => (
              <View key={referral.id} style={styles.referralCard}>
                <View style={styles.referralHeader}>
                  <Text style={styles.referralCode}>{referral.referralCode}</Text>
                  <View
                    style={[
                      styles.referralStatus,
                      {
                        backgroundColor:
                          referral.status === 'COMPLETED'
                            ? '#10B981'
                            : referral.status === 'PENDING'
                            ? '#F59E0B'
                            : '#EF4444',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: '#FFF',
                      }}
                    >
                      {referral.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.referralDate}>
                  Created: {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                </Text>
                <Button
                  variant="secondary"
                  onPress={() => handleShareReferral(referral)}
                  style={{ marginTop: 8 }}
                >
                  Share
                </Button>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Referral Modal */}
      <Modal
        visible={createModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Referral</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Referral Type</Text>
              {config?.availableTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor:
                      newReferralType === type ? colors.primary : colors.background,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => setNewReferralType(type)}
                >
                  <Text
                    style={{
                      color: newReferralType === type ? '#FFF' : colors.text,
                      fontWeight: newReferralType === type ? '600' : 'normal',
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Custom Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReferralMessage}
                onChangeText={setNewReferralMessage}
                placeholder="Add a personal message..."
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
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleCreateReferral}
                disabled={!newReferralType || creating}
                style={{ flex: 1 }}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
