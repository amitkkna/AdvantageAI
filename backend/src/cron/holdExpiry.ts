import cron from 'node-cron';
import { prisma } from '../config/database';

export function startHoldExpiryCron() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      // 1. Cancel expired holds
      const expiredHolds = await prisma.booking.findMany({
        where: {
          status: 'HOLD',
          holdExpiresAt: { lte: new Date() },
        },
        include: {
          campaign: { select: { name: true, assignedToId: true } },
          asset: { select: { code: true, name: true } },
        },
      });

      for (const booking of expiredHolds) {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CANCELLED' },
          }),
          prisma.availabilityBlock.deleteMany({
            where: { bookingId: booking.id },
          }),
        ]);

        // Notify assigned user about expired hold
        const notifyUserId = booking.campaign.assignedToId;
        if (notifyUserId) {
          await prisma.notification.create({
            data: {
              userId: notifyUserId,
              type: 'HOLD_EXPIRED' as any,
              title: 'Booking Hold Expired',
              message: `Hold on ${booking.asset.name} (${booking.asset.code}) for "${booking.campaign.name}" has expired and was auto-cancelled`,
              metadata: { bookingId: booking.id, campaignId: booking.campaignId },
            },
          });
        }

        console.log(`Hold expired for booking ${booking.id}`);
      }

      if (expiredHolds.length > 0) {
        console.log(`Expired ${expiredHolds.length} holds`);
      }

      // 2. Warn about holds expiring within 2 hours
      const soonExpiring = await prisma.booking.findMany({
        where: {
          status: 'HOLD',
          holdExpiresAt: {
            gt: new Date(),
            lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
          },
        },
        include: {
          campaign: { select: { name: true, assignedToId: true } },
          asset: { select: { code: true, name: true } },
        },
      });

      for (const booking of soonExpiring) {
        const notifyUserId = booking.campaign.assignedToId;
        if (!notifyUserId) continue;

        // Check if we already sent a HOLD_EXPIRING notification for this booking recently
        const existing = await prisma.notification.findFirst({
          where: {
            userId: notifyUserId,
            type: 'HOLD_EXPIRING',
            metadata: { path: ['bookingId'], equals: booking.id },
            createdAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
          },
        });
        if (existing) continue;

        const minutesLeft = Math.round((new Date(booking.holdExpiresAt!).getTime() - Date.now()) / 60000);
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'HOLD_EXPIRING',
            title: 'Booking Hold Expiring Soon',
            message: `Hold on ${booking.asset.name} (${booking.asset.code}) expires in ${minutesLeft} minutes. Confirm or it will be auto-cancelled.`,
            metadata: { bookingId: booking.id, campaignId: booking.campaignId },
          },
        });
      }
    } catch (error) {
      console.error('Hold expiry cron error:', error);
    }
  });
  console.log('Hold expiry cron started (every 5 min)');
}

export function startInvoiceOverdueCron() {
  // Run daily at 8 AM IST (2:30 UTC)
  cron.schedule('30 2 * * *', async () => {
    try {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'SENT',
          dueDate: { lt: new Date() },
        },
        include: {
          client: { select: { companyName: true } },
          campaign: { select: { name: true } },
        },
      });

      for (const invoice of overdueInvoices) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'OVERDUE' },
        });

        const staff = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'FINANCE'] } },
          select: { id: true },
        });
        await prisma.notification.createMany({
          data: staff.map((u) => ({
            userId: u.id,
            type: 'INVOICE_OVERDUE' as any,
            title: 'Invoice Overdue',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.client.companyName} is overdue`,
            metadata: { invoiceId: invoice.id, campaignId: invoice.campaignId },
          })),
        });
      }

      if (overdueInvoices.length > 0) {
        console.log(`Marked ${overdueInvoices.length} invoices as overdue`);
      }
    } catch (error) {
      console.error('Invoice overdue cron error:', error);
    }
  });
  console.log('Invoice overdue cron started (daily 8 AM IST)');
}

export function startRentalAlertCron() {
  // Run daily at 9 AM IST
  cron.schedule('30 3 * * *', async () => {
    try {
      const alertDays = [30, 14, 7];
      for (const days of alertDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const expiring = await prisma.rentalAgreement.findMany({
          where: {
            isActive: true,
            endDate: { gte: targetDate, lt: nextDay },
          },
          include: { vendor: true },
        });

        for (const agreement of expiring) {
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true },
          });

          await prisma.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: 'RENTAL_EXPIRY_ALERT' as const,
              title: `Rental Agreement Expiring in ${days} days`,
              message: `Agreement with ${agreement.vendor.name} expires on ${agreement.endDate.toLocaleDateString()}`,
              metadata: { agreementId: agreement.id, vendorId: agreement.vendorId },
            })),
          });
        }
      }
    } catch (error) {
      console.error('Rental alert cron error:', error);
    }
  });
  console.log('Rental alert cron started (daily 9 AM IST)');
}
