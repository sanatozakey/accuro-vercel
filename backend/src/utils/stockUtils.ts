export type StockStatus = 'out_of_stock' | 'low_stock' | 'in_stock';

/**
 * Determine the stock status based on quantity and threshold
 */
export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) {
    return 'out_of_stock';
  } else if (quantity <= threshold) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
}

/**
 * Get display label for stock status
 */
export function getStockLabel(
  status: StockStatus,
  quantity: number,
  showExactQuantity: boolean
): string {
  switch (status) {
    case 'out_of_stock':
      return 'Out of Stock';
    case 'low_stock':
      return showExactQuantity ? `Only ${quantity} left` : 'Low Stock';
    case 'in_stock':
      return showExactQuantity ? `${quantity} available` : 'In Stock';
    default:
      return 'Unknown';
  }
}

/**
 * Get color class for stock status
 */
export function getStockColor(status: StockStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'out_of_stock':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    case 'low_stock':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      };
    case 'in_stock':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
  }
}

/**
 * Prepare product with stock info for API response
 */
export function prepareProductWithStock(
  product: any,
  showExactQuantity: boolean
) {
  if (!product.trackInventory) {
    return {
      ...product,
      stockStatus: null,
      stockLabel: null,
      canPurchase: true,
    };
  }

  const status = getStockStatus(product.stockQuantity, product.lowStockThreshold);
  const label = getStockLabel(status, product.stockQuantity, showExactQuantity);

  return {
    ...product,
    stockStatus: status,
    stockLabel: label,
    canPurchase: status !== 'out_of_stock',
  };
}
