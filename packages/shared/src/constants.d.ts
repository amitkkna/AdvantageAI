export declare const UserRole: {
    readonly ADMIN: "ADMIN";
    readonly SALES: "SALES";
    readonly FIELD: "FIELD";
    readonly FINANCE: "FINANCE";
    readonly CLIENT: "CLIENT";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const AssetType: {
    readonly BILLBOARD: "BILLBOARD";
    readonly UNIPOLE: "UNIPOLE";
    readonly HOARDING: "HOARDING";
    readonly BUS_SHELTER: "BUS_SHELTER";
    readonly GANTRY: "GANTRY";
    readonly DIGITAL_SCREEN: "DIGITAL_SCREEN";
    readonly WALL_WRAP: "WALL_WRAP";
    readonly POLE_KIOSK: "POLE_KIOSK";
};
export type AssetType = (typeof AssetType)[keyof typeof AssetType];
export declare const AssetStatus: {
    readonly AVAILABLE: "AVAILABLE";
    readonly PARTIALLY_BOOKED: "PARTIALLY_BOOKED";
    readonly FULLY_BOOKED: "FULLY_BOOKED";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly INACTIVE: "INACTIVE";
};
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];
export declare const LightingType: {
    readonly FRONT_LIT: "FRONT_LIT";
    readonly BACK_LIT: "BACK_LIT";
    readonly NON_LIT: "NON_LIT";
    readonly DIGITAL: "DIGITAL";
};
export type LightingType = (typeof LightingType)[keyof typeof LightingType];
export declare const CampaignStatus: {
    readonly DRAFT: "DRAFT";
    readonly PROPOSAL_SENT: "PROPOSAL_SENT";
    readonly CLIENT_APPROVED: "CLIENT_APPROVED";
    readonly CREATIVE_PENDING: "CREATIVE_PENDING";
    readonly CREATIVE_APPROVED: "CREATIVE_APPROVED";
    readonly LIVE: "LIVE";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];
export declare const BookingStatus: {
    readonly HOLD: "HOLD";
    readonly CONFIRMED: "CONFIRMED";
    readonly CANCELLED: "CANCELLED";
    readonly COMPLETED: "COMPLETED";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
export declare const CreativeStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly REVISION_REQUESTED: "REVISION_REQUESTED";
};
export type CreativeStatus = (typeof CreativeStatus)[keyof typeof CreativeStatus];
export declare const ProposalStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly VIEWED: "VIEWED";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
};
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];
export declare const EnquiryStatus: {
    readonly NEW: "NEW";
    readonly CONTACTED: "CONTACTED";
    readonly QUALIFIED: "QUALIFIED";
    readonly PROPOSAL_SENT: "PROPOSAL_SENT";
    readonly CONVERTED: "CONVERTED";
    readonly LOST: "LOST";
};
export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];
export declare const EnquiryPriority: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type EnquiryPriority = (typeof EnquiryPriority)[keyof typeof EnquiryPriority];
export declare const InvoiceStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly PAID: "PAID";
    readonly OVERDUE: "OVERDUE";
    readonly CANCELLED: "CANCELLED";
};
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export declare const NotificationType: {
    readonly BOOKING_CREATED: "BOOKING_CREATED";
    readonly BOOKING_CONFIRMED: "BOOKING_CONFIRMED";
    readonly BOOKING_CANCELLED: "BOOKING_CANCELLED";
    readonly CAMPAIGN_STATUS_CHANGE: "CAMPAIGN_STATUS_CHANGE";
    readonly CREATIVE_UPLOADED: "CREATIVE_UPLOADED";
    readonly CREATIVE_APPROVED: "CREATIVE_APPROVED";
    readonly CREATIVE_REJECTED: "CREATIVE_REJECTED";
    readonly CREATIVE_REVISION_REQUESTED: "CREATIVE_REVISION_REQUESTED";
    readonly INVOICE_GENERATED: "INVOICE_GENERATED";
    readonly INVOICE_OVERDUE: "INVOICE_OVERDUE";
    readonly PAYMENT_RECEIVED: "PAYMENT_RECEIVED";
    readonly RENTAL_EXPIRY_ALERT: "RENTAL_EXPIRY_ALERT";
    readonly HOLD_EXPIRING: "HOLD_EXPIRING";
    readonly HOLD_EXPIRED: "HOLD_EXPIRED";
    readonly PROPOSAL_READY: "PROPOSAL_READY";
    readonly PROPOSAL_VIEWED: "PROPOSAL_VIEWED";
    readonly ENQUIRY_CREATED: "ENQUIRY_CREATED";
    readonly ENQUIRY_CONVERTED: "ENQUIRY_CONVERTED";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export declare const ChatStage: {
    readonly STAGE_1_BRAND: 1;
    readonly STAGE_2_LOCATIONS: 2;
    readonly STAGE_3_BUDGET: 3;
    readonly STAGE_4_MATCHING: 4;
    readonly STAGE_5_PROPOSAL: 5;
};
export declare const VALID_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]>;
export declare const VALID_PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]>;
export declare const VALID_ENQUIRY_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]>;
export declare const VALID_CREATIVE_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]>;
export declare const INDIAN_CITIES: readonly ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow", "Raipur", "Bilaspur", "Bhilai", "Durg", "Korba", "Nagpur", "Indore", "Bhopal"];
export declare const INR: {
    symbol: string;
    code: string;
    format: (amount: number) => string;
};
export declare const IST: {
    timezone: string;
    offset: string;
    now: () => Date;
};
export declare const PAGINATION: {
    DEFAULT_PAGE: number;
    DEFAULT_LIMIT: number;
    MAX_LIMIT: number;
};
export declare const UPLOAD: {
    MAX_FILE_SIZE: number;
    ALLOWED_IMAGE_TYPES: string[];
    ALLOWED_DOC_TYPES: string[];
    MAX_PHOTOS_PER_ASSET: number;
};
export declare const HOLD_DURATION_HOURS = 24;
export declare const SCORE_WEIGHTS: {
    LOCATION_RELEVANCE: number;
    BUDGET_FIT: number;
    TRAFFIC_VOLUME: number;
    SIZE_APPROPRIATENESS: number;
    AVAILABILITY_MATCH: number;
    VENDOR_RELIABILITY: number;
    TOTAL: number;
};
export declare const ASSET_SCORE_WEIGHTS: {
    TRAFFIC_VOLUME: number;
    PHYSICAL_CONDITION: number;
    SIZE_VISIBILITY: number;
    CAMPAIGN_PERFORMANCE: number;
    VENDOR_RELIABILITY: number;
    LIGHTING_QUALITY: number;
    AVAILABILITY: number;
    TOTAL: number;
};
export declare const CONDITION_SCORES: Record<string, number>;
export declare const LIGHTING_SCORES: Record<string, number>;
//# sourceMappingURL=constants.d.ts.map