import type { UserRole, AssetType, AssetStatus, LightingType, CampaignStatus, BookingStatus, CreativeStatus, InvoiceStatus, NotificationType, ProposalStatus, EnquiryStatus, EnquiryPriority } from './constants';
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: PaginationMeta;
}
export interface User extends BaseEntity {
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
    isActive: boolean;
    clientId?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}
export interface Vendor extends BaseEntity {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    gstNumber?: string;
    panNumber?: string;
    reliabilityScore: number;
    isActive: boolean;
}
export interface Client extends BaseEntity {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    industry: string;
    gstNumber?: string;
    isActive: boolean;
}
export interface Asset extends BaseEntity {
    code: string;
    name: string;
    type: AssetType;
    status: AssetStatus;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
    lighting: LightingType;
    faces: number;
    monthlyRate: number;
    dailyRate?: number;
    trafficCount?: number;
    landmark?: string;
    description?: string;
    vendorId: string;
    vendor?: Vendor;
    photos?: AssetPhoto[];
}
export interface AssetPhoto extends BaseEntity {
    assetId: string;
    url: string;
    caption?: string;
    isPrimary: boolean;
}
export interface RentalAgreement extends BaseEntity {
    assetId: string;
    vendorId: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    agreementUrl?: string;
    isActive: boolean;
    asset?: Asset;
    vendor?: Vendor;
}
export interface AvailabilityBlock extends BaseEntity {
    assetId: string;
    startDate: string;
    endDate: string;
    bookingId?: string;
    reason: string;
}
export interface Campaign extends BaseEntity {
    name: string;
    clientId: string;
    client?: Client;
    status: CampaignStatus;
    startDate: string;
    endDate: string;
    totalBudget: number;
    description?: string;
    assignedToId?: string;
    assignedTo?: User;
    bookings?: Booking[];
    proposals?: Proposal[];
}
export interface Booking extends BaseEntity {
    campaignId: string;
    assetId: string;
    startDate: string;
    endDate: string;
    status: BookingStatus;
    amount: number;
    holdExpiresAt?: string;
    campaign?: Campaign;
    asset?: Asset;
}
export interface Proposal extends BaseEntity {
    campaignId?: string;
    clientId: string;
    title: string;
    description: string;
    totalBudget: number;
    assets: ProposalAsset[];
    pdfUrl?: string;
    status: ProposalStatus;
    validUntil?: string;
    sentAt?: string;
    viewedAt?: string;
    chatSessionId?: string;
    enquiryId?: string;
}
export interface ProposalAsset {
    assetId: string;
    asset?: Asset;
    startDate: string;
    endDate: string;
    amount: number;
    score: number;
}
export interface Creative extends BaseEntity {
    bookingId: string;
    assetId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    status: CreativeStatus;
    rejectionReason?: string;
    uploadedById: string;
    reviewedById?: string;
}
export interface Invoice extends BaseEntity {
    invoiceNumber: string;
    campaignId: string;
    clientId: string;
    amount: number;
    tax: number;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string;
    paidAt?: string;
    paymentMethod?: string;
    paymentRef?: string;
    notes?: string;
    pdfUrl?: string;
    campaign?: Campaign;
    client?: Client;
}
export interface Enquiry extends BaseEntity {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    industry?: string;
    cities: string[];
    assetTypes: string[];
    budget?: number;
    startDate?: string;
    endDate?: string;
    requirements?: string;
    status: EnquiryStatus;
    priority: EnquiryPriority;
    source?: string;
    assignedToId?: string;
    assignedTo?: User;
    clientId?: string;
    client?: Client;
    campaignId?: string;
    convertedAt?: string;
    lostReason?: string;
    notes: Array<{
        text: string;
        by: string;
        at: string;
    }>;
}
export interface Notification extends BaseEntity {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata?: Record<string, unknown>;
}
export interface CampaignAnalytics extends BaseEntity {
    campaignId: string;
    bookingId: string;
    date: string;
    impressions: number;
    reach: number;
    cpm: number;
}
export interface ChatSession extends BaseEntity {
    userId: string;
    clientId?: string;
    stage: number;
    stageData: Record<string, unknown>;
    isComplete: boolean;
    proposalId?: string;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    stageComplete?: boolean;
    stageData?: Record<string, unknown>;
}
export interface FieldCheckin extends BaseEntity {
    assetId: string;
    userId: string;
    latitude: number;
    longitude: number;
    notes?: string;
    photoUrls: string[];
    condition: 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED' | 'OBSTRUCTED';
}
export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    type: AssetType;
    status: AssetStatus;
    name: string;
    code: string;
    monthlyRate: number;
    color: 'green' | 'orange' | 'red' | 'grey';
}
export interface AssetScore {
    assetId: string;
    asset: Asset;
    totalScore: number;
    breakdown: {
        locationRelevance: number;
        budgetFit: number;
        trafficVolume: number;
        sizeAppropriateness: number;
        availabilityMatch: number;
        vendorReliability: number;
    };
}
export interface AssetFilter {
    city?: string;
    type?: AssetType;
    status?: AssetStatus;
    lighting?: LightingType;
    minPrice?: number;
    maxPrice?: number;
    minWidth?: number;
    maxWidth?: number;
    startDate?: string;
    endDate?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    vendorId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface AdminDashboardStats {
    totalAssets: number;
    availableAssets: number;
    occupancyRate: number;
    totalRevenue: number;
    revenueTarget: number;
    activeCampaigns: number;
    totalClients: number;
    pendingInvoices: number;
    outstandingAmount: number;
}
export interface ClientDashboardStats {
    activeCampaigns: number;
    totalBookings: number;
    totalSpend: number;
    daysRemaining: number;
    impressions: number;
    reach: number;
    avgCpm: number;
}
//# sourceMappingURL=types.d.ts.map