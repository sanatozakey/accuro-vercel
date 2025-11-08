import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  X,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import productService, { Product, CreateProductData } from '../services/productService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Dialog states
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

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
  });
  const [featureInput, setFeatureInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productService.getProducts();
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

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
    });
    setFeatureInput('');
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
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
    });
    setImagePreview(product.image || '');
    setShowAddEditDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile) return formData.image;

    try {
      setUploadingImage(true);
      const response = await productService.uploadImage(imageFile);
      return response.data.url;
    } catch (err: any) {
      setFormErrors({
        ...formErrors,
        image: err.response?.data?.message || 'Failed to upload image',
      });
      return undefined;
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
      setLoading(true);
      setError('');

      // Upload image if a new one was selected
      let imageUrl = formData.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const productData = {
        ...formData,
        image: imageUrl,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, productData);
        showSuccessMessage('Product updated successfully');
      } else {
        await productService.createProduct(productData);
        showSuccessMessage('Product created successfully');
      }

      setShowAddEditDialog(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      setLoading(true);
      setError('');
      await productService.deleteProduct(deletingProduct._id);
      showSuccessMessage('Product deleted successfully');
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
      console.error('Error deleting product:', err);
    } finally {
      setLoading(false);
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

  if (loading && products.length === 0) {
    return (
      <div className={`${isInline ? '' : 'min-h-screen'} ${isInline ? (darkMode ? 'bg-gray-900' : 'bg-gray-50') : 'bg-gray-50'} flex items-center justify-center ${isInline ? 'py-12' : ''}`}>
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className={`${isInline && darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isInline ? '' : 'min-h-screen bg-gray-50'}>
      {/* Header - Only show when not inline */}
      {!isInline && (
        <div className="bg-navy-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                  <Package className="h-10 w-10" />
                  Product Management
                </h1>
                <p className="text-gray-300">Manage your product catalog</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-navy-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={openAddDialog}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={isInline ? '' : 'container mx-auto px-4 py-8'}>
        {/* Inline Header - Show when in inline mode */}
        {isInline && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center gap-3`}>
                  <Package className="h-8 w-8" />
                  Product Management
                </h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage your product catalog</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={openAddDialog}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className={`mb-6 ${isInline && darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-4 flex items-center gap-3`}>
            <div className="flex-shrink-0">
              <div className={`h-5 w-5 ${isInline && darkMode ? 'text-green-400' : 'text-green-500'}`}>✓</div>
            </div>
            <p className={`${isInline && darkMode ? 'text-green-300' : 'text-green-800'} font-medium`}>{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className={`ml-auto ${isInline && darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 ${isInline && darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 flex items-center gap-3`}>
            <AlertCircle className={`h-5 w-5 ${isInline && darkMode ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
            <p className={`${isInline && darkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
            <button
              onClick={() => setError('')}
              className={`ml-auto ${isInline && darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className={`${isInline && darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-5 w-5 ${isInline && darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${isInline && darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}`}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 ${isInline && darkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0`} />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={isInline && darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className={isInline && darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={isInline && darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className={isInline && darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className={isInline && darkMode ? 'bg-gray-700 text-gray-300' : ''}>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </Badge>
          </div>
        </div>

        {/* Products Table */}
        <div className={`${isInline && darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isInline && darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={isInline && darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Product
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Category
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Price Range
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isInline && darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isInline && darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className={isInline && darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-12 w-12 rounded object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className={`font-medium ${isInline && darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{product.name}</div>
                            <div className={`text-sm ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={isInline && darkMode ? 'border-gray-600 text-gray-300' : ''}>{product.category}</Badge>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isInline && darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {product.priceRange || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            product.status === 'active'
                              ? 'default'
                              : product.status === 'inactive'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={`px-6 py-12 text-center ${isInline && darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product information below'
                : 'Fill in the product details below'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  className={formErrors.description ? 'border-red-500' : ''}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as 'active' | 'inactive' | 'archived',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image">Product Image</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Max file size: 2MB</p>
                  {formErrors.image && (
                    <p className="text-sm text-red-500">{formErrors.image}</p>
                  )}
                </div>
              </div>

              {/* Beamex URL */}
              <div>
                <Label htmlFor="beamexUrl">Beamex Product URL</Label>
                <Input
                  id="beamexUrl"
                  value={formData.beamexUrl}
                  onChange={(e) => setFormData({ ...formData, beamexUrl: e.target.value })}
                  placeholder="https://www.beamex.com/..."
                />
              </div>

              {/* Price Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceRange">Price Range (PHP)</Label>
                  <Input
                    id="priceRange"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                    placeholder="₱50,000 - ₱100,000"
                  />
                </div>

                <div>
                  <Label htmlFor="priceRangeUSD">Price Range (USD)</Label>
                  <Input
                    id="priceRangeUSD"
                    value={formData.priceRangeUSD}
                    onChange={(e) =>
                      setFormData({ ...formData, priceRangeUSD: e.target.value })
                    }
                    placeholder="$1,000 - $2,000"
                  />
                </div>
              </div>

              {/* Estimated Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedPrice">Estimated Price (PHP)</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    value={formData.estimatedPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="75000"
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedPriceUSD">Estimated Price (USD)</Label>
                  <Input
                    id="estimatedPriceUSD"
                    type="number"
                    value={formData.estimatedPriceUSD || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedPriceUSD: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="1500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <Label htmlFor="features">Features</Label>
                <div className="space-y-2">
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
                    />
                    <Button type="button" onClick={addFeature} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.features && formData.features.length > 0 && (
                    <div className="space-y-1">
                      {formData.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm">{feature}</span>
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
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddEditDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploadingImage}>
                {loading || uploadingImage ? (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingProduct(null);
              }}
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
                  Delete Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
