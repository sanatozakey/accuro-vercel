import Product from '../models/Product';
import { connectDB } from '../config/database';

/**
 * Sample product data for seeding the database
 * This is a subset of products - you can add more from your products.ts file
 */
const sampleProducts = [
  {
    name: 'Beamex CMX Calibration Management Software',
    category: 'Calibration Software',
    description: 'All-in-one calibration management solution designed to help organizations manage instrumentation assets safely and plan/execute calibrations efficiently, even in highly regulated industries.',
    image: 'https://www.beamex.com/app/uploads/2022/09/cmx-calibration-software-1280-720px-v1.jpg',
    beamexUrl: 'https://www.beamex.com/calibration-software/cmx/',
    priceRange: '₱800,000 - ₱2,500,000',
    priceRangeUSD: '$14,300 - $44,600',
    estimatedPrice: 1500000,
    estimatedPriceUSD: 26800,
    features: [
      'Instrument management with hierarchical organization',
      'Role-based access control with authentication',
      'Digital data flow integration with Beamex calibrators',
      'Guided calibration process ensuring standardized execution',
      'Uncertainty calculation for each calibration point',
      'Full calibration history with permanent storage',
      '21 CFR Part 11 compliance',
      'Work order automation via Business Bridge',
    ],
    status: 'active',
  },
  {
    name: 'Beamex LOGiCAL Calibration Management Software',
    category: 'Calibration Software',
    description: 'Subscription-based, cloud-hosted calibration management platform designed to digitalize and streamline instrumentation calibration processes with unlimited users and instruments.',
    image: 'https://www.beamex.com/app/uploads/2022/12/logical-v2-scaled.jpg',
    beamexUrl: 'https://www.beamex.com/calibration-software/logical/',
    priceRange: '₱250,000 - ₱600,000',
    priceRangeUSD: '$4,500 - $10,700',
    estimatedPrice: 400000,
    estimatedPriceUSD: 7100,
    features: [
      'Cloud-based infrastructure on Microsoft Azure',
      'Unlimited instrument database',
      'Automated tracking of calibration reference instruments',
      'Guided calibration workflows',
      'Seamless integration with Beamex calibrators',
      'Role-based access control',
      'Multi-tenant architecture',
      'Offline capability with automatic sync',
    ],
    status: 'active',
  },
  {
    name: 'Beamex MC6-T Advanced Field Calibrator and Communicator',
    category: 'Field Calibrators',
    description: 'The most capable and accurate field calibrator and communicator in the market, featuring world-class accuracy (0.002%), documenting functionality, and support for multiple communication protocols including HART, FOUNDATION Fieldbus, and Profibus PA.',
    image: 'https://www.beamex.com/app/uploads/2023/02/mc6-t-v2-scaled.jpg',
    beamexUrl: 'https://www.beamex.com/products/field-calibrators-and-communicators/mc6/',
    priceRange: '₱450,000 - ₱750,000',
    priceRangeUSD: '$8,000 - $13,400',
    estimatedPrice: 600000,
    estimatedPriceUSD: 10700,
    features: [
      'World-class accuracy: 0.002% for voltage',
      'HART, FOUNDATION Fieldbus, and Profibus PA support',
      'Large 5.7-inch touchscreen display',
      'Intrinsically safe (ATEX/IECEx Zone 0)',
      'IP65 rating for harsh environments',
      'Hot-swappable rechargeable battery',
      'Automatic temperature compensation',
      'Direct integration with Beamex CMX software',
    ],
    status: 'active',
  },
];

/**
 * Seed products into the database
 */
export const seedProducts = async () => {
  try {
    console.log('🌱 Starting product seeding...');

    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Database already contains ${existingCount} products. Skipping seed.`);
      return;
    }

    // Insert sample products
    const result = await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully seeded ${result.length} products`);

    result.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.category})`);
    });
  } catch (error: any) {
    console.error('❌ Error seeding products:', error.message);
    throw error;
  }
};

/**
 * Run seed function if executed directly
 */
if (require.main === module) {
  connectDB()
    .then(() => seedProducts())
    .then(() => {
      console.log('🎉 Product seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Product seeding failed:', error);
      process.exit(1);
    });
}
