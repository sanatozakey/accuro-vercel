import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Animated,
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

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const styleSheet = styles(theme);

  return (
    <KeyboardAvoidingView
      style={styleSheet.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styleSheet.scrollContent}>
        <Animated.View
          style={[
            styleSheet.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Image
            source={require('../../assets/accuro_logo.png')}
            style={styleSheet.logo}
            resizeMode="contain"
          />
          <Text variant="displaySmall" style={styleSheet.title}>
            Create Account
          </Text>
          <Text variant="titleMedium" style={styleSheet.subtitle}>
            Join Accuro to manage your bookings and quotes
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
        <Card style={styleSheet.card} elevation={4}>
          <Card.Content>
            {error ? (
              <Text style={[styleSheet.error, { color: theme.colors.error }]}>
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
              <View style={styleSheet.passwordFeedback}>
                <Text
                  variant="bodySmall"
                  style={[
                    styleSheet.strengthText,
                    { color: getPasswordStrengthColor(getPasswordStrength(password)) }
                  ]}
                >
                  Password strength: {getPasswordStrength(password)}
                </Text>
                <Text variant="bodySmall" style={styleSheet.requirementsHeader}>
                  Password must contain:
                </Text>
                {passwordRequirements.map((req, index) => {
                  const isMet = req.test(password);
                  return (
                    <View key={index} style={styleSheet.requirementRow}>
                      <Text
                        style={[
                          styleSheet.requirementText,
                          { color: isMet ? COLORS.success : theme.colors.onSurfaceVariant }
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
              <Text style={styleSheet.matchText}>✓ Passwords match</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styleSheet.signupButton}
            >
              Sign Up
            </Button>
          </Card.Content>
        </Card>
        </Animated.View>

        <Animated.View style={[styleSheet.footer, { opacity: fadeAnim }]}>
          <Text variant="bodyMedium">Already have an account?</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login' as never)}
          >
            Sign In
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: COLORS.secondary,
    marginHorizontal: -24,
    marginTop: -24,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginBottom: 20,
    marginTop: 28,
    borderRadius: 16,
  },
  error: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  signupButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  passwordFeedback: {
    marginTop: 16,
    marginBottom: 16,
    padding: 18,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  strengthText: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 14,
  },
  requirementsHeader: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 13,
  },
  requirementRow: {
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    lineHeight: 18,
  },
  matchText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default SignupScreen;
