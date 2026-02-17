export interface PricingOptions {
  style: string;
  material: string;
  printArea: string;
  size: string;
}

const BASE_PRICE = 19.99;

const STYLE_MODIFIERS: Record<string, number> = {
  crew_neck: 0,
  v_neck: 2,
  long_sleeve: 5,
  hoodie: 15,
};

const MATERIAL_MODIFIERS: Record<string, number> = {
  cotton: 0,
  polyester_blend: -2,
  organic_cotton: 3,
};

const PRINT_AREA_MODIFIERS: Record<string, number> = {
  front: 0,
  back: 0,
  both: 12,
};

const SIZE_MODIFIERS: Record<string, number> = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  '2XL': 2,
  '3XL': 2,
};

export function calculatePrice(options: PricingOptions): number {
  let price = BASE_PRICE;

  price += STYLE_MODIFIERS[options.style] || 0;
  price += MATERIAL_MODIFIERS[options.material] || 0;
  price += PRINT_AREA_MODIFIERS[options.printArea] || 0;
  price += SIZE_MODIFIERS[options.size] || 0;

  return Math.round(price * 100) / 100;
}

export function calculateShipping(method: string, itemCount: number): number {
  const baseShipping: Record<string, number> = {
    standard: 4.99,
    express: 9.99,
    overnight: 19.99,
  };

  const base = baseShipping[method] || 4.99;
  const additionalItems = Math.max(0, itemCount - 1);

  return Math.round((base + additionalItems * 1.5) * 100) / 100;
}

export function calculateTax(subtotal: number, state: string): number {
  // Simplified tax rates by state
  const taxRates: Record<string, number> = {
    CA: 0.0725,
    NY: 0.08,
    TX: 0.0625,
    FL: 0.06,
    // Default tax rate
    DEFAULT: 0.05,
  };

  const rate = taxRates[state] || taxRates.DEFAULT;
  return Math.round(subtotal * rate * 100) / 100;
}

export function getEstimatedDeliveryDays(method: string): { min: number; max: number } {
  const deliveryDays: Record<string, { min: number; max: number }> = {
    standard: { min: 5, max: 7 },
    express: { min: 2, max: 3 },
    overnight: { min: 1, max: 1 },
  };

  return deliveryDays[method] || deliveryDays.standard;
}
