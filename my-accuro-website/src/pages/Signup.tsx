import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Building, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { validatePassword, getPasswordStrength } from '../utils/passwordValidation';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';

export function Signup() {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    password?: string[];
    confirmPassword?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');

    // Real-time validation
    const newFieldErrors = { ...fieldErrors };

    switch (name) {
      case 'firstName':
        if (value.length > 0 && value.length < 1) {
          newFieldErrors.firstName = 'First name is required';
        } else {
          delete newFieldErrors.firstName;
        }
        break;

      case 'lastName':
        if (value.length > 0 && value.length < 1) {
          newFieldErrors.lastName = 'Last name is required';
        } else {
          delete newFieldErrors.lastName;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.length > 0 && !emailRegex.test(value)) {
          newFieldErrors.email = 'Please enter a valid email address';
        } else {
          delete newFieldErrors.email;
        }
        break;

      case 'phone':
        const phoneRegex = /^[0-9+\-() ]*$/;
        if (!phoneRegex.test(value)) {
          newFieldErrors.phone = 'Phone can only contain numbers, spaces, dashes, parentheses, and plus sign';
        } else {
          delete newFieldErrors.phone;
        }
        break;

      case 'password':
        const passwordValidation = validatePassword(value);
        if (value.length > 0 && !passwordValidation.isValid) {
          newFieldErrors.password = passwordValidation.errors;
        } else {
          delete newFieldErrors.password;
        }

        // Also check confirm password match if it has a value
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newFieldErrors.confirmPassword = 'Passwords do not match';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          delete newFieldErrors.confirmPassword;
        }
        break;

      case 'confirmPassword':
        if (value.length > 0 && value !== formData.password) {
          newFieldErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newFieldErrors.confirmPassword;
        }
        break;
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    const newFieldErrors: any = {};
    let isValid = true;

    // Name validation
    if (!formData.firstName.trim()) {
      newFieldErrors.firstName = 'First name is required';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      newFieldErrors.lastName = 'Last name is required';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^[0-9+\-() ]*$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newFieldErrors.phone = 'Phone can only contain numbers, spaces, dashes, parentheses, and plus sign';
      isValid = false;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newFieldErrors.password = passwordValidation.errors;
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await register(registerData);

      // Show success message about email verification
      if (response?.message) {
        setSuccess(response.message);
      } else {
        setSuccess('Account created successfully! Please check your email to verify your account.');
      }

      // Don't navigate immediately - let user see the verification message
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-background min-h-screen">
      {/* Header */}
      <section className="bg-navy-900 text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Create Account</h1>
          <p className="text-lg text-gray-200">Join Accuro to manage your bookings and quotes</p>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="border-2 shadow-xl">
              <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl">Get Started</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <p className="font-medium">{success}</p>
                      <p className="text-sm mt-1">Redirecting to login page in 5 seconds...</p>
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`pl-10 ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                        placeholder="John"
                        required
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <p className="text-sm text-red-600">{fieldErrors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="(Optional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`pl-10 ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Doe"
                        required
                      />
                    </div>
                    {fieldErrors.lastName && (
                      <p className="text-sm text-red-600">{fieldErrors.lastName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`pl-10 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-sm text-red-600">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Your Company Ltd."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 pr-12 ${fieldErrors.password ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={formData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pl-10 pr-12 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                    )}
                    {formData.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword === formData.password && (
                      <p className="text-sm text-green-600">✓ Passwords match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-muted-foreground">or sign up with</span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      if (credentialResponse.credential) {
                        try {
                          setLoading(true);
                          setError('');
                          await googleLogin(credentialResponse.credential);
                          navigate('/');
                        } catch (err: any) {
                          setError(err.response?.data?.message || 'Google sign-up failed');
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    onError={() => {
                      setError('Google sign-up failed. Please try again.');
                    }}
                    size="large"
                    width="100%"
                    text="signup_with"
                  />
                </div>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <Link to="/" className="text-muted-foreground hover:text-foreground text-sm">
                    Back to Home
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
