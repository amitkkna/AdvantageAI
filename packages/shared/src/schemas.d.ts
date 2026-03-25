import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["ADMIN", "SALES", "FIELD", "FINANCE", "CLIENT"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    role: "ADMIN" | "SALES" | "FIELD" | "FINANCE" | "CLIENT";
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    role: "ADMIN" | "SALES" | "FIELD" | "FINANCE" | "CLIENT";
    phone?: string | undefined;
}>;
export declare const createVendorSchema: z.ZodObject<{
    name: z.ZodString;
    contactPerson: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    gstNumber: z.ZodOptional<z.ZodString>;
    panNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone: string;
    contactPerson: string;
    address: string;
    city: string;
    state: string;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
}, {
    email: string;
    name: string;
    phone: string;
    contactPerson: string;
    address: string;
    city: string;
    state: string;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
}>;
export declare const updateVendorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    gstNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    panNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
}>;
export declare const createClientSchema: z.ZodObject<{
    companyName: z.ZodString;
    contactPerson: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    industry: z.ZodString;
    gstNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    contactPerson: string;
    address: string;
    city: string;
    companyName: string;
    industry: string;
    gstNumber?: string | undefined;
}, {
    email: string;
    phone: string;
    contactPerson: string;
    address: string;
    city: string;
    companyName: string;
    industry: string;
    gstNumber?: string | undefined;
}>;
export declare const updateClientSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    gstNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    gstNumber?: string | undefined;
    companyName?: string | undefined;
    industry?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    gstNumber?: string | undefined;
    companyName?: string | undefined;
    industry?: string | undefined;
}>;
export declare const createAssetSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["BILLBOARD", "UNIPOLE", "HOARDING", "BUS_SHELTER", "GANTRY", "DIGITAL_SCREEN", "WALL_WRAP", "POLE_KIOSK"]>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    lighting: z.ZodEnum<["FRONT_LIT", "BACK_LIT", "NON_LIT", "DIGITAL"]>;
    faces: z.ZodDefault<z.ZodNumber>;
    monthlyRate: z.ZodNumber;
    dailyRate: z.ZodOptional<z.ZodNumber>;
    trafficCount: z.ZodOptional<z.ZodNumber>;
    landmark: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK";
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
    lighting: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL";
    faces: number;
    monthlyRate: number;
    vendorId: string;
    dailyRate?: number | undefined;
    trafficCount?: number | undefined;
    landmark?: string | undefined;
    description?: string | undefined;
}, {
    code: string;
    type: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK";
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    width: number;
    height: number;
    lighting: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL";
    monthlyRate: number;
    vendorId: string;
    faces?: number | undefined;
    dailyRate?: number | undefined;
    trafficCount?: number | undefined;
    landmark?: string | undefined;
    description?: string | undefined;
}>;
export declare const updateAssetSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["BILLBOARD", "UNIPOLE", "HOARDING", "BUS_SHELTER", "GANTRY", "DIGITAL_SCREEN", "WALL_WRAP", "POLE_KIOSK"]>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    lighting: z.ZodOptional<z.ZodEnum<["FRONT_LIT", "BACK_LIT", "NON_LIT", "DIGITAL"]>>;
    faces: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    monthlyRate: z.ZodOptional<z.ZodNumber>;
    dailyRate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    trafficCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    landmark: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    vendorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    type?: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK" | undefined;
    name?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    lighting?: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL" | undefined;
    faces?: number | undefined;
    monthlyRate?: number | undefined;
    dailyRate?: number | undefined;
    trafficCount?: number | undefined;
    landmark?: string | undefined;
    description?: string | undefined;
    vendorId?: string | undefined;
}, {
    code?: string | undefined;
    type?: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK" | undefined;
    name?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    lighting?: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL" | undefined;
    faces?: number | undefined;
    monthlyRate?: number | undefined;
    dailyRate?: number | undefined;
    trafficCount?: number | undefined;
    landmark?: string | undefined;
    description?: string | undefined;
    vendorId?: string | undefined;
}>;
export declare const assetFilterSchema: z.ZodObject<{
    city: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["BILLBOARD", "UNIPOLE", "HOARDING", "BUS_SHELTER", "GANTRY", "DIGITAL_SCREEN", "WALL_WRAP", "POLE_KIOSK"]>>;
    status: z.ZodOptional<z.ZodEnum<["AVAILABLE", "PARTIALLY_BOOKED", "FULLY_BOOKED", "MAINTENANCE", "INACTIVE"]>>;
    lighting: z.ZodOptional<z.ZodEnum<["FRONT_LIT", "BACK_LIT", "NON_LIT", "DIGITAL"]>>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    radius: z.ZodOptional<z.ZodNumber>;
    vendorId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    type?: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK" | undefined;
    status?: "AVAILABLE" | "PARTIALLY_BOOKED" | "FULLY_BOOKED" | "MAINTENANCE" | "INACTIVE" | undefined;
    city?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    lighting?: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL" | undefined;
    vendorId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    radius?: number | undefined;
    search?: string | undefined;
}, {
    type?: "BILLBOARD" | "UNIPOLE" | "HOARDING" | "BUS_SHELTER" | "GANTRY" | "DIGITAL_SCREEN" | "WALL_WRAP" | "POLE_KIOSK" | undefined;
    status?: "AVAILABLE" | "PARTIALLY_BOOKED" | "FULLY_BOOKED" | "MAINTENANCE" | "INACTIVE" | undefined;
    city?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    lighting?: "FRONT_LIT" | "BACK_LIT" | "NON_LIT" | "DIGITAL" | undefined;
    vendorId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    radius?: number | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const createCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    clientId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    totalBudget: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
    clientId: string;
    totalBudget: number;
    description?: string | undefined;
    assignedToId?: string | undefined;
}, {
    name: string;
    startDate: string;
    endDate: string;
    clientId: string;
    totalBudget: number;
    description?: string | undefined;
    assignedToId?: string | undefined;
}>;
export declare const updateCampaignSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    totalBudget: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    clientId?: string | undefined;
    totalBudget?: number | undefined;
    assignedToId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    clientId?: string | undefined;
    totalBudget?: number | undefined;
    assignedToId?: string | undefined;
}>;
export declare const updateCampaignStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "PROPOSAL_SENT", "CLIENT_APPROVED", "CREATIVE_PENDING", "CREATIVE_APPROVED", "LIVE", "COMPLETED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PROPOSAL_SENT" | "CLIENT_APPROVED" | "CREATIVE_PENDING" | "CREATIVE_APPROVED" | "LIVE" | "COMPLETED" | "CANCELLED";
}, {
    status: "DRAFT" | "PROPOSAL_SENT" | "CLIENT_APPROVED" | "CREATIVE_PENDING" | "CREATIVE_APPROVED" | "LIVE" | "COMPLETED" | "CANCELLED";
}>;
export declare const createBookingSchema: z.ZodObject<{
    campaignId: z.ZodString;
    assetId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    campaignId: string;
    assetId: string;
    amount: number;
}, {
    startDate: string;
    endDate: string;
    campaignId: string;
    assetId: string;
    amount: number;
}>;
export declare const updateBookingStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["HOLD", "CONFIRMED", "CANCELLED", "COMPLETED"]>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "CANCELLED" | "HOLD" | "CONFIRMED";
}, {
    status: "COMPLETED" | "CANCELLED" | "HOLD" | "CONFIRMED";
}>;
export declare const reviewCreativeSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED", "REVISION_REQUESTED"]>;
    rejectionReason: z.ZodOptional<z.ZodString>;
    revisionNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    rejectionReason?: string | undefined;
    revisionNotes?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    rejectionReason?: string | undefined;
    revisionNotes?: string | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    message: z.ZodDefault<z.ZodString>;
    selections: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    clientId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    clientId?: string | null | undefined;
    sessionId?: string | null | undefined;
    selections?: Record<string, any> | null | undefined;
}, {
    message?: string | undefined;
    clientId?: string | null | undefined;
    sessionId?: string | null | undefined;
    selections?: Record<string, any> | null | undefined;
}>;
export declare const createInvoiceSchema: z.ZodObject<{
    campaignId: z.ZodString;
    clientId: z.ZodString;
    amount: z.ZodNumber;
    tax: z.ZodNumber;
    dueDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    campaignId: string;
    amount: number;
    tax: number;
    dueDate: string;
    notes?: string | undefined;
}, {
    clientId: string;
    campaignId: string;
    amount: number;
    tax: number;
    dueDate: string;
    notes?: string | undefined;
}>;
export declare const updateInvoiceStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    paymentRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE";
    paymentMethod?: string | undefined;
    paymentRef?: string | undefined;
}, {
    status: "DRAFT" | "CANCELLED" | "SENT" | "PAID" | "OVERDUE";
    paymentMethod?: string | undefined;
    paymentRef?: string | undefined;
}>;
export declare const updateProposalStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "SENT", "VIEWED", "APPROVED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "APPROVED" | "REJECTED" | "SENT" | "VIEWED";
}, {
    status: "DRAFT" | "APPROVED" | "REJECTED" | "SENT" | "VIEWED";
}>;
export declare const createEnquirySchema: z.ZodObject<{
    companyName: z.ZodString;
    contactPerson: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    cities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    assetTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    budget: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    source: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    contactPerson: string;
    companyName: string;
    cities: string[];
    assetTypes: string[];
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    industry?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    assignedToId?: string | undefined;
    budget?: number | undefined;
    requirements?: string | undefined;
    source?: string | undefined;
}, {
    email: string;
    phone: string;
    contactPerson: string;
    companyName: string;
    industry?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    assignedToId?: string | undefined;
    cities?: string[] | undefined;
    assetTypes?: string[] | undefined;
    budget?: number | undefined;
    requirements?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    source?: string | undefined;
}>;
export declare const updateEnquirySchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cities: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    assetTypes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    budget: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    requirements: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    companyName?: string | undefined;
    industry?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    assignedToId?: string | undefined;
    cities?: string[] | undefined;
    assetTypes?: string[] | undefined;
    budget?: number | undefined;
    requirements?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    source?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    contactPerson?: string | undefined;
    companyName?: string | undefined;
    industry?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    assignedToId?: string | undefined;
    cities?: string[] | undefined;
    assetTypes?: string[] | undefined;
    budget?: number | undefined;
    requirements?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    source?: string | undefined;
}>;
export declare const updateEnquiryStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "CONVERTED", "LOST"]>;
    lostReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PROPOSAL_SENT" | "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
    lostReason?: string | undefined;
}, {
    status: "PROPOSAL_SENT" | "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
    lostReason?: string | undefined;
}>;
export declare const fieldCheckinSchema: z.ZodObject<{
    assetId: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    condition: z.ZodEnum<["GOOD", "NEEDS_REPAIR", "DAMAGED", "OBSTRUCTED"]>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    assetId: string;
    condition: "GOOD" | "NEEDS_REPAIR" | "DAMAGED" | "OBSTRUCTED";
    notes?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    assetId: string;
    condition: "GOOD" | "NEEDS_REPAIR" | "DAMAGED" | "OBSTRUCTED";
    notes?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    PORT: z.ZodDefault<z.ZodNumber>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    AWS_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    AWS_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
    AWS_REGION: z.ZodDefault<z.ZodString>;
    S3_BUCKET: z.ZodDefault<z.ZodString>;
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    AWS_REGION: string;
    S3_BUCKET: string;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
}, {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    PORT?: number | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_REGION?: string | undefined;
    S3_BUCKET?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map