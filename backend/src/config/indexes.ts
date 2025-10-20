import mongoose from 'mongoose';

/**
 * Create database indexes for optimal query performance
 * Call this function after MongoDB connection is established
 */
export const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection not established');
      return;
    }

    console.log('Creating database indexes...');

    // ==================== USERS COLLECTION ====================
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'email_unique' }
    );
    console.log('✓ Created unique index on users.email');

    await db.collection('users').createIndex(
      { createdAt: -1 },
      { name: 'users_created_desc' }
    );
    console.log('✓ Created index on users.createdAt');

    await db.collection('users').createIndex(
      { role: 1 },
      { name: 'users_role' }
    );
    console.log('✓ Created index on users.role');

    // ==================== BOOKINGS COLLECTION ====================
    await db.collection('bookings').createIndex(
      { user: 1 },
      { name: 'bookings_user' }
    );
    console.log('✓ Created index on bookings.user');

    await db.collection('bookings').createIndex(
      { productId: 1 },
      { name: 'bookings_product' }
    );
    console.log('✓ Created index on bookings.productId');

    await db.collection('bookings').createIndex(
      { preferredDate: 1 },
      { name: 'bookings_preferred_date' }
    );
    console.log('✓ Created index on bookings.preferredDate');

    await db.collection('bookings').createIndex(
      { status: 1 },
      { name: 'bookings_status' }
    );
    console.log('✓ Created index on bookings.status');

    await db.collection('bookings').createIndex(
      { createdAt: -1 },
      { name: 'bookings_created_desc' }
    );
    console.log('✓ Created index on bookings.createdAt');

    // Compound index for user bookings sorted by date
    await db.collection('bookings').createIndex(
      { user: 1, createdAt: -1 },
      { name: 'bookings_user_created' }
    );
    console.log('✓ Created compound index on bookings.user + createdAt');

    // Compound index for status + date queries
    await db.collection('bookings').createIndex(
      { status: 1, preferredDate: 1 },
      { name: 'bookings_status_date' }
    );
    console.log('✓ Created compound index on bookings.status + preferredDate');

    // ==================== REVIEWS COLLECTION ====================
    await db.collection('reviews').createIndex(
      { user: 1 },
      { name: 'reviews_user' }
    );
    console.log('✓ Created index on reviews.user');

    await db.collection('reviews').createIndex(
      { productId: 1 },
      { name: 'reviews_product' }
    );
    console.log('✓ Created index on reviews.productId');

    await db.collection('reviews').createIndex(
      { isApproved: 1 },
      { name: 'reviews_approved' }
    );
    console.log('✓ Created index on reviews.isApproved');

    await db.collection('reviews').createIndex(
      { createdAt: -1 },
      { name: 'reviews_created_desc' }
    );
    console.log('✓ Created index on reviews.createdAt');

    // Compound index for approved reviews by product
    await db.collection('reviews').createIndex(
      { productId: 1, isApproved: 1 },
      { name: 'reviews_product_approved' }
    );
    console.log('✓ Created compound index on reviews.productId + isApproved');

    // ==================== CONTACTS COLLECTION ====================
    await db.collection('contacts').createIndex(
      { email: 1 },
      { name: 'contacts_email' }
    );
    console.log('✓ Created index on contacts.email');

    await db.collection('contacts').createIndex(
      { createdAt: -1 },
      { name: 'contacts_created_desc' }
    );
    console.log('✓ Created index on contacts.createdAt');

    await db.collection('contacts').createIndex(
      { status: 1 },
      { name: 'contacts_status' }
    );
    console.log('✓ Created index on contacts.status (if exists)');

    // ==================== QUOTES COLLECTION ====================
    await db.collection('quotes').createIndex(
      { userId: 1 },
      { name: 'quotes_user' }
    );
    console.log('✓ Created index on quotes.userId');

    await db.collection('quotes').createIndex(
      { customerEmail: 1 },
      { name: 'quotes_email' }
    );
    console.log('✓ Created index on quotes.customerEmail');

    await db.collection('quotes').createIndex(
      { createdAt: -1 },
      { name: 'quotes_created_desc' }
    );
    console.log('✓ Created index on quotes.createdAt');

    await db.collection('quotes').createIndex(
      { status: 1 },
      { name: 'quotes_status' }
    );
    console.log('✓ Created index on quotes.status');

    // Compound index for user quotes sorted by date
    await db.collection('quotes').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'quotes_user_created' }
    );
    console.log('✓ Created compound index on quotes.userId + createdAt');

    // Compound index for status + date queries
    await db.collection('quotes').createIndex(
      { status: 1, createdAt: -1 },
      { name: 'quotes_status_created' }
    );
    console.log('✓ Created compound index on quotes.status + createdAt');

    // ==================== PURCHASE HISTORY COLLECTION ====================
    await db.collection('purchasehistories').createIndex(
      { user: 1 },
      { name: 'purchasehistories_user' }
    );
    console.log('✓ Created index on purchasehistories.user');

    await db.collection('purchasehistories').createIndex(
      { orderNumber: 1 },
      { unique: true, name: 'purchasehistories_ordernumber_unique' }
    );
    console.log('✓ Created unique index on purchasehistories.orderNumber');

    await db.collection('purchasehistories').createIndex(
      { userEmail: 1 },
      { name: 'purchasehistories_email' }
    );
    console.log('✓ Created index on purchasehistories.userEmail');

    await db.collection('purchasehistories').createIndex(
      { orderStatus: 1 },
      { name: 'purchasehistories_order_status' }
    );
    console.log('✓ Created index on purchasehistories.orderStatus');

    await db.collection('purchasehistories').createIndex(
      { paymentStatus: 1 },
      { name: 'purchasehistories_payment_status' }
    );
    console.log('✓ Created index on purchasehistories.paymentStatus');

    await db.collection('purchasehistories').createIndex(
      { createdAt: -1 },
      { name: 'purchasehistories_created_desc' }
    );
    console.log('✓ Created index on purchasehistories.createdAt');

    // Compound index for user purchase history sorted by date
    await db.collection('purchasehistories').createIndex(
      { user: 1, createdAt: -1 },
      { name: 'purchasehistories_user_created' }
    );
    console.log('✓ Created compound index on purchasehistories.user + createdAt');

    // Compound index for order/payment status queries
    await db.collection('purchasehistories').createIndex(
      { paymentStatus: 1, orderStatus: 1 },
      { name: 'purchasehistories_payment_order_status' }
    );
    console.log('✓ Created compound index on purchasehistories.paymentStatus + orderStatus');

    // ==================== ACTIVITY LOGS COLLECTION ====================
    await db.collection('activitylogs').createIndex(
      { user: 1 },
      { name: 'activitylogs_user' }
    );
    console.log('✓ Created index on activitylogs.user');

    await db.collection('activitylogs').createIndex(
      { createdAt: -1 },
      { name: 'activitylogs_created_desc' }
    );
    console.log('✓ Created index on activitylogs.createdAt');

    await db.collection('activitylogs').createIndex(
      { action: 1 },
      { name: 'activitylogs_action' }
    );
    console.log('✓ Created index on activitylogs.action');

    // Compound index for user activity logs
    await db.collection('activitylogs').createIndex(
      { user: 1, createdAt: -1 },
      { name: 'activitylogs_user_created' }
    );
    console.log('✓ Created compound index on activitylogs.user + createdAt');

    console.log('\n✅ All database indexes created successfully!\n');
  } catch (error: any) {
    // Ignore duplicate index errors (index already exists)
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  Some indexes already exist, skipping...');
    } else {
      console.error('❌ Error creating indexes:', error.message);
    }
  }
};

/**
 * List all indexes for a collection
 */
export const listIndexes = async (collectionName: string) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database connection not established');
      return;
    }

    const indexes = await db.collection(collectionName).indexes();
    console.log(`\nIndexes for ${collectionName}:`);
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error: any) {
    console.error(`Error listing indexes for ${collectionName}:`, error.message);
  }
};
