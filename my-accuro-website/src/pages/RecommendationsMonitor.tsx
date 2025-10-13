import React, { useEffect, useState } from 'react';
import {
  Activity,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  ShoppingCart,
  MessageSquare,
  Package,
  RefreshCw,
  BarChart3,
  Star,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import recommendationAdminService, {
  UserInteraction,
  RecommendationStats,
} from '../services/recommendationAdminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function RecommendationsMonitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsResponse, interactionsResponse] = await Promise.all([
        recommendationAdminService.getStats(),
        recommendationAdminService.getAllInteractions(),
      ]);

      setStats(statsResponse.data);
      setInteractions(interactionsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recommendation data');
      console.error('Error loading recommendations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'booking':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'inquiry':
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInteractionBadgeColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'booking':
        return 'bg-green-100 text-green-800';
      case 'inquiry':
        return 'bg-yellow-100 text-yellow-800';
      case 'purchase':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recommendation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for charts
  const interactionTypeData = stats.interactionsByType.map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
  }));

  const categoryData = stats.interactionsByCategory.slice(0, 6).map((item) => ({
    name: item._id,
    interactions: item.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Collaborative Filtering Monitor
              </h1>
              <p className="text-gray-300">
                Real-time monitoring of recommendation system performance
              </p>
            </div>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Interactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalInteractions}</p>
              </div>
              <Activity className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.topProducts.length}</p>
              </div>
              <Star className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Categories</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.interactionsByCategory.length}
                </p>
              </div>
              <Package className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Interaction Types Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Interactions by Type</h3>
            {interactionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {interactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No interaction data yet</p>
            )}
          </div>

          {/* Category Interactions Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Interactions by Category
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interactions" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No category data yet</p>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Top Products by Engagement
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Weight
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topProducts.length > 0 ? (
                  stats.topProducts.map((product, index) => (
                    <tr key={product.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{product.productName}</div>
                        <div className="text-sm text-gray-500">{product.productId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {product.interactionCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {product.totalWeight}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No product data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Interactions */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Recent Interactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interactions.length > 0 ? (
                  interactions.slice(0, 20).map((interaction) => (
                    <tr key={interaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {interaction.userId?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {interaction.userId?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getInteractionBadgeColor(
                            interaction.interactionType
                          )}`}
                        >
                          {getInteractionIcon(interaction.interactionType)}
                          {interaction.interactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {interaction.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {interaction.productCategory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {interaction.weight}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(interaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No interactions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
