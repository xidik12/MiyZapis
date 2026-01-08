// Reviews Screen - Customer reviews and ratings
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
  response?: string;
}

export const ReviewsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockReviews: Review[] = [
        {
          id: '1',
          customerName: 'John Doe',
          rating: 5,
          comment: 'Excellent service! Very professional and friendly.',
          serviceName: 'Haircut',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          customerName: 'Jane Smith',
          rating: 4,
          comment: 'Great experience, will come back again.',
          serviceName: 'Massage',
          date: new Date(Date.now() - 86400000).toISOString(),
          response: 'Thank you for your feedback!',
        },
        {
          id: '3',
          customerName: 'Mike Johnson',
          rating: 5,
          comment: 'Best service in town! Highly recommend.',
          serviceName: 'Manicure',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'responded') return review.response;
    if (filter === 'pending') return !review.response;
    return true;
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
      marginBottom: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      color: colors.text,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    serviceName: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    rating: {
      fontSize: 16,
    },
    comment: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    reviewFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    responseButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    responseButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    response: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    responseLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    responseText: {
      fontSize: 14,
      color: colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading && !reviews.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

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
          <Text style={styles.title}>Reviews</Text>
          <Text style={styles.subtitle}>
            {reviews.length} reviews · {averageRating} ⭐ average rating
          </Text>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'all' && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'pending' && styles.filterButtonActive,
              ]}
              onPress={() => setFilter('pending')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'pending' && styles.filterTextActive,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'responded' && styles.filterButtonActive,
              ]}
              onPress={() => setFilter('responded')}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === 'responded' && styles.filterTextActive,
                ]}
              >
                Responded
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{review.customerName}</Text>
                  <Text style={styles.serviceName}>{review.serviceName}</Text>
                </View>
                <Text style={styles.rating}>{renderStars(review.rating)}</Text>
              </View>

              <Text style={styles.comment}>{review.comment}</Text>

              {review.response && (
                <View style={styles.response}>
                  <Text style={styles.responseLabel}>Your Response</Text>
                  <Text style={styles.responseText}>{review.response}</Text>
                </View>
              )}

              <View style={styles.reviewFooter}>
                <Text style={styles.date}>
                  {format(new Date(review.date), 'MMM d, yyyy')}
                </Text>
                {!review.response && (
                  <TouchableOpacity style={styles.responseButton}>
                    <Text style={styles.responseButtonText}>Respond</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
