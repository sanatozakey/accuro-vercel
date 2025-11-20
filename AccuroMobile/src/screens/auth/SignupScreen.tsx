import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const SignupScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'At least one number', test: (pwd) => /[0-9]/.test(pwd) },
    { label: 'At least one special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*]/.test(pwd) },
  ];

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    passwordRequirements.forEach(req => {
      if (!req.test(pwd)) {
        errors.push(req.label);
      }
    });
    return { isValid: errors.length === 0, errors };
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return '';
    const validation = validatePassword(pwd);
    const errorCount = validation.errors.length;
    if (errorCount === 0) return 'Strong';
    if (errorCount <= 2) return 'Medium';
    return 'Weak';
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return COLORS.success;
      case 'Medium': return COLORS.warning;
      case 'Weak': return COLORS.error;
      default: return COLORS.gray[500];
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError('');

      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors[0]);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      await register({ name, email, password });
    } catch (err: any) {
      // Extract error message from backend response
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.errors?.[0]?.message ||
                          err.message ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
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
          <Image
            source={require('../../assets/accuro_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="displaySmall" style={styles.title}>
            Create Account
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Join Accuro to manage your bookings and quotes
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              left={<Input.Icon icon="account" />}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<Input.Icon icon="email" />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              right={
                <Input.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {password ? (
              <View style={styles.passwordFeedback}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.strengthText,
                    { color: getPasswordStrengthColor(getPasswordStrength(password)) }
                  ]}
                >
                  Password strength: {getPasswordStrength(password)}
                </Text>
                <Text variant="bodySmall" style={styles.requirementsHeader}>
                  Password must contain:
                </Text>
                {passwordRequirements.map((req, index) => {
                  const isMet = req.test(password);
                  return (
                    <View key={index} style={styles.requirementRow}>
                      <Text
                        style={[
                          styles.requirementText,
                          { color: isMet ? COLORS.success : COLORS.gray[500] }
                        ]}
                      >
                        {isMet ? '✓' : '○'} {req.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              right={
                <Input.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {confirmPassword && password === confirmPassword ? (
              <Text style={styles.matchText}>✓ Passwords match</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.signupButton}
            >
              Sign Up
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Already have an account?</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login' as never)}
          >
            Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: COLORS.secondary,
    marginHorizontal: -20,
    marginTop: -20,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.white,
  },
  subtitle: {
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    marginTop: 24,
    borderRadius: 12,
    elevation: 4,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  signupButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  passwordFeedback: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  strengthText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementsHeader: {
    color: COLORS.gray[700],
    marginBottom: 6,
    fontWeight: '500',
  },
  requirementRow: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
  },
  matchText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
    marginBottom: 8,
  },
});

export default SignupScreen;
