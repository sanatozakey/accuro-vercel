import React, { useState } from 'react'
import { ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react'
import { AddToCartButton } from '../components/cart/AddToCartButton'
import { MiniCart } from '../components/cart/MiniCart'
import { getPriceForProduct, formatPrice, isProductAvailable } from '../utils/pricingUtils'

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
  productUrl: string;
  status: 'current' | 'discontinued' | 'limited';
  replacedBy?: string;
  features?: string[];
  applications?: string[];
}

// Updated product categories based on current Beamex offerings
const categories = [
  'Field Calibrators',
  'Workshop Calibrators',
  'Temperature Calibrators',
  'Calibration Software',
  'Calibration Benches',
  'Pressure Generation',
  'Accessories & Modules',
  'Discontinued Products'
]

// Updated Beamex products with local image paths
const products: Product[] = [
  // CURRENT FIELD CALIBRATORS
  {
    id: 1,
    name: 'Beamex MC6-Advanced',
    category: 'Field Calibrators',
    description: 'High-accuracy field calibrator and communicator for pressure, temperature, and electrical signals',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mc6/',
    status: 'current' as const,
    features: ['HART/Fieldbus communication', 'Internal pressure pump', 'Wireless connectivity', 'Touch screen interface'],
    applications: ['Field calibration', 'Process maintenance', 'Commissioning']
  },
  {
    id: 2,
    name: 'Beamex MC6-Ex',
    category: 'Field Calibrators',
    description: 'Intrinsically safe field calibrator and communicator (ATEX, IECEx, North American certified)',
    image: '/images/Beamex MC6-Ex.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mc6-ex/',
    status: 'current' as const,
    features: ['Intrinsically safe', 'ATEX certified', 'Hazardous area use', 'Same functionality as MC6'],
    applications: ['Hazardous areas', 'Oil & gas', 'Chemical plants']
  },
  {
    id: 3,
    name: 'Beamex MC6-T',
    category: 'Field Calibrators',
    description: 'Field calibrator with integrated temperature dry block for comprehensive temperature calibration',
    image: '/images/Beamex MC6-T.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mc6-t/',
    status: 'current' as const,
    features: ['Integrated dry block', 'Temperature + electrical', 'Field portable', 'Multifunction capability'],
    applications: ['Temperature sensor calibration', 'Field temperature work', 'Process temperature']
  },
  {
    id: 4,
    name: 'Beamex MC4',
    category: 'Field Calibrators',
    description: 'Documenting process calibrator with digital calibration data flow',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mc4/',
    status: 'current' as const,
    features: ['Documenting calibrator', 'Digital data flow', 'CMX/LOGiCAL integration', 'No manual data entry'],
    applications: ['Documented calibration', 'Quality compliance', 'Process maintenance']
  },

  // WORKSHOP CALIBRATORS
  {
    id: 5,
    name: 'Beamex MC6-WS',
    category: 'Workshop Calibrators',
    description: 'High-accuracy workshop calibrator and communicator for bench-mounted applications',
    image: '/images/Beamex MC6-WS.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mc6-ws/',
    status: 'current' as const,
    features: ['Panel mounted', 'High accuracy', 'Workshop optimized', 'Automatic calibration'],
    applications: ['Workshop calibration', 'Laboratory use', 'Bench applications']
  },

  // TEMPERATURE CALIBRATORS
  {
    id: 6,
    name: 'Beamex FB Series',
    category: 'Temperature Calibrators',
    description: 'Lightweight, fast temperature dry block for industrial field use',
    image: '/images/Beamex FB.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-fb/',
    status: 'current' as const,
    features: ['Fast heating/cooling', 'Lightweight design', 'Field portable', 'High accuracy'],
    applications: ['Field temperature calibration', 'Temperature sensor testing', 'Mobile calibration']
  },
  {
    id: 7,
    name: 'Beamex MB Series',
    category: 'Temperature Calibrators',
    description: 'High-accuracy portable temperature dry block delivering bath-level accuracy',
    image: '/images/Beamex Temperature Sensors.png',
    productUrl: 'https://www.beamex.com/us/calibrators/beamex-mb/',
    status: 'current' as const,
    features: ['Bath-level accuracy', 'Portable design', 'Industrial applications', 'Multiple inserts available'],
    applications: ['High-precision temperature work', 'Laboratory calibration', 'Reference standards']
  },

  // CALIBRATION SOFTWARE
  {
    id: 8,
    name: 'Beamex CMX',
    category: 'Calibration Software',
    description: 'Comprehensive calibration management software for planning and managing calibration work',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibration-software/beamex-cmx/',
    status: 'current' as const,
    features: ['Asset management', 'Work planning', 'Compliance reporting', 'Digital workflows'],
    applications: ['Calibration management', 'Regulatory compliance', 'Asset tracking', 'Work optimization']
  },
  {
    id: 9,
    name: 'Beamex LOGiCAL',
    category: 'Calibration Software',
    description: 'Cloud-based calibration management software as a service (SaaS)',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibration-software/beamex-logical/',
    status: 'current' as const,
    features: ['Cloud-based SaaS', 'No IT infrastructure needed', 'Automatic updates', 'Remote access'],
    applications: ['Small to medium companies', 'Remote calibration management', 'Multi-site operations']
  },

  // CALIBRATION BENCHES
  {
    id: 10,
    name: 'Beamex CENTRiCAL',
    category: 'Calibration Benches',
    description: 'Modern calibration bench system (replacement for MCS200)',
    image: '/images/Beamex CENTRiCAL.png',
    productUrl: 'https://www.beamex.com/us/calibration-benches/beamex-centrical/',
    status: 'current' as const,
    features: ['Modular design', 'MC6-WS integration', 'Ergonomic workspace', 'Multiple configurations'],
    applications: ['Workshop calibration', 'Laboratory setup', 'Calibration centers']
  },

  // PRESSURE GENERATION
  {
    id: 11,
    name: 'Beamex ePG',
    category: 'Pressure Generation',
    description: 'Portable battery-operated pressure generator for industrial pressure calibration',
    image: '/images/Beamex ePG.png',
    productUrl: 'https://www.beamex.com/us/calibration-accessories/beamex-epg/',
    status: 'current' as const,
    features: ['Battery operated', 'Portable design', 'Range -0.85 to 20 bar', 'Industrial applications'],
    applications: ['Field pressure generation', 'Mobile calibration', 'Pressure testing']
  },

  // ACCESSORIES & MODULES
  {
    id: 15,
    name: 'Beamex External Pressure Modules',
    category: 'Accessories & Modules',
    description: 'External pressure measurement modules for extended pressure ranges',
    image: '/images/Beamex External Pressure Modules.png',
    productUrl: 'https://www.beamex.com/us/calibration-accessories/',
    status: 'current' as const,
    features: ['Extended pressure ranges', 'High accuracy', 'MC6 compatible', 'Various pressure ranges'],
    applications: ['High pressure applications', 'Extended measurement ranges', 'Specialized pressure work']
  },
  {
    id: 16,
    name: 'Beamex POC8',
    category: 'Accessories & Modules',
    description: 'Pressure and vacuum hand pump for pressure generation',
    image: '/images/Beamex POC8.png',
    productUrl: 'https://www.beamex.com/us/calibration-accessories/',
    status: 'current' as const,
    features: ['Manual pressure generation', 'Pressure and vacuum', 'Portable design', 'High quality construction'],
    applications: ['Manual pressure generation', 'Field calibration', 'Pressure testing']
  },
  {
    id: 17,
    name: 'Calibration Pumps',
    category: 'Accessories & Modules',
    description: 'Various calibration pumps for pressure generation',
    image: '/images/Calibration Pumps.png',
    productUrl: 'https://www.beamex.com/us/calibration-accessories/',
    status: 'current' as const,
    features: ['Multiple pump types', 'Various pressure ranges', 'Professional quality', 'Field portable'],
    applications: ['Pressure calibration', 'Field work', 'Workshop applications']
  },
  {
    id: 18,
    name: 'Temperature Sensors',
    category: 'Accessories & Modules',
    description: 'High-quality temperature sensors and probes',
    image: '/images/Beamex Temperature Sensors.png',
    productUrl: 'https://www.beamex.com/us/calibration-accessories/',
    status: 'current' as const,
    features: ['Various sensor types', 'High accuracy', 'Industrial grade', 'Multiple temperature ranges'],
    applications: ['Temperature measurement', 'Calibration work', 'Process applications']
  },

  // DISCONTINUED PRODUCTS (for reference)
  {
    id: 12,
    name: 'Beamex MC5',
    category: 'Discontinued Products',
    description: 'Multifunction calibrator (Discontinued 2014 - Replaced by MC6)',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibrators/discontinued-products/',
    status: 'discontinued' as const,
    replacedBy: 'MC6-Advanced',
    features: ['Legacy product', 'No longer supported'],
    applications: ['Historical reference only']
  },
  {
    id: 13,
    name: 'Beamex MCS200',
    category: 'Discontinued Products',
    description: 'Modular calibration bench (Discontinued - Replaced by CENTRiCAL)',
    image: '/images/Beamex CENTRiCAL.png',
    productUrl: 'https://www.beamex.com/us/calibrators/discontinued-products/',
    status: 'discontinued' as const,
    replacedBy: 'CENTRiCAL',
    features: ['Legacy bench system', 'No longer available'],
    applications: ['Historical reference only']
  },
  {
    id: 14,
    name: 'Beamex MC2',
    category: 'Discontinued Products',
    description: 'Compact calibrator for field use (Limited availability)',
    image: '/images/Beamex MC6.png',
    productUrl: 'https://www.beamex.com/us/calibrators/discontinued-products/',
    status: 'limited' as const,
    replacedBy: 'MC4 or MC6-Advanced',
    features: ['Limited support', 'Being phased out'],
    applications: ['Limited field use']
  }
]

