// My Clients Screen - Full implementation matching web version
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/booking.service';

export const MyClientsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const result = await bookingService.getBookings({}, 'specialist');
      
      // Extract unique clients from bookings
      const clientMap = new Map();
      result.bookings.forEach((booking: any) => {
        const customer = booking.customer;
        if (customer && !clientMap.has(customer.id)) {
          clientMap.set(customer.id, {
            ...customer,
            bookingCount: 1,
            totalSpent: booking.totalAmount || 0,
            lastBooking: booking.scheduledAt,
          });
        } else if (customer) {
          const existing = clientMap.get(customer.id);
          existing.bookingCount += 1;
          existing.totalSpent += (booking.totalAmount || 0);
          if (new Date(booking.scheduledAt) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.scheduledAt;
          }
        }
      });
      
      setClients(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const name = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
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
    clientCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    clientEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    clientStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 4,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
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
          <Text style={styles.title}>My Clients</Text>
          <Text style={styles.subtitle}>Manage your client relationships</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clients found</Text>
          </View>
        ) : (
          filteredClients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.clientCard}
              onPress={() => navigation.navigate('ClientDetail' as never, { clientId: client.id } as never)}
            >
              {client.avatar ? (
                <Image source={{ uri: client.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24, color: colors.textSecondary }}>
                    {client.firstName?.[0]?.toUpperCase() || 'C'}
                  </Text>
                </View>
              )}
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {client.firstName} {client.lastName}
                </Text>
                <Text style={styles.clientEmail}>{client.email}</Text>
                <View style={styles.clientStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Bookings:</Text>
                    <Text style={styles.statValue}>{client.bookingCount || 0}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total:</Text>
                    <Text style={styles.statValue}>${client.totalSpent?.toFixed(2) || '0.00'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
