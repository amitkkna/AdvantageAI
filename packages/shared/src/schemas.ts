import { z } from 'zod';
import {
  UserRole, AssetType, AssetStatus, LightingType,
  CampaignStatus, BookingStatus, CreativeStatus,
  InvoiceStatus, ProposalStatus, EnquiryStatus, EnquiryPriority,
  PAGINATION, UPLOAD,
} from './constants';

// ─── Auth Schemas ────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.SALES, UserRole.FIELD, UserRole.FINANCE, UserRole.CLIENT]),
});

// ─── Vendor Schemas ──────────────────────────────────
export const createVendorSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

// ─── Client Schemas ──────────────────────────────────
export const createClientSchema = z.object({
  companyName: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  industry: z.string().min(2),
  gstNumber: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ─── Asset Schemas ───────────────────────────────────
export const createAssetSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  type: z.enum([AssetType.BILLBOARD, AssetType.UNIPOLE, AssetType.HOARDING,
    AssetType.BUS_SHELTER, AssetType.GANTRY, AssetType.DIGITAL_SCREEN,
    AssetType.WALL_WRAP, AssetType.POLE_KIOSK]),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  width: z.number().positive(),
  height: z.number().positive(),
  lighting: z.enum([LightingType.FRONT_LIT, LightingType.BACK_LIT,
    LightingType.NON_LIT, LightingType.DIGITAL]),
  faces: z.number().int().positive().default(1),
  monthlyRate: z.number().positive(),
  dailyRate: z.number().positive().optional(),
  trafficCount: z.number().int().positive().optional(),
  landmark: z.string().optional(),
  description: z.string().optional(),
  vendorId: z.string().uuid(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assetFilterSchema = z.object({
  city: z.string().optional(),
  type: z.enum([AssetType.BILLBOARD, AssetType.UNIPOLE, AssetType.HOARDING,
    AssetType.BUS_SHELTER, AssetType.GANTRY, AssetType.DIGITAL_SCREEN,
    AssetType.WALL_WRAP, AssetType.POLE_KIOSK]).optional(),
  status: z.enum([AssetStatus.AVAILABLE, AssetStatus.PARTIALLY_BOOKED,
    AssetStatus.FULLY_BOOKED, AssetStatus.MAINTENANCE, AssetStatus.INACTIVE]).optional(),
  lighting: z.enum([LightingType.FRONT_LIT, LightingType.BACK_LIT,
    LightingType.NON_LIT, LightingType.DIGITAL]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  vendorId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// ─── Campaign Schemas ────────────────────────────────
export const createCampaignSchema = z.object({
  name: z.string().min(3),
  clientId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  totalBudget: z.number().positive(),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const updateCampaignStatusSchema = z.object({
  status: z.enum([CampaignStatus.DRAFT, CampaignStatus.PROPOSAL_SENT,
    CampaignStatus.CLIENT_APPROVED, CampaignStatus.CREATIVE_PENDING,
    CampaignStatus.CREATIVE_APPROVED, CampaignStatus.LIVE,
    CampaignStatus.COMPLETED, CampaignStatus.CANCELLED]),
});

// ─── Booking Schemas ─────────────────────────────────
export const createBookingSchema = z.object({
  campaignId: z.string().uuid(),
  assetId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  amount: z.number().positive(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([BookingStatus.HOLD, BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED, BookingStatus.COMPLETED]),
});

// ─── Creative Schemas ────────────────────────────────
export const reviewCreativeSchema = z.object({
  status: z.enum([CreativeStatus.APPROVED, CreativeStatus.REJECTED, CreativeStatus.REVISION_REQUESTED]),
  rejectionReason: z.string().optional(),
  revisionNotes: z.string().optional(),
});

// ─── Chat Schemas ────────────────────────────────────
export const chatMessageSchema = z.object({
  sessionId: z.string().uuid().nullish(),
  message: z.string().default(''),
  selections: z.record(z.any()).nullish(),
  clientId: z.string().uuid().nullish(),
});

// ─── Invoice Schemas ─────────────────────────────────
export const createInvoiceSchema = z.object({
  campaignId: z.string().uuid(),
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  tax: z.number().min(0),
  dueDate: z.string(),
  notes: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum([InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED]),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
});

// ─── Proposal Status Schema ─────────────────────────
export const updateProposalStatusSchema = z.object({
  status: z.enum([ProposalStatus.DRAFT, ProposalStatus.SENT, ProposalStatus.VIEWED, ProposalStatus.APPROVED, ProposalStatus.REJECTED]),
});

// ─── Enquiry Schemas ────────────────────────────────
export const createEnquirySchema = z.object({
  companyName: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  industry: z.string().optional(),
  cities: z.array(z.string()).default([]),
  assetTypes: z.array(z.string()).default([]),
  budget: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requirements: z.string().optional(),
  priority: z.enum([EnquiryPriority.LOW, EnquiryPriority.MEDIUM, EnquiryPriority.HIGH, EnquiryPriority.URGENT]).default('MEDIUM'),
  source: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const updateEnquirySchema = createEnquirySchema.partial();

export const updateEnquiryStatusSchema = z.object({
  status: z.enum([EnquiryStatus.NEW, EnquiryStatus.CONTACTED, EnquiryStatus.QUALIFIED, EnquiryStatus.PROPOSAL_SENT, EnquiryStatus.CONVERTED, EnquiryStatus.LOST]),
  lostReason: z.string().optional(),
});

// ─── Field Check-in Schemas ──────────────────────────
export const fieldCheckinSchema = z.object({
  assetId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
  condition: z.enum(['GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'OBSTRUCTED']),
});

// ─── Pagination Schema ──────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// ─── Env Validation ─────────────────────────────────
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().default('advantage-uploads'),
  ANTHROPIC_API_KEY: z.string().optional(),
});
