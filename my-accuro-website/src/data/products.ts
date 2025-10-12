export interface Product {
  id: string
  name: string
  category: string
  description: string
  image: string
  beamexUrl?: string
  features?: string[]
  priceRange?: string
  priceRangeUSD?: string
  estimatedPrice?: number
  estimatedPriceUSD?: number
}

export const productCategories = [
  'All Products',
  'Calibration Software',
  'Field Calibrators',
  'Workshop Calibrators',
  'Calibration Benches',
  'Temperature Calibration',
  'Pressure Calibration',
  'Accessories',
]

export const products: Product[] = [
  // Calibration Management Software
  {
    id: 'cmx',
    name: 'Beamex CMX',
    category: 'Calibration Software',
    description: 'Comprehensive calibration management software for managing instrumentation assets, planning, and executing calibrations efficiently.',
    image: '/images/Beamex MC6.png',
    beamexUrl: 'https://www.beamex.com/calibration-software/cmx/',
    priceRange: '₱800,000 - ₱2,500,000',
    priceRangeUSD: '$14,300 - $44,600',
    estimatedPrice: 1500000,
    estimatedPriceUSD: 26800,
    features: [
      'Complete asset management',
      'Automated calibration workflows',
      'Regulatory compliance',
    ],
  },
  {
    id: 'logical',
    name: 'Beamex LOGiCAL',
    category: 'Calibration Software',
    description: 'Easy-to-use and affordable calibration software solution for managing your instrumentation assets.',
    image: '/images/Beamex MC6.png',
    beamexUrl: 'https://www.beamex.com/calibration-software/logical/',
    priceRange: '₱250,000 - ₱600,000',
    priceRangeUSD: '$4,500 - $10,700',
    estimatedPrice: 400000,
    estimatedPriceUSD: 7100,
    features: [
      'Simple asset management',
      'Basic calibration workflows',
      'Cost-effective solution',
    ],
  },

  // MC6 Family Calibrators
  {
    id: 'mc6',
    name: 'Beamex MC6',
    category: 'Field Calibrators',
    description: 'High-accuracy field calibrator with comprehensive calibration capabilities for pressure, temperature, and electrical signals.',
    image: '/images/Beamex MC6.png',
    beamexUrl: 'https://www.beamex.com/calibrators/beamex-mc6/',
    priceRange: '₱650,000 - ₱950,000',
    priceRangeUSD: '$11,600 - $17,000',
    estimatedPrice: 800000,
    estimatedPriceUSD: 14300,
    features: [
      'Multi-function calibration',
      'HART communication',
      'High accuracy ±0.01%',
    ],
  },
  {
    id: 'mc6-ex',
    name: 'Beamex MC6-Ex',
    category: 'Field Calibrators',
    description: "World's most accurate intrinsically safe field calibrator and communicator for hazardous areas.",
    image: '/images/Beamex MC6-Ex.png',
    beamexUrl: 'https://www.beamex.com/calibrators/beamex-mc6-ex/',
    priceRange: '₱850,000 - ₱1,200,000',
    priceRangeUSD: '$15,200 - $21,400',
    estimatedPrice: 1000000,
    estimatedPriceUSD: 17900,
    features: [
      'Intrinsically safe (ATEX/IECEx)',
      'Highest accuracy',
      'Hazardous area certified',
    ],
  },
  {
    id: 'mc6-t',
    name: 'Beamex MC6-T',
    category: 'Temperature Calibration',
    description: 'Combines a temperature dry block with multifunction process calibrator for comprehensive temperature calibration.',
    image: '/images/Beamex MC6-T.png',
    beamexUrl: 'https://www.beamex.com/calibrators/beamex-mc6-t/',
    priceRange: '₱1,100,000 - ₱1,500,000',
    priceRangeUSD: '$19,600 - $26,800',
    estimatedPrice: 1300000,
    estimatedPriceUSD: 23200,
    features: [
      'Integrated dry block calibrator',
      'Wide temperature range',
      'Fast heat-up/cool-down',
    ],
  },
  {
    id: 'mc6-ws',
    name: 'Beamex MC6-WS',
    category: 'Workshop Calibrators',
    description: 'High-accuracy workshop calibrator and communicator for bench and laboratory applications.',
    image: '/images/Beamex MC6-WS.png',
    beamexUrl: 'https://www.beamex.com/calibrators/beamex-mc6-ws/',
    priceRange: '₱750,000 - ₱1,050,000',
    priceRangeUSD: '$13,400 - $18,800',
    estimatedPrice: 900000,
    estimatedPriceUSD: 16100,
    features: [
      'Workshop accuracy',
      'AC/DC powered',
      'Large display interface',
    ],
  },

  // Calibration Benches
  {
    id: 'poc6',
    name: 'Beamex POC6',
    category: 'Calibration Benches',
    description: 'Portable pressure calibration bench for field and workshop pressure calibration with integrated pump.',
    image: '/images/Calibration Pumps.png',
    beamexUrl: 'https://www.beamex.com/calibrators/beamex-poc6/',
    priceRange: '₱450,000 - ₱750,000',
    priceRangeUSD: '$8,000 - $13,400',
    estimatedPrice: 600000,
    estimatedPriceUSD: 10700,
    features: [
      'Portable design',
      'Integrated pressure pump',
      'Wide pressure range',
    ],
  },
  {
    id: 'centrical',
    name: 'Beamex CENTRiCAL',
    category: 'Temperature Calibration',
    description: 'Automated temperature calibration system for precise and efficient temperature sensor calibration.',
    image: '/images/Beamex CENTRiCAL.png',
    beamexUrl: 'https://www.beamex.com/calibration-workstations/centrical/',
    priceRange: '₱2,500,000 - ₱4,000,000',
    priceRangeUSD: '$44,600 - $71,400',
    estimatedPrice: 3200000,
    estimatedPriceUSD: 57100,
    features: [
      'Fully automated calibration',
      'High accuracy bath',
      'Fast stabilization',
    ],
  },

  // Temperature Calibration
  {
    id: 'temperature-sensors',
    name: 'Temperature Reference Sensors',
    category: 'Temperature Calibration',
    description: 'High-precision temperature reference sensors for accurate temperature measurement and calibration.',
    image: '/images/Beamex Temperature Sensors.png',
    beamexUrl: 'https://www.beamex.com/accessories/temperature-reference-sensors/',
    priceRange: '₱35,000 - ₱150,000',
    priceRangeUSD: '$625 - $2,680',
    estimatedPrice: 75000,
    estimatedPriceUSD: 1340,
    features: [
      'Reference accuracy',
      'RTD and TC sensors',
      'Calibration certificates included',
    ],
  },

  // Pressure Calibration
  {
    id: 'calibration-pumps',
    name: 'Pressure Calibration Pumps',
    category: 'Pressure Calibration',
    description: 'Manual and automated pressure generation equipment for pressure calibration applications.',
    image: '/images/Calibration Pumps.png',
    beamexUrl: 'https://www.beamex.com/accessories/pressure-pumps/',
    priceRange: '₱45,000 - ₱250,000',
    priceRangeUSD: '$800 - $4,460',
    estimatedPrice: 120000,
    estimatedPriceUSD: 2140,
    features: [
      'Manual and automated options',
      'Pneumatic and hydraulic',
      'Rugged construction',
    ],
  },

  // Accessories
  {
    id: 'test-equipment-set',
    name: 'Complete Accessory Kit',
    category: 'Accessories',
    description: 'Complete set of accessories including carrying cases, test leads, hoses, adapters, and batteries.',
    image: '/images/Beamex MC6.png',
    beamexUrl: 'https://www.beamex.com/accessories/',
    priceRange: '₱25,000 - ₱100,000',
    priceRangeUSD: '$446 - $1,786',
    estimatedPrice: 55000,
    estimatedPriceUSD: 982,
    features: [
      'Carrying cases and bags',
      'Test leads and cables',
      'Batteries and chargers',
    ],
  },
]

export function getProductsByCategory(category: string): Product[] {
  if (category === 'All Products') {
    return products
  }
  return products.filter((product) => product.category === category)
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}
