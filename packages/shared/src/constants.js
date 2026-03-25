"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIGHTING_SCORES = exports.CONDITION_SCORES = exports.ASSET_SCORE_WEIGHTS = exports.SCORE_WEIGHTS = exports.HOLD_DURATION_HOURS = exports.UPLOAD = exports.PAGINATION = exports.IST = exports.INR = exports.INDIAN_CITIES = exports.VALID_CREATIVE_TRANSITIONS = exports.VALID_ENQUIRY_TRANSITIONS = exports.VALID_PROPOSAL_TRANSITIONS = exports.VALID_STATUS_TRANSITIONS = exports.ChatStage = exports.NotificationType = exports.InvoiceStatus = exports.EnquiryPriority = exports.EnquiryStatus = exports.ProposalStatus = exports.CreativeStatus = exports.BookingStatus = exports.CampaignStatus = exports.LightingType = exports.AssetStatus = exports.AssetType = exports.UserRole = void 0;
// User Roles
exports.UserRole = {
    ADMIN: 'ADMIN',
    SALES: 'SALES',
    FIELD: 'FIELD',
    FINANCE: 'FINANCE',
    CLIENT: 'CLIENT',
};
// Asset Types
exports.AssetType = {
    BILLBOARD: 'BILLBOARD',
    UNIPOLE: 'UNIPOLE',
    HOARDING: 'HOARDING',
    BUS_SHELTER: 'BUS_SHELTER',
    GANTRY: 'GANTRY',
    DIGITAL_SCREEN: 'DIGITAL_SCREEN',
    WALL_WRAP: 'WALL_WRAP',
    POLE_KIOSK: 'POLE_KIOSK',
};
// Asset Status
exports.AssetStatus = {
    AVAILABLE: 'AVAILABLE',
    PARTIALLY_BOOKED: 'PARTIALLY_BOOKED',
    FULLY_BOOKED: 'FULLY_BOOKED',
    MAINTENANCE: 'MAINTENANCE',
    INACTIVE: 'INACTIVE',
};
// Lighting Type
exports.LightingType = {
    FRONT_LIT: 'FRONT_LIT',
    BACK_LIT: 'BACK_LIT',
    NON_LIT: 'NON_LIT',
    DIGITAL: 'DIGITAL',
};
// Campaign Status
exports.CampaignStatus = {
    DRAFT: 'DRAFT',
    PROPOSAL_SENT: 'PROPOSAL_SENT',
    CLIENT_APPROVED: 'CLIENT_APPROVED',
    CREATIVE_PENDING: 'CREATIVE_PENDING',
    CREATIVE_APPROVED: 'CREATIVE_APPROVED',
    LIVE: 'LIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};
// Booking Status
exports.BookingStatus = {
    HOLD: 'HOLD',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
};
// Creative Status
exports.CreativeStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    REVISION_REQUESTED: 'REVISION_REQUESTED',
};
// Proposal Status
exports.ProposalStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    VIEWED: 'VIEWED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
// Enquiry Status
exports.EnquiryStatus = {
    NEW: 'NEW',
    CONTACTED: 'CONTACTED',
    QUALIFIED: 'QUALIFIED',
    PROPOSAL_SENT: 'PROPOSAL_SENT',
    CONVERTED: 'CONVERTED',
    LOST: 'LOST',
};
// Enquiry Priority
exports.EnquiryPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
// Invoice Status
exports.InvoiceStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
};
// Notification Type
exports.NotificationType = {
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    CAMPAIGN_STATUS_CHANGE: 'CAMPAIGN_STATUS_CHANGE',
    CREATIVE_UPLOADED: 'CREATIVE_UPLOADED',
    CREATIVE_APPROVED: 'CREATIVE_APPROVED',
    CREATIVE_REJECTED: 'CREATIVE_REJECTED',
    CREATIVE_REVISION_REQUESTED: 'CREATIVE_REVISION_REQUESTED',
    INVOICE_GENERATED: 'INVOICE_GENERATED',
    INVOICE_OVERDUE: 'INVOICE_OVERDUE',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    RENTAL_EXPIRY_ALERT: 'RENTAL_EXPIRY_ALERT',
    HOLD_EXPIRING: 'HOLD_EXPIRING',
    HOLD_EXPIRED: 'HOLD_EXPIRED',
    PROPOSAL_READY: 'PROPOSAL_READY',
    PROPOSAL_VIEWED: 'PROPOSAL_VIEWED',
    ENQUIRY_CREATED: 'ENQUIRY_CREATED',
    ENQUIRY_CONVERTED: 'ENQUIRY_CONVERTED',
};
// Chat Stages
exports.ChatStage = {
    STAGE_1_BRAND: 1,
    STAGE_2_LOCATIONS: 2,
    STAGE_3_BUDGET: 3,
    STAGE_4_MATCHING: 4,
    STAGE_5_PROPOSAL: 5,
};
// Campaign status transitions
exports.VALID_STATUS_TRANSITIONS = {
    DRAFT: ['PROPOSAL_SENT', 'CANCELLED'],
    PROPOSAL_SENT: ['CLIENT_APPROVED', 'CANCELLED'],
    CLIENT_APPROVED: ['CREATIVE_PENDING', 'CANCELLED'],
    CREATIVE_PENDING: ['CREATIVE_APPROVED', 'CANCELLED'],
    CREATIVE_APPROVED: ['LIVE', 'CANCELLED'],
    LIVE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};
