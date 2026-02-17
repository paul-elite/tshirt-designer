export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id: string;
  userId: string;
  name: string;
  canvasData: string;
  thumbnailUrl?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  designId: string;
  size: TShirtSize;
  color: string;
  colorName: string;
  style: TShirtStyle;
  material: TShirtMaterial;
  printArea: PrintArea;
  pricePerUnit: number;
  createdAt: string;
  design?: Design;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingMethod: ShippingMethod;
  stripePaymentId?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
export type TShirtStyle = 'crew_neck' | 'v_neck' | 'long_sleeve' | 'hoodie';
export type TShirtMaterial = 'cotton' | 'polyester_blend' | 'organic_cotton';
export type PrintArea = 'front' | 'back' | 'both';
export type ShippingMethod = 'standard' | 'express' | 'overnight';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface TShirtColor {
  name: string;
  hex: string;
}

export const TSHIRT_COLORS: TShirtColor[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
];

export const TSHIRT_SIZES: TShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export const TSHIRT_STYLES: { value: TShirtStyle; label: string; priceModifier: number }[] = [
  { value: 'crew_neck', label: 'Crew Neck', priceModifier: 0 },
  { value: 'v_neck', label: 'V-Neck', priceModifier: 2 },
  { value: 'long_sleeve', label: 'Long Sleeve', priceModifier: 5 },
  { value: 'hoodie', label: 'Hoodie', priceModifier: 15 },
];

export const TSHIRT_MATERIALS: { value: TShirtMaterial; label: string; priceModifier: number }[] = [
  { value: 'cotton', label: '100% Cotton', priceModifier: 0 },
  { value: 'polyester_blend', label: 'Polyester Blend', priceModifier: -2 },
  { value: 'organic_cotton', label: 'Organic Cotton', priceModifier: 3 },
];

export const PRINT_AREAS: { value: PrintArea; label: string; priceModifier: number }[] = [
  { value: 'front', label: 'Front Only', priceModifier: 0 },
  { value: 'back', label: 'Back Only', priceModifier: 0 },
  { value: 'both', label: 'Front & Back', priceModifier: 12 },
];

export const SHIPPING_METHODS: { value: ShippingMethod; label: string; description: string; basePrice: number }[] = [
  { value: 'standard', label: 'Standard Shipping', description: '5-7 business days', basePrice: 4.99 },
  { value: 'express', label: 'Express Shipping', description: '2-3 business days', basePrice: 9.99 },
  { value: 'overnight', label: 'Overnight Shipping', description: '1 business day', basePrice: 19.99 },
];

export const BASE_PRICE = 19.99;

export interface CanvasObject {
  id: string;
  type: 'image' | 'text' | 'rect' | 'circle';
  // Fabric.js object data
  [key: string]: unknown;
}

export interface AIGeneratedImage {
  url: string;
  prompt: string;
  style: string;
  id: string;
}

export interface PriceBreakdown {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  discountError?: string;
}
