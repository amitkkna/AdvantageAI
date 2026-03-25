import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createClientSchema, updateClientSchema, paginationSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';

const router = Router();

// GET /api/clients
router.get('/', authenticate, authorize('ADMIN', 'SALES', 'FINANCE'), validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const where = { isActive: true };
    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.client.count({ where }),
    ]);
    sendPaginated(res, clients, paginate(page, limit, total));
  } catch (error) {
    sendError(res, 'Failed to fetch clients');
  }
});

// GET /api/clients/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { campaigns: true, users: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!client) { sendError(res, 'Client not found', 404); return; }
    sendSuccess(res, client);
  } catch (error) {
    sendError(res, 'Failed to fetch client');
  }
});

// POST /api/clients
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createClientSchema), async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.create({ data: req.body });
    sendSuccess(res, client, 'Client created', 201);
  } catch (error) {
    sendError(res, 'Failed to create client');
  }
});

// PUT /api/clients/:id
router.put('/:id', authenticate, authorize('ADMIN', 'SALES'), validate(updateClientSchema), async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, client, 'Client updated');
  } catch (error) {
    sendError(res, 'Failed to update client');
  }
});

export default router;
