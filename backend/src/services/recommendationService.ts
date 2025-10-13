import UserInteraction from '../models/UserInteraction';
import Booking from '../models/Booking';
import mongoose from 'mongoose';

// Product data structure
interface Product {
  id: string;
  name: string;
  category: string;
  features?: string[];
  estimatedPrice?: number;
}

// All available products (matching frontend data)
const PRODUCTS: Product[] = [
  { id: 'cmx', name: 'Beamex CMX', category: 'Calibration Software', estimatedPrice: 1500000 },
  { id: 'logical', name: 'Beamex LOGiCAL', category: 'Calibration Software', estimatedPrice: 400000 },
  { id: 'mc6', name: 'Beamex MC6', category: 'Field Calibrators', estimatedPrice: 800000 },
  { id: 'mc6-ex', name: 'Beamex MC6-Ex', category: 'Field Calibrators', estimatedPrice: 1000000 },
  { id: 'mc6-t', name: 'Beamex MC6-T', category: 'Temperature Calibration', estimatedPrice: 1300000 },
  { id: 'mc6-ws', name: 'Beamex MC6-WS', category: 'Workshop Calibrators', estimatedPrice: 900000 },
  { id: 'poc6', name: 'Beamex POC6', category: 'Calibration Benches', estimatedPrice: 600000 },
  { id: 'centrical', name: 'Beamex CENTRiCAL', category: 'Temperature Calibration', estimatedPrice: 3200000 },
  { id: 'temperature-sensors', name: 'Temperature Reference Sensors', category: 'Temperature Calibration', estimatedPrice: 75000 },
  { id: 'calibration-pumps', name: 'Pressure Calibration Pumps', category: 'Pressure Calibration', estimatedPrice: 120000 },
  { id: 'test-equipment-set', name: 'Complete Accessory Kit', category: 'Accessories', estimatedPrice: 55000 },
];

// Product category relationships (products that go well together)
const CATEGORY_COMPLEMENTS: { [key: string]: string[] } = {
  'Field Calibrators': ['Accessories', 'Calibration Software', 'Pressure Calibration'],
  'Workshop Calibrators': ['Calibration Software', 'Accessories', 'Temperature Calibration'],
  'Calibration Software': ['Field Calibrators', 'Workshop Calibrators', 'Calibration Benches'],
  'Temperature Calibration': ['Calibration Software', 'Workshop Calibrators', 'Accessories'],
  'Pressure Calibration': ['Field Calibrators', 'Calibration Benches', 'Accessories'],
  'Calibration Benches': ['Calibration Software', 'Pressure Calibration', 'Accessories'],
  'Accessories': ['Field Calibrators', 'Workshop Calibrators', 'Temperature Calibration'],
};

// Product similarity based on use case and complementarity
const PRODUCT_COMPLEMENTS: { [key: string]: string[] } = {
  'mc6': ['cmx', 'test-equipment-set', 'calibration-pumps'],
  'mc6-ex': ['cmx', 'test-equipment-set', 'calibration-pumps'],
  'mc6-ws': ['cmx', 'logical', 'test-equipment-set', 'temperature-sensors'],
  'mc6-t': ['cmx', 'temperature-sensors', 'test-equipment-set'],
  'cmx': ['mc6', 'mc6-ws', 'mc6-t', 'poc6', 'centrical'],
  'logical': ['mc6-ws', 'mc6', 'test-equipment-set'],
  'poc6': ['cmx', 'calibration-pumps', 'mc6'],
  'centrical': ['cmx', 'temperature-sensors'],
  'temperature-sensors': ['mc6-t', 'centrical', 'mc6-ws'],
  'calibration-pumps': ['mc6', 'mc6-ex', 'poc6'],
  'test-equipment-set': ['mc6', 'mc6-ex', 'mc6-ws', 'mc6-t'],
};

interface RecommendationScore {
  productId: string;
  score: number;
  reasons: string[];
}

