// Employees Screen - For Business user type only
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { specialistService } from '../../services/specialist.service';

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
  const { colors } = useTheme();
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
      // Note: This endpoint would need to be implemented in the backend
      // For now, using a placeholder
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
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      await specialistService.addTeamMember({
        email: newEmployeeEmail.trim(),
        role: 'employee',
      });
      Alert.alert('Success', 'Invitation sent to employee');
      setShowAddModal(false);
      setNewEmployeeEmail('');
      loadEmployees();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to add employee');
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    Alert.alert(
      'Remove Employee',
      'Are you sure you want to remove this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await specialistService.removeTeamMember(employeeId);
              Alert.alert('Success', 'Employee removed successfully');
              loadEmployees();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to remove employee');
            }
          },
        },
      ]
    );
  };

  const filteredEmployees = employees.filter(employee => {
    if (!searchQuery) return true;
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
    const email = (employee.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

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
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    searchInput: {
      height: 50,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    employeeCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    employeeEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    employeeRole: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    removeButton: {
      padding: 8,
    },
    removeButtonText: {
      fontSize: 20,
      color: colors.error,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
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
      marginBottom: 16,
    },
    modalInput: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    modalButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonTextSecondary: {
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          <Text style={styles.title}>Employees</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Employee</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptyText}>
              Add team members to help manage your business
            </Text>
          </View>
        ) : (
          filteredEmployees.map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              {employee.avatar ? (
                <Image source={{ uri: employee.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24, color: colors.textSecondary }}>
                    {employee.firstName?.[0]?.toUpperCase() || 'E'}
                  </Text>
                </View>
              )}
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Text style={styles.employeeEmail}>{employee.email}</Text>
                <Text style={styles.employeeRole}>{employee.role || 'Employee'}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveEmployee(employee.id)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Employee</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Employee email address"
              placeholderTextColor={colors.textSecondary}
              value={newEmployeeEmail}
              onChangeText={setNewEmployeeEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewEmployeeEmail('');
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddEmployee}
              >
                <Text style={styles.modalButtonText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

