import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { startHoldExpiryCron, startRentalAlertCron, startInvoiceOverdueCron } from './cron/holdExpiry';
import { startAiInsightsCron } from './cron/aiInsights';
import { setupWebSocket } from './websocket';

// Route imports
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import clientRoutes from './routes/clients';
import assetRoutes from './routes/assets';
import campaignRoutes from './routes/campaigns';
import bookingRoutes from './routes/bookings';
import proposalRoutes from './routes/proposals';
import invoiceRoutes from './routes/invoices';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import chatRoutes from './routes/chat';
import analyticsRoutes from './routes/analytics';
import fieldCheckinRoutes from './routes/fieldCheckins';
import creativeRoutes from './routes/creatives';
import userRoutes from './routes/users';
import activityLogRoutes from './routes/activityLogs';
import savedFilterRoutes from './routes/savedFilters';
import dashboardConfigRoutes from './routes/dashboardConfig';
import bulkImportRoutes from './routes/bulkImport';
import enquiryRoutes from './routes/enquiries';
import aiAgentRoutes from './routes/aiAgent';

const app = express();
const httpServer = createServer(app);

// WebSocket
setupWebSocket(httpServer);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'exp://localhost:8081',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root & Health check
app.get('/', (_req, res) => {
  res.json({ success: true, data: { name: 'AdVantage AI API', version: '1.0.0', docs: '/api/health' } });
});
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/field-checkins', fieldCheckinRoutes);
app.use('/api/creatives', creativeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/saved-filters', savedFilterRoutes);
app.use('/api/dashboard-config', dashboardConfigRoutes);
app.use('/api/bulk-import', bulkImportRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/ai-agent', aiAgentRoutes);

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`AdVantage AI backend running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log('WebSocket enabled');

  // Start cron jobs
  startHoldExpiryCron();
  startRentalAlertCron();
  startInvoiceOverdueCron();
  startAiInsightsCron();
});

export default app;
