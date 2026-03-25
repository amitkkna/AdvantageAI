import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// GET /api/saved-filters?entity=Asset
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const entity = req.query.entity as string;
    const where: any = { userId: req.user!.userId };
    if (entity) where.entity = entity;

    const filters = await prisma.savedFilter.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    sendSuccess(res, filters);
  } catch (error) {
    sendError(res, 'Failed to fetch saved filters');
  }
});

// POST /api/saved-filters
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, entity, filters, isDefault } = req.body;
    if (!name || !entity || !filters) {
      sendError(res, 'name, entity, and filters are required', 400);
      return;
    }

    // If setting as default, unset existing default
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: { userId: req.user!.userId, entity, isDefault: true },
        data: { isDefault: false },
      });
    }

    const saved = await prisma.savedFilter.create({
      data: { userId: req.user!.userId, name, entity, filters, isDefault: !!isDefault },
    });
    sendSuccess(res, saved, 'Filter saved', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      sendError(res, 'A filter with this name already exists', 409);
      return;
    }
    sendError(res, 'Failed to save filter');
  }
});

// PUT /api/saved-filters/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.savedFilter.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) { sendError(res, 'Filter not found', 404); return; }

    const { name, filters, isDefault } = req.body;

    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: { userId: req.user!.userId, entity: existing.entity, isDefault: true, id: { not: existing.id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.savedFilter.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(filters && { filters }), ...(isDefault !== undefined && { isDefault }) },
    });
    sendSuccess(res, updated, 'Filter updated');
  } catch (error) {
    sendError(res, 'Failed to update filter');
  }
});

// DELETE /api/saved-filters/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.savedFilter.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) { sendError(res, 'Filter not found', 404); return; }

    await prisma.savedFilter.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Filter deleted');
  } catch (error) {
    sendError(res, 'Failed to delete filter');
  }
});

export default router;
