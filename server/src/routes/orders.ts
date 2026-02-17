import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { calculateShipping, calculateTax } from '../utils/pricing.js';

const router = Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              include: { design: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              include: { design: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create order from cart
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { addressId, shippingMethod, discountCode, stripePaymentId } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify address
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

        // Update usage count
        await prisma.discountCode.update({
          where: { id: code.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: req.userId!,
        addressId,
        status: stripePaymentId ? 'paid' : 'pending',
        subtotal,
        shipping,
        tax,
        discount,
        total,
        shippingMethod,
        stripePaymentId,
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.pricePerUnit,
          })),
        },
      },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              include: { design: true },
            },
          },
        },
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: req.userId },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (for admin or webhooks)
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, trackingNumber },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
