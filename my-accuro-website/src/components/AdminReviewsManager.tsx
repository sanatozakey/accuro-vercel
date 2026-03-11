import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Search,
  RefreshCw,
  Award,
  TrendingUp,
  Clock,
  Users,
  Filter,
  Eye,
  MoreVertical,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import reviewService, { Review } from '../services/reviewService';
import toast from 'react-hot-toast';

interface AdminReviewsManagerProps {
  darkMode: boolean;
}

interface ReviewStats {
  total: number;
  approved: number;
  pending: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export function AdminReviewsManager({ darkMode }: AdminReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    approved: 0,
    pending: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Bulk selection
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Expanded review
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getAllReviews(undefined, undefined);
      const reviewsData = data.data || [];
      setReviews(reviewsData);

      // Calculate stats
      const approved = reviewsData.filter((r: Review) => r.isApproved).length;
      const pending = reviewsData.filter((r: Review) => !r.isApproved).length;
      const ratingDistribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;

      reviewsData.forEach((r: Review) => {
        if (r.rating >= 1 && r.rating <= 5) {
          ratingDistribution[r.rating]++;
          totalRating += r.rating;
        }
      });

      setStats({
        total: reviewsData.length,
        approved,
        pending,
        averageRating: reviewsData.length > 0 ? totalRating / reviewsData.length : 0,
        ratingDistribution,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Apply filters
  useEffect(() => {
    let filtered = [...reviews];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.userName.toLowerCase().includes(term) ||
          r.comment.toLowerCase().includes(term) ||
          (r.company && r.company.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter === 'approved') {
      filtered = filtered.filter((r) => r.isApproved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((r) => !r.isApproved);
    }

    // Rating filter
    if (ratingFilter !== null) {
      filtered = filtered.filter((r) => r.rating === ratingFilter);
    }

    // Sort
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

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, statusFilter, ratingFilter, sortBy]);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await reviewService.approveReview(id, approve);
      toast.success(approve ? 'Review approved' : 'Review unapproved');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}'s review? This cannot be undone.`)) {
      return;
    }

    try {
      await reviewService.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
      setSelectedReviews((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleBulkApprove = async (approve: boolean) => {
    if (selectedReviews.size === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedReviews).map((id) =>
        reviewService.approveReview(id, approve)
      );
      await Promise.all(promises);
      toast.success(`${selectedReviews.size} reviews ${approve ? 'approved' : 'unapproved'}`);
      setSelectedReviews(new Set());
      fetchReviews();
    } catch (err: any) {
      toast.error('Some reviews failed to update');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedReviews.size} reviews? This cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedReviews).map((id) =>
        reviewService.deleteReview(id)
      );
      await Promise.all(promises);
      toast.success(`${selectedReviews.size} reviews deleted`);
      setSelectedReviews(new Set());
      fetchReviews();
    } catch (err: any) {
      toast.error('Some reviews failed to delete');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map((r) => r._id)));
    }
  };

  const toggleSelectReview = (id: string) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : darkMode
              ? 'text-gray-600'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300';
  const cardBgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  if (loading) {
    return (
      <div className={`${bgClass} rounded-lg shadow-md p-8`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className={textClass}>Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${bgClass} border ${borderClass}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Total Reviews</p>
                <p className={`text-2xl font-bold ${textClass}`}>{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} border ${borderClass}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Pending</p>
                <p className={`text-2xl font-bold text-yellow-600`}>{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} border ${borderClass}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Approved</p>
                <p className={`text-2xl font-bold text-green-600`}>{stats.approved}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${bgClass} border ${borderClass}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedClass}`}>Avg Rating</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${textClass}`}>{stats.averageRating.toFixed(1)}</p>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className={`${bgClass} border ${borderClass}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${textClass}`}>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className={`text-sm ${mutedClass}`}>{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                </div>
                <div className={`flex-1 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`text-sm w-12 text-right ${mutedClass}`}>{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className={`${bgClass} border ${borderClass}`}>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${mutedClass}`} />
              <input
                type="text"
                placeholder="Search by name, company, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md ${inputBgClass} focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-2 border rounded-md ${inputBgClass}`}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter || ''}
              onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
              className={`px-3 py-2 border rounded-md ${inputBgClass}`}
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 border rounded-md ${inputBgClass}`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>

            {/* Refresh */}
            <Button variant="outline" onClick={fetchReviews} className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
          <span className={`text-sm font-medium ${textClass}`}>
            {selectedReviews.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkApprove(true)}
            disabled={bulkActionLoading}
            className="bg-green-600 text-white hover:bg-green-700 border-0"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkApprove(false)}
            disabled={bulkActionLoading}
            className="bg-yellow-600 text-white hover:bg-yellow-700 border-0"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Unapprove All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDelete}
            disabled={bulkActionLoading}
            className="bg-red-600 text-white hover:bg-red-700 border-0"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete All
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <Card className={`${bgClass} border ${borderClass}`}>
        <CardContent className="p-0">
          {/* Header Row */}
          <div className={`flex items-center gap-4 p-4 border-b ${borderClass} ${cardBgClass}`}>
            <input
              type="checkbox"
              checked={selectedReviews.size === filteredReviews.length && filteredReviews.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className={`text-sm font-medium ${mutedClass}`}>
              {filteredReviews.length} reviews
            </span>
          </div>

          {/* Reviews */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <Award className={`h-16 w-16 mx-auto mb-4 ${mutedClass}`} />
                <p className={mutedClass}>No reviews found matching your criteria</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review._id}
                  className={`p-4 hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition ${
                    selectedReviews.has(review._id) ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedReviews.has(review._id)}
                      onChange={() => toggleSelectReview(review._id)}
                      className="h-4 w-4 rounded border-gray-300 mt-1"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className={`text-sm font-medium ${textClass}`}>{review.userName}</span>
                        {review.company && (
                          <span className={`text-sm ${mutedClass}`}>({review.company})</span>
                        )}
                        <span className={`text-xs ${mutedClass}`}>
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {review.isApproved ? (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {review.isPublic ? 'Public' : 'Private'}
                        </span>
                        {review.reviewType === 'booking' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded border">
                            Booking Review
                          </span>
                        )}
                      </div>

                      {/* Comment */}
                      <p className={`text-sm ${textClass} ${expandedReview === review._id ? '' : 'line-clamp-2'}`}>
                        "{review.comment}"
                      </p>
                      {review.comment.length > 150 && (
                        <button
                          onClick={() => setExpandedReview(expandedReview === review._id ? null : review._id)}
                          className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                        >
                          {expandedReview === review._id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!review.isApproved ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review._id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Approve</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(review._id, false)}
                          className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Unapprove</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(review._id, review.userName)}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminReviewsManager;
