import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const addressSchema = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Get all addresses
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to get addresses' });
  }
});

// Get single address
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Failed to get address' });
  }
});

// Create address
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = addressSchema.parse(req.body);

    // If this is the first address or set as default, update other addresses
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address
    const existingCount = await prisma.address.count({
      where: { userId: req.userId },
    });

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: req.userId!,
        isDefault: data.isDefault || existingCount === 0,
      },
    });

    res.status(201).json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// Update address
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = addressSchema.partial().parse(req.body);

    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, update other addresses
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId, isDefault: true, id: { not: req.params.id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data,
    });

    res.json(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id: req.params.id } });

    // If deleted address was default, set another as default
    if (existing.isDefault) {
      const another = await prisma.address.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (another) {
        await prisma.address.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Set address as default
router.post('/:id/default', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Update all addresses to not default
    await prisma.address.updateMany({
      where: { userId: req.userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this address as default
    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });

    res.json(address);
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

export default router;
