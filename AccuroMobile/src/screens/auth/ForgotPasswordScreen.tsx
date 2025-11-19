import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

const ForgotPasswordScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      if (!email) {
        setError('Please enter your email');
        return;
      }

      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to send reset email. Please try again.'
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
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Reset Password
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Enter your email to receive a reset link
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            {success ? (
              <View style={styles.successContainer}>
                <Text
                  style={[styles.success, { color: theme.colors.success }]}
                  variant="bodyLarge"
                >
                  Password reset email sent! Please check your inbox.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Login' as never)}
                  style={styles.backButton}
                >
                  Back to Login
                </Button>
              </View>
            ) : (
              <>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<Input.Icon icon="email" />}
                />

                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={loading}
                  style={styles.resetButton}
                >
                  Send Reset Link
                </Button>

                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login' as never)}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              </>
            )}
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
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  success: {
    marginBottom: 24,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  resetButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
  backButton: {
    marginTop: 8,
  },
});

export default ForgotPasswordScreen;
