# Product Management API Guide

## Overview
This guide provides comprehensive documentation for the Product Management API endpoints, including examples and testing instructions.

## Database Schema

### Product Model Fields
```typescript
{
  name: string;                      // Required, 2-200 characters
  description: string;               // Required, 10-5000 characters
  category: string;                  // Required, must be one of the predefined categories
  image?: string;                    // Optional, URL or base64 data URI (max 5MB)
  beamexUrl?: string;               // Optional, external product URL
  features?: string[];              // Optional, array of feature descriptions
  priceRange?: string;              // Optional, e.g., "₱800,000 - ₱2,500,000"
  priceRangeUSD?: string;           // Optional, e.g., "$14,300 - $44,600"
  estimatedPrice?: number;          // Optional, numeric price in PHP
  estimatedPriceUSD?: number;       // Optional, numeric price in USD
  specifications?: object;          // Optional, flexible specifications object
  status: 'active' | 'inactive' | 'archived';  // Default: 'active'
  createdAt: Date;                  // Auto-generated
  updatedAt: Date;                  // Auto-generated
}
```

### Valid Categories
- `Calibration Software`
- `Field Calibrators`
- `Workshop Calibrators`
- `Temperature Calibration`
- `Pressure Generation`
- `Accessories`

## API Endpoints

### 1. Get All Products
**Public endpoint** - No authentication required

```http
GET /api/products
```

#### Query Parameters
- `category` (optional): Filter by category (e.g., "Field Calibrators")
- `status` (optional): Filter by status (active/inactive/archived). Default: active
- `search` (optional): Full-text search in name and description
- `limit` (optional): Number of results per page. Default: 100
- `page` (optional): Page number. Default: 1

#### Example Request
```bash
# Get all active products
curl http://localhost:5000/api/products

# Get products in a specific category
curl http://localhost:5000/api/products?category=Calibration%20Software

# Search for products
curl http://localhost:5000/api/products?search=calibration

# Paginated results
curl http://localhost:5000/api/products?limit=10&page=1
```

#### Example Response
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Beamex CMX Calibration Management Software",
      "description": "All-in-one calibration management solution...",
      "category": "Calibration Software",
      "image": "https://www.beamex.com/...",
      "beamexUrl": "https://www.beamex.com/...",
      "features": ["Feature 1", "Feature 2"],
      "priceRange": "₱800,000 - ₱2,500,000",
      "priceRangeUSD": "$14,300 - $44,600",
      "estimatedPrice": 1500000,
      "estimatedPriceUSD": 26800,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Product
**Public endpoint** - No authentication required

```http
GET /api/products/:id
```

#### Example Request
```bash
curl http://localhost:5000/api/products/507f1f77bcf86cd799439011
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Beamex CMX Calibration Management Software",
    "description": "All-in-one calibration management solution...",
    "category": "Calibration Software",
    "status": "active",
    ...
  }
}
```

---

### 3. Create Product
**Protected endpoint** - Requires admin authentication

```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "New Product Name",
  "description": "Detailed product description (min 10 characters)",
  "category": "Field Calibrators",
  "image": "https://example.com/image.jpg",
  "beamexUrl": "https://www.beamex.com/product",
  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3"
  ],
  "priceRange": "₱100,000 - ₱200,000",
  "priceRangeUSD": "$1,800 - $3,600",
  "estimatedPrice": 150000,
  "estimatedPriceUSD": 2700,
  "specifications": {
    "accuracy": "0.01%",
    "range": "0-100 bar"
  },
  "status": "active"
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product for demonstration purposes",
    "category": "Field Calibrators",
    "status": "active"
  }'
```

#### Example Response
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Test Product",
    "description": "This is a test product for demonstration purposes",
    "category": "Field Calibrators",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Product
**Protected endpoint** - Requires admin authentication

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body
All fields are optional. Only include fields you want to update.

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "status": "inactive"
}
```

#### Example Request
```bash
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

