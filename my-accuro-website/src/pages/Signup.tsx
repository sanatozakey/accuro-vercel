import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Building, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    password?: string[];
    confirmPassword?: string;
  }>({});

  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('At least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const getPasswordStrength = (password: string) => {
    const validation = validatePassword(password);
    if (password.length === 0) return '';

    const errorCount = validation.errors.length;
    if (errorCount === 0) return 'Strong';
    if (errorCount <= 2) return 'Medium';
    return 'Weak';
  };

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
      case 'name':
        if (value.length > 0 && value.length < 2) {
          newFieldErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newFieldErrors.name;
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
    if (formData.name.length < 2) {
      newFieldErrors.name = 'Name must be at least 2 characters';
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Create Account</h1>
          <p className="mt-4">Join Accuro to manage your bookings and quotes</p>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserPlus className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">Get Started</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      pattern="[0-9+\-() ]+"
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-gray-700 font-medium mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your Company Ltd."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-1">
                      <p className={`text-xs font-medium ${
                        getPasswordStrength(formData.password) === 'Strong' ? 'text-green-600' :
                        getPasswordStrength(formData.password) === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        Password strength: {getPasswordStrength(formData.password)}
                      </p>
                    </div>
                  )}
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 font-medium mb-1">Password must contain:</p>
                    <ul className="text-xs space-y-1">
                      <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '○'} At least one uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[a-z]/.test(formData.password) ? '✓' : '○'} At least one lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[0-9]/.test(formData.password) ? '✓' : '○'} At least one number
                      </li>
                      <li className={/[!@#$%^&*]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[!@#$%^&*]/.test(formData.password) ? '✓' : '○'} At least one special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword === formData.password && (
                    <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-gray-600 hover:text-gray-800 text-sm">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
