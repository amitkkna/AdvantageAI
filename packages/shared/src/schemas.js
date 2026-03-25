"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = exports.paginationSchema = exports.fieldCheckinSchema = exports.updateEnquiryStatusSchema = exports.updateEnquirySchema = exports.createEnquirySchema = exports.updateProposalStatusSchema = exports.updateInvoiceStatusSchema = exports.createInvoiceSchema = exports.chatMessageSchema = exports.reviewCreativeSchema = exports.updateBookingStatusSchema = exports.createBookingSchema = exports.updateCampaignStatusSchema = exports.updateCampaignSchema = exports.createCampaignSchema = exports.assetFilterSchema = exports.updateAssetSchema = exports.createAssetSchema = exports.updateClientSchema = exports.createClientSchema = exports.updateVendorSchema = exports.createVendorSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
// ─── Auth Schemas ────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum([constants_1.UserRole.ADMIN, constants_1.UserRole.SALES, constants_1.UserRole.FIELD, constants_1.UserRole.FINANCE, constants_1.UserRole.CLIENT]),
});
// ─── Vendor Schemas ──────────────────────────────────
exports.createVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    address: zod_1.z.string().min(5),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    gstNumber: zod_1.z.string().optional(),
    panNumber: zod_1.z.string().optional(),
});
exports.updateVendorSchema = exports.createVendorSchema.partial();
// ─── Client Schemas ──────────────────────────────────
exports.createClientSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    address: zod_1.z.string().min(5),
    city: zod_1.z.string().min(2),
    industry: zod_1.z.string().min(2),
    gstNumber: zod_1.z.string().optional(),
});
exports.updateClientSchema = exports.createClientSchema.partial();
// ─── Asset Schemas ───────────────────────────────────
exports.createAssetSchema = zod_1.z.object({
    code: zod_1.z.string().min(3),
    name: zod_1.z.string().min(3),
    type: zod_1.z.enum([constants_1.AssetType.BILLBOARD, constants_1.AssetType.UNIPOLE, constants_1.AssetType.HOARDING,
        constants_1.AssetType.BUS_SHELTER, constants_1.AssetType.GANTRY, constants_1.AssetType.DIGITAL_SCREEN,
        constants_1.AssetType.WALL_WRAP, constants_1.AssetType.POLE_KIOSK]),
    address: zod_1.z.string().min(5),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    width: zod_1.z.number().positive(),
    height: zod_1.z.number().positive(),
    lighting: zod_1.z.enum([constants_1.LightingType.FRONT_LIT, constants_1.LightingType.BACK_LIT,
        constants_1.LightingType.NON_LIT, constants_1.LightingType.DIGITAL]),
    faces: zod_1.z.number().int().positive().default(1),
    monthlyRate: zod_1.z.number().positive(),
    dailyRate: zod_1.z.number().positive().optional(),
    trafficCount: zod_1.z.number().int().positive().optional(),
    landmark: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    vendorId: zod_1.z.string().uuid(),
});
exports.updateAssetSchema = exports.createAssetSchema.partial();
exports.assetFilterSchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    type: zod_1.z.enum([constants_1.AssetType.BILLBOARD, constants_1.AssetType.UNIPOLE, constants_1.AssetType.HOARDING,
        constants_1.AssetType.BUS_SHELTER, constants_1.AssetType.GANTRY, constants_1.AssetType.DIGITAL_SCREEN,
        constants_1.AssetType.WALL_WRAP, constants_1.AssetType.POLE_KIOSK]).optional(),
    status: zod_1.z.enum([constants_1.AssetStatus.AVAILABLE, constants_1.AssetStatus.PARTIALLY_BOOKED,
        constants_1.AssetStatus.FULLY_BOOKED, constants_1.AssetStatus.MAINTENANCE, constants_1.AssetStatus.INACTIVE]).optional(),
    lighting: zod_1.z.enum([constants_1.LightingType.FRONT_LIT, constants_1.LightingType.BACK_LIT,
        constants_1.LightingType.NON_LIT, constants_1.LightingType.DIGITAL]).optional(),
    minPrice: zod_1.z.coerce.number().optional(),
    maxPrice: zod_1.z.coerce.number().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    latitude: zod_1.z.coerce.number().optional(),
    longitude: zod_1.z.coerce.number().optional(),
    radius: zod_1.z.coerce.number().optional(),
    vendorId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(constants_1.PAGINATION.DEFAULT_PAGE),
    limit: zod_1.z.coerce.number().int().positive().max(constants_1.PAGINATION.MAX_LIMIT).default(constants_1.PAGINATION.DEFAULT_LIMIT),
});
// ─── Campaign Schemas ────────────────────────────────
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    clientId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    totalBudget: zod_1.z.number().positive(),
    description: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
});
exports.updateCampaignSchema = exports.createCampaignSchema.partial();
exports.updateCampaignStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.CampaignStatus.DRAFT, constants_1.CampaignStatus.PROPOSAL_SENT,
        constants_1.CampaignStatus.CLIENT_APPROVED, constants_1.CampaignStatus.CREATIVE_PENDING,
        constants_1.CampaignStatus.CREATIVE_APPROVED, constants_1.CampaignStatus.LIVE,
        constants_1.CampaignStatus.COMPLETED, constants_1.CampaignStatus.CANCELLED]),
});
// ─── Booking Schemas ─────────────────────────────────
exports.createBookingSchema = zod_1.z.object({
    campaignId: zod_1.z.string().uuid(),
    assetId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.BookingStatus.HOLD, constants_1.BookingStatus.CONFIRMED,
        constants_1.BookingStatus.CANCELLED, constants_1.BookingStatus.COMPLETED]),
});
// ─── Creative Schemas ────────────────────────────────
exports.reviewCreativeSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.CreativeStatus.APPROVED, constants_1.CreativeStatus.REJECTED, constants_1.CreativeStatus.REVISION_REQUESTED]),
    rejectionReason: zod_1.z.string().optional(),
    revisionNotes: zod_1.z.string().optional(),
});
// ─── Chat Schemas ────────────────────────────────────
exports.chatMessageSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid().nullish(),
    message: zod_1.z.string().default(''),
    selections: zod_1.z.record(zod_1.z.any()).nullish(),
    clientId: zod_1.z.string().uuid().nullish(),
});
// ─── Invoice Schemas ─────────────────────────────────
exports.createInvoiceSchema = zod_1.z.object({
    campaignId: zod_1.z.string().uuid(),
    clientId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    tax: zod_1.z.number().min(0),
    dueDate: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
exports.updateInvoiceStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.InvoiceStatus.DRAFT, constants_1.InvoiceStatus.SENT, constants_1.InvoiceStatus.PAID, constants_1.InvoiceStatus.OVERDUE, constants_1.InvoiceStatus.CANCELLED]),
    paymentMethod: zod_1.z.string().optional(),
    paymentRef: zod_1.z.string().optional(),
});
// ─── Proposal Status Schema ─────────────────────────
exports.updateProposalStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.ProposalStatus.DRAFT, constants_1.ProposalStatus.SENT, constants_1.ProposalStatus.VIEWED, constants_1.ProposalStatus.APPROVED, constants_1.ProposalStatus.REJECTED]),
});
// ─── Enquiry Schemas ────────────────────────────────
exports.createEnquirySchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    industry: zod_1.z.string().optional(),
    cities: zod_1.z.array(zod_1.z.string()).default([]),
    assetTypes: zod_1.z.array(zod_1.z.string()).default([]),
    budget: zod_1.z.number().positive().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    requirements: zod_1.z.string().optional(),
    priority: zod_1.z.enum([constants_1.EnquiryPriority.LOW, constants_1.EnquiryPriority.MEDIUM, constants_1.EnquiryPriority.HIGH, constants_1.EnquiryPriority.URGENT]).default('MEDIUM'),
    source: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
});
exports.updateEnquirySchema = exports.createEnquirySchema.partial();
exports.updateEnquiryStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([constants_1.EnquiryStatus.NEW, constants_1.EnquiryStatus.CONTACTED, constants_1.EnquiryStatus.QUALIFIED, constants_1.EnquiryStatus.PROPOSAL_SENT, constants_1.EnquiryStatus.CONVERTED, constants_1.EnquiryStatus.LOST]),
    lostReason: zod_1.z.string().optional(),
});
// ─── Field Check-in Schemas ──────────────────────────
exports.fieldCheckinSchema = zod_1.z.object({
    assetId: zod_1.z.string().uuid(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    notes: zod_1.z.string().optional(),
    condition: zod_1.z.enum(['GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'OBSTRUCTED']),
});
// ─── Pagination Schema ──────────────────────────────
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(constants_1.PAGINATION.DEFAULT_PAGE),
    limit: zod_1.z.coerce.number().int().positive().max(constants_1.PAGINATION.MAX_LIMIT).default(constants_1.PAGINATION.DEFAULT_LIMIT),
});
// ─── Env Validation ─────────────────────────────────
exports.envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().default('ap-south-1'),
    S3_BUCKET: zod_1.z.string().default('advantage-uploads'),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map