#### Example Response
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Product Name",
    "status": "inactive",
    ...
  }
}
```

---

### 5. Delete Product
**Protected endpoint** - Requires admin authentication

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

#### Example Request
```bash
curl -X DELETE http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Example Response
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 6. Get Product Categories
**Public endpoint** - No authentication required

```http
GET /api/products/categories
```

#### Example Request
```bash
curl http://localhost:5000/api/products/categories
```

#### Example Response
```json
{
  "success": true,
  "data": [
    "Calibration Software",
    "Field Calibrators",
    "Workshop Calibrators",
    "Temperature Calibration",
    "Pressure Generation",
    "Accessories"
  ]
}
```

---

### 7. Bulk Import Products
**Protected endpoint** - Requires admin authentication

```http
POST /api/products/bulk/import
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "products": [
    {
      "name": "Product 1",
      "description": "Description for product 1",
      "category": "Field Calibrators"
    },
    {
      "name": "Product 2",
      "description": "Description for product 2",
      "category": "Calibration Software"
    }
  ]
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Bulk import completed",
  "data": {
    "successful": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

## Authentication

### Getting an Admin Token

1. **Login as Admin**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@calibrex.com",
    "password": "your_admin_password"
  }'
```

2. **Response will include token**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@calibrex.com",
    "role": "admin"
  }
}
```

3. **Use the token in subsequent requests**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:5000/api/products
```

---

## Image Handling

### URL-based Images
Simply provide the image URL:
```json
{
  "image": "https://example.com/product-image.jpg"
}
```

### Base64-encoded Images
Upload images as base64 data URI (max 5MB):
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Converting an image to base64 (Node.js example):**
```javascript
const fs = require('fs');
const imageBuffer = fs.readFileSync('product-image.jpg');
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
```

---

## Seeding Sample Products

Run the seeding script to populate your database with sample products:

```bash
cd backend
npm run seed:products
```

Or using ts-node directly:
```bash
cd backend
npx ts-node src/utils/seedProducts.ts
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Product name is required"
    },
    {
      "field": "category",
      "message": "Invalid category"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Testing Checklist

### Public Endpoints (No Auth Required)
- [ ] GET /api/products - List all products
- [ ] GET /api/products?category=Field%20Calibrators - Filter by category
- [ ] GET /api/products?search=calibration - Search products
- [ ] GET /api/products/:id - Get single product
- [ ] GET /api/products/categories - Get categories

### Admin Endpoints (Auth Required)
- [ ] POST /api/products - Create product
- [ ] PUT /api/products/:id - Update product
- [ ] DELETE /api/products/:id - Delete product
- [ ] POST /api/products/bulk/import - Bulk import

### Validation Tests
- [ ] Try creating product with missing required fields
- [ ] Try creating product with invalid category
- [ ] Try uploading image larger than 5MB
- [ ] Try creating product with duplicate name
- [ ] Try accessing admin endpoints without token

### Edge Cases
- [ ] Test pagination with large datasets
- [ ] Test search with special characters
- [ ] Test product with all optional fields
- [ ] Test product with minimal required fields only
- [ ] Test updating product name to existing name

---

## Integration with Frontend

### Example React/TypeScript Service

```typescript
// productService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  createdAt: Date;
  updatedAt: Date;
}

export const productService = {
  // Get all products
  getProducts: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axios.get(`${API_URL}/products`, { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id: string) => {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  },

  // Create product (admin only)
  createProduct: async (productData: Partial<Product>, token: string) => {
    const response = await axios.post(
      `${API_URL}/products`,
      productData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Update product (admin only)
  updateProduct: async (id: string, productData: Partial<Product>, token: string) => {
    const response = await axios.put(
      `${API_URL}/products/${id}`,
      productData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Delete product (admin only)
  deleteProduct: async (id: string, token: string) => {
    const response = await axios.delete(
      `${API_URL}/products/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Product names must be unique
- Deleted products are permanently removed (consider using `status: 'archived'` instead)
- Image URLs should be HTTPS for security
- Base64 images are stored directly in MongoDB (consider cloud storage for production)
- Activity logs are automatically created for admin actions
- Text search uses MongoDB's full-text search indexes
