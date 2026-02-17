import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { calculatePrice } from '../utils/pricing.js';

const router = Router();
const prisma = new PrismaClient();

// Get cart
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: {
        product: {
          include: { design: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        ...item.product,
        design: {
          id: item.product.design.id,
          name: item.product.design.name,
          thumbnailUrl: item.product.design.thumbnailUrl,
        },
      },
    }));

    const subtotal = items.reduce((sum, item) => sum + item.product.pricePerUnit * item.quantity, 0);

    res.json({ items, subtotal: Math.round(subtotal * 100) / 100 });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Add to cart
router.post('/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { designId, size, color, colorName, style, material, printArea, quantity = 1 } = req.body;

    // Verify design exists and belongs to user
    const design = await prisma.design.findFirst({
      where: { id: designId, userId: req.userId },
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Calculate price
    const pricePerUnit = calculatePrice({ size, style, material, printArea });

    // Create or find product
    let product = await prisma.product.findFirst({
      where: {
        designId,
        size,
        color,
        style,
        material,
        printArea,
      },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          designId,
          size,
          color,
          colorName,
          style,
          material,
          printArea,
          pricePerUnit,
        },
      });
    }

    // Add to cart or update quantity
    const existingCartItem = await prisma.cartItem.findFirst({
      where: { userId: req.userId, productId: product.id },
    });

    let cartItem;
    if (existingCartItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
        include: { product: { include: { design: true } } },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.userId!,
          productId: product.id,
          quantity,
        },
        include: { product: { include: { design: true } } },
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item quantity
router.put('/items/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity },
      include: { product: { include: { design: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove from cart
router.delete('/items/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id: req.params.id } });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Clear cart
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.userId },
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
