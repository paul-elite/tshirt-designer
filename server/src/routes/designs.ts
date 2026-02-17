import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all designs for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const designs = await prisma.design.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(designs);
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Failed to get designs' });
  }
});

// Get single design
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const design = await prisma.design.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { products: true },
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({ error: 'Failed to get design' });
  }
});

// Create design
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, canvasData, thumbnailUrl, isDraft } = req.body;

    const design = await prisma.design.create({
      data: {
        userId: req.userId!,
        name: name || 'Untitled Design',
        canvasData: typeof canvasData === 'string' ? canvasData : JSON.stringify(canvasData),
        thumbnailUrl,
        isDraft: isDraft ?? true,
      },
    });

    res.status(201).json(design);
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Update design
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, canvasData, thumbnailUrl, isDraft } = req.body;

    const existing = await prisma.design.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }

    const design = await prisma.design.update({
      where: { id: req.params.id },
      data: {
        name,
        canvasData: canvasData ? (typeof canvasData === 'string' ? canvasData : JSON.stringify(canvasData)) : undefined,
        thumbnailUrl,
        isDraft,
      },
    });

    res.json(design);
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Delete design
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.design.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }

    await prisma.design.delete({ where: { id: req.params.id } });

    res.json({ message: 'Design deleted' });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

export default router;