class RecommendationService {
  /**
   * Generate personalized recommendations using collaborative filtering
   * @param userId - User to generate recommendations for
   * @param limit - Number of recommendations to return
   * @returns Array of recommended product IDs with scores
   */
  async getRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<{ productId: string; score: number; reasons: string[] }[]> {
    try {
      // Get user's interaction history
      const userInteractions = await UserInteraction.find({
        userId: new mongoose.Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      // Get user's booking history
      const userBookings = await Booking.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: { $in: ['completed', 'confirmed', 'pending'] },
      }).sort({ createdAt: -1 });

      // Extract products user has already interacted with
      const interactedProducts = new Set([
        ...userInteractions.map((i) => i.productId),
        ...userBookings.map((b) => b.product),
      ]);

      // Build user profile from interactions
      const userProfile = this.buildUserProfile(userInteractions, userBookings);

      // Generate recommendations using multiple strategies
      const contentBasedScores = this.contentBasedFiltering(userProfile, interactedProducts);
      const collaborativeScores = await this.collaborativeFiltering(userId, interactedProducts);
      const categoryScores = this.categoryBasedRecommendations(userProfile, interactedProducts);

      // Combine scores with weights
      const combinedScores = this.combineScores(
        contentBasedScores,
        collaborativeScores,
        categoryScores,
        {
          contentWeight: 0.4,
          collaborativeWeight: 0.35,
          categoryWeight: 0.25,
        }
      );

      // Sort by score and return top recommendations
      const sortedRecommendations = Array.from(combinedScores.entries())
        .map(([productId, data]) => ({
          productId,
          score: data.score,
          reasons: data.reasons,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return sortedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to popular products
      return this.getPopularProducts(limit);
    }
  }

  /**
   * Build user profile from interactions and bookings
   */
  private buildUserProfile(interactions: any[], bookings: any[]) {
    const profile: {
      categories: Map<string, number>;
      products: Map<string, number>;
      priceRange: number[];
      recentProducts: string[];
    } = {
      categories: new Map(),
      products: new Map(),
      priceRange: [],
      recentProducts: [],
    };

    // Process interactions with time decay
    const now = Date.now();
    interactions.forEach((interaction) => {
      const product = PRODUCTS.find((p) => p.id === interaction.productId);
      if (!product) return;

      // Time decay: interactions lose relevance over time (30 days half-life)
      const ageInDays = (now - new Date(interaction.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-ageInDays / 30);
      const score = interaction.weight * decayFactor;

      // Update category preferences
      const currentCategoryScore = profile.categories.get(product.category) || 0;
      profile.categories.set(product.category, currentCategoryScore + score);

      // Update product scores
      const currentProductScore = profile.products.get(product.id) || 0;
      profile.products.set(product.id, currentProductScore + score);

      // Track price range
      if (product.estimatedPrice) {
        profile.priceRange.push(product.estimatedPrice);
      }
    });

    // Process bookings (higher weight)
    bookings.forEach((booking) => {
      const product = PRODUCTS.find((p) => p.name === booking.product || p.id === booking.product);
      if (!product) return;

      profile.recentProducts.push(product.id);

      const bookingWeight = booking.status === 'completed' ? 10 : 5;
      const currentCategoryScore = profile.categories.get(product.category) || 0;
      profile.categories.set(product.category, currentCategoryScore + bookingWeight);

      const currentProductScore = profile.products.get(product.id) || 0;
      profile.products.set(product.id, currentProductScore + bookingWeight);

      if (product.estimatedPrice) {
        profile.priceRange.push(product.estimatedPrice);
      }
    });

    return profile;
  }

  /**
   * Content-based filtering: Recommend similar products based on user's preferences
   */
  private contentBasedFiltering(
    userProfile: any,
    excludeProducts: Set<string>
  ): Map<string, RecommendationScore> {
    const scores = new Map<string, RecommendationScore>();

    // Calculate average price range user is interested in
    const avgPrice =
      userProfile.priceRange.length > 0
        ? userProfile.priceRange.reduce((a: number, b: number) => a + b, 0) / userProfile.priceRange.length
        : null;

    PRODUCTS.forEach((product) => {
      if (excludeProducts.has(product.id)) return;

      let score = 0;
      const reasons: string[] = [];

      // Score based on category preference
      const categoryScore = userProfile.categories.get(product.category) || 0;
      if (categoryScore > 0) {
        score += categoryScore * 2;
        reasons.push(`Matches your interest in ${product.category}`);
      }

      // Score based on complementary products
      userProfile.recentProducts.forEach((recentProductId: string) => {
        const complements = PRODUCT_COMPLEMENTS[recentProductId] || [];
        if (complements.includes(product.id)) {
          score += 3;
          const recentProduct = PRODUCTS.find((p) => p.id === recentProductId);
          reasons.push(`Complements ${recentProduct?.name || 'your recent interest'}`);
        }
      });

      // Score based on price similarity (if user has price history)
      if (avgPrice && product.estimatedPrice) {
        const priceDiff = Math.abs(product.estimatedPrice - avgPrice);
        const priceScore = Math.max(0, 5 - priceDiff / avgPrice);
        if (priceScore > 2) {
          score += priceScore;
          reasons.push('Similar price range to your interests');
        }
      }

      if (score > 0) {
        scores.set(product.id, { productId: product.id, score, reasons });
      }
    });

    return scores;
  }

  /**
   * Collaborative filtering: Find similar users and recommend their products
   */
  private async collaborativeFiltering(
    userId: string,
    excludeProducts: Set<string>
  ): Promise<Map<string, RecommendationScore>> {
    const scores = new Map<string, RecommendationScore>();

    try {
      // Get current user's interactions
      const userInteractions = await UserInteraction.find({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const userProductSet = new Set(userInteractions.map((i) => i.productId));

      if (userProductSet.size === 0) {
        return scores; // No data for collaborative filtering
      }

      // Find similar users (users who interacted with same products)
      const similarUsersData = await UserInteraction.aggregate([
        {
          $match: {
            productId: { $in: Array.from(userProductSet) },
            userId: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        {
          $group: {
            _id: '$userId',
            commonProducts: { $addToSet: '$productId' },
            totalInteractions: { $sum: 1 },
          },
        },
        {
          $match: {
            totalInteractions: { $gte: 2 }, // At least 2 common interactions
          },
        },
        { $limit: 20 }, // Top 20 similar users
      ]);

      // Get products from similar users
      const similarUserIds = similarUsersData.map((u) => u._id);

      if (similarUserIds.length > 0) {
        const similarUserProducts = await UserInteraction.aggregate([
          {
            $match: {
              userId: { $in: similarUserIds },
              productId: { $nin: Array.from(excludeProducts) },
            },
          },
          {
            $group: {
              _id: '$productId',
              totalWeight: { $sum: '$weight' },
              userCount: { $addToSet: '$userId' },
            },
          },
          {
            $project: {
              productId: '$_id',
              score: { $multiply: ['$totalWeight', { $size: '$userCount' }] },
            },
          },
          { $sort: { score: -1 } },
          { $limit: 10 },
        ]);

        similarUserProducts.forEach((item: any) => {
          const product = PRODUCTS.find((p) => p.id === item.productId);
          if (product) {
            scores.set(item.productId, {
              productId: item.productId,
              score: item.score,
              reasons: ['Popular among users with similar interests'],
            });
          }
        });
      }
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
    }

    return scores;
  }

  /**
   * Category-based recommendations: Recommend complementary product categories
   */
  private categoryBasedRecommendations(
    userProfile: any,
    excludeProducts: Set<string>
  ): Map<string, RecommendationScore> {
    const scores = new Map<string, RecommendationScore>();

    // Find user's top categories
    const topCategories = Array.from(userProfile.categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    // Recommend products from complementary categories
    topCategories.forEach((category) => {
      const complementaryCategories = CATEGORY_COMPLEMENTS[category] || [];

      complementaryCategories.forEach((complementCategory) => {
        PRODUCTS.filter((p) => p.category === complementCategory && !excludeProducts.has(p.id)).forEach(
          (product) => {
            const existing = scores.get(product.id);
            const score = 2;
            const reason = `Complements your ${category} interests`;

            if (existing) {
              existing.score += score;
              if (!existing.reasons.includes(reason)) {
                existing.reasons.push(reason);
              }
            } else {
              scores.set(product.id, {
                productId: product.id,
                score,
                reasons: [reason],
              });
            }
          }
        );
      });
    });

    return scores;
  }

  /**
   * Combine multiple recommendation scores
   */
  private combineScores(
    contentScores: Map<string, RecommendationScore>,
    collaborativeScores: Map<string, RecommendationScore>,
    categoryScores: Map<string, RecommendationScore>,
    weights: { contentWeight: number; collaborativeWeight: number; categoryWeight: number }
  ): Map<string, RecommendationScore> {
    const combined = new Map<string, RecommendationScore>();

    // Collect all product IDs
    const allProductIds = new Set([
      ...contentScores.keys(),
      ...collaborativeScores.keys(),
      ...categoryScores.keys(),
    ]);

    allProductIds.forEach((productId) => {
      const contentScore = contentScores.get(productId);
      const collaborativeScore = collaborativeScores.get(productId);
      const categoryScore = categoryScores.get(productId);

      const totalScore =
        (contentScore?.score || 0) * weights.contentWeight +
        (collaborativeScore?.score || 0) * weights.collaborativeWeight +
        (categoryScore?.score || 0) * weights.categoryWeight;

      const allReasons = [
        ...(contentScore?.reasons || []),
        ...(collaborativeScore?.reasons || []),
        ...(categoryScore?.reasons || []),
      ];

      // Remove duplicates and limit to top 3 reasons
      const uniqueReasons = Array.from(new Set(allReasons)).slice(0, 3);

      combined.set(productId, {
        productId,
        score: totalScore,
        reasons: uniqueReasons,
      });
    });

    return combined;
  }

  /**
   * Fallback: Get popular products based on interaction data
   */
  private async getPopularProducts(
    limit: number = 5
  ): Promise<{ productId: string; score: number; reasons: string[] }[]> {
    try {
      const popularProducts = await UserInteraction.aggregate([
        {
          $group: {
            _id: '$productId',
            totalScore: { $sum: '$weight' },
            interactionCount: { $sum: 1 },
          },
        },
        {
          $sort: { totalScore: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return popularProducts.map((item) => ({
        productId: item._id,
        score: item.totalScore,
        reasons: ['Popular product'],
      }));
    } catch (error) {
      console.error('Error getting popular products:', error);
      // Ultimate fallback: return first few products
      return PRODUCTS.slice(0, limit).map((p) => ({
        productId: p.id,
        score: 1,
        reasons: ['Featured product'],
      }));
    }
  }

  /**
   * Record a user interaction with a product
   */
  async recordInteraction(
    userId: string,
    productId: string,
    interactionType: 'view' | 'booking' | 'inquiry' | 'purchase',
    metadata?: any
  ): Promise<void> {
    try {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) {
        console.error('Product not found:', productId);
        return;
      }

      // Set interaction weight
      const weights = {
        view: 1,
        inquiry: 2,
        booking: 3,
        purchase: 5,
      };

      await UserInteraction.create({
        userId: new mongoose.Types.ObjectId(userId),
        productId,
        interactionType,
        productCategory: product.category,
        weight: weights[interactionType],
        metadata,
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  /**
   * Get all user interactions (Admin only)
   */
  async getAllInteractions(): Promise<any[]> {
    try {
      const interactions = await UserInteraction.find()
        .sort({ createdAt: -1 })
        .limit(500)
        .populate('userId', 'name email')
        .lean();

      return interactions;
    } catch (error) {
      console.error('Error getting all interactions:', error);
      return [];
    }
  }

  /**
   * Get recommendation statistics (Admin only)
   */
  async getStats(): Promise<any> {
    try {
      const totalInteractions = await UserInteraction.countDocuments();

      const interactionsByType = await UserInteraction.aggregate([
        {
          $group: {
            _id: '$interactionType',
            count: { $sum: 1 },
          },
        },
      ]);

      const interactionsByCategory = await UserInteraction.aggregate([
        {
          $group: {
            _id: '$productCategory',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const topProducts = await UserInteraction.aggregate([
        {
          $group: {
            _id: '$productId',
            totalWeight: { $sum: '$weight' },
            interactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalWeight: -1 } },
        { $limit: 10 },
      ]);

      const activeUsers = await UserInteraction.aggregate([
        {
          $group: {
            _id: '$userId',
            interactionCount: { $sum: 1 },
          },
        },
        {
          $match: {
            interactionCount: { $gte: 2 },
          },
        },
      ]);

      // Recent interactions
      const recentInteractions = await UserInteraction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean();

      return {
        totalInteractions,
        totalUsers: activeUsers.length,
        interactionsByType,
        interactionsByCategory,
        topProducts: topProducts.map((item) => {
          const product = PRODUCTS.find((p) => p.id === item._id);
          return {
            productId: item._id,
            productName: product?.name || item._id,
            totalWeight: item.totalWeight,
            interactionCount: item.interactionCount,
          };
        }),
        recentInteractions,
      };
    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      return {
        totalInteractions: 0,
        totalUsers: 0,
        interactionsByType: [],
        interactionsByCategory: [],
        topProducts: [],
        recentInteractions: [],
      };
    }
  }
}

export default new RecommendationService();
