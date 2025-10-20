import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductRecommendations } from '../components/ProductRecommendations';
import { AccountHistory } from '../components/AccountHistory';

export function UserDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-gray-300">
            Welcome back, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Product Recommendations */}
        <ProductRecommendations limit={5} />

        {/* Account History Section - Now includes all user data in tabs */}
        <AccountHistory className="mb-8" />
      </div>
    </div>
  );
}
