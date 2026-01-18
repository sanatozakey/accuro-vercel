import api from './api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  beamexUrl?: string;
  features?: string[];
  priceRange?: string;
  priceRangeUSD?: string;
  estimatedPrice?: number;
  estimatedPriceUSD?: number;
  specifications?: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  // Inventory fields
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  category: string;
  image?: string;
  beamexUrl?: string;
  features?: string[];
  priceRange?: string;
  priceRangeUSD?: string;
  estimatedPrice?: number;
  estimatedPriceUSD?: number;
  specifications?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
  // Inventory fields
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  data: Product[];
}

class ProductService {
  async getProducts(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ProductsResponse> {
    // For admin, pass empty string to get all products regardless of status
    const queryParams = {
      ...params,
      status: params?.status === 'All' ? '' : params?.status,
    };
    const response = await api.get<ProductsResponse>('/products', { params: queryParams });
    return response.data;
  }

  async getProduct(id: string): Promise<ProductResponse> {
    const response = await api.get<ProductResponse>(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductData): Promise<ProductResponse> {
    const response = await api.post<ProductResponse>('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<ProductResponse> {
    const response = await api.put<ProductResponse>(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<{ success: boolean; data: {} }> {
    const response = await api.delete<{ success: boolean; data: {} }>(`/products/${id}`);
    return response.data;
  }

  async uploadImage(file: File): Promise<{ success: boolean; data: { url: string } }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<{ success: boolean; data: { url: string } }>(
      '/products/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async updateStock(id: string, stockQuantity: number): Promise<ProductResponse> {
    const response = await api.put<ProductResponse>(`/products/${id}`, { stockQuantity });
    return response.data;
  }

  async getLowStockProducts(threshold?: number): Promise<ProductsResponse> {
    const response = await api.get<ProductsResponse>('/products/low-stock', {
      params: threshold ? { threshold } : undefined,
    });
    return response.data;
  }
}

export default new ProductService();
