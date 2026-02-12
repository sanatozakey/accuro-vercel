import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Button from '../common/Button';
import Input from '../common/Input';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const { height } = Dimensions.get('window');

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Review Required',
        text2: 'Please write your review before submitting',
      });
      return;
    }

    try {
      setLoading(true);
      await api.post(API_ENDPOINTS.REVIEWS.BASE, {
        rating,
        comment: comment.trim(),
        isPublic: true,
      });

      Toast.show({
        type: 'success',
        text1: 'Review Submitted!',
        text2: 'Your review has been submitted for approval',
        visibilityTime: 3000,
      });

      // Reset form
      setRating(5);
      setComment('');
      onClose();
      onSuccess();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit review',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="star" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Write a Review</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Icon
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#FFD700' : COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Review Text */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Review</Text>
              <Input
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience with us..."
                multiline
                numberOfLines={6}
                style={styles.textInput}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Submit Review
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: height * 0.5,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    marginVertical: 0,
  },
  textInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default WriteReviewModal;
