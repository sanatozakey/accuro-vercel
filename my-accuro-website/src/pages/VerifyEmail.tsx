import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setResending(true);
    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      alert(response.data.message || 'Verification email sent! Please check your inbox.');
      setEmail('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Email Verification</h1>
          <p className="mt-4">Verifying your email address</p>
        </div>
      </section>

      {/* Verification Status */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
              {status === 'loading' && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-4">Verifying...</h2>
                  <p className="text-gray-600 text-center">Please wait while we verify your email address.</p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-4 text-green-600">Success!</h2>
                  <p className="text-gray-600 text-center mb-6">{message}</p>
                  <p className="text-sm text-gray-500 mb-4">Redirecting to login page...</p>
                  <Link
                    to="/login"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition"
                  >
                    Go to Login
                  </Link>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-red-100 p-3 rounded-full">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-4 text-red-600">Verification Failed</h2>
                  <p className="text-gray-600 text-center mb-6">{message}</p>

                  {/* Resend Verification */}
                  <div className="mt-8 border-t pt-6">
                    <div className="flex items-center justify-center mb-4">
                      <Mail className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold">Resend Verification Email</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Enter your email to receive a new verification link</p>
                    <div className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
