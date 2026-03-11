import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Quote, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import reviewService, { Review } from '../services/reviewService';

interface TestimonialsSectionProps {
  maxReviews?: number;
}

export function TestimonialsSection({ maxReviews = 6 }: TestimonialsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getPublicReviews(undefined);
        // Get top-rated reviews (4+ stars), sorted by rating then date
        const topReviews = (data.data || [])
          .filter((r: Review) => r.rating >= 4)
          .sort((a: Review, b: Review) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, maxReviews);

        setReviews(topReviews);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.count || 0);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [maxReviews]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, reviews.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, reviews.length - 1)) % Math.max(1, reviews.length - 1));
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  // Don't render if no reviews
  if (!loading && reviews.length === 0) {
    return null;
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <Card key={i} className="border-2 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                  <div className="h-20 bg-gray-200 rounded mb-4" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: show 2 reviews at a time
  const visibleReviews = reviews.slice(currentIndex, currentIndex + 2);
  // If we're near the end, wrap around
  if (visibleReviews.length < 2 && reviews.length >= 2) {
    visibleReviews.push(...reviews.slice(0, 2 - visibleReviews.length));
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Don't just take our word for it - hear from our satisfied customers
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block" />
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalReviews}</span> verified reviews
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Buttons - Desktop */}
          {reviews.length > 2 && (
            <>
              <button
                onClick={prevSlide}
                className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition z-10"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition z-10"
                aria-label="Next reviews"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleReviews.map((review, index) => (
              <Card
                key={`${review._id}-${index}`}
                className="border-2 hover:shadow-xl hover:border-blue-600 transition-all duration-300 relative overflow-hidden group"
              >
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-blue-100 dark:text-blue-900 group-hover:text-blue-200 transition" />

                  {/* Rating */}
                  <div className="mb-4">
                    {renderStars(review.rating)}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed line-clamp-4 italic">
                    "{review.comment}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {review.userName}
                      </p>
                      {review.company && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {review.company}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dots Indicator */}
          {reviews.length > 2 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(reviews.length / 2) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i * 2)}
                  className={`h-2 rounded-full transition-all ${
                    Math.floor(currentIndex / 2) === i
                      ? 'w-6 bg-blue-600'
                      : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to reviews ${i * 2 + 1}-${i * 2 + 2}`}
                />
              ))}
            </div>
          )}

          {/* Mobile Navigation */}
          {reviews.length > 2 && (
            <div className="flex md:hidden justify-center gap-4 mt-6">
              <button
                onClick={prevSlide}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg" className="border-2">
            <Link to="/testimonials">
              View All Reviews
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
