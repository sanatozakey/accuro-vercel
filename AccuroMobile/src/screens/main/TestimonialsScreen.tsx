import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import WriteReviewModal from '../../components/reviews/WriteReviewModal';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Review, User } from '../../types';
import { COLORS } from '../../constants/colors';

const TestimonialsScreen = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Review[] }>(
        API_ENDPOINTS.REVIEWS.BASE
      );
      // Filter to show only approved and public reviews
      const approvedReviews = (response.data.data || []).filter(
        (review) => review.approved && review.isPublic
      );
      setReviews(approvedReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUserName = (user: string | User) => {
    if (typeof user === 'string') return 'Anonymous';
    return user.name || 'Anonymous';
  };

  const getUserInitials = (user: string | User) => {
    const name = getUserName(user);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading testimonials..." />;
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Testimonials</Text>
          </View>
          <Text style={styles.headerTitle}>What Our Clients Say</Text>
          <Text style={styles.headerSubtitle}>
            Read reviews from our satisfied customers
          </Text>
        </View>

        {/* Write Review Button */}
        <View style={styles.writeReviewSection}>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            icon="pencil"
            style={styles.writeReviewButton}
          >
            Write a Review
          </Button>
        </View>

        {/* Reviews List */}
        <View style={styles.content}>
          {reviews.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="comment-text-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share your experience with us!
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <Card key={review._id} style={styles.card}>
                <Card.Content>
                  {/* Rating Stars */}
                  {renderStars(review.rating)}

                  {/* Review Text */}
                  <Text variant="bodyLarge" style={styles.reviewText}>
                    {review.comment}
                  </Text>

                  {/* Author Info */}
                  <View style={styles.authorContainer}>
                    <View style={styles.avatar}>
                      <Text variant="titleMedium" style={styles.avatarText}>
                        {getUserInitials(review.user)}
                      </Text>
                    </View>
                    <View style={styles.authorInfo}>
                      <Text variant="titleMedium" style={styles.authorName}>
                        {getUserName(review.user)}
                      </Text>
                      {review.companyName && (
                        <Text variant="bodySmall" style={styles.authorCompany}>
                          {review.companyName}
                        </Text>
                      )}
                      <Text variant="bodySmall" style={styles.reviewDate}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleReviewSubmitted}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 32,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  writeReviewSection: {
    padding: 20,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  writeReviewButton: {
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 20,
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  reviewText: {
    lineHeight: 24,
    marginBottom: 16,
    color: COLORS.text.primary,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  authorCompany: {
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  reviewDate: {
    color: COLORS.text.secondary,
    marginTop: 4,
    fontSize: 12,
  },
});

export default TestimonialsScreen;