// Proposal status transitions
exports.VALID_PROPOSAL_TRANSITIONS = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'APPROVED', 'REJECTED'],
    VIEWED: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: ['DRAFT'],
};
// Enquiry status transitions
exports.VALID_ENQUIRY_TRANSITIONS = {
    NEW: ['CONTACTED', 'QUALIFIED', 'LOST'],
    CONTACTED: ['QUALIFIED', 'LOST'],
    QUALIFIED: ['PROPOSAL_SENT', 'LOST'],
    PROPOSAL_SENT: ['CONVERTED', 'LOST'],
    CONVERTED: [],
    LOST: ['NEW'],
};
// Creative status transitions
exports.VALID_CREATIVE_TRANSITIONS = {
    PENDING: ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
    APPROVED: [],
    REJECTED: ['PENDING'],
    REVISION_REQUESTED: ['PENDING'],
};
// Indian cities commonly used in OOH
exports.INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad',
    'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow',
    'Raipur', 'Bilaspur', 'Bhilai', 'Durg', 'Korba',
    'Nagpur', 'Indore', 'Bhopal',
];
// Currency helper
exports.INR = {
    symbol: '₹',
    code: 'INR',
    format: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    },
};
// IST timezone helper
exports.IST = {
    timezone: 'Asia/Kolkata',
    offset: '+05:30',
    now: () => {
        return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    },
};
// Pagination defaults
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// File upload limits
exports.UPLOAD = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOC_TYPES: ['application/pdf'],
    MAX_PHOTOS_PER_ASSET: 10,
};
// Hold duration
exports.HOLD_DURATION_HOURS = 24;
// Chat-based scoring (context-dependent, used in AI chat for proposal matching)
exports.SCORE_WEIGHTS = {
    LOCATION_RELEVANCE: 30,
    BUDGET_FIT: 20,
    TRAFFIC_VOLUME: 15,
    SIZE_APPROPRIATENESS: 10,
    AVAILABILITY_MATCH: 15,
    VENDOR_RELIABILITY: 10,
    TOTAL: 100,
};
// Asset Quality Score (persistent, intrinsic asset quality — not campaign-dependent)
exports.ASSET_SCORE_WEIGHTS = {
    TRAFFIC_VOLUME: 20, // Daily footfall/traffic past the billboard
    PHYSICAL_CONDITION: 20, // Latest field check-in condition rating
    SIZE_VISIBILITY: 15, // Billboard area and face count
    CAMPAIGN_PERFORMANCE: 15, // Historical impressions/reach from analytics
    VENDOR_RELIABILITY: 10, // Vendor's reliability track record
    LIGHTING_QUALITY: 10, // Lighting type (digital > backlit > frontlit > non-lit)
    AVAILABILITY: 10, // Current booking availability
    TOTAL: 100,
};
exports.CONDITION_SCORES = {
    'Excellent': 20,
    'Good': 16,
    'Fair': 10,
    'Needs Repair': 4,
    'Damaged': 0,
};
exports.LIGHTING_SCORES = {
    'DIGITAL': 10,
    'BACK_LIT': 8,
    'FRONT_LIT': 6,
    'NON_LIT': 3,
};
//# sourceMappingURL=constants.js.map