import React, { useState, useEffect, useCallback } from 'react';
import { Star, Filter, TrendingUp, Users, Award, Send, X, ArrowUpDown } from 'lucide-react';
import reviewService, { Review } from '../services/reviewService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

export function Testimonials() {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

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
      const data = await reviewService.getPublicReviews(undefined);
      const reviewsData = data.data || [];
      setAllReviews(reviewsData);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.count || 0);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allReviews];

    // Filter by selected ratings
    if (selectedRatings.length > 0) {
      filtered = filtered.filter((review) => selectedRatings.includes(review.rating));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    setReviews(filtered);
  }, [allReviews, selectedRatings, sortBy]);

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
    allReviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="w-full bg-background min-h-screen">
      {/* Header */}
      <section className="bg-navy-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">Customer Testimonials</h1>
            <p className="text-lg sm:text-xl text-gray-200">
              See what our satisfied clients have to say about our calibration services
            </p>
          </div>
        </div>
      </section>

      {/* Write Review Section */}
      {isAuthenticated && (
        <section className="py-8 sm:py-12 bg-gradient-to-b from-gray-50 to-white border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              {submitSuccess && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <Award className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <p className="text-green-800 font-medium">
                      Thank you for your testimonial!
                    </p>
                    <p className="text-green-700 text-sm">
                      It will be visible after admin approval.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-base sm:text-lg"
                >
                  <Award className="h-5 w-5" />
                  Write a Review
                </Button>
              ) : (
                <Card className="border-2 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl md:text-3xl">Share Your Experience</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowForm(false);
                          setSubmitError('');
                        }}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      {/* Rating Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Your Rating *
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingClick(star)}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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
                        <label className="block text-sm font-medium mb-2">
                          Your Review *
                        </label>
                        <Textarea
                          value={formData.comment}
                          onChange={(e) =>
                            setFormData({ ...formData, comment: e.target.value })
                          }
                          rows={5}
                          placeholder="Tell us about your experience with Accuro..."
                          required
                          maxLength={1000}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.comment.length}/1000 characters
                        </p>
                      </div>

                      {/* Error Message */}
                      {submitError && (
                        <Alert variant="destructive">
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={submitting}
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700"
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
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!isAuthenticated && (
        <section className="py-8 sm:py-12 bg-gradient-to-b from-gray-50 to-white border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mb-2">
                    Share Your Experience
                  </CardTitle>
                  <CardDescription className="text-base">
                    Please log in to write a review and share your experience with Accuro.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link to="/login?redirect=/testimonials">
                      Log In to Write a Review
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Statistics Section */}
      <section className="py-8 sm:py-12 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Average Rating */}
              <Card className="border-2 text-center hover:shadow-xl transition-all duration-300 hover:border-blue-600">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-blue-900 mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">{renderStars(Math.round(averageRating), 'lg')}</div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base font-medium">Average Rating</CardDescription>
                </CardContent>
              </Card>

              {/* Total Reviews */}
              <Card className="border-2 text-center hover:shadow-xl transition-all duration-300 hover:border-green-600">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-4xl font-bold text-green-900 mb-2">{totalReviews}</div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base font-medium">Total Reviews</CardDescription>
                </CardContent>
              </Card>

              {/* 5-Star Reviews */}
              <Card className="border-2 text-center hover:shadow-xl transition-all duration-300 hover:border-yellow-600">
                <CardHeader>
                  <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                    <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
                  </div>
                  <div className="text-4xl font-bold text-yellow-900 mb-2">
                    {distribution[5]}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base font-medium">5-Star Reviews</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Rating Distribution */}
      <section className="py-6 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = distribution[rating];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <button
                      key={rating}
                      onClick={() => {
                        if (selectedRatings.includes(rating)) {
                          setSelectedRatings(selectedRatings.filter(r => r !== rating));
                        } else {
                          setSelectedRatings([...selectedRatings, rating]);
                        }
                      }}
                      className={`flex items-center gap-3 w-full p-2 rounded-lg transition hover:bg-gray-100 ${
                        selectedRatings.includes(rating) ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full bg-yellow-400 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filter & Sort Section */}
      <section className="py-6 bg-gray-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4">
                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedRatings.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRatings([])}
                      className={selectedRatings.length === 0 ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      All ({totalReviews})
                    </Button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        variant={selectedRatings.includes(rating) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedRatings.includes(rating)) {
                            setSelectedRatings(selectedRatings.filter(r => r !== rating));
                          } else {
                            setSelectedRatings([...selectedRatings, rating]);
                          }
                        }}
                        className={selectedRatings.includes(rating) ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <span>{rating}</span>
                        <Star className="h-3 w-3 fill-current" />
                      </Button>
                    ))}
                  </div>

                  <Separator orientation="vertical" className="hidden lg:block h-6" />

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Sort:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortBy === 'newest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('newest')}
                      className={sortBy === 'newest' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Newest
                    </Button>
                    <Button
                      variant={sortBy === 'oldest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('oldest')}
                      className={sortBy === 'oldest' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Oldest
                    </Button>
                    <Button
                      variant={sortBy === 'highest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('highest')}
                      className={sortBy === 'highest' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Highest Rated
                    </Button>
                    <Button
                      variant={sortBy === 'lowest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('lowest')}
                      className={sortBy === 'lowest' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Lowest Rated
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading reviews..." />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription className="text-center">{error}</AlertDescription>
              </Alert>
            ) : reviews.length === 0 ? (
              <Card className="border-2 border-blue-200">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Award className="h-12 w-12 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mb-2">
                    {selectedRatings.length > 0
                      ? `No reviews matching selected ratings`
                      : 'No reviews yet'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {selectedRatings.length > 0
                      ? 'Try selecting different star ratings to see more reviews.'
                      : 'Be the first to share your experience with our calibration services!'}
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <Card
                    key={review._id}
                    className="border-2 hover:shadow-xl hover:border-blue-600 transition-all duration-300"
                  >
                    <CardHeader>
                      {/* Rating */}
                      <div className="flex items-center justify-between mb-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Comment */}
                      <p className="text-gray-700 mb-4 leading-relaxed italic">"{review.comment}"</p>

                      <Separator className="mb-4" />

                      {/* User Info */}
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                            {review.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          {review.company && (
                            <p className="text-sm text-muted-foreground">{review.company}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!loading && reviews.length > 0 && (
        <section className="py-12 sm:py-16 bg-navy-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Ready to Experience Excellence?
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
              Join our satisfied customers and book your calibration service today
            </p>
            <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
              <Link to="/booking">
                Book Now
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
