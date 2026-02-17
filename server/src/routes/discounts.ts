import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Validate discount code
router.post('/validate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const discountCode = await prisma.discountCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!discountCode) {
      return res.status(404).json({ error: 'Invalid discount code' });
    }

    // Check expiration
    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Discount code has expired' });
    }

    // Check usage limit
    if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
      return res.status(400).json({ error: 'Discount code has been fully redeemed' });
    }

    // Check minimum order amount
    if (discountCode.minOrderAmount && subtotal < discountCode.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount: $${discountCode.minOrderAmount}`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.discountType === 'percentage') {
      discountAmount = Math.round(subtotal * (discountCode.discountValue / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discountCode.discountValue, subtotal);
    }

    res.json({
      valid: true,
      code: discountCode.code,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      discountAmount,
      description:
        discountCode.discountType === 'percentage'
          ? `${discountCode.discountValue}% off`
          : `$${discountCode.discountValue} off`,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ error: 'Failed to validate discount code' });
  }
});

export default router;
