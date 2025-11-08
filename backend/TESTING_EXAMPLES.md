# Product API Testing Examples

This document provides ready-to-use commands for testing the Product Management API.

## Prerequisites

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Get an admin token (if you need to test admin endpoints):
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@calibrex.com",
    "password": "Admin@123456"
  }'
```

Copy the token from the response and use it in the examples below by replacing `YOUR_ADMIN_TOKEN`.

---

## Test 1: Get All Products (Public)

```bash
curl http://localhost:5000/api/products
```

Expected: Returns list of all active products with pagination info.

---

## Test 2: Get Products by Category (Public)

```bash
curl "http://localhost:5000/api/products?category=Field%20Calibrators"
```

Expected: Returns only products in the "Field Calibrators" category.

---

## Test 3: Search Products (Public)

```bash
curl "http://localhost:5000/api/products?search=software"
```

Expected: Returns products matching "software" in name or description.

---

## Test 4: Get Product Categories (Public)

```bash
curl http://localhost:5000/api/products/categories
```

Expected: Returns array of valid product categories.

---

## Test 5: Get Single Product (Public)

First, get a product ID from Test 1, then:

```bash
curl http://localhost:5000/api/products/PRODUCT_ID_HERE
```

Expected: Returns full details of a single product.

---

## Test 6: Create Product - Minimal (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Calibrator Model X1",
    "description": "This is a test product for demonstration purposes. It includes basic calibration features.",
    "category": "Field Calibrators"
  }'
```

Expected: Successfully creates product with minimal required fields.

---

## Test 7: Create Product - Full (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Temperature Calibrator Pro",
    "description": "Professional-grade temperature calibrator with wide range and high accuracy. Ideal for laboratory and field use.",
    "category": "Temperature Calibration",
    "image": "https://example.com/product-image.jpg",
    "beamexUrl": "https://www.beamex.com/products/example",
    "features": [
      "Temperature range: -50°C to 1200°C",
      "Accuracy: ±0.05°C",
      "Portable design with rechargeable battery",
      "Digital display with backlight"
    ],
    "priceRange": "₱200,000 - ₱350,000",
    "priceRangeUSD": "$3,600 - $6,250",
    "estimatedPrice": 275000,
    "estimatedPriceUSD": 4900,
    "specifications": {
      "weight": "2.5 kg",
      "dimensions": "250 x 180 x 100 mm",
      "batteryLife": "8 hours"
    },
    "status": "active"
  }'
```

Expected: Successfully creates product with all fields populated.

---

## Test 8: Create Product - Validation Error (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "X",
    "description": "Short",
    "category": "Invalid Category"
  }'
```

Expected: Returns validation errors for short name, short description, and invalid category.

---

## Test 9: Update Product (Admin)

First, create a product or get an ID from existing products, then:

```bash
curl -X PUT http://localhost:5000/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "priceRange": "₱250,000 - ₱400,000"
  }'
```

Expected: Successfully updates only the specified fields.

---

## Test 10: Delete Product (Admin)

```bash
curl -X DELETE http://localhost:5000/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected: Successfully deletes the product and returns confirmation message.

---

## Test 11: Bulk Import Products (Admin)

```bash
curl -X POST http://localhost:5000/api/products/bulk/import \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Bulk Product 1",
        "description": "First product in bulk import test",
        "category": "Accessories"
      },
      {
        "name": "Bulk Product 2",
        "description": "Second product in bulk import test",
        "category": "Accessories"
      }
    ]
  }'
```

Expected: Returns import results with successful and failed counts.

---

## Test 12: Upload Product Image (Admin)

```bash
curl -X POST http://localhost:5000/api/products/upload-image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

Note: Replace `/path/to/your/image.jpg` with an actual image file path on your system.

Expected: Returns uploaded image URL that can be used in product creation/update.

---

## Test 13: Create Product with Base64 Image (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product with Base64 Image",
    "description": "This product has an embedded base64 image",
    "category": "Accessories",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

Note: The example uses a tiny 1x1 pixel image. In production, use actual product images.

Expected: Successfully creates product with base64 image stored.

---

## Test 14: Unauthorized Access (No Token)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This should fail",
    "category": "Field Calibrators"
  }'
```

Expected: Returns 401 Unauthorized error.

---

## Test 15: Pagination Test (Public)

```bash
curl "http://localhost:5000/api/products?limit=2&page=1"
```

Expected: Returns first 2 products with pagination metadata (page, pages, total).

---

## Test 16: Seed Sample Products

```bash
cd backend
npm run seed:products
```

Expected: Populates database with 3 sample products if database is empty.

---

## Postman Collection

You can also import these tests into Postman. Create a new collection with:

1. **Environment Variables**:
   - `baseUrl`: `http://localhost:5000`
   - `adminToken`: (paste your admin token here)

2. **Collection Variables**:
   - All requests use `{{baseUrl}}/api/products`
   - Admin requests use `Authorization: Bearer {{adminToken}}`

---

## Automated Testing Script

Save this as `test-products.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"
echo "🧪 Testing Product API..."

# Test 1: Health Check
echo -e "\n1️⃣  Health Check"
curl -s $BASE_URL/health | jq

# Test 2: Get Categories
echo -e "\n2️⃣  Get Categories"
curl -s $BASE_URL/products/categories | jq

# Test 3: Get All Products
echo -e "\n3️⃣  Get All Products"
curl -s $BASE_URL/products | jq '.success, .count'

# Test 4: Search Products
echo -e "\n4️⃣  Search Products"
curl -s "$BASE_URL/products?search=calibration" | jq '.success, .count'

echo -e "\n✅ Public endpoints tested successfully!"
```

Make it executable and run:
```bash
chmod +x test-products.sh
./test-products.sh
```

---

## Troubleshooting

### Error: "Product name is required"
- Make sure you're sending `name`, `description`, and `category` fields
- Check that name is at least 2 characters long

### Error: "Invalid category"
- Use one of the valid categories from the `/categories` endpoint
- Category names are case-sensitive

### Error: "Not authorized to access this route"
- Make sure you're logged in as admin
- Check that your token is valid and included in the Authorization header

### Error: "Image size too large"
- Base64 images must be under 5MB
- Consider using the `/upload-image` endpoint for larger files

### Error: "A product with this name already exists"
- Product names must be unique
- Either use a different name or update the existing product

---

## Performance Testing

Test API performance with Apache Bench:

```bash
# Test GET endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:5000/api/products

# Test with search parameter
ab -n 100 -c 10 "http://localhost:5000/api/products?search=calibration"
```

---

## Next Steps

1. ✅ Test all public endpoints
2. ✅ Test admin endpoints with authentication
3. ✅ Test validation errors
4. ✅ Test edge cases (pagination, search, etc.)
5. ✅ Load test with sample data
6. 🔄 Integrate with frontend
7. 🔄 Set up monitoring and logging
