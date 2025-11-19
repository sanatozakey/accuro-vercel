import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme, SegmentedButtons } from 'react-native-paper';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

const BookingScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Book a Meeting
        </Text>

        {success && (
          <Card style={[styles.messageCard, { backgroundColor: theme.colors.successContainer }]}>
            <Card.Content>
              <Text style={{ color: theme.colors.onSuccessContainer }}>
                Booking submitted successfully! We'll contact you soon.
              </Text>
            </Card.Content>
          </Card>
        )}

        {error && (
          <Card style={[styles.messageCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </Card.Content>
          </Card>
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
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  messageCard: {
    marginBottom: 16,
  },
});

export default BookingScreen;
