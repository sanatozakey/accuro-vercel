import React, { useState, useEffect, useCallback } from 'react';
import { Star, Filter, TrendingUp, Users, Award, Send, X } from 'lucide-react';
import reviewService, { Review } from '../services/reviewService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Testimonials() {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | undefined>();
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getPublicReviews(selectedRating);
      setReviews(data.data || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.count || 0);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      setSubmitError('Please enter your review');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      await reviewService.createReview({
        rating: formData.rating,
        comment: formData.comment,
        reviewType: 'general',
      });
      setSubmitSuccess(true);
      setFormData({ rating: 5, comment: '' });
      setShowForm(false);
      setTimeout(() => {
        setSubmitSuccess(false);
        fetchReviews(); // Refresh reviews
      }, 3000);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-navy-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Customer Testimonials</h1>
            <p className="text-xl text-gray-300">
              See what our satisfied clients have to say about our calibration services
            </p>
          </div>
        </div>
      </section>

      {/* Write Review Section */}
      {isAuthenticated && (
        <section className="py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center">
                  <Award className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-green-800 font-medium">
                      Thank you for your testimonial!
                    </p>
                    <p className="text-green-700 text-sm">
                      It will be visible after admin approval.
                    </p>
                  </div>
                </div>
              )}

              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition flex items-center justify-center gap-3 shadow-md"
                >
                  <Award className="h-5 w-5" />
                  Write a Review
                </button>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">Share Your Experience</h3>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setSubmitError('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    {/* Rating Selection */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Your Rating *
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-10 w-10 transition cursor-pointer ${
                                star <= formData.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Your Review *
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) =>
                          setFormData({ ...formData, comment: e.target.value })
                        }
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about your experience with Accuro..."
                        required
                        maxLength={1000}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.comment.length}/1000 characters
                      </p>
                    </div>

                    {/* Error Message */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        {submitError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Submit Review
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!isAuthenticated && (
        <section className="py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                Share Your Experience
              </h3>
              <p className="text-gray-600 mb-4">
                Please log in to write a review and share your experience with Accuro.
              </p>
              <Link
                to="/login?redirect=/testimonials"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Log In to Write a Review
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Statistics Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="mb-2">{renderStars(Math.round(averageRating), 'lg')}</div>
                <p className="text-gray-600 font-medium">Average Rating</p>
              </div>

              {/* Total Reviews */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-4xl font-bold text-green-900 mb-2">{totalReviews}</div>
                <p className="text-gray-600 font-medium">Total Reviews</p>
              </div>

              {/* 5-Star Reviews */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 text-center">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2 fill-yellow-600" />
                <div className="text-4xl font-bold text-yellow-900 mb-2">
                  {distribution[5]}
                </div>
                <p className="text-gray-600 font-medium">5-Star Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filter by Rating:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRating(undefined)}
                  className={`px-4 py-3 rounded-md font-medium transition ${
                    selectedRating === undefined
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({totalReviews})
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`px-4 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                      selectedRating === rating
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span>{rating}</span>
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">({distribution[rating]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading reviews..." />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700">{error}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <Award className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                  {selectedRating
                    ? `No ${selectedRating}-star reviews yet`
                    : 'No reviews yet'}
                </h3>
                <p className="text-gray-600">
                  Be the first to share your experience with our calibration services!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition"
                  >
                    {/* Rating */}
                    <div className="flex items-center justify-between mb-4">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 mb-4 leading-relaxed">"{review.comment}"</p>

                    {/* User Info */}
                    <div className="flex items-center pt-4 border-t border-gray-200">
                      <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold text-lg">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.userName}</p>
                        {review.company && (
                          <p className="text-sm text-gray-600">{review.company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!loading && reviews.length > 0 && (
        <section className="py-12 bg-blue-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Experience Excellence?
            </h2>
            <p className="text-xl text-blue-200 mb-6">
              Join our satisfied customers and book your calibration service today
            </p>
            <a
              href="/booking"
              className="inline-block bg-white text-blue-900 font-medium py-3 px-8 rounded-md hover:bg-gray-100 transition"
            >
              Book Now
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
