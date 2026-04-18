import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Upload,
  AlertCircle,
  Download,
  ArrowUpDown,
  Eye,
  CheckSquare2,
  Square,
  Archive,
  Zap,
  FileText,
  MoreVertical,
  Minus,
  PackagePlus,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService, { Product, CreateProductData } from '../services/productService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const CATEGORIES = [
  'Calibration Software',
  'Field Calibrators',
  'Workshop Calibrators',
  'Temperature Calibration',
  'Pressure Generation',
  'Accessories',
];

const STATUSES = ['active', 'inactive', 'archived'] as const;

// Exchange rate: 1 USD = 56 PHP (approximate, can be updated)
const PHP_TO_USD_RATE = 0.018; // 1 PHP = 0.018 USD
const USD_TO_PHP_RATE = 56; // 1 USD = 56 PHP

type StatusTab = 'all' | 'active' | 'inactive' | 'archived';

interface ProductManagementProps {
  isInline?: boolean;
  darkMode?: boolean;
}

export function ProductManagement({ isInline = false, darkMode = false }: ProductManagementProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Dialog states
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [stockEditProduct, setStockEditProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);

  // Bulk restock dialog
  const [showBulkRestockDialog, setShowBulkRestockDialog] = useState(false);
  const [bulkRestockRows, setBulkRestockRows] = useState<Array<{
    productId: string;
    name: string;
    currentStock: number;
    delta: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  }>>([]);
  const [bulkRestockSaving, setBulkRestockSaving] = useState(false);
  const [enablingTracking, setEnablingTracking] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    category: '',
    image: '',
    beamexUrl: '',
    features: [],
    priceRange: '',
    priceRangeUSD: '',
    estimatedPrice: undefined,
    estimatedPriceUSD: undefined,
    status: 'active',
    stockQuantity: 0,
    lowStockThreshold: 10,
    trackInventory: true,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, activeTab, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productService.getProducts({ status: '' });
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    // Filter by tab/status
    if (activeTab !== 'all') {
      filtered = filtered.filter((product) => product.status === activeTab);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stock':
          comparison = (a.stockQuantity || 0) - (b.stockQuantity || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, activeTab, sortBy, sortOrder]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      image: '',
      beamexUrl: '',
      features: [],
      priceRange: '',
      priceRangeUSD: '',
      estimatedPrice: undefined,
      estimatedPriceUSD: undefined,
      status: 'active',
      stockQuantity: 0,
      lowStockThreshold: 10,
      trackInventory: true,
    });
    setFeatureInput('');
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setCustomCategory('');
    setIsAddingNewCategory(false);
    setSubmitting(false);
  };

  const openAddDialog = () => {
    resetForm();
    setEditingProduct(null);
    setShowAddEditDialog(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image || '',
      beamexUrl: product.beamexUrl || '',
      features: product.features || [],
      priceRange: product.priceRange || '',
      priceRangeUSD: product.priceRangeUSD || '',
      estimatedPrice: product.estimatedPrice,
      estimatedPriceUSD: product.estimatedPriceUSD,
      status: product.status,
      stockQuantity: product.stockQuantity || 0,
      lowStockThreshold: product.lowStockThreshold || 10,
      trackInventory: product.trackInventory ?? true,
    });
    setImagePreview(product.image || '');
    setShowAddEditDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  const openViewDialog = (product: Product) => {
    setViewingProduct(product);
    setShowViewDialog(true);
  };

  const openStockDialog = (product: Product) => {
    setStockEditProduct(product);
    setNewStockValue(product.stockQuantity || 0);
    setShowStockDialog(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (isAddingNewCategory) {
      if (!customCategory.trim()) {
        errors.category = 'Custom category name is required';
      }
    } else {
      if (!formData.category) {
        errors.category = 'Category is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processImageFile = (file: File) => {
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({ ...formErrors, image: 'Image size must be less than 2MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormErrors({ ...formErrors, image: 'Please select a valid image file' });
      return;
    }

    setImageFile(file);
    setFormErrors({ ...formErrors, image: '' });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const convertPHPToUSD = (php: number): number => {
    return Math.round(php * PHP_TO_USD_RATE * 100) / 100;
  };

  const convertUSDToPHP = (usd: number): number => {
    return Math.round(usd * USD_TO_PHP_RATE);
  };

  const handleEstimatedPriceChange = (value: string) => {
    const numValue = value ? Number(value) : undefined;
    setFormData({
      ...formData,
      estimatedPrice: numValue,
      estimatedPriceUSD: numValue ? convertPHPToUSD(numValue) : undefined,
    });
  };

  const handleEstimatedPriceUSDChange = (value: string) => {
    const numValue = value ? Number(value) : undefined;
    setFormData({
      ...formData,
      estimatedPriceUSD: numValue,
      estimatedPrice: numValue ? convertUSDToPHP(numValue) : undefined,
    });
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile) return formData.image;

    try {
      setUploadingImage(true);

      const uploadPromise = productService.uploadImage(imageFile);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), 15000)
      );

      const response: any = await Promise.race([uploadPromise, timeoutPromise]);
      return response.data.url;
    } catch (err: any) {
      console.error('Image upload error:', err);
      // If upload fails, use base64 preview as fallback
      if (imagePreview && imagePreview.startsWith('data:')) {
        return imagePreview;
      }
      setFormErrors({
        ...formErrors,
        image: err.message === 'Upload timeout'
          ? 'Image upload timed out. Product will be created without image.'
          : err.response?.data?.message || 'Image upload failed. Product will be created without image.',
      });
      return '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Upload image if a new one was selected
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Use custom category if adding new one
      const finalCategory = isAddingNewCategory && customCategory
        ? customCategory
        : formData.category;

      const productData = {
        ...formData,
        category: finalCategory,
        image: imageUrl || '',
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, productData);
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct(productData);
        toast.success('Product created successfully!');
      }

      setShowAddEditDialog(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save product';
      const validationErrors = err.response?.data?.errors;

      if (validationErrors && Array.isArray(validationErrors)) {
        const detailedErrors = validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errorMessage}: ${detailedErrors}`);
      } else {
        toast.error(errorMessage);
      }

      console.error('Error saving product:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      setLoading(true);
      setError('');
      await productService.deleteProduct(deletingProduct._id);
      toast.success('Product deleted successfully!');
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
      console.error('Error deleting product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockEditProduct) return;

    try {
      await productService.updateStock(stockEditProduct._id, newStockValue);
      toast.success('Stock updated successfully!');
      setShowStockDialog(false);
      setStockEditProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const openBulkRestockDialog = () => {
    if (selectedProducts.size === 0) {
      toast.error('Select at least one product to restock');
      return;
    }
    const rows = filteredProducts
      .filter((p) => selectedProducts.has(p._id))
      .map((p) => ({
        productId: p._id,
        name: p.name,
        currentStock: p.stockQuantity || 0,
        delta: 0,
        lowStockThreshold: p.lowStockThreshold ?? 10,
        trackInventory: p.trackInventory ?? true,
      }));
    setBulkRestockRows(rows);
    setShowBulkRestockDialog(true);
  };

  const handleBulkRestockSubmit = async () => {
    const updates = bulkRestockRows
      .map((r) => {
        const hasStockChange = r.delta !== 0;
        return {
          productId: r.productId,
          ...(hasStockChange ? { stockQuantity: Math.max(0, r.currentStock + r.delta) } : {}),
          lowStockThreshold: r.lowStockThreshold,
          trackInventory: r.trackInventory,
        };
      });

    try {
      setBulkRestockSaving(true);
      const res = await productService.bulkUpdateStock(updates);
      const { successful, failed } = res.data;
      const unitsAdded = bulkRestockRows.reduce((sum, r) => sum + Math.max(0, r.delta), 0);
      if (failed === 0) {
        toast.success(`Restocked ${successful} product${successful !== 1 ? 's' : ''}${unitsAdded > 0 ? ` — +${unitsAdded} units` : ''}`);
      } else {
        toast.error(`${successful} updated, ${failed} failed`);
      }
      setShowBulkRestockDialog(false);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk restock failed');
    } finally {
      setBulkRestockSaving(false);
    }
  };

  const handleEnableAllTracking = async () => {
    if (!window.confirm('Enable inventory tracking on every product? This is a one-time migration for products created before tracking was enabled by default.')) {
      return;
    }
    try {
      setEnablingTracking(true);
      const res = await productService.enableAllInventoryTracking();
      if (res.modifiedCount === 0) {
        toast.success('All products already have tracking enabled');
      } else {
        toast.success(`Enabled tracking on ${res.modifiedCount} product${res.modifiedCount !== 1 ? 's' : ''}`);
      }
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable tracking');
    } finally {
      setEnablingTracking(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index),
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const exportToCSV = () => {
    const productsToExport = selectedProducts.size > 0
      ? filteredProducts.filter((p) => selectedProducts.has(p._id))
      : filteredProducts;

    const headers = ['Name', 'Category', 'Status', 'Stock', 'Price Range PHP', 'Price Range USD', 'Description'];
    const rows = productsToExport.map((p) => [
      p.name,
      p.category,
      p.status,
      p.stockQuantity || 0,
      p.priceRange || '',
      p.priceRangeUSD || '',
      p.description.replace(/,/g, ';'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${productsToExport.length} products to CSV`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            Archived
          </span>
        );
      default:
        return <span className="text-xs font-medium px-2 py-0.5 rounded border">{status}</span>;
    }
  };

  const getStockDisplay = (product: Product) => {
    const stock = product.stockQuantity || 0;
    const threshold = product.lowStockThreshold || 10;
    const isLowStock = stock <= threshold;
    const isOutOfStock = stock === 0;

    if (isOutOfStock) {
      return <span className="text-red-600 font-medium">0 in stock</span>;
    }
    if (isLowStock) {
      return <span className="text-yellow-600 font-medium">{stock} in stock</span>;
    }
    return <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{stock} in stock</span>;
  };

  const getTabCount = (tab: StatusTab) => {
    if (tab === 'all') return products.length;
    return products.filter((p) => p.status === tab).length;
  };

  if (loading && products.length === 0) {
    return (
      <div className={`${isInline ? '' : 'min-h-screen'} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center ${isInline ? 'py-12' : ''}`}>
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isInline ? '' : 'min-h-screen bg-gray-50'}>
      <div className={isInline ? '' : 'container mx-auto px-4 py-8'}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 rounded-t-lg`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Products</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnableAllTracking}
                disabled={enablingTracking}
                title="One-time migration — turns on inventory tracking for products created before it was the default"
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {enablingTracking ? 'Enabling…' : 'Enable tracking on all'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={openAddDialog}
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add product
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mx-6 mt-4 ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 flex items-center gap-3`}>
            <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
            <p className={darkMode ? 'text-red-300' : 'text-red-800'}>{error}</p>
            <button
              onClick={() => setError('')}
              className={`ml-auto ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-b-lg shadow-md`}>
          {/* My Products Title */}
          <div className={`px-6 pt-6 pb-2`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My products</h2>
          </div>

          {/* Tabs and Search */}
          <div className={`px-6 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Status Tabs */}
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { key: 'all', label: 'All', icon: Package },
                  { key: 'active', label: 'Active', icon: Zap },
                  { key: 'inactive', label: 'Draft', icon: FileText },
                  { key: 'archived', label: 'Archived', icon: Archive },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as StatusTab)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                      activeTab === key
                        ? darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === key
                        ? darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getTabCount(key as StatusTab)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search and Sort */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 lg:w-64">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 h-9 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}`}
                  />
                </div>
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [newSortBy, newSortOrder] = value.split('-') as ['name' | 'stock' | 'date', 'asc' | 'desc'];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                >
                  <SelectTrigger className={`w-32 h-9 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <span className="text-sm">Sort</span>
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="stock-asc">Stock Low-High</SelectItem>
                    <SelectItem value="stock-desc">Stock High-Low</SelectItem>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProducts}
                  className={`h-9 ${darkMode ? 'border-gray-600 text-gray-300' : ''}`}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedProducts.size > 0 && (
            <div className={`px-6 py-3 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border-b flex items-center justify-between`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={openBulkRestockDialog}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PackagePlus className="h-4 w-4 mr-1" />
                  Bulk Restock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className={`w-full ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead>
                <tr className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                    >
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      ) : (
                        <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Product
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Inventory
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Category
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Price
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-24`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} ${
                        selectedProducts.has(product._id) ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectProduct(product._id)}
                          className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                        >
                          {selectedProducts.has(product._id) ? (
                            <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          ) : (
                            <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <Package className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <button
                              onClick={() => openViewDialog(product)}
                              className={`font-medium truncate max-w-[200px] block text-left hover:underline ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
                            >
                              {product.name}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openStockDialog(product)}
                          className={`text-sm hover:underline cursor-pointer ${
                            product.stockQuantity === 0 ? 'text-red-600' :
                            (product.stockQuantity || 0) <= (product.lowStockThreshold || 10) ? 'text-yellow-600' :
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                          title="Click to edit stock"
                        >
                          {getStockDisplay(product)}
                        </button>
                      </td>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {product.category}
                      </td>
                      <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {product.priceRange || product.estimatedPrice ? (
                          <span>
                            {product.estimatedPrice ? `₱${product.estimatedPrice.toLocaleString()}` : product.priceRange}
                          </span>
                        ) : (
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openViewDialog(product)}
                            className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditDialog(product)}
                            className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(product)}
                            className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={`px-6 py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Package className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className="text-lg font-medium mb-1">No products found</p>
                      <p className="text-sm">
                        {searchQuery ? 'Try adjusting your search or filters' : 'Add your first product to get started'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              {editingProduct
                ? 'Update the product information below'
                : 'Fill in the product details below'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Basic Information</h3>

                {/* Product Name */}
                <div>
                  <Label htmlFor="name" className={darkMode ? 'text-gray-200' : ''}>
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className={`mt-1 ${formErrors.name ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className={darkMode ? 'text-gray-200' : ''}>
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description (minimum 10 characters)"
                    rows={3}
                    className={`mt-1 ${formErrors.description ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                  )}
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className={darkMode ? 'text-gray-200' : ''}>
                      Category <span className="text-red-500">*</span>
                    </Label>
                    {isAddingNewCategory ? (
                      <div className="space-y-2 mt-1">
                        <Input
                          id="customCategory"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Enter new category name"
                          className={`${formErrors.category ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingNewCategory(false);
                            setCustomCategory('');
                          }}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={formData.category}
                        onValueChange={(value) => {
                          if (value === '__add_new__') {
                            setIsAddingNewCategory(true);
                            setFormData({ ...formData, category: '' });
                          } else {
                            setFormData({ ...formData, category: value });
                          }
                        }}
                      >
                        <SelectTrigger className={`mt-1 ${formErrors.category ? 'border-red-500' : ''} ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="__add_new__" className="text-blue-600 font-medium">
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Category
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {formErrors.category && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="status" className={darkMode ? 'text-gray-200' : ''}>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: value as 'active' | 'inactive' | 'archived',
                        })
                      }
                    >
                      <SelectTrigger className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Product Image</h3>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isDragging ? 'Drop image here' : 'Drag and drop an image here, or click to browse'}
                  </p>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image')?.click()}
                    className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    Choose File
                  </Button>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Max file size: 2MB</p>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData({ ...formData, image: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {formErrors.image && (
                  <p className="text-sm text-red-500">{formErrors.image}</p>
                )}
              </div>

              {/* Inventory Section */}
              <div className="space-y-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Inventory</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stockQuantity" className={darkMode ? 'text-gray-200' : ''}>Stock Quantity</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={formData.stockQuantity || 0}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockThreshold" className={darkMode ? 'text-gray-200' : ''}>Low Stock Alert</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold || 10}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Pricing</h3>

                {/* Beamex URL */}
                <div>
                  <Label htmlFor="beamexUrl" className={darkMode ? 'text-gray-200' : ''}>Beamex Product URL</Label>
                  <Input
                    id="beamexUrl"
                    value={formData.beamexUrl}
                    onChange={(e) => setFormData({ ...formData, beamexUrl: e.target.value })}
                    placeholder="https://www.beamex.com/..."
                    className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>

                {/* Price Ranges */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceRange" className={darkMode ? 'text-gray-200' : ''}>Price Range (PHP)</Label>
                    <Input
                      id="priceRange"
                      value={formData.priceRange}
                      onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                      placeholder="₱50,000 - ₱100,000"
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priceRangeUSD" className={darkMode ? 'text-gray-200' : ''}>Price Range (USD)</Label>
                    <Input
                      id="priceRangeUSD"
                      value={formData.priceRangeUSD}
                      onChange={(e) =>
                        setFormData({ ...formData, priceRangeUSD: e.target.value })
                      }
                      placeholder="$1,000 - $2,000"
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                </div>

                {/* Estimated Prices with Auto-Conversion */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedPrice" className={darkMode ? 'text-gray-200' : ''}>Estimated Price (PHP)</Label>
                    <Input
                      id="estimatedPrice"
                      type="number"
                      value={formData.estimatedPrice || ''}
                      onChange={(e) => handleEstimatedPriceChange(e.target.value)}
                      placeholder="75000"
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Auto-converts to USD</p>
                  </div>

                  <div>
                    <Label htmlFor="estimatedPriceUSD" className={darkMode ? 'text-gray-200' : ''}>Estimated Price (USD)</Label>
                    <Input
                      id="estimatedPriceUSD"
                      type="number"
                      value={formData.estimatedPriceUSD || ''}
                      onChange={(e) => handleEstimatedPriceUSDChange(e.target.value)}
                      placeholder="1500"
                      className={`mt-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Auto-converts to PHP</p>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-4">
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Features</h3>

                <div className="flex gap-2">
                  <Input
                    id="features"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Enter a feature"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <Button type="button" onClick={addFeature} variant="outline" className={darkMode ? 'border-gray-600' : ''}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.features && formData.features.length > 0 && (
                  <div className="space-y-1">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3 py-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : ''}`}>{feature}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddEditDialog(false);
                  resetForm();
                }}
                disabled={submitting}
                className={darkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || uploadingImage}>
                {submitting || uploadingImage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingImage ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>{editingProduct ? 'Update Product' : 'Create Product'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Edit Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className={`max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Update Stock</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              {stockEditProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className={darkMode ? 'text-gray-200' : ''}>Stock Quantity</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewStockValue(Math.max(0, newStockValue - 1))}
                className={darkMode ? 'border-gray-600' : ''}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="0"
                value={newStockValue}
                onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                className={`w-24 text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewStockValue(newStockValue + 1)}
                className={darkMode ? 'border-gray-600' : ''}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStockDialog(false);
                setStockEditProduct(null);
              }}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              Cancel
            </Button>
            <Button onClick={handleStockUpdate}>
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Restock Dialog */}
      <Dialog open={showBulkRestockDialog} onOpenChange={setShowBulkRestockDialog}>
        <DialogContent className={`max-w-3xl ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Bulk Restock</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              Enter the quantity received for each product. Leave at 0 to skip stock changes but still apply threshold/tracking updates.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
            <div className={`grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-900/50' : 'text-gray-500 bg-gray-50'} rounded`}>
              <div className="col-span-4">Product</div>
              <div className="col-span-2 text-center">Current</div>
              <div className="col-span-2 text-center">+ Add</div>
              <div className="col-span-2 text-center">Low-stock</div>
              <div className="col-span-2 text-center">Track</div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {bulkRestockRows.map((row, idx) => {
                const projected = Math.max(0, row.currentStock + row.delta);
                return (
                  <div key={row.productId} className="grid grid-cols-12 gap-3 items-center px-3 py-3">
                    <div className={`col-span-4 text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'} truncate`} title={row.name}>
                      {row.name}
                    </div>
                    <div className={`col-span-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {row.currentStock}
                      <span className="ml-1 text-xs opacity-60">→ {projected}</span>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        value={row.delta}
                        onChange={(e) => {
                          const v = Math.max(0, parseInt(e.target.value) || 0);
                          setBulkRestockRows((prev) => prev.map((r, i) => i === idx ? { ...r, delta: v } : r));
                        }}
                        className={`text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        value={row.lowStockThreshold}
                        onChange={(e) => {
                          const v = Math.max(0, parseInt(e.target.value) || 0);
                          setBulkRestockRows((prev) => prev.map((r, i) => i === idx ? { ...r, lowStockThreshold: v } : r));
                        }}
                        className={`text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setBulkRestockRows((prev) => prev.map((r, i) => i === idx ? { ...r, trackInventory: !r.trackInventory } : r))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${row.trackInventory ? 'bg-blue-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                        title={row.trackInventory ? 'Inventory tracked — deducts on approval' : 'Tracking off — deductions will skip this item'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${row.trackInventory ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${darkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-blue-50 text-blue-900'}`}>
            <span>
              {bulkRestockRows.length} product{bulkRestockRows.length !== 1 ? 's' : ''} selected
            </span>
            <span>
              +{bulkRestockRows.reduce((s, r) => s + Math.max(0, r.delta), 0)} units to add
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkRestockDialog(false)}
              disabled={bulkRestockSaving}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRestockSubmit}
              disabled={bulkRestockSaving || bulkRestockRows.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {bulkRestockSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Apply Restock
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Delete Product</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingProduct(null);
              }}
              className={darkMode ? 'border-gray-600 text-gray-300' : ''}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>Product Details</DialogTitle>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              {/* Product Image */}
              <div className="flex justify-center">
                {viewingProduct.image ? (
                  <img
                    src={viewingProduct.image}
                    alt={viewingProduct.name}
                    className="max-h-48 w-auto rounded-lg object-contain border border-gray-200"
                  />
                ) : (
                  <div className={`h-48 w-48 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Package className={`h-16 w-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {viewingProduct.name}
                  </h3>
                  {getStatusBadge(viewingProduct.status)}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${darkMode ? 'border-gray-600 text-gray-300' : ''}`}>{viewingProduct.category}</span>
              </div>

              {/* Description */}
              <div>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Description</h4>
                <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewingProduct.description}</p>
              </div>

              {/* Inventory Info */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Inventory</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Stock</p>
                    <p className={`text-lg font-semibold ${
                      viewingProduct.stockQuantity === 0 ? 'text-red-600' :
                      (viewingProduct.stockQuantity || 0) <= (viewingProduct.lowStockThreshold || 10) ? 'text-yellow-600' :
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {viewingProduct.stockQuantity || 0} units
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Low Stock Alert</p>
                    <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {viewingProduct.lowStockThreshold || 10} units
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              {(viewingProduct.priceRange || viewingProduct.estimatedPrice) && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingProduct.priceRange && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price Range (PHP)</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{viewingProduct.priceRange}</p>
                      </div>
                    )}
                    {viewingProduct.priceRangeUSD && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price Range (USD)</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{viewingProduct.priceRangeUSD}</p>
                      </div>
                    )}
                    {viewingProduct.estimatedPrice && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estimated Price (PHP)</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>₱{viewingProduct.estimatedPrice.toLocaleString()}</p>
                      </div>
                    )}
                    {viewingProduct.estimatedPriceUSD && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estimated Price (USD)</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>${viewingProduct.estimatedPriceUSD.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {viewingProduct.features && viewingProduct.features.length > 0 && (
                <div>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingProduct.features.map((feature, index) => (
                      <li key={index} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Beamex URL */}
              {viewingProduct.beamexUrl && (
                <div>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>More Information</h4>
                  <a
                    href={viewingProduct.beamexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                  >
                    View on Beamex Website
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Actions */}
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    openStockDialog(viewingProduct);
                  }}
                  className={darkMode ? 'border-gray-600 text-gray-300' : ''}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Update Stock
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    openEditDialog(viewingProduct);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
