import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Sparkles } from 'lucide-react';
import recommendationService, { Recommendation } from '../services/recommendationService';
import { getProductById, Product } from '../data/products';
import { useAuth } from '../contexts/AuthContext';

interface ProductRecommendationsProps {
  limit?: number;
  title?: string;
  subtitle?: string;
}

export function ProductRecommendations({
  limit = 5,
  title = 'Recommended for You',
  subtitle = 'Based on your interests and activity',
}: ProductRecommendationsProps) {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await recommendationService.getRecommendations(limit);
        setRecommendations(response.data);

        // Map recommendations to products
        const recommendedProducts = response.data
          .map((rec) => getProductById(rec.productId))
          .filter((p): p is Product => p !== undefined);

        setProducts(recommendedProducts);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated, limit]);

  if (!isAuthenticated) {
    return null; // Don't show recommendations for non-authenticated users
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Silently fail - don't show error to user
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
            {title}
          </h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        <Sparkles className="h-8 w-8 text-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {products.map((product, index) => {
          const recommendation = recommendations[index];
          return (
            <Link
              key={product.id}
              to={`/products#${product.id}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-400"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Match
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                {recommendation && recommendation.reasons.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-2 italic">
                      {recommendation.reasons[0]}
                    </p>
                  </div>
                )}

                <div className="mt-3 text-xs text-blue-600 font-medium group-hover:underline">
                  Learn more →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {products.length < limit && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {products.length} recommendation{products.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
