# Database Schema Migration Guide

## Overview
This guide outlines the database schema updates made to support comprehensive user history tracking in the Accuro backend system.

## Changes Summary

### 1. User Model Updates
**File:** `src/models/User.ts`

**Changes:**
- Added `superadmin` role to the role enum
- Role field now supports: `'user' | 'admin' | 'superadmin'`

**Impact:**
- Existing user documents are compatible (no data migration needed)
- New super admin users can be created
- Existing admin users retain their current role

### 2. New Models Created

#### PurchaseHistory Model
**File:** `src/models/PurchaseHistory.ts`

**Purpose:** Track complete purchase/transaction history for users

**Key Fields:**
- `user` - Reference to User document
- `orderNumber` - Unique order identifier
- `items[]` - Array of purchased items with pricing
- `paymentMethod` - Payment type used
- `paymentStatus` - Current payment state
- `orderStatus` - Current order state
- `shippingAddress` - Delivery information
- `relatedQuote` - Optional link to originating quote
- `relatedBooking` - Optional link to related booking
- Timestamps: `createdAt`, `updatedAt`

**Indexes:**
- `user` + `createdAt` (compound)
- `orderNumber` (unique)
- `orderStatus`
- `paymentStatus`
- `userEmail`

### 3. Updated Models

#### ActivityLog Model
**File:** `src/models/ActivityLog.ts`

**Changes:**
- Expanded `resourceType` enum to include: `'quote'` and `'purchase'`
- Now supports: `'user' | 'booking' | 'review' | 'quote' | 'purchase' | 'auth' | 'system'`

**Impact:**
- Existing activity logs remain valid
- New activity types can be logged

#### Quote Model
**File:** `src/models/Quote.ts`

**Changes:**
- Added indexes for performance:
  - `userId` + `createdAt` (compound)
  - `customerEmail`
  - `status` + `createdAt` (compound)
  - `items.productId`

### 4. New Controllers

#### PurchaseHistoryController
**File:** `src/controllers/purchaseHistoryController.ts`

**Endpoints:**
- `GET /api/purchases` - Get all purchases (Admin)
- `GET /api/purchases/:id` - Get single purchase
- `POST /api/purchases` - Create new purchase
- `PUT /api/purchases/:id` - Update purchase (Admin)
- `GET /api/purchases/my-purchases` - Get user's purchases
- `PUT /api/purchases/:id/cancel` - Cancel purchase

#### UserHistoryController
**File:** `src/controllers/userHistoryController.ts`

**Endpoints:**
- `GET /api/user-history/my-history` - Get comprehensive user history
- `GET /api/user-history/reviews` - Get user's review history
- `GET /api/user-history/quotes` - Get user's quote history
- `GET /api/user-history/bookings` - Get user's booking history
- `GET /api/user-history/activity` - Get user's activity logs
- `GET /api/user-history/:userId` - Get any user's history (Admin)

### 5. Updated Controllers

#### QuoteController
**File:** `src/controllers/quoteController.ts`

**Changes:**
- Added activity logging for quote creation
- Added activity logging for quote updates
- Added activity logging for quote deletion
- All quote operations now tracked in ActivityLog

### 6. Index Configuration
**File:** `src/config/indexes.ts`

**New Indexes Added:**
- Quote collection indexes (userId, customerEmail, status combinations)
- PurchaseHistory collection indexes (user, orderNumber, status fields)

## Migration Steps

### Step 1: Backup Database
```bash
# Create a backup before applying changes
mongodump --uri="mongodb://your-connection-string" --out=./backup-before-migration
```

### Step 2: Deploy Code Changes
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if any new ones)
npm install

# Build TypeScript
npm run build

# Start the server (indexes will be created automatically)
npm start
```

### Step 3: Verify Index Creation
The indexes will be created automatically when the server starts. Check the console output for:
```
✓ Created index on quotes.userId
✓ Created compound index on quotes.userId + createdAt
✓ Created index on purchasehistories.user
✓ Created unique index on purchasehistories.orderNumber
...
```

### Step 4: Create Super Admin User (Optional)
If you need to create a super admin user:

```javascript
// Using MongoDB shell or a migration script
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "superadmin" } }
);
```

Or via the API (requires existing admin access):
```bash
# Update user role to superadmin
PUT /api/users/:userId
{
  "role": "superadmin"
}
```

### Step 5: Verify New Endpoints
Test the new endpoints:

```bash
# Get user's comprehensive history
GET /api/user-history/my-history
Authorization: Bearer <token>

# Get user's purchases
GET /api/purchases/my-purchases
Authorization: Bearer <token>

# Create a purchase (example)
POST /api/purchases
Authorization: Bearer <token>
Content-Type: application/json
{
  "items": [...],
  "shippingAddress": {...},
  ...
}
```

## Backward Compatibility

All changes are backward compatible:

1. **User Model:** Existing users retain their current roles. No data migration needed.

2. **ActivityLog:** Existing logs remain valid. New resource types simply expand the enum.

3. **Quote Model:** Only indexes added, no schema changes. Existing quotes are unaffected.

4. **New Models:** New collections (PurchaseHistory) won't affect existing data.

5. **Controllers:** Existing endpoints unchanged. New endpoints added.

## Rollback Procedure

If you need to rollback:

### Step 1: Stop the Server
```bash
# Stop the running server
```

### Step 2: Restore Previous Code
```bash
git checkout <previous-commit-hash>
npm run build
npm start
```

### Step 3: Remove New Indexes (Optional)
```javascript
// Only if needed to free up space
db.quotes.dropIndex("quotes_user_created");
db.quotes.dropIndex("quotes_status_created");
db.purchasehistories.dropIndexes();
```

### Step 4: Restore Database (If Needed)
```bash
mongorestore --uri="mongodb://your-connection-string" ./backup-before-migration
```

## Performance Considerations

1. **Index Creation:** Initial index creation may take time on large collections. Plan deployment during low-traffic periods.

2. **Query Performance:** New indexes improve query performance for:
   - User history lookups
   - Purchase filtering by status
   - Quote searches by user/status

3. **Storage:** Additional indexes require ~10-15% more storage space.

## Monitoring

After deployment, monitor:

1. **Index Usage:**
```javascript
db.purchasehistories.getIndexes();
db.quotes.getIndexes();
```

2. **Query Performance:**
```javascript
// Check slow queries
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

3. **Collection Stats:**
```javascript
db.purchasehistories.stats();
db.activitylogs.stats();
```

## Support

For issues or questions:
1. Check server logs for errors
2. Verify database connection
3. Ensure all indexes were created successfully
4. Review this guide for proper migration steps

## Additional Notes

- All new endpoints require authentication
- Admin endpoints require `admin` or `superadmin` role
- Activity logging is automatic and non-blocking (errors are logged but don't fail requests)
- Purchase order numbers are auto-generated with format: `ORD-{timestamp}-{random}`