export function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showDiscontinued, setShowDiscontinued] = useState(false)
  
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : showDiscontinued 
      ? products 
      : products.filter((product) => product.status === 'current')

  const handleViewDetails = (product: Product) => {
    window.open(product.productUrl, '_blank', 'noopener,noreferrer')
  }

  const currentProductsCount = products.filter(p => p.status === 'current').length
  const discontinuedProductsCount = products.filter(p => p.status !== 'current').length

  const getStatusBadge = (product: Product) => {
    if (product.status === 'discontinued') {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs mb-2">
          <AlertTriangle size={12} />
          <span>Discontinued</span>
        </div>
      )
    }
    if (product.status === 'limited') {
      return (
        <div className="flex items-center gap-1 text-orange-600 text-xs mb-2">
          <AlertTriangle size={12} />
          <span>Limited Availability</span>
        </div>
      )
    }
    return null
  }

  const getReplacementInfo = (product: Product) => {
    if (product.replacedBy) {
      return (
        <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
          Replaced by: <strong>{product.replacedBy}</strong>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-white">
      {/* Products Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Beamex Products</h1>
          <p className="mt-4 max-w-3xl">
            Explore our comprehensive range of high-quality Beamex calibration equipment, 
            software, and accessories for various industrial applications. All products are 
            sourced directly from Beamex's current catalog.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="bg-green-600 px-3 py-1 rounded">
              {currentProductsCount} Current Products
            </span>
            <span className="bg-gray-600 px-3 py-1 rounded">
              {discontinuedProductsCount} Legacy Products
            </span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Controls and Cart */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showDiscontinued}
                  onChange={(e) => setShowDiscontinued(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show discontinued products</span>
              </label>
              <a 
                href="https://www.beamex.com/products/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink size={14} />
                View on Beamex.com
              </a>
            </div>
            
            {/* Cart Component */}
            <MiniCart />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Categories</h2>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded flex justify-between items-center ${!selectedCategory ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    >
                      <span>All Products</span>
                      <ChevronRight
                        size={16}
                        className={!selectedCategory ? 'text-blue-700' : 'text-gray-400'}
                      />
                    </button>
                  </li>
                  {categories.map((category, index) => {
                    const categoryCount = products.filter(p => 
                      p.category === category && 
                      (showDiscontinued || p.status === 'current')
                    ).length;
                    
                    return (
                      <li key={index}>
                        <button
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 rounded flex justify-between items-center ${selectedCategory === category ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        >
                          <span className="flex-1">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {categoryCount}
                            </span>
                            <ChevronRight
                              size={16}
                              className={selectedCategory === category ? 'text-blue-700' : 'text-gray-400'}
                            />
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* Products Grid */}
            <div className="md:col-span-3">
              <h2 className="text-2xl font-bold mb-6">
                {selectedCategory || 'All Products'} 
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({filteredProducts.length} items)
                </span>
              </h2>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-white rounded-lg overflow-hidden shadow-md border-2 transition-all ${
                        product.status === 'discontinued' 
                          ? 'border-red-200 opacity-75' 
                          : product.status === 'limited'
                          ? 'border-orange-200'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                      }`}
                    >
                      <div className="p-4 bg-gray-50 flex items-center justify-center h-48 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CZWFtZXg8L3RleHQ+PC9zdmc+'
                          }}
                        />
                        {product.status !== 'current' && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {product.status === 'discontinued' ? 'Discontinued' : 'Limited'}
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        {getStatusBadge(product)}
                        
                        <h3 className="font-semibold text-lg mb-2">
                          {product.name}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {product.description}
                        </p>

                        {product.features && product.features.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold text-gray-700 mb-1">Key Features:</h4>
                            <ul className="text-xs text-gray-600">
                              {product.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="mb-1">• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Price Display */}
                        {product.status === 'current' && (
                          <div className="mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-blue-600">
                                {formatPrice(getPriceForProduct(product.category))}
                              </span>
                              <span className="text-xs text-gray-500">est.</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              *Estimated price. Request quote for final pricing
                            </p>
                          </div>
                        )}

                        {getReplacementInfo(product)}

                        <div className="mt-4 flex flex-col gap-2">
                          <button 
                            onClick={() => handleViewDetails(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1 py-2 border border-blue-600 rounded hover:bg-blue-50 transition-all"
                          >
                            <ExternalLink size={14} />
                            View Details
                          </button>
                          
                          {product.status === 'current' && (
                            <AddToCartButton
                              product={{
                                id: product.id,
                                name: product.name,
                                category: product.category,
                                image: product.image
                              }}
                              price={getPriceForProduct(product.category)}
                              disabled={!isProductAvailable(product.status)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <p className="text-gray-600">
                    No products found in this category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Information Footer */}
          <div className="mt-12 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Product Information & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Current Products</h4>
                <p className="text-gray-600">
                  All current products are actively supported by Beamex and available for purchase. 
                  Features and specifications are based on the latest information from Beamex.com.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Pricing Policy</h4>
                <p className="text-gray-600">
                  Prices shown are estimated base prices. Final pricing depends on configuration, 
                  accessories, quantity, and current promotions. Add items to cart and request a 
                  quote for accurate pricing tailored to your needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}