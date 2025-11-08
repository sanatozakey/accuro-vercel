# Product API Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Start server
cd backend && npm run dev

# 2. Seed sample products (optional)
npm run seed:products

# 3. Get admin token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calibrex.com","password":"Admin@123456"}'
```

---

## 📋 Common Operations

### Get All Products (Public)
```bash
curl http://localhost:5000/api/products
```

### Search Products (Public)
```bash
curl "http://localhost:5000/api/products?search=calibration"
```

### Filter by Category (Public)
```bash
curl "http://localhost:5000/api/products?category=Field%20Calibrators"
```

### Get Categories (Public)
```bash
curl http://localhost:5000/api/products/categories
```

### Create Product (Admin)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name",
    "description": "Product description here",
    "category": "Field Calibrators"
  }'
```

### Update Product (Admin)
```bash
curl -X PUT http://localhost:5000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

### Delete Product (Admin)
```bash
curl -X DELETE http://localhost:5000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 File Structure

```
backend/
├── src/
│   ├── models/
│   │   └── Product.ts          # MongoDB schema
│   ├── controllers/
│   │   └── productController.ts # Business logic
│   ├── routes/
│   │   └── productRoutes.ts    # API routes
│   ├── middleware/
│   │   └── validation.ts       # Input validation
│   └── utils/
│       └── seedProducts.ts     # Database seeding
├── uploads/
│   └── products/               # Uploaded images
├── PRODUCT_API_GUIDE.md        # Full documentation
├── TESTING_EXAMPLES.md         # Test cases
└── PRODUCT_SYSTEM_SUMMARY.md  # Implementation summary
```

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | 🔓 Public | List all products |
| GET | `/api/products/:id` | 🔓 Public | Get one product |
| GET | `/api/products/categories` | 🔓 Public | Get categories |
| POST | `/api/products` | 🔒 Admin | Create product |
| PUT | `/api/products/:id` | 🔒 Admin | Update product |
| DELETE | `/api/products/:id` | 🔒 Admin | Delete product |
| POST | `/api/products/bulk/import` | 🔒 Admin | Bulk import |
| POST | `/api/products/upload-image` | 🔒 Admin | Upload image |

---

## ✅ Required Fields

**Minimum to create a product:**
```json
{
  "name": "Product Name",           // 2-200 chars
  "description": "Description...",  // 10-5000 chars
  "category": "Field Calibrators"   // Valid category
}
```

---

## 📂 Valid Categories

1. Calibration Software
2. Field Calibrators
3. Workshop Calibrators
4. Temperature Calibration
5. Pressure Generation
6. Accessories

---

## 🖼️ Image Options

### 1. External URL
```json
{"image": "https://example.com/product.jpg"}
```

### 2. Upload File
```bash
curl -X POST http://localhost:5000/api/products/upload-image \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@product.jpg"
```

### 3. Base64 (max 5MB)
```json
{"image": "data:image/jpeg;base64,/9j/4AAQ..."}
```

---

## 🔍 Query Parameters

```
?category=Field%20Calibrators  # Filter by category
?status=active                 # Filter by status
?search=calibration            # Full-text search
?limit=10                      # Results per page
?page=2                        # Page number
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Login and get new token |
| 403 Forbidden | Not admin | Use admin account |
| 400 Validation | Missing/invalid fields | Check required fields |
| 404 Not Found | Invalid product ID | Verify ID exists |

---

## 🧪 Testing

```bash
# Run seeder
npm run seed:products

# Test health
curl http://localhost:5000/api/health

# Test products
curl http://localhost:5000/api/products

# Get test token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calibrex.com","password":"Admin@123456"}'
```

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "data": {...},
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{
    "field": "name",
    "message": "Product name is required"
  }]
}
```

---

## 🔗 Useful Links

- **Full API Docs**: `PRODUCT_API_GUIDE.md`
- **Test Examples**: `TESTING_EXAMPLES.md`
- **System Summary**: `PRODUCT_SYSTEM_SUMMARY.md`

---

## 💡 Pro Tips

1. Use `?status=active` to show only active products
2. Paginate large results with `?limit=20&page=1`
3. Search is case-insensitive and searches name + description
4. Product names must be unique
5. Use status='archived' instead of deleting
6. Upload images separately for better performance
7. All timestamps are in UTC ISO format

---

## 🚨 Quick Troubleshooting

**Server won't start?**
```bash
cd backend
npm install
npm run build
npm run dev
```

**Can't create products?**
- Check you have admin token
- Verify all required fields
- Check category spelling (case-sensitive)

**Images not loading?**
- Check `/uploads` directory exists
- Verify image URL is accessible
- For base64, check size < 5MB

**Database empty?**
```bash
npm run seed:products
```

---

## 📞 Need Help?

1. Check error message in response
2. Review `PRODUCT_API_GUIDE.md` for details
3. Try examples from `TESTING_EXAMPLES.md`
4. Verify MongoDB is running
5. Check server logs for errors
