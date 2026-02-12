import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';

const LoginScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      await login({ email, password });
    } catch (err: any) {
      // Extract error message from backend response
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.errors?.[0]?.message ||
                          err.message ||
                          'Login failed. Please try again.';
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
            Login
          </Text>
          <Text variant="titleMedium" style={styleSheet.subtitle}>
            Sign in to your Accuro account
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

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styleSheet.loginButton}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword' as never)}
              style={styleSheet.forgotButton}
            >
              Forgot Password?
            </Button>
          </Card.Content>
        </Card>
        </Animated.View>

        <Animated.View style={[styleSheet.footer, { opacity: fadeAnim }]}>
          <Text variant="bodyMedium">Don't have an account?</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Signup' as never)}
          >
            Sign Up
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
  loginButton: {
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 4,
  },
  forgotButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
});

export default LoginScreen;
