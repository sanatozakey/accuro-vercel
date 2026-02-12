import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const BookingScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { items, getTotal } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    date: '',
    time: '',
    purpose: '',
    productOfInterest: '',
    location: 'accuro_office' as 'client_site' | 'accuro_office' | 'virtual',
    additionalNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fill cart data when component mounts
  useEffect(() => {
    if (items.length > 0) {
      const cartSummary = generateCartSummary();
      setFormData((prev) => ({
        ...prev,
        additionalNotes: cartSummary,
      }));
    }
  }, []);

  const generateCartSummary = () => {
    if (items.length === 0) return '';

    let summary = '--- QUOTE REQUEST FROM CART ---\n\n';
    summary += 'Products requested:\n';

    items.forEach((item, index) => {
      const price = item.product.price
        ? `₱${item.product.price.toLocaleString()}`
        : item.product.estimatedPricePhp || 'Contact for price';
      summary += `${index + 1}. ${item.product.name} - Qty: ${item.quantity} - Est. Price: ${price}\n`;
      if (item.specifications) {
        summary += `   Specifications: ${item.specifications}\n`;
      }
    });

    const total = getTotal();
    if (total > 0) {
      summary += `\nTotal Estimated Price: ₱${total.toLocaleString()}\n`;
    }

    summary += '\n--- END OF CART SUMMARY ---\n\n';
    return summary;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (
        !formData.fullName ||
        !formData.email ||
        !formData.phone ||
        !formData.date ||
        !formData.time
      ) {
        setError('Please fill in all required fields');
        return;
      }

      await api.post(API_ENDPOINTS.BOOKINGS.BASE, formData);
      setSuccess(true);

      Toast.show({
        type: 'success',
        text1: 'Booking Submitted!',
        text2: 'We will contact you soon to confirm your meeting.',
        visibilityTime: 3000,
      });

      // Reset form
      setTimeout(() => {
        setFormData({
          fullName: user?.name || '',
          email: user?.email || '',
          phone: '',
          company: '',
          date: '',
          time: '',
          purpose: '',
          productOfInterest: '',
          location: 'accuro_office',
          additionalNotes: '',
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Schedule a Meeting</Text>
          </View>
          <Text style={styles.headerTitle}>Book a Meeting</Text>
          <Text style={styles.headerSubtitle}>
            Schedule a consultation with our calibration experts
          </Text>
        </View>

        {/* Success Message */}
        {success && (
          <View style={styles.successMessage}>
            <Icon name="check-circle" size={24} color={COLORS.success} />
            <View style={styles.successTextContainer}>
              <Text style={styles.successTitle}>Booking Submitted!</Text>
              <Text style={styles.successText}>
                We'll contact you soon to confirm your meeting.
              </Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorMessage}>
            <Icon name="alert-circle" size={24} color={COLORS.error} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>

            <Input
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              placeholder="Enter your full name"
            />

            <Input
              label="Email *"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone *"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <Input
              label="Company"
              value={formData.company}
              onChangeText={(text) => handleInputChange('company', text)}
              placeholder="Enter your company name"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Meeting Details
            </Text>

            <Input
              label="Preferred Date *"
              value={formData.date}
              onChangeText={(text) => handleInputChange('date', text)}
              placeholder="YYYY-MM-DD"
            />

            <Input
              label="Preferred Time *"
              value={formData.time}
              onChangeText={(text) => handleInputChange('time', text)}
              placeholder="HH:MM"
            />

            <Text variant="labelLarge" style={styles.label}>
              Meeting Location *
            </Text>
            <SegmentedButtons
              value={formData.location}
              onValueChange={(value) => handleInputChange('location', value)}
              buttons={[
                { value: 'client_site', label: 'Client Site' },
                { value: 'accuro_office', label: 'Our Office' },
                { value: 'virtual', label: 'Virtual' },
              ]}
              style={styles.segmented}
            />

            <Input
              label="Purpose of Meeting"
              value={formData.purpose}
              onChangeText={(text) => handleInputChange('purpose', text)}
              placeholder="e.g., Calibration consultation"
              multiline
              numberOfLines={2}
            />

            <Input
              label="Product of Interest"
              value={formData.productOfInterest}
              onChangeText={(text) =>
                handleInputChange('productOfInterest', text)
              }
              placeholder="Any specific product?"
            />

            <Input
              label="Additional Notes"
              value={formData.additionalNotes}
              onChangeText={(text) => handleInputChange('additionalNotes', text)}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || success}
          style={styles.submitButton}
        >
          Submit Booking
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
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
  successMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.success + '15',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    gap: 12,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.error + '15',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    gap: 12,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text.primary,
    fontSize: 18,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  segmented: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
});

export default BookingScreen;
