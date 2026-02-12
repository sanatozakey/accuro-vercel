import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Settings,
  AlertTriangle,
  Save,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { StockBadge } from '../../components/StockBadge';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

interface StockSettingsData {
  stockDisplayMode: 'labels_only' | 'exact_quantities';
  defaultLowStockThreshold: number;
}

interface LowStockProduct {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
  stockLabel: string;
}

export function StockSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StockSettingsData>({
    stockDisplayMode: 'labels_only',
    defaultLowStockThreshold: 10,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
    fetchSettings();
    fetchLowStockProducts();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/settings/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock settings:', error);
      toast.error('Failed to load stock settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      setLoadingLowStock(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setLowStockProducts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
    } finally {
      setLoadingLowStock(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/settings/stock`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Stock settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save stock settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/products')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Inventory Settings
          </h1>
          <p className="text-blue-200 mt-2">Configure stock display and thresholds</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Display Settings
            </h2>

            <div className="space-y-6">
              {/* Stock Display Mode */}
              <div>
                <Label htmlFor="displayMode">Stock Display Mode</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Choose how stock levels are shown to customers
                </p>
                <Select
                  value={settings.stockDisplayMode}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      stockDisplayMode: value as 'labels_only' | 'exact_quantities',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labels_only">
                      Labels Only (In Stock, Low Stock, Out of Stock)
                    </SelectItem>
                    <SelectItem value="exact_quantities">
                      Exact Quantities (5 available, Only 2 left)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Preview */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Preview:</p>
                  <div className="flex flex-wrap gap-3">
                    <StockBadge
                      status="in_stock"
                      label={settings.stockDisplayMode === 'exact_quantities' ? '25 available' : undefined}
                    />
                    <StockBadge
                      status="low_stock"
                      label={settings.stockDisplayMode === 'exact_quantities' ? 'Only 3 left' : undefined}
                    />
                    <StockBadge status="out_of_stock" />
                  </div>
                </div>
              </div>

              {/* Default Low Stock Threshold */}
              <div>
                <Label htmlFor="threshold">Default Low Stock Threshold</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Products with stock at or below this number will be marked as "Low Stock"
                </p>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={settings.defaultLowStockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultLowStockThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Low Stock Alert Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockProducts.length}
                </Badge>
              )}
            </h2>

            {loadingLowStock ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No products with low stock</p>
                <p className="text-sm">All tracked products have sufficient inventory</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.stockQuantity} / {product.lowStockThreshold}
                        </p>
                        <p className="text-xs text-gray-500">Stock / Threshold</p>
                      </div>
                      <StockBadge
                        status={product.stockStatus}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={fetchLowStockProducts}
              className="w-full mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockSettings;
