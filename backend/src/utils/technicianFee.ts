// Technician fee matrix: purpose + location + product interest (capped at ₱30).
// Fee is additive: base(purpose) + adjustment(location) + adjustment(product), max ₱30.

export const PURPOSE_FEE: Record<string, number> = {
  'Product Demonstration': 5,
  'Technical Consultation': 6,
  'Calibration Services': 10,
  'Software Training': 7,
  'Maintenance Support': 9,
  'General Inquiry': 3,
  'Other': 4,
};

export const LOCATION_FEE: Record<string, number> = {
  'Accuro Office': 2,
  'Virtual Meeting': 1,
  'Client Site': 5,
  'Other': 3,
};

export const PRODUCT_FEE: Record<string, number> = {
  'Beamex Calibrators': 5,
  'Beamex Calibration Benches': 8,
  'Beamex Calibration Software': 3,
  'Beamex Calibration Accessories': 2,
  'Beamex Pressure Measurement': 5,
  'Beamex Temperature Measurement': 5,
  'Beamex Electrical Measurement': 5,
  'Beamex Integrated Solutions': 9,
  'Not sure / Need recommendation': 2,
};

export const FEE_CAP = 30;

export interface FeeBreakdown {
  purposeFee: number;
  locationFee: number;
  productFee: number;
  subtotal: number;
  total: number;
  capped: boolean;
}

export function computeTechnicianFee(
  purpose: string,
  location: string,
  product: string
): FeeBreakdown {
  const purposeFee = PURPOSE_FEE[purpose] ?? 4;
  const locationFee = LOCATION_FEE[location] ?? 3;
  const productFee = PRODUCT_FEE[product] ?? 2;
  const subtotal = purposeFee + locationFee + productFee;
  const total = Math.min(subtotal, FEE_CAP);
  return {
    purposeFee,
    locationFee,
    productFee,
    subtotal,
    total,
    capped: subtotal > FEE_CAP,
  };
}
