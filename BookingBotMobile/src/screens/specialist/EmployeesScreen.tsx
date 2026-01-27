/**
 * EmployeesScreen - Redesigned with Panhaha design system
 * Team management with search, add, and remove functionality
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { specialistService } from '../../services/specialist.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export const EmployeesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await specialistService.getTeamMembers().catch(() => ({ members: [] }));
      setEmployees(result.members || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeEmail.trim()) {
      Alert.alert(t('common.error'), t('employees.enterEmail'));
      return;
    }

    try {
      await specialistService.addTeamMember({
        email: newEmployeeEmail.trim(),
        role: 'employee',
      });
      Alert.alert(t('common.success'), t('employees.invitationSent'));
      setShowAddModal(false);
      setNewEmployeeEmail('');
      loadEmployees();
    } catch (error: any) {
      Alert.alert(t('common.error'), error || t('employees.addError'));
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    Alert.alert(
      t('employees.removeTitle'),
      t('employees.removeMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await specialistService.removeTeamMember(employeeId);
              Alert.alert(t('common.success'), t('employees.removeSuccess'));
              loadEmployees();
            } catch (error: any) {
              Alert.alert(t('common.error'), error || t('employees.removeError'));
            }
          },
        },
      ]
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    if (!searchQuery) return true;
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
    const email = (employee.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>👥</Text>
          <Text style={styles.heroTitle}>{t('employees.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('employees.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        placeholder={t('employees.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: SECONDARY_COLORS[500] }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ {t('employees.add')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmployeeCard = ({ item }: { item: Employee }) => (
    <Card style={styles.employeeCard} borderVariant="subtle" elevation="sm">
      <View style={styles.employeeContent}>
        {/* Avatar */}
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] },
            ]}
          >
            <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
              {item.firstName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'E'}
            </Text>
          </View>
        )}

        {/* Employee Info */}
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.employeeEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.employeeMeta}>
            <Badge label={item.role || t('employees.roleEmployee')} variant="secondary" size="sm" />
            {item.isActive && (
              <View style={styles.activeIndicator}>
                <View style={[styles.activeDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.activeText, { color: '#10B981' }]}>
                  {t('employees.active')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: ERROR_COLOR + '20' }]}
          onPress={() => handleRemoveEmployee(item.id)}
        >
          <Text style={[styles.removeIcon, { color: ERROR_COLOR }]}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent} borderVariant="subtle" elevation="lg">
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('employees.addEmployee')}
          </Text>
          <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
            {t('employees.addDescription')}
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('employees.emailLabel')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
              placeholder={t('employees.emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newEmployeeEmail}
              onChangeText={setNewEmployeeEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => {
                setShowAddModal(false);
                setNewEmployeeEmail('');
              }}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: SECONDARY_COLORS[500] }]}
              onPress={handleAddEmployee}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {t('employees.sendInvitation')}
              </Text>
            </TouchableOpacity>
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
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={100} style={{ marginBottom: SPACING.md }} />
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
            tintColor={SECONDARY_COLORS[500]}
            colors={[SECONDARY_COLORS[500]]}
          />
        }
      >
        {renderSearchBar()}

        {filteredEmployees.length === 0 ? (
          <EmptyState
            emoji="👥"
            title={searchQuery ? t('employees.noResults') : t('employees.noEmployees')}
            description={searchQuery ? t('employees.noResultsDesc') : t('employees.noEmployeesDesc')}
            actionLabel={!searchQuery ? t('employees.addFirst') : undefined}
            onAction={!searchQuery ? () => setShowAddModal(true) : undefined}
          />
        ) : (
          <FlatList
            data={filteredEmployees}
            renderItem={renderEmployeeCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
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
  searchContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  addButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  employeeCard: {
    padding: SPACING.md,
  },
  employeeContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  employeeInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  employeeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  employeeEmail: {
    fontSize: FONT_SIZES.sm,
  },
  employeeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 20,
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
    marginBottom: SPACING.xs,
  },
  modalDescription: {
    fontSize: FONT_SIZES.sm,
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
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  buttonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});
