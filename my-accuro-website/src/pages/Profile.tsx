import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Camera, Save, AlertCircle, X, CheckCircle, XCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { compressImage } from '../utils/imageCompression';

export function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });

  const [profilePicture, setProfilePicture] = useState<string>(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const processImageFile = async (file: File) => {
    // Validate file size (max 5MB input - will be auto-compressed)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    try {
      // Auto-compress: resize to 800x800 max, JPEG quality 0.8
      const compressed = await compressImage(file);
      setProfilePicture(compressed);
      setError('');
    } catch {
      setError('Failed to process image file');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePicture('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update profile details
      // Only include fields that have values to avoid validation errors
      const updateData: any = {};

      // Only add fields that have non-empty values
      if (formData.firstName && formData.firstName.trim()) updateData.firstName = formData.firstName.trim();
      updateData.middleName = formData.middleName ? formData.middleName.trim() : '';
      if (formData.lastName && formData.lastName.trim()) updateData.lastName = formData.lastName.trim();
      if (formData.email && formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.phone && formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.company && formData.company.trim()) updateData.company = formData.company.trim();

      // Handle profile picture changes
      // If profilePicture is a new base64 image, send it
      if (profilePicture && profilePicture.startsWith('data:image/')) {
        updateData.profilePicture = profilePicture;
      }
      // If profilePicture was removed (empty string) and user had a picture before, send empty string to remove it
      else if (profilePicture === '' && user?.profilePicture) {
        updateData.profilePicture = '';
      }

      const response = await authService.updateDetails(updateData);

      // Update user in context
      updateUser(response.data.data);

      setSuccess('Profile updated successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">Edit Profile</h1>
          </div>

          {/* Profile Picture Section */}
          <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <div
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`transition-all ${isDragging ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105' : ''}`}>
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(formData.name || 'U')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <Camera className="w-5 h-5 text-blue-600" />
                  </button>
                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-red-50 dark:hover:bg-gray-600 transition"
                      title="Remove profile picture"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Click the camera icon or drag & drop an image to upload a new profile picture
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: 5MB (auto-compressed). Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-6 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            )}

            {/* Name Fields */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="middleName" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(Optional)"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
              {/* Email Verification Status */}
              <div className="mt-2">
                {user?.isEmailVerified ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">Email verified</span>
                  </div>
                ) : (
                  <div className="px-3 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Email not verified</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                      Please verify your email to access all features. Check your inbox for a verification link.
                    </p>
                    {verificationMessage && (
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2">{verificationMessage}</p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        setResendingVerification(true);
                        setVerificationMessage('');
                        try {
                          await authService.resendVerificationEmail(user?.email || formData.email);
                          setVerificationMessage('Verification email sent! Please check your inbox.');
                        } catch (err: any) {
                          setVerificationMessage(err.response?.data?.message || 'Failed to send verification email.');
                        } finally {
                          setResendingVerification(false);
                        }
                      }}
                      disabled={resendingVerification}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3 h-3" />
                      {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="mb-6">
              <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Company Field */}
            <div className="mb-6">
              <label htmlFor="company" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <Building className="w-4 h-4 mr-2 text-gray-400" />
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
