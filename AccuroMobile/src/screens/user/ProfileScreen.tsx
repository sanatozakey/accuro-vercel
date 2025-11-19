import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

const ProfileScreen = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await api.put(API_ENDPOINTS.AUTH.UPDATE_DETAILS, {
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      });

      updateUser(response.data.user);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to update profile. Please try again.'
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
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={100}
            label={user?.name?.charAt(0).toUpperCase() || 'U'}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {user?.name}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user?.email}
          </Text>
        </View>

        {success && (
          <Card
            style={[
              styles.messageCard,
              { backgroundColor: theme.colors.successContainer },
            ]}
          >
            <Card.Content>
              <Text style={{ color: theme.colors.onSuccessContainer }}>
                Profile updated successfully!
              </Text>
            </Card.Content>
          </Card>
        )}

        {error && (
          <Card
            style={[
              styles.messageCard,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Card.Content>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Edit Profile
            </Text>

            <Input
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your full name"
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled
            />

            <Input
              label="Phone"
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

            <Button
              mode="contained"
              onPress={handleUpdate}
              loading={loading}
              disabled={loading}
              style={styles.updateButton}
            >
              Update Profile
            </Button>
          </Card.Content>
        </Card>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  name: {
    fontWeight: 'bold',
    marginTop: 16,
  },
  email: {
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  updateButton: {
    marginTop: 8,
  },
  messageCard: {
    marginBottom: 16,
  },
});

export default ProfileScreen;
