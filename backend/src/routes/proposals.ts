import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';
import { validate } from '../middleware/validate';
import { updateProposalStatusSchema, VALID_PROPOSAL_TRANSITIONS } from '@advantage/shared';
import { logActivity } from './activityLogs';
import { env } from '../config/env';

const router = Router();

// ─── Helper: fetch image as buffer ───
function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Image fetch timeout')), 8000);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      // Follow redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        clearTimeout(timeout);
        fetchImageBuffer(response.headers.location).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        clearTimeout(timeout);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      });
      response.on('error', (e) => {
        clearTimeout(timeout);
        reject(e);
      });
    }).on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

// ─── Helper: get Google Maps Static image URL ───
function getStaticMapUrl(lat: number, lng: number, zoom: number = 15, width: number = 600, height: number = 300): string | null {
  const key = env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${key}`;
}

// GET /api/proposals
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const where: any = {};

    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.clientId = req.user!.clientId;
    }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, companyName: true, contactPerson: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proposal.count({ where }),
    ]);
    sendPaginated(res, proposals, paginate(page, limit, total));
  } catch (error) {
    sendError(res, 'Failed to fetch proposals');
  }
});

// GET /api/proposals/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { client: true, campaign: true },
    });
    if (!proposal) { sendError(res, 'Proposal not found', 404); return; }
    sendSuccess(res, proposal);
  } catch (error) {
    sendError(res, 'Failed to fetch proposal');
  }
});

// GET /api/proposals/:id/pdf — Generate rich PDF with maps and photos
router.get('/:id/pdf', authenticate, async (req: Request, res: Response) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!proposal) { sendError(res, 'Proposal not found', 404); return; }

    const assets = (proposal.assets as any[]) || [];

    // Fetch full asset data with ALL photos
    const assetIds = assets.map((a: any) => a.assetId).filter(Boolean);
    const fullAssets = assetIds.length > 0
      ? await prisma.asset.findMany({
          where: { id: { in: assetIds } },
          include: {
            photos: { orderBy: { isPrimary: 'desc' }, take: 3 },
            vendor: { select: { name: true, contactPerson: true, phone: true } },
          },
        })
      : [];
    const assetMap = new Map<string, (typeof fullAssets)[number]>(
      fullAssets.map((a) => [a.id, a] as const)
    );

    // Pre-fetch all map images in parallel
    const mapImages = new Map<string, Buffer>();
    const photoImages = new Map<string, Buffer>();

    const fetchPromises: Promise<void>[] = [];

    for (const asset of assets) {
      const full = assetMap.get(asset.assetId);
      if (full?.latitude && full?.longitude) {
        const mapUrl = getStaticMapUrl(full.latitude, full.longitude);
        if (mapUrl) {
          fetchPromises.push(
            fetchImageBuffer(mapUrl)
              .then((buf) => { mapImages.set(asset.assetId, buf); })
              .catch(() => {}) // silently skip failed fetches
          );
        }
      }
      // Fetch asset photos
      if (full?.photos) {
        for (const photo of full.photos) {
          if (photo.url && (photo.url.startsWith('http://') || photo.url.startsWith('https://'))) {
            fetchPromises.push(
              fetchImageBuffer(photo.url)
                .then((buf) => { photoImages.set(photo.id, buf); })
                .catch(() => {})
            );
          }
        }
      }
    }

    await Promise.allSettled(fetchPromises);

    // ═══ BUILD PREMIUM PDF ═══
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AdVantage-Proposal-${proposal.id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // ── Premium Color Palette ──
    const navy = '#0f172a';
    const darkSlate = '#1e293b';
    const gold = '#b8860b';
    const lightGold = '#d4a843';
    const bodyText = '#334155';
    const secondary = '#64748b';
    const lightBg = '#f8fafc';
    const gridLine = '#cbd5e1';
    const green = '#16a34a';
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 50;
    const contentW = pageW - margin * 2;
    const borderInset = 25;
    const innerInset = 28;

    const totalMonthly = assets.reduce((s: number, a: any) => s + (a.monthlyRate || 0), 0);

    // ── Helper: draw page borders (called in footer loop) ──
    const drawPageBorders = (pageDoc: typeof doc) => {
      // Outer navy border
      pageDoc.save();
      pageDoc.rect(borderInset, borderInset, pageW - borderInset * 2, pageH - borderInset * 2)
        .lineWidth(1.2).stroke(navy);
      // Inner gold hairline
      pageDoc.rect(innerInset, innerInset, pageW - innerInset * 2, pageH - innerInset * 2)
        .lineWidth(0.4).stroke(gold);
      pageDoc.restore();
    };

    // ══════════════════════════════════════════════
    // ═══ PAGE 1: PREMIUM COVER ═══
    // ══════════════════════════════════════════════

    // Navy header band
    doc.rect(0, 0, pageW, 210).fill(navy);
    // Gold bottom accent line
    doc.rect(0, 210, pageW, 2.5).fill(gold);

    // Logo / brand
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(38).text('AdVantage', margin + 10, 55, { lineBreak: false });
    doc.font('Helvetica').fillColor(lightGold).fontSize(13).text('OOH Advertising Solutions', margin + 10, 100, { lineBreak: false });

    // Gold decorative divider
    doc.rect(margin + 10, 130, 60, 2).fill(gold);

    // Proposal number
    doc.fillColor('#ffffff').font('Helvetica').fontSize(9)
      .text(`PROPOSAL  #${proposal.id.slice(0, 8).toUpperCase()}`, margin + 10, 148, { lineBreak: false });
    doc.fillColor(secondary).fontSize(8)
      .text(new Date(proposal.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 10, 165, { lineBreak: false });

    // ── Proposal Title ──
    let y = 240;
    doc.font('Helvetica-Bold').fillColor(navy).fontSize(28).text(proposal.title, margin + 10, y, { width: contentW - 20, lineBreak: false });
    y += 40;

    // ── Client Info Card (bordered with gold left accent) ──
    if (proposal.client) {
      const cardH = 85;
      // Light background
      doc.rect(margin + 10, y, contentW - 20, cardH).fill(lightBg);
      // Gold left border
      doc.rect(margin + 10, y, 3.5, cardH).fill(gold);
      // Card outline
      doc.rect(margin + 10, y, contentW - 20, cardH).lineWidth(0.5).stroke(gridLine);

      const cx = margin + 28;
      doc.font('Helvetica').fillColor(secondary).fontSize(9).text('PREPARED FOR', cx, y + 12, { lineBreak: false });
      doc.font('Helvetica-Bold').fillColor(navy).fontSize(16).text(proposal.client.companyName, cx, y + 28, { lineBreak: false });
      let cy = y + 50;
      if (proposal.client.contactPerson) {
        doc.font('Helvetica').fillColor(bodyText).fontSize(9).text(`Contact: ${proposal.client.contactPerson}`, cx, cy, { lineBreak: false });
        cy += 14;
      }
      if (proposal.client.email) {
        doc.font('Helvetica').fillColor(bodyText).fontSize(9).text(`Email: ${proposal.client.email}`, cx, cy, { lineBreak: false });
      }
      y += cardH + 20;
    }

    // ── Campaign Overview ──
    if (proposal.description) {
      y = Math.max(y, 420);
      doc.font('Helvetica-Bold').fillColor(darkSlate).fontSize(13).text('Campaign Overview', margin + 10, y, { lineBreak: false });
      // Gold underline
      doc.rect(margin + 10, y + 18, 100, 1.5).fill(gold);
      y += 28;
      doc.font('Helvetica').fillColor(bodyText).fontSize(10).text(proposal.description, margin + 10, y, { width: contentW - 20, lineBreak: false });
      y += 25;
    }

    // ── Budget Highlight Box (gold border) ──
    y = Math.max(y, 540);
    const budgetH = 80;
    doc.rect(margin + 10, y, contentW - 20, budgetH).lineWidth(1.5).stroke(gold);
    // Gold left accent
    doc.rect(margin + 10, y, 4, budgetH).fill(gold);
    // Content
    doc.font('Helvetica').fillColor(secondary).fontSize(9).text('TOTAL CAMPAIGN BUDGET', margin + 30, y + 14, { lineBreak: false });
    doc.font('Helvetica-Bold').fillColor(navy).fontSize(30).text(
      `Rs.${proposal.totalBudget.toLocaleString('en-IN')}`, margin + 30, y + 32, { lineBreak: false }
    );
    doc.font('Helvetica').fillColor(secondary).fontSize(10).text(
      `${assets.length} locations  |  Rs.${totalMonthly.toLocaleString('en-IN')}/month`,
      margin + 30, y + 62, { lineBreak: false }
    );

    // Status badge (top right of budget box)
    const statusW = 70;
    doc.rect(margin + contentW - 20 - statusW, y + 10, statusW, 22).fill(navy);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(
      proposal.status, margin + contentW - 20 - statusW, y + 16, { width: statusW, align: 'center', lineBreak: false }
    );

    // ══════════════════════════════════════════════
    // ═══ PAGE 2: BILLBOARD SUMMARY TABLE ═══
    // ══════════════════════════════════════════════
    doc.addPage();

    // Section title with gold underline
    doc.font('Helvetica-Bold').fillColor(navy).fontSize(20).text('Billboard Summary', margin + 10, margin + 15, { lineBreak: false });
    doc.rect(margin + 10, margin + 40, 120, 2).fill(gold);

    y = margin + 55;

    // ── Table column definitions ──
    const cols = [
      { label: '#', x: margin, w: 25 },
      { label: 'Billboard', x: margin + 25, w: 160 },
      { label: 'City', x: margin + 185, w: 65 },
      { label: 'Type', x: margin + 250, w: 70 },
      { label: 'Size (ft)', x: margin + 320, w: 50 },
      { label: 'Score', x: margin + 370, w: 35 },
      { label: 'Rate/Month', x: margin + 405, w: contentW - 405 },
    ];
    const rowH = 26;
    const headerH = 26;

    // ── Table Header ──
    doc.rect(margin, y, contentW, headerH).fill(navy);
    // Gold line under header
    doc.rect(margin, y + headerH, contentW, 1.5).fill(gold);
    // Header text
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    cols.forEach((col) => {
      doc.text(col.label, col.x + 6, y + 8, { width: col.w - 12, lineBreak: false });
    });
    // Vertical grid lines in header
    doc.save();
    doc.lineWidth(0.3).strokeColor('#ffffff').strokeOpacity(0.3);
    cols.slice(1).forEach((col) => {
      doc.moveTo(col.x, y + 4).lineTo(col.x, y + headerH - 4).stroke();
    });
    doc.restore();
    y += headerH + 1.5;

    // ── Table Rows ──
    assets.forEach((asset: any, i: number) => {
      if (y > 710) {
        // Draw table border around current page section
        doc.addPage();
        y = margin + 10;
      }

      // Alternating row fill
      doc.rect(margin, y, contentW, rowH).fill(i % 2 === 0 ? '#ffffff' : lightBg);

      // Horizontal grid line (bottom of row)
      doc.moveTo(margin, y + rowH).lineTo(margin + contentW, y + rowH).lineWidth(0.3).stroke(gridLine);

      // Vertical grid lines
      doc.save();
      doc.lineWidth(0.3).strokeColor(gridLine);
      cols.slice(1).forEach((col) => {
        doc.moveTo(col.x, y).lineTo(col.x, y + rowH).stroke();
      });
      doc.restore();

      // Left + right table border for this row
      doc.save();
      doc.lineWidth(0.5).strokeColor(navy);
      doc.moveTo(margin, y).lineTo(margin, y + rowH).stroke();
      doc.moveTo(margin + contentW, y).lineTo(margin + contentW, y + rowH).stroke();
      doc.restore();

      // Row data — all single-line, vertically centered
      const ry = y + 8;
      doc.font('Helvetica').fillColor(bodyText).fontSize(8);
      doc.text(`${i + 1}`, cols[0].x + 4, ry, { width: cols[0].w - 8, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(navy).text(
        asset.name || 'N/A', cols[1].x + 6, ry, { width: cols[1].w - 12, lineBreak: false, ellipsis: true }
      );
      doc.font('Helvetica').fillColor(bodyText).fontSize(8);
      doc.text(asset.city || '', cols[2].x + 6, ry, { width: cols[2].w - 12, lineBreak: false });
      doc.text((asset.type || '').replace(/_/g, ' '), cols[3].x + 6, ry, { width: cols[3].w - 12, lineBreak: false });
      doc.text(`${asset.width || '?'}x${asset.height || '?'}`, cols[4].x + 4, ry, { width: cols[4].w - 8, lineBreak: false });
      if (asset.score) {
        const scoreColor = asset.score >= 70 ? green : asset.score >= 50 ? '#f59e0b' : '#ef4444';
        doc.fillColor(scoreColor).font('Helvetica-Bold').text(`${asset.score}`, cols[5].x + 6, ry, { width: cols[5].w - 12, lineBreak: false });
      }
      doc.font('Helvetica-Bold').fillColor(navy).fontSize(8);
      doc.text(`Rs.${(asset.monthlyRate || 0).toLocaleString('en-IN')}`, cols[6].x + 6, ry, { width: cols[6].w - 12, lineBreak: false });

      y += rowH;
    });

    // ── Total Row ──
    y += 1;
    const totalRowH = 30;
    doc.rect(margin, y, contentW, totalRowH).fill(navy);
    // Gold accent line above total
    doc.rect(margin, y - 1, contentW, 2).fill(gold);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text(`TOTAL  —  ${assets.length} sites`, margin + 31, y + 9, { lineBreak: false });
    doc.text(`Rs.${totalMonthly.toLocaleString('en-IN')}/mo`, cols[6].x + 6, y + 9, { width: cols[6].w - 12, lineBreak: false });

    // ══════════════════════════════════════════════
    // ═══ PAGES 3+: ASSET DETAIL PAGES ═══
    // ══════════════════════════════════════════════
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const full = assetMap.get(asset.assetId);

      doc.addPage();

      // ── Navy header band with gold accent ──
      doc.rect(0, 0, pageW, 48).fill(navy);
      doc.rect(0, 48, pageW, 2).fill(gold);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
      doc.text(`Location ${i + 1} of ${assets.length}`, margin + 10, 16, { lineBreak: false });
      doc.font('Helvetica').fillColor(lightGold).fontSize(9).text(
        asset.name || 'Billboard', margin + 250, 18, { align: 'right', width: 230, lineBreak: false }
      );

      y = 68;

      // ── Asset Name + Code ──
      doc.font('Helvetica-Bold').fillColor(navy).fontSize(22).text(asset.name || 'Billboard', margin + 10, y, { lineBreak: false });
      y += 28;
      if (asset.code) {
        doc.font('Helvetica').fillColor(secondary).fontSize(10).text(`Code: ${asset.code}`, margin + 10, y, { lineBreak: false });
        y += 18;
      }

      // ── Score badge (circle) ──
      if (asset.score) {
        const scoreColor = asset.score >= 70 ? green : asset.score >= 50 ? '#f59e0b' : '#ef4444';
        const badgeX = margin + contentW - 35;
        const badgeY = 75;
        doc.circle(badgeX, badgeY, 22).fill(scoreColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text(
          `${asset.score}`, badgeX - 18, badgeY - 12, { width: 36, align: 'center', lineBreak: false }
        );
        doc.fontSize(6).text('SCORE', badgeX - 18, badgeY + 6, { width: 36, align: 'center', lineBreak: false });
      }

      y += 5;

      // ── Two-column layout: Map (left) + Details Grid (right) ──
      const mapW = 240;
      const mapH = 155;
      const detailX = margin + mapW + 15;
      const detailW = contentW - mapW - 15;
      const mapY = y;

      // ── Map image with double frame ──
      const mapBuf = mapImages.get(asset.assetId);
      if (mapBuf) {
        try {
          doc.image(mapBuf, margin + 4, mapY + 4, { width: mapW - 8, height: mapH - 8 });
        } catch {
          doc.rect(margin + 4, mapY + 4, mapW - 8, mapH - 8).fill(lightBg);
          doc.fillColor(secondary).fontSize(9).text('Map unavailable', margin + 80, mapY + 70, { lineBreak: false });
        }
      } else {
        doc.rect(margin + 4, mapY + 4, mapW - 8, mapH - 8).fill(lightBg);
        doc.fillColor(secondary).fontSize(9).text('Map image unavailable', margin + 65, mapY + 68, { lineBreak: false });
        doc.fontSize(7).text('(Google Maps API key required)', margin + 60, mapY + 82, { lineBreak: false });
      }
      // Outer gold frame
      doc.rect(margin, mapY, mapW, mapH).lineWidth(1.2).stroke(gold);
      // Inner gray frame
      doc.rect(margin + 3, mapY + 3, mapW - 6, mapH - 6).lineWidth(0.4).stroke(gridLine);

      // Google Maps link
      if (full?.latitude && full?.longitude) {
        const mapLink = `https://maps.google.com/?q=${full.latitude},${full.longitude}`;
        doc.fillColor(gold).font('Helvetica').fontSize(7).text(
          'View on Google Maps', margin, mapY + mapH + 4,
          { link: mapLink, underline: true, width: mapW, lineBreak: false }
        );
      }

      // ── Details Grid (bordered rows) ──
      let dy = mapY;
      const labelW = 72;
      const valueW = detailW - labelW;
      const detailRowH = 19;

      const detailRows: { label: string; value: string }[] = [
        { label: 'Location', value: asset.city || 'N/A' },
        { label: 'Address', value: asset.address || full?.address || 'N/A' },
        { label: 'Type', value: (asset.type || '').replace(/_/g, ' ') },
        { label: 'Size', value: `${asset.width || '?'} x ${asset.height || '?'} ft (${((asset.width || 0) * (asset.height || 0))} sq ft)` },
        { label: 'Lighting', value: (full?.lighting || 'N/A').replace(/_/g, ' ') },
        { label: 'Vendor', value: asset.vendor || full?.vendor?.name || 'N/A' },
      ];
      if (full?.vendor?.contactPerson) detailRows.push({ label: 'Contact', value: full.vendor.contactPerson });
      if (full?.vendor?.phone) detailRows.push({ label: 'Phone', value: full.vendor.phone });
      if (full?.trafficCount) detailRows.push({ label: 'Traffic', value: `~${full.trafficCount.toLocaleString('en-IN')} vehicles/day` });

      detailRows.forEach((row, ri) => {
        doc.rect(detailX, dy, detailW, detailRowH).fill(ri % 2 === 0 ? '#ffffff' : lightBg);
        doc.rect(detailX, dy, detailW, detailRowH).lineWidth(0.3).stroke(gridLine);
        doc.moveTo(detailX + labelW, dy).lineTo(detailX + labelW, dy + detailRowH).lineWidth(0.3).stroke(gridLine);
        doc.font('Helvetica-Bold').fillColor(secondary).fontSize(6.5).text(
          row.label.toUpperCase(), detailX + 5, dy + 6, { width: labelW - 10, lineBreak: false }
        );
        doc.font('Helvetica').fillColor(navy).fontSize(7.5).text(
          row.value, detailX + labelW + 5, dy + 6, { width: valueW - 10, lineBreak: false }
        );
        dy += detailRowH;
      });

      // ── GPS + Rate in a single row below details grid ──
      dy += 4;
      if (full?.latitude && full?.longitude) {
        // GPS panel (left half of detail width)
        const gpsW = detailW * 0.55;
        doc.rect(detailX, dy, gpsW, 22).fill(lightBg);
        doc.rect(detailX, dy, gpsW, 22).lineWidth(0.4).stroke(gold);
        doc.font('Helvetica').fillColor(secondary).fontSize(5.5).text('GPS', detailX + 6, dy + 3, { lineBreak: false });
        doc.font('Helvetica-Bold').fillColor(navy).fontSize(7.5)
          .text(`${full.latitude.toFixed(6)}, ${full.longitude.toFixed(6)}`, detailX + 6, dy + 12, { lineBreak: false });
        // Rate box (right half)
        const rateW = detailW - gpsW - 4;
        doc.rect(detailX + gpsW + 4, dy, rateW, 22).fill(gold);
        doc.fillColor('#ffffff').font('Helvetica').fontSize(5.5).text('RATE/MO', detailX + gpsW + 10, dy + 3, { lineBreak: false });
        doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(10).text(
          `Rs.${(asset.monthlyRate || 0).toLocaleString('en-IN')}`, detailX + gpsW + 10, dy + 11, { lineBreak: false }
        );
        dy += 26;
      } else {
        // Rate box full width
        doc.rect(detailX, dy, detailW, 26).fill(gold);
        doc.rect(detailX, dy, detailW, 26).lineWidth(0.5).stroke(navy);
        doc.fillColor('#ffffff').font('Helvetica').fontSize(7).text('MONTHLY RATE', detailX + 10, dy + 4, { lineBreak: false });
        doc.font('Helvetica-Bold').fillColor('#ffffff').fontSize(14).text(
          `Rs.${(asset.monthlyRate || 0).toLocaleString('en-IN')}`, detailX + 10, dy + 13, { lineBreak: false }
        );
        dy += 30;
      }

      // ── Site Photos (compact — 3 across, smaller) ──
      y = Math.max(mapY + mapH + 20, dy + 8);

      const photos = full?.photos || [];
      const renderedPhotos = photos.filter((p: any) => photoImages.has(p.id));
      if (renderedPhotos.length > 0) {
        doc.font('Helvetica-Bold').fillColor(darkSlate).fontSize(10).text('Site Photos', margin + 10, y, { lineBreak: false });
        doc.rect(margin + 10, y + 13, 60, 1.2).fill(gold);
        y += 20;

        // Fit photos in remaining page space — limit to 2 rows max
        const remainingH = pageH - y - 65;
        const photoH = Math.min(130, Math.floor(remainingH / (renderedPhotos.length > 3 ? 2.1 : 1)));
        const numCols = renderedPhotos.length === 1 ? 1 : renderedPhotos.length === 2 ? 2 : 3;
        const gap = 8;
        const photoW = (contentW - 20 - gap * (numCols - 1)) / numCols;
        let px = margin + 10;
        let photosInRow = 0;

        for (const photo of renderedPhotos) {
          const photoBuf = photoImages.get(photo.id);
          if (!photoBuf) continue;

          // Check if we need to wrap to next row
          if (photosInRow >= numCols) {
            px = margin + 10;
            y += photoH + (photo.caption ? 18 : gap);
            photosInRow = 0;
          }

          // Skip if no space left on page (don't create a new page)
          if (y + photoH > pageH - 60) break;

          try {
            doc.image(photoBuf, px + 2, y + 2, { width: photoW - 4, height: photoH - 4, fit: [photoW - 4, photoH - 4] });
            doc.rect(px, y, photoW, photoH).lineWidth(0.6).stroke(gold);

            if (photo.caption) {
              doc.font('Helvetica').fillColor(secondary).fontSize(6).text(
                photo.caption, px, y + photoH + 2, { width: photoW, lineBreak: false }
              );
            }
          } catch {
            // skip broken image
          }

          px += photoW + gap;
          photosInRow++;
        }
        y += photoH + 15;
      }

      // ── Bottom disclaimer ──
      if (y < pageH - 75) {
        doc.rect(margin + 10, y, contentW - 20, 20).fill(lightBg);
        doc.rect(margin + 10, y, contentW - 20, 20).lineWidth(0.3).stroke(gridLine);
        doc.font('Helvetica').fillColor(secondary).fontSize(6).text(
          'Availability subject to confirmation. Rates exclusive of GST. Installation and creative production charges additional.',
          margin + 16, y + 6, { width: contentW - 32, lineBreak: false }
        );
      }
    }

    // ══════════════════════════════════════════════
    // ═══ LAST PAGE: TERMS & CONDITIONS ═══
    // ══════════════════════════════════════════════
    doc.addPage();

    doc.font('Helvetica-Bold').fillColor(navy).fontSize(22).text('Terms & Conditions', margin + 10, margin + 15, { lineBreak: false });
    // Gold underline
    doc.rect(margin + 10, margin + 42, 140, 2).fill(gold);

    y = margin + 60;

    const terms = [
      'All rates are in INR and exclusive of applicable taxes (GST @ 18%).',
      'Creative design, printing, and installation charges are additional.',
      'Booking confirmation requires 50% advance payment.',
      'Campaign dates are subject to availability at the time of booking confirmation.',
      'Cancellation within 15 days of campaign start will incur 25% cancellation fee.',
      'Client must provide print-ready creative files at least 7 days before campaign start.',
      'AdVantage is not liable for damages caused by natural calamities or force majeure events.',
      'This proposal is valid for 15 days from the date of generation.',
    ];

    terms.forEach((term, i) => {
      const termH = 28;
      // Bordered row with alternating bg
      doc.rect(margin + 10, y, contentW - 20, termH).fill(i % 2 === 0 ? '#ffffff' : lightBg);
      doc.rect(margin + 10, y, contentW - 20, termH).lineWidth(0.3).stroke(gridLine);

      // Number circle
      doc.circle(margin + 26, y + termH / 2, 8).fill(navy);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(
        `${i + 1}`, margin + 18, y + termH / 2 - 5, { width: 16, align: 'center', lineBreak: false }
      );

      // Term text
      doc.font('Helvetica').fillColor(bodyText).fontSize(9).text(term, margin + 44, y + 9, { width: contentW - 60, lineBreak: false });
      y += termH;
    });

    // ── Thank You Section ──
    y += 35;
    // Gold decorative line above
    doc.rect(margin + 10 + (contentW - 20) / 2 - 60, y, 120, 1.5).fill(gold);
    y += 18;

    doc.font('Helvetica-Bold').fillColor(navy).fontSize(16).text(
      'Thank you for considering AdVantage!', margin + 10, y, { align: 'center', width: contentW - 20, lineBreak: false }
    );
    y += 28;
    doc.font('Helvetica').fillColor(secondary).fontSize(10).text(
      'For questions or to confirm this proposal, please contact your account manager.',
      margin + 10, y, { align: 'center', width: contentW - 20, lineBreak: false }
    );
    y += 20;

    // Gold decorative line below
    doc.rect(margin + 10 + (contentW - 20) / 2 - 60, y, 120, 1.5).fill(gold);

    // ══════════════════════════════════════════════
    // ═══ FOOTER + PAGE BORDERS ON ALL PAGES ═══
    // ══════════════════════════════════════════════
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Draw double page border
      drawPageBorders(doc);

      // Gold footer line
      doc.save();
      doc.moveTo(margin, pageH - 48).lineTo(margin + contentW, pageH - 48).lineWidth(0.5).stroke(gold);
      doc.restore();

      // Reset cursor to top to prevent PDFKit auto-pagination
      doc.y = 0;
      doc.font('Helvetica').fillColor(secondary).fontSize(7);
      doc.text(
        `AdVantage OOH  |  Confidential  |  Page ${i + 1} of ${pageCount}  |  Generated ${new Date().toLocaleDateString('en-IN')}`,
        margin, pageH - 40, { align: 'center', width: contentW, lineBreak: false, height: 15 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    sendError(res, 'Failed to generate PDF');
  }
});

// POST /api/proposals
router.post('/', authenticate, authorize('ADMIN', 'SALES'), async (req: Request, res: Response) => {
  try {
    const proposal = await prisma.proposal.create({
      data: { ...req.body, assets: req.body.assets || [] },
    });
    sendSuccess(res, proposal, 'Proposal created', 201);
  } catch (error) {
    sendError(res, 'Failed to create proposal');
  }
});

// PATCH /api/proposals/:id/status
router.patch('/:id/status', authenticate, validate(updateProposalStatusSchema), async (req: Request, res: Response) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
    if (!proposal) { sendError(res, 'Proposal not found', 404); return; }

    const { status: newStatus } = req.body;
    const currentStatus = proposal.status;
    const validTransitions = VALID_PROPOSAL_TRANSITIONS[currentStatus as keyof typeof VALID_PROPOSAL_TRANSITIONS] || [];

    if (!validTransitions.includes(newStatus)) {
      sendError(res, `Cannot transition from ${currentStatus} to ${newStatus}`, 400);
      return;
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'SENT') updateData.sentAt = new Date();
    if (newStatus === 'VIEWED') updateData.viewedAt = new Date();

    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Notify on SENT — notify client users
    if (newStatus === 'SENT') {
      const clientUsers = await prisma.user.findMany({
        where: { clientId: proposal.clientId, role: 'CLIENT' },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: clientUsers.map((u) => ({
          userId: u.id,
          type: 'PROPOSAL_READY' as const,
          title: 'New Proposal Available',
          message: `A new proposal "${proposal.title}" is ready for your review`,
          metadata: { proposalId: proposal.id },
        })),
      });
    }

    // Notify on VIEWED — notify admins/sales
    if (newStatus === 'VIEWED') {
      const staff = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SALES'] } },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: staff.map((u) => ({
          userId: u.id,
          type: 'PROPOSAL_VIEWED' as const,
          title: 'Proposal Viewed by Client',
          message: `Proposal "${proposal.title}" has been viewed by the client`,
          metadata: { proposalId: proposal.id },
        })),
      });
    }

    await logActivity(req.user!.userId, 'STATUS_CHANGE', 'Proposal', proposal.id, { before: { status: currentStatus }, after: { status: newStatus } }, req.ip);
    sendSuccess(res, updated, 'Proposal status updated');
  } catch (error) {
    sendError(res, 'Failed to update proposal status');
  }
});

export default router;
