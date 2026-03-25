// User Roles
export const UserRole = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  FIELD: 'FIELD',
  FINANCE: 'FINANCE',
  CLIENT: 'CLIENT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Asset Types
export const AssetType = {
  BILLBOARD: 'BILLBOARD',
  UNIPOLE: 'UNIPOLE',
  HOARDING: 'HOARDING',
  BUS_SHELTER: 'BUS_SHELTER',
  GANTRY: 'GANTRY',
  DIGITAL_SCREEN: 'DIGITAL_SCREEN',
  WALL_WRAP: 'WALL_WRAP',
  POLE_KIOSK: 'POLE_KIOSK',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

// Asset Status
export const AssetStatus = {
  AVAILABLE: 'AVAILABLE',
  PARTIALLY_BOOKED: 'PARTIALLY_BOOKED',
  FULLY_BOOKED: 'FULLY_BOOKED',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

// Lighting Type
export const LightingType = {
  FRONT_LIT: 'FRONT_LIT',
  BACK_LIT: 'BACK_LIT',
  NON_LIT: 'NON_LIT',
  DIGITAL: 'DIGITAL',
} as const;
export type LightingType = (typeof LightingType)[keyof typeof LightingType];

// Campaign Status
export const CampaignStatus = {
  DRAFT: 'DRAFT',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  CLIENT_APPROVED: 'CLIENT_APPROVED',
  CREATIVE_PENDING: 'CREATIVE_PENDING',
  CREATIVE_APPROVED: 'CREATIVE_APPROVED',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

// Booking Status
export const BookingStatus = {
  HOLD: 'HOLD',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

// Creative Status
export const CreativeStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
} as const;
export type CreativeStatus = (typeof CreativeStatus)[keyof typeof CreativeStatus];

// Proposal Status
export const ProposalStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

// Enquiry Status
export const EnquiryStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;
export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];

// Enquiry Priority
export const EnquiryPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type EnquiryPriority = (typeof EnquiryPriority)[keyof typeof EnquiryPriority];

// Invoice Status
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// Notification Type
export const NotificationType = {
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
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// Chat Stages
export const ChatStage = {
  STAGE_1_BRAND: 1,
  STAGE_2_LOCATIONS: 2,
  STAGE_3_BUDGET: 3,
  STAGE_4_MATCHING: 4,
  STAGE_5_PROPOSAL: 5,
} as const;

// Campaign status transitions
export const VALID_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
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
export const VALID_PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['VIEWED', 'APPROVED', 'REJECTED'],
  VIEWED: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: ['DRAFT'],
};

// Enquiry status transitions
export const VALID_ENQUIRY_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['PROPOSAL_SENT', 'LOST'],
  PROPOSAL_SENT: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: ['NEW'],
};

// Creative status transitions
export const VALID_CREATIVE_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
  APPROVED: [],
  REJECTED: ['PENDING'],
  REVISION_REQUESTED: ['PENDING'],
};

// Indian cities commonly used in OOH
export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow',
  'Raipur', 'Bilaspur', 'Bhilai', 'Durg', 'Korba',
  'Nagpur', 'Indore', 'Bhopal',
] as const;

// Currency helper
export const INR = {
  symbol: '₹',
  code: 'INR',
  format: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

// IST timezone helper
export const IST = {
  timezone: 'Asia/Kolkata',
  offset: '+05:30',
  now: (): Date => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// File upload limits
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
  MAX_PHOTOS_PER_ASSET: 10,
};

// Hold duration
export const HOLD_DURATION_HOURS = 24;

// Chat-based scoring (context-dependent, used in AI chat for proposal matching)
export const SCORE_WEIGHTS = {
  LOCATION_RELEVANCE: 30,
  BUDGET_FIT: 20,
  TRAFFIC_VOLUME: 15,
  SIZE_APPROPRIATENESS: 10,
  AVAILABILITY_MATCH: 15,
  VENDOR_RELIABILITY: 10,
  TOTAL: 100,
};

// Asset Quality Score (persistent, intrinsic asset quality — not campaign-dependent)
export const ASSET_SCORE_WEIGHTS = {
  TRAFFIC_VOLUME: 20,        // Daily footfall/traffic past the billboard
  PHYSICAL_CONDITION: 20,    // Latest field check-in condition rating
  SIZE_VISIBILITY: 15,       // Billboard area and face count
  CAMPAIGN_PERFORMANCE: 15,  // Historical impressions/reach from analytics
  VENDOR_RELIABILITY: 10,    // Vendor's reliability track record
  LIGHTING_QUALITY: 10,      // Lighting type (digital > backlit > frontlit > non-lit)
  AVAILABILITY: 10,          // Current booking availability
  TOTAL: 100,
};

export const CONDITION_SCORES: Record<string, number> = {
  'Excellent': 20,
  'Good': 16,
  'Fair': 10,
  'Needs Repair': 4,
  'Damaged': 0,
};

export const LIGHTING_SCORES: Record<string, number> = {
  'DIGITAL': 10,
  'BACK_LIT': 8,
  'FRONT_LIT': 6,
  'NON_LIT': 3,
};
