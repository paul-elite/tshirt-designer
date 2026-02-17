import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { calculateShipping, calculateTax } from '../utils/pricing.js';

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe (will work in test mode with test keys)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

// Create payment intent
router.post('/create-intent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { addressId, shippingMethod, discountCode } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Get address for tax calculation
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.userId },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.pricePerUnit * item.quantity,
      0
    );

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = calculateShipping(shippingMethod, totalItems);
    const tax = calculateTax(subtotal, address.state);

    // Handle discount
    let discount = 0;
    if (discountCode) {
      const code = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      });

      if (code) {
        if (code.discountType === 'percentage') {
          discount = Math.round(subtotal * (code.discountValue / 100) * 100) / 100;
        } else {
          discount = code.discountValue;
        }
      }
    }

    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.userId!,
        addressId,
        shippingMethod,
        discountCode: discountCode || '',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        subtotal,
        shipping,
        tax,
        discount,
        total,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Calculate order totals (for preview)
router.post('/calculate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { addressId, shippingMethod, discountCode } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.json({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0,
      });
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.pricePerUnit * item.quantity,
      0
    );

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Shipping
    const shipping = shippingMethod ? calculateShipping(shippingMethod, totalItems) : 0;

    // Tax (needs address)
    let tax = 0;
    if (addressId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } });
      if (address) {
        tax = calculateTax(subtotal, address.state);
      }
    }

    // Discount
    let discount = 0;
    let discountError = null;
    if (discountCode) {
      const code = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      });

      if (code) {
        if (code.minOrderAmount && subtotal < code.minOrderAmount) {
          discountError = `Minimum order amount: $${code.minOrderAmount}`;
        } else if (code.maxUses && code.usedCount >= code.maxUses) {
          discountError = 'Discount code has been fully redeemed';
        } else {
          if (code.discountType === 'percentage') {
            discount = Math.round(subtotal * (code.discountValue / 100) * 100) / 100;
          } else {
            discount = Math.min(code.discountValue, subtotal);
          }
        }
      } else {
        discountError = 'Invalid discount code';
      }
    }

    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    res.json({
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total,
      discountError,
    });
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({ error: 'Failed to calculate totals' });
  }
});

export default router;
