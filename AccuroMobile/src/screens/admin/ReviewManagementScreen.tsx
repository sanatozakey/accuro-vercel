import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Review, User } from '../../types';
import { COLORS } from '../../constants/colors';

const ReviewManagementScreen = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Review[] }>(
        API_ENDPOINTS.REVIEWS.BASE
      );
      setReviews(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Filter by approval status
    if (statusFilter === 'pending') {
      filtered = filtered.filter((review) => !review.approved);
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter((review) => review.approved);
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(ratingFilter)
      );
    }

    setFilteredReviews(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await api.put(API_ENDPOINTS.REVIEWS.APPROVE(reviewId));
      Toast.show({
        type: 'success',
        text1: 'Review Approved',
        text2: 'The review has been approved successfully',
      });
      fetchReviews();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: error.response?.data?.message || 'Failed to approve review',
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.REVIEWS.BY_ID(reviewId));
              Toast.show({
                type: 'success',
                text1: 'Review Deleted',
                text2: 'The review has been deleted successfully',
              });
              fetchReviews();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Deletion Failed',
                text2: error.response?.data?.message || 'Failed to delete review',
              });
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const getUserName = (user: string | User) => {
    if (typeof user === 'string') return 'Anonymous';
    return user.name || 'Anonymous';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading reviews..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Admin</Text>
        </View>
        <Text style={styles.headerTitle}>Review Management</Text>
        <Text style={styles.headerSubtitle}>
          Approve, reject, or delete customer reviews
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Approved" value="approved" />
              </Picker>
            </View>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Rating:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={ratingFilter}
                onValueChange={(value) => setRatingFilter(value)}
                style={styles.picker}
              >
                <Picker.Item label="All" value="all" />
                <Picker.Item label="5 Stars" value="5" />
                <Picker.Item label="4 Stars" value="4" />
                <Picker.Item label="3 Stars" value="3" />
                <Picker.Item label="2 Stars" value="2" />
                <Picker.Item label="1 Star" value="1" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}{' '}
            found
          </Text>
        </View>
      </View>

      {/* Reviews List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredReviews.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="comment-text-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>No Reviews</Text>
            <Text style={styles.emptyText}>
              {statusFilter !== 'all' || ratingFilter !== 'all'
                ? 'No reviews match your filters'
                : 'No reviews available'}
            </Text>
          </View>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review._id} style={styles.reviewCard}>
              <Card.Content>
                {/* Header */}
                <View style={styles.reviewHeader}>
                  {renderStars(review.rating)}
                  <View style={styles.badges}>
                    <Chip
                      style={[
                        styles.statusChip,
                        review.approved
                          ? styles.approvedChip
                          : styles.pendingChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {review.approved ? 'APPROVED' : 'PENDING'}
                    </Chip>
                    <Chip
                      style={[
                        styles.statusChip,
                        review.isPublic
                          ? styles.publicChip
                          : styles.privateChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {review.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </Chip>
                  </View>
                </View>

                {/* Review Content */}
                <Text style={styles.reviewText}>{review.comment}</Text>

                {/* Author Info */}
                <View style={styles.authorInfo}>
                  <Icon name="account" size={16} color={COLORS.primary} />
                  <Text style={styles.authorName}>{getUserName(review.user)}</Text>
                  {review.companyName && (
                    <Text style={styles.authorCompany}>
                      - {review.companyName}
                    </Text>
                  )}
                </View>

                <Text style={styles.date}>{formatDate(review.createdAt)}</Text>

                {/* Actions */}
                <View style={styles.actions}>
                  {!review.approved && (
                    <Button
                      mode="contained"
                      onPress={() => handleApprove(review._id)}
                      style={styles.approveButton}
                      icon="check"
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    onPress={() => handleDelete(review._id)}
                    style={styles.deleteButton}
                    textColor={COLORS.error}
                    icon="delete"
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  picker: {
    height: 50,
  },
  resultsCount: {
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  reviewCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  approvedChip: {
    backgroundColor: COLORS.success,
  },
  pendingChip: {
    backgroundColor: '#F59E0B',
  },
  publicChip: {
    backgroundColor: COLORS.primary,
  },
  privateChip: {
    backgroundColor: COLORS.gray[500],
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 12,
    lineHeight: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  authorCompany: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  date: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
  },
  deleteButton: {
    flex: 1,
    borderColor: COLORS.error,
  },
});

export default ReviewManagementScreen;
