// Pricing utility functions
// This file contains the pricing logic for Beamex products

/**
 * Get estimated price for a product based on its category
 * Note: These are estimated prices. Final pricing will be confirmed in quote.
 */
export function getPriceForProduct(category: string): number {
  const priceMap: { [key: string]: number } = {
    'Field Calibrators': 8500,
    'Workshop Calibrators': 12000,
    'Temperature Calibrators': 6500,
    'Calibration Software': 15000,
    'Calibration Benches': 25000,
    'Pressure Generation': 4500,
    'Accessories & Modules': 1200,
    'Discontinued Products': 0, // Not available for purchase
  }
  
  return priceMap[category] || 5000 // Default price if category not found
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`
}

/**
 * Check if product is available for purchase
 */
export function isProductAvailable(status: 'current' | 'discontinued' | 'limited'): boolean {
  return status === 'current'
}