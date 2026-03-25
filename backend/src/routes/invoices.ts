import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createInvoiceSchema, updateInvoiceStatusSchema, paginationSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';
import { logActivity } from './activityLogs';

const router = Router();

// GET /api/invoices
router.get('/', authenticate, validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const where: any = {};
    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.clientId = req.user!.clientId;
    }
    if (req.query.status) where.status = req.query.status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          campaign: { select: { id: true, name: true } },
          client: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);
    sendPaginated(res, invoices, paginate(page, limit, total));
  } catch (error) {
    sendError(res, 'Failed to fetch invoices');
  }
});

// GET /api/invoices/summary - Financial summary
router.get('/summary', authenticate, authorize('ADMIN', 'FINANCE'), async (_req: Request, res: Response) => {
  try {
    const [total, paid, overdue, pending] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, _count: true }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true }, _count: true }),
      prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { totalAmount: true }, _count: true }),
      prisma.invoice.aggregate({ where: { status: { in: ['DRAFT', 'SENT'] } }, _sum: { totalAmount: true }, _count: true }),
    ]);

    sendSuccess(res, {
      totalInvoiced: total._sum.totalAmount || 0,
      totalCount: total._count,
      collected: paid._sum.totalAmount || 0,
      collectedCount: paid._count,
      overdue: overdue._sum.totalAmount || 0,
      overdueCount: overdue._count,
      pending: pending._sum.totalAmount || 0,
      pendingCount: pending._count,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch invoice summary');
  }
});

// POST /api/invoices
router.post('/', authenticate, authorize('ADMIN', 'FINANCE'), validate(createInvoiceSchema), async (req: Request, res: Response) => {
  try {
    const { amount, tax } = req.body;
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        ...req.body,
        invoiceNumber,
        totalAmount: amount + tax,
        dueDate: new Date(req.body.dueDate),
      },
      include: {
        campaign: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
      },
    });

    // Notify client users
    const clientUsers = await prisma.user.findMany({
      where: { clientId: req.body.clientId, role: 'CLIENT' },
      select: { id: true },
    });
    if (clientUsers.length > 0) {
      await prisma.notification.createMany({
        data: clientUsers.map((u) => ({
          userId: u.id,
          type: 'INVOICE_GENERATED' as const,
          title: 'New Invoice Generated',
          message: `Invoice ${invoiceNumber} for ${invoice.client.companyName} has been generated`,
          metadata: { invoiceId: invoice.id, campaignId: invoice.campaignId },
        })),
      });
    }

    sendSuccess(res, invoice, 'Invoice created', 201);
  } catch (error) {
    sendError(res, 'Failed to create invoice');
  }
});

// POST /api/invoices/generate-from-campaign/:campaignId - Auto-generate invoice from confirmed bookings
router.post('/generate-from-campaign/:campaignId', authenticate, authorize('ADMIN', 'FINANCE'), async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.campaignId },
      include: {
        client: { select: { id: true, companyName: true } },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: { amount: true },
        },
      },
    });

    if (!campaign) { sendError(res, 'Campaign not found', 404); return; }
    if (campaign.bookings.length === 0) {
      sendError(res, 'No confirmed bookings to invoice', 400);
      return;
    }

    const amount = campaign.bookings.reduce((sum, b) => sum + b.amount, 0);
    const taxRate = 0.18; // 18% GST
    const tax = Math.round(amount * taxRate);
    const totalAmount = amount + tax;

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        campaignId: campaign.id,
        clientId: campaign.clientId,
        amount,
        tax,
        totalAmount,
        dueDate,
        notes: `Auto-generated from campaign "${campaign.name}" with ${campaign.bookings.length} confirmed booking(s)`,
      },
      include: {
        campaign: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
      },
    });

    await logActivity(req.user!.userId, 'CREATE', 'Invoice', invoice.id, { auto: true, campaignId: campaign.id }, req.ip);
    sendSuccess(res, invoice, 'Invoice auto-generated from campaign bookings', 201);
  } catch (error) {
    console.error('Auto-generate invoice error:', error);
    sendError(res, 'Failed to generate invoice');
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'FINANCE'), validate(updateInvoiceStatusSchema), async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: { select: { companyName: true } } },
    });
    if (!invoice) { sendError(res, 'Invoice not found', 404); return; }

    const { status, paymentMethod, paymentRef } = req.body;
    const updateData: any = { status };

    if (status === 'PAID') {
      updateData.paidAt = new Date();
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (paymentRef) updateData.paymentRef = paymentRef;
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        campaign: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
      },
    });

    // Notify on payment received
    if (status === 'PAID') {
      const staff = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'FINANCE'] } },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: staff.map((u) => ({
          userId: u.id,
          type: 'PAYMENT_RECEIVED' as const,
          title: 'Payment Received',
          message: `Payment received for invoice ${invoice.invoiceNumber} from ${invoice.client.companyName}${paymentMethod ? ` via ${paymentMethod}` : ''}`,
          metadata: { invoiceId: invoice.id },
        })),
      });
    }

    await logActivity(req.user!.userId, 'STATUS_CHANGE', 'Invoice', invoice.id, { before: { status: invoice.status }, after: { status } }, req.ip);
    sendSuccess(res, updated, 'Invoice status updated');
  } catch (error) {
    sendError(res, 'Failed to update invoice status');
  }
});

export default router;
