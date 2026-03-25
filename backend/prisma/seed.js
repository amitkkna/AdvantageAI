"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database with comprehensive data...\n');
    // Clear existing data in correct order (respecting FK constraints)
    await prisma.campaignAnalytics.deleteMany();
    await prisma.creative.deleteMany();
    await prisma.fieldCheckin.deleteMany();
    await prisma.assetPhoto.deleteMany();
    await prisma.availabilityBlock.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.enquiry.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.rentalAgreement.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.savedFilter.deleteMany();
    await prisma.userDashboardConfig.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleared existing data.');
    // ═══════════════════════════════════════════════
    // ═══ USERS (12) ═══
    // ═══════════════════════════════════════════════
    const pw = async (p) => bcryptjs_1.default.hash(p, 12);
    const admin = await prisma.user.create({
        data: { email: 'admin@advantage.ai', password: await pw('admin123'), name: 'Rahul Sharma', phone: '+919876543210', role: 'ADMIN' },
    });
    const sales1 = await prisma.user.create({
        data: { email: 'sales@advantage.ai', password: await pw('sales123'), name: 'Priya Patel', phone: '+919876543211', role: 'SALES' },
    });
    const sales2 = await prisma.user.create({
        data: { email: 'neha@advantage.ai', password: await pw('sales123'), name: 'Neha Verma', phone: '+919876543230', role: 'SALES' },
    });
    const sales3 = await prisma.user.create({
        data: { email: 'rohit@advantage.ai', password: await pw('sales123'), name: 'Rohit Agrawal', phone: '+919876543231', role: 'SALES' },
    });
    const field1 = await prisma.user.create({
        data: { email: 'field@advantage.ai', password: await pw('field123'), name: 'Amit Kumar', phone: '+919876543212', role: 'FIELD' },
    });
    const field2 = await prisma.user.create({
        data: { email: 'suresh@advantage.ai', password: await pw('field123'), name: 'Suresh Yadav', phone: '+919876543232', role: 'FIELD' },
    });
    const field3 = await prisma.user.create({
        data: { email: 'ravi@advantage.ai', password: await pw('field123'), name: 'Ravi Sahu', phone: '+919876543233', role: 'FIELD' },
    });
    const finance1 = await prisma.user.create({
        data: { email: 'finance@advantage.ai', password: await pw('admin123'), name: 'Kavita Mishra', phone: '+919876543234', role: 'FINANCE' },
    });
    console.log('8 internal users created.');
    // ═══════════════════════════════════════════════
    // ═══ VENDORS (8) ═══
    // ═══════════════════════════════════════════════
    const vendors = await Promise.all([
        prisma.vendor.create({ data: { name: 'CG Media Solutions', contactPerson: 'Rajesh Tiwari', email: 'rajesh@cgmedia.in', phone: '+919771234567', address: 'GE Road, Raipur', city: 'Raipur', state: 'Chhattisgarh', gstNumber: '22ABCDE1234F1Z5', reliabilityScore: 92 } }),
        prisma.vendor.create({ data: { name: 'Skyline Outdoor Pvt Ltd', contactPerson: 'Vikram Singh', email: 'vikram@skylineoutdoor.com', phone: '+919771234568', address: 'Pandri, Raipur', city: 'Raipur', state: 'Chhattisgarh', gstNumber: '22FGHIJ5678K2Z6', reliabilityScore: 85 } }),
        prisma.vendor.create({ data: { name: 'Metro Ads CG', contactPerson: 'Deepak Verma', email: 'deepak@metroads.in', phone: '+919771234569', address: 'Telibandha, Raipur', city: 'Raipur', state: 'Chhattisgarh', reliabilityScore: 78 } }),
        prisma.vendor.create({ data: { name: 'Bhilai Hoardings Co', contactPerson: 'Sunita Agrawal', email: 'sunita@bhilaihoardings.com', phone: '+919771234570', address: 'Sector 6, Bhilai', city: 'Bhilai', state: 'Chhattisgarh', reliabilityScore: 88 } }),
        prisma.vendor.create({ data: { name: 'Central India Ads', contactPerson: 'Manoj Sahu', email: 'manoj@centralindiaads.com', phone: '+919771234571', address: 'Link Road, Bilaspur', city: 'Bilaspur', state: 'Chhattisgarh', reliabilityScore: 82 } }),
        prisma.vendor.create({ data: { name: 'Korba Outdoor Media', contactPerson: 'Ramesh Patel', email: 'ramesh@korbaoutdoor.in', phone: '+919771234572', address: 'NTPC Road, Korba', city: 'Korba', state: 'Chhattisgarh', reliabilityScore: 75 } }),
        prisma.vendor.create({ data: { name: 'Bastar Publicity', contactPerson: 'Dinesh Kashyap', email: 'dinesh@bastarpub.com', phone: '+919771234573', address: 'Main Road, Jagdalpur', city: 'Jagdalpur', state: 'Chhattisgarh', reliabilityScore: 70 } }),
        prisma.vendor.create({ data: { name: 'Surguja Ads Network', contactPerson: 'Pradeep Pandey', email: 'pradeep@surgujaads.in', phone: '+919771234574', address: 'Station Road, Ambikapur', city: 'Ambikapur', state: 'Chhattisgarh', reliabilityScore: 73 } }),
    ]);
    console.log('8 vendors created.');
    // ═══════════════════════════════════════════════
    // ═══ 100 ASSETS across Chhattisgarh ═══
    // ═══════════════════════════════════════════════
    const assetData = [
        // ── RAIPUR (30 assets) ──
        { code: 'RPR-001', name: 'GE Road Hoarding - Jaistambh Chowk', type: 'HOARDING', address: 'GE Road, Jaistambh Chowk', city: 'Raipur', lat: 21.2514, lng: 81.6296, w: 40, h: 20, lighting: 'FRONT_LIT', rate: 75000, traffic: 85000, landmark: 'Jaistambh Chowk', vendorIdx: 0 },
        { code: 'RPR-002', name: 'Fafadih Chowk Billboard', type: 'BILLBOARD', address: 'Fafadih Chowk, Raipur', city: 'Raipur', lat: 21.2437, lng: 81.6358, w: 30, h: 15, lighting: 'BACK_LIT', rate: 65000, traffic: 72000, landmark: 'Fafadih Chowk', vendorIdx: 0 },
        { code: 'RPR-003', name: 'Telibandha Lake Road Unipole', type: 'UNIPOLE', address: 'Telibandha Road, Near Lake', city: 'Raipur', lat: 21.2365, lng: 81.6488, w: 20, h: 10, lighting: 'FRONT_LIT', rate: 45000, traffic: 55000, landmark: 'Telibandha Lake', vendorIdx: 2 },
        { code: 'RPR-004', name: 'VIP Road Gantry', type: 'GANTRY', address: 'VIP Road, Raipur', city: 'Raipur', lat: 21.2610, lng: 81.6360, w: 30, h: 10, lighting: 'FRONT_LIT', rate: 120000, traffic: 90000, landmark: 'VIP Road', vendorIdx: 1 },
        { code: 'RPR-005', name: 'Pandri Chowk Billboard', type: 'BILLBOARD', address: 'Pandri Chowk', city: 'Raipur', lat: 21.2389, lng: 81.6310, w: 25, h: 12, lighting: 'BACK_LIT', rate: 55000, traffic: 65000, landmark: 'Pandri Bus Stand', vendorIdx: 1 },
        { code: 'RPR-006', name: 'Station Road Hoarding', type: 'HOARDING', address: 'Station Road, Near Railway Station', city: 'Raipur', lat: 21.2167, lng: 81.6289, w: 35, h: 15, lighting: 'FRONT_LIT', rate: 55000, traffic: 78000, landmark: 'Raipur Railway Station', vendorIdx: 0 },
        { code: 'RPR-007', name: 'Shankar Nagar Gantry', type: 'GANTRY', address: 'Shankar Nagar Main Road', city: 'Raipur', lat: 21.2455, lng: 81.6502, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 85000, traffic: 70000, landmark: 'Shankar Nagar', vendorIdx: 2 },
        { code: 'RPR-008', name: 'Magneto Mall Hoarding', type: 'HOARDING', address: 'Magneto Mall, Labhandi', city: 'Raipur', lat: 21.2702, lng: 81.6685, w: 50, h: 30, lighting: 'FRONT_LIT', rate: 150000, traffic: 95000, landmark: 'Magneto Mall', vendorIdx: 1 },
        { code: 'RPR-009', name: 'City Center Mall Billboard', type: 'BILLBOARD', address: 'City Center Mall, Pandri', city: 'Raipur', lat: 21.2398, lng: 81.6350, w: 30, h: 15, lighting: 'BACK_LIT', rate: 70000, traffic: 80000, landmark: 'City Center Mall', vendorIdx: 0 },
        { code: 'RPR-010', name: 'Ring Road Unipole - Tatibandh', type: 'UNIPOLE', address: 'Ring Road, Tatibandh', city: 'Raipur', lat: 21.2780, lng: 81.6125, w: 20, h: 10, lighting: 'FRONT_LIT', rate: 35000, traffic: 45000, landmark: 'Tatibandh', vendorIdx: 2 },
        { code: 'RPR-011', name: 'Amanaka Chowk Hoarding', type: 'HOARDING', address: 'Amanaka Chowk', city: 'Raipur', lat: 21.2320, lng: 81.6265, w: 40, h: 20, lighting: 'FRONT_LIT', rate: 60000, traffic: 68000, landmark: 'Amanaka', vendorIdx: 0 },
        { code: 'RPR-012', name: 'Bhanpuri Flyover Billboard', type: 'BILLBOARD', address: 'Bhanpuri Flyover', city: 'Raipur', lat: 21.2230, lng: 81.6180, w: 25, h: 12, lighting: 'BACK_LIT', rate: 50000, traffic: 60000, landmark: 'Bhanpuri', vendorIdx: 1 },
        { code: 'RPR-013', name: 'Devendra Nagar Unipole', type: 'UNIPOLE', address: 'Devendra Nagar', city: 'Raipur', lat: 21.2555, lng: 81.6410, w: 15, h: 8, lighting: 'BACK_LIT', rate: 30000, traffic: 40000, landmark: 'Devendra Nagar', vendorIdx: 2 },
        { code: 'RPR-014', name: 'NH-6 Highway Gantry', type: 'GANTRY', address: 'NH-6, Near Mana', city: 'Raipur', lat: 21.2105, lng: 81.6050, w: 30, h: 10, lighting: 'FRONT_LIT', rate: 95000, traffic: 100000, landmark: 'NH-6 Highway', vendorIdx: 0 },
        { code: 'RPR-015', name: 'Ambuja Mall Billboard', type: 'BILLBOARD', address: 'Ambuja City Center', city: 'Raipur', lat: 21.2480, lng: 81.6320, w: 25, h: 12, lighting: 'BACK_LIT', rate: 70000, traffic: 75000, landmark: 'Ambuja Mall', vendorIdx: 1 },
        { code: 'RPR-016', name: 'Mowa Flyover Hoarding', type: 'HOARDING', address: 'Mowa Flyover, Raipur', city: 'Raipur', lat: 21.2850, lng: 81.6450, w: 35, h: 15, lighting: 'FRONT_LIT', rate: 55000, traffic: 72000, landmark: 'Mowa', vendorIdx: 2 },
        { code: 'RPR-017', name: 'Byron Bazaar Unipole', type: 'UNIPOLE', address: 'Byron Bazaar, Raipur', city: 'Raipur', lat: 21.2490, lng: 81.6280, w: 15, h: 8, lighting: 'BACK_LIT', rate: 28000, traffic: 35000, landmark: 'Byron Bazaar', vendorIdx: 2 },
        { code: 'RPR-018', name: 'Samta Colony Billboard', type: 'BILLBOARD', address: 'Samta Colony Main Road', city: 'Raipur', lat: 21.2340, lng: 81.6550, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 48000, traffic: 52000, landmark: 'Samta Colony', vendorIdx: 0 },
        { code: 'RPR-019', name: 'Khamardih Gantry', type: 'GANTRY', address: 'Khamardih Road', city: 'Raipur', lat: 21.2680, lng: 81.6590, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 88000, traffic: 82000, landmark: 'Khamardih', vendorIdx: 1 },
        { code: 'RPR-020', name: 'Purani Basti Hoarding', type: 'HOARDING', address: 'Purani Basti, Raipur', city: 'Raipur', lat: 21.2450, lng: 81.6220, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 42000, traffic: 48000, landmark: 'Purani Basti', vendorIdx: 0 },
        { code: 'RPR-021', name: 'Nehru Nagar Billboard', type: 'BILLBOARD', address: 'Nehru Nagar Square', city: 'Raipur', lat: 21.2530, lng: 81.6450, w: 25, h: 12, lighting: 'BACK_LIT', rate: 52000, traffic: 58000, landmark: 'Nehru Nagar', vendorIdx: 2 },
        { code: 'RPR-022', name: 'Vidhan Sabha Road Unipole', type: 'UNIPOLE', address: 'Vidhan Sabha Road', city: 'Raipur', lat: 21.2620, lng: 81.6520, w: 20, h: 10, lighting: 'FRONT_LIT', rate: 62000, traffic: 70000, landmark: 'Vidhan Sabha', vendorIdx: 1 },
        { code: 'RPR-023', name: 'Shastri Chowk Hoarding', type: 'HOARDING', address: 'Shastri Chowk', city: 'Raipur', lat: 21.2410, lng: 81.6340, w: 40, h: 20, lighting: 'FRONT_LIT', rate: 68000, traffic: 76000, landmark: 'Shastri Chowk', vendorIdx: 0 },
        { code: 'RPR-024', name: 'Hirapur Gantry', type: 'GANTRY', address: 'Hirapur Chowk', city: 'Raipur', lat: 21.2280, lng: 81.6150, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 78000, traffic: 65000, landmark: 'Hirapur', vendorIdx: 1 },
        { code: 'RPR-025', name: 'Naya Raipur Gate Billboard', type: 'BILLBOARD', address: 'Naya Raipur Entry Gate', city: 'Raipur', lat: 21.1950, lng: 81.7200, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 90000, traffic: 88000, landmark: 'Naya Raipur', vendorIdx: 0 },
        { code: 'RPR-026', name: 'Labhandi Unipole', type: 'UNIPOLE', address: 'Labhandi Road', city: 'Raipur', lat: 21.2730, lng: 81.6620, w: 18, h: 9, lighting: 'BACK_LIT', rate: 38000, traffic: 42000, landmark: 'Labhandi', vendorIdx: 2 },
        { code: 'RPR-027', name: 'Pachpedi Naka Hoarding', type: 'HOARDING', address: 'Pachpedi Naka', city: 'Raipur', lat: 21.2350, lng: 81.6400, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 58000, traffic: 64000, landmark: 'Pachpedi Naka', vendorIdx: 0 },
        { code: 'RPR-028', name: 'Marine Drive Billboard', type: 'BILLBOARD', address: 'Marine Drive, Telibandha', city: 'Raipur', lat: 21.2380, lng: 81.6510, w: 28, h: 14, lighting: 'BACK_LIT', rate: 72000, traffic: 68000, landmark: 'Marine Drive', vendorIdx: 1 },
        { code: 'RPR-029', name: 'Katora Talab Gantry', type: 'GANTRY', address: 'Near Katora Talab', city: 'Raipur', lat: 21.2460, lng: 81.6250, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 82000, traffic: 72000, landmark: 'Katora Talab', vendorIdx: 2 },
        { code: 'RPR-030', name: 'Gudhiyari Unipole', type: 'UNIPOLE', address: 'Gudhiyari Chowk', city: 'Raipur', lat: 21.2200, lng: 81.6100, w: 18, h: 9, lighting: 'FRONT_LIT', rate: 32000, traffic: 38000, landmark: 'Gudhiyari', vendorIdx: 0 },
        // ── BHILAI (15 assets) ──
        { code: 'BHL-001', name: 'Sector 6 Market Hoarding', type: 'HOARDING', address: 'Main Road, Sector 6', city: 'Bhilai', lat: 21.2094, lng: 81.3784, w: 35, h: 15, lighting: 'FRONT_LIT', rate: 40000, traffic: 55000, landmark: 'Sector 6 Market', vendorIdx: 3 },
        { code: 'BHL-002', name: 'Civic Center Billboard', type: 'BILLBOARD', address: 'Civic Center, Bhilai', city: 'Bhilai', lat: 21.2168, lng: 81.4312, w: 25, h: 12, lighting: 'BACK_LIT', rate: 35000, traffic: 48000, landmark: 'Civic Center', vendorIdx: 3 },
        { code: 'BHL-003', name: 'Supela Chowk Unipole', type: 'UNIPOLE', address: 'Supela Chowk', city: 'Bhilai', lat: 21.2145, lng: 81.3956, w: 20, h: 10, lighting: 'FRONT_LIT', rate: 30000, traffic: 42000, landmark: 'Supela Chowk', vendorIdx: 3 },
        { code: 'BHL-004', name: 'Nehru Nagar Gantry', type: 'GANTRY', address: 'Nehru Nagar, Bhilai', city: 'Bhilai', lat: 21.2050, lng: 81.3850, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 55000, traffic: 50000, landmark: 'Nehru Nagar', vendorIdx: 3 },
        { code: 'BHL-005', name: 'Power House Billboard', type: 'BILLBOARD', address: 'Power House Road', city: 'Bhilai', lat: 21.2180, lng: 81.4050, w: 30, h: 15, lighting: 'BACK_LIT', rate: 38000, traffic: 46000, landmark: 'Power House', vendorIdx: 3 },
        { code: 'BHL-006', name: 'Junwani Hoarding', type: 'HOARDING', address: 'Junwani Road', city: 'Bhilai', lat: 21.1980, lng: 81.3720, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 32000, traffic: 38000, landmark: 'Junwani', vendorIdx: 3 },
        { code: 'BHL-007', name: 'Akash Ganga Unipole', type: 'UNIPOLE', address: 'Near Akash Ganga Complex', city: 'Bhilai', lat: 21.2120, lng: 81.4180, w: 18, h: 9, lighting: 'BACK_LIT', rate: 25000, traffic: 35000, landmark: 'Akash Ganga', vendorIdx: 3 },
        { code: 'BHL-008', name: 'Sector 1 Gate Gantry', type: 'GANTRY', address: 'BSP Sector 1 Gate', city: 'Bhilai', lat: 21.2200, lng: 81.4100, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 48000, traffic: 52000, landmark: 'BSP Gate', vendorIdx: 3 },
        { code: 'BHL-009', name: 'Khursipar Billboard', type: 'BILLBOARD', address: 'Khursipar Main Road', city: 'Bhilai', lat: 21.2260, lng: 81.3900, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 28000, traffic: 32000, landmark: 'Khursipar', vendorIdx: 3 },
        { code: 'BHL-010', name: 'Sector 10 Hoarding', type: 'HOARDING', address: 'Sector 10 Market', city: 'Bhilai', lat: 21.2020, lng: 81.3950, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 34000, traffic: 40000, landmark: 'Sector 10', vendorIdx: 3 },
        { code: 'BHL-011', name: 'Risali Unipole', type: 'UNIPOLE', address: 'Risali Main Road', city: 'Bhilai', lat: 21.2300, lng: 81.3700, w: 20, h: 10, lighting: 'BACK_LIT', rate: 22000, traffic: 28000, landmark: 'Risali', vendorIdx: 3 },
        { code: 'BHL-012', name: 'Kumhari Gantry', type: 'GANTRY', address: 'NH-6, Kumhari', city: 'Bhilai', lat: 21.2350, lng: 81.3600, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 52000, traffic: 60000, landmark: 'Kumhari', vendorIdx: 3 },
        { code: 'BHL-013', name: 'Maroda Billboard', type: 'BILLBOARD', address: 'Maroda Sector', city: 'Bhilai', lat: 21.1950, lng: 81.4000, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 26000, traffic: 30000, landmark: 'Maroda', vendorIdx: 3 },
        { code: 'BHL-014', name: 'Charoda Hoarding', type: 'HOARDING', address: 'Charoda Main Road', city: 'Bhilai', lat: 21.2380, lng: 81.3550, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 30000, traffic: 35000, landmark: 'Charoda', vendorIdx: 3 },
        { code: 'BHL-015', name: 'Kohka Unipole', type: 'UNIPOLE', address: 'Kohka Chowk', city: 'Bhilai', lat: 21.2150, lng: 81.3680, w: 18, h: 9, lighting: 'FRONT_LIT', rate: 20000, traffic: 25000, landmark: 'Kohka', vendorIdx: 3 },
        // ── DURG (12 assets) ──
        { code: 'DRG-001', name: 'Station Road Billboard', type: 'BILLBOARD', address: 'Station Road, Durg', city: 'Durg', lat: 21.1904, lng: 81.2849, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 38000, traffic: 50000, landmark: 'Durg Railway Station', vendorIdx: 3 },
        { code: 'DRG-002', name: 'Padmanabhpur Hoarding', type: 'HOARDING', address: 'Padmanabhpur Main Road', city: 'Durg', lat: 21.1850, lng: 81.2780, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 35000, traffic: 45000, landmark: 'Padmanabhpur', vendorIdx: 3 },
        { code: 'DRG-003', name: 'Pulgaon Chowk Gantry', type: 'GANTRY', address: 'Pulgaon Chowk', city: 'Durg', lat: 21.1920, lng: 81.2900, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 45000, traffic: 48000, landmark: 'Pulgaon Chowk', vendorIdx: 3 },
        { code: 'DRG-004', name: 'Adarsh Nagar Unipole', type: 'UNIPOLE', address: 'Adarsh Nagar', city: 'Durg', lat: 21.1870, lng: 81.2950, w: 18, h: 9, lighting: 'BACK_LIT', rate: 22000, traffic: 28000, landmark: 'Adarsh Nagar', vendorIdx: 3 },
        { code: 'DRG-005', name: 'Mohan Nagar Billboard', type: 'BILLBOARD', address: 'Mohan Nagar Road', city: 'Durg', lat: 21.1960, lng: 81.2800, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 30000, traffic: 35000, landmark: 'Mohan Nagar', vendorIdx: 3 },
        { code: 'DRG-006', name: 'Indira Market Hoarding', type: 'HOARDING', address: 'Near Indira Market', city: 'Durg', lat: 21.1890, lng: 81.2830, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 32000, traffic: 42000, landmark: 'Indira Market', vendorIdx: 3 },
        { code: 'DRG-007', name: 'Shakti Nagar Gantry', type: 'GANTRY', address: 'Shakti Nagar Road', city: 'Durg', lat: 21.1940, lng: 81.2750, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 42000, traffic: 40000, landmark: 'Shakti Nagar', vendorIdx: 3 },
        { code: 'DRG-008', name: 'Potiya Chowk Billboard', type: 'BILLBOARD', address: 'Potiya Chowk', city: 'Durg', lat: 21.1830, lng: 81.2880, w: 25, h: 12, lighting: 'BACK_LIT', rate: 28000, traffic: 34000, landmark: 'Potiya Chowk', vendorIdx: 3 },
        { code: 'DRG-009', name: 'Chhawani Road Unipole', type: 'UNIPOLE', address: 'Chhawani Road', city: 'Durg', lat: 21.1980, lng: 81.2920, w: 20, h: 10, lighting: 'FRONT_LIT', rate: 25000, traffic: 30000, landmark: 'Chhawani', vendorIdx: 3 },
        { code: 'DRG-010', name: 'Rajendra Nagar Hoarding', type: 'HOARDING', address: 'Rajendra Nagar', city: 'Durg', lat: 21.1860, lng: 81.2960, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 33000, traffic: 38000, landmark: 'Rajendra Nagar', vendorIdx: 3 },
        { code: 'DRG-011', name: 'Durg Bypass Gantry', type: 'GANTRY', address: 'Durg Bypass Road', city: 'Durg', lat: 21.1800, lng: 81.2700, w: 30, h: 10, lighting: 'FRONT_LIT', rate: 55000, traffic: 65000, landmark: 'Bypass Road', vendorIdx: 3 },
        { code: 'DRG-012', name: 'Malviya Nagar Billboard', type: 'BILLBOARD', address: 'Malviya Nagar Road', city: 'Durg', lat: 21.1910, lng: 81.2860, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 27000, traffic: 32000, landmark: 'Malviya Nagar', vendorIdx: 3 },
        // ── BILASPUR (13 assets) ──
        { code: 'BLP-001', name: 'Vyapar Vihar Billboard', type: 'BILLBOARD', address: 'Vyapar Vihar, Bilaspur', city: 'Bilaspur', lat: 22.0796, lng: 82.1391, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 35000, traffic: 45000, landmark: 'Vyapar Vihar', vendorIdx: 4 },
        { code: 'BLP-002', name: 'Link Road Hoarding', type: 'HOARDING', address: 'Link Road, Bilaspur', city: 'Bilaspur', lat: 22.0735, lng: 82.1480, w: 40, h: 20, lighting: 'BACK_LIT', rate: 42000, traffic: 52000, landmark: 'Link Road', vendorIdx: 4 },
        { code: 'BLP-003', name: 'Bilaspur Station Gantry', type: 'GANTRY', address: 'Near Railway Station', city: 'Bilaspur', lat: 22.0750, lng: 82.1500, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 55000, traffic: 60000, landmark: 'Railway Station', vendorIdx: 4 },
        { code: 'BLP-004', name: 'Sarkanda Unipole', type: 'UNIPOLE', address: 'Sarkanda Chowk', city: 'Bilaspur', lat: 22.0820, lng: 82.1350, w: 18, h: 9, lighting: 'FRONT_LIT', rate: 22000, traffic: 30000, landmark: 'Sarkanda', vendorIdx: 4 },
        { code: 'BLP-005', name: 'Tifra Billboard', type: 'BILLBOARD', address: 'Tifra Main Road', city: 'Bilaspur', lat: 22.0700, lng: 82.1420, w: 25, h: 12, lighting: 'BACK_LIT', rate: 28000, traffic: 35000, landmark: 'Tifra', vendorIdx: 4 },
        { code: 'BLP-006', name: 'Torwa Bypass Hoarding', type: 'HOARDING', address: 'Torwa Bypass Road', city: 'Bilaspur', lat: 22.0850, lng: 82.1250, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 38000, traffic: 48000, landmark: 'Torwa', vendorIdx: 4 },
        { code: 'BLP-007', name: 'Nehru Chowk Gantry', type: 'GANTRY', address: 'Nehru Chowk', city: 'Bilaspur', lat: 22.0780, lng: 82.1410, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 48000, traffic: 55000, landmark: 'Nehru Chowk', vendorIdx: 4 },
        { code: 'BLP-008', name: 'Mangla Chowk Billboard', type: 'BILLBOARD', address: 'Mangla Chowk', city: 'Bilaspur', lat: 22.0770, lng: 82.1370, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 30000, traffic: 38000, landmark: 'Mangla', vendorIdx: 4 },
        { code: 'BLP-009', name: 'Bus Stand Hoarding', type: 'HOARDING', address: 'Near Bus Stand', city: 'Bilaspur', lat: 22.0810, lng: 82.1450, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 34000, traffic: 42000, landmark: 'Bus Stand', vendorIdx: 4 },
        { code: 'BLP-010', name: 'Uslapur Unipole', type: 'UNIPOLE', address: 'Uslapur Road', city: 'Bilaspur', lat: 22.0900, lng: 82.1300, w: 20, h: 10, lighting: 'BACK_LIT', rate: 20000, traffic: 25000, landmark: 'Uslapur', vendorIdx: 4 },
        { code: 'BLP-011', name: 'Bilha Road Billboard', type: 'BILLBOARD', address: 'Bilha Road', city: 'Bilaspur', lat: 22.0680, lng: 82.1520, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 32000, traffic: 40000, landmark: 'Bilha Road', vendorIdx: 4 },
        { code: 'BLP-012', name: 'SECL Colony Hoarding', type: 'HOARDING', address: 'SECL Colony Road', city: 'Bilaspur', lat: 22.0830, lng: 82.1280, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 30000, traffic: 32000, landmark: 'SECL Colony', vendorIdx: 4 },
        { code: 'BLP-013', name: 'Sirgitti Gantry', type: 'GANTRY', address: 'Sirgitti Junction', city: 'Bilaspur', lat: 22.0650, lng: 82.1550, w: 28, h: 10, lighting: 'FRONT_LIT', rate: 50000, traffic: 58000, landmark: 'Sirgitti', vendorIdx: 4 },
        // ── KORBA (10 assets) ──
        { code: 'KRB-001', name: 'NTPC Road Billboard', type: 'BILLBOARD', address: 'NTPC Road, Korba', city: 'Korba', lat: 22.3595, lng: 82.7501, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 28000, traffic: 35000, landmark: 'NTPC Road', vendorIdx: 5 },
        { code: 'KRB-002', name: 'Kusmunda Hoarding', type: 'HOARDING', address: 'Kusmunda Main Road', city: 'Korba', lat: 22.3500, lng: 82.7400, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 25000, traffic: 30000, landmark: 'Kusmunda', vendorIdx: 5 },
        { code: 'KRB-003', name: 'Korba Station Gantry', type: 'GANTRY', address: 'Near Railway Station', city: 'Korba', lat: 22.3550, lng: 82.7550, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 38000, traffic: 40000, landmark: 'Railway Station', vendorIdx: 5 },
        { code: 'KRB-004', name: 'TPS Colony Unipole', type: 'UNIPOLE', address: 'TPS Colony Road', city: 'Korba', lat: 22.3620, lng: 82.7450, w: 18, h: 9, lighting: 'BACK_LIT', rate: 18000, traffic: 22000, landmark: 'TPS Colony', vendorIdx: 5 },
        { code: 'KRB-005', name: 'Pali Road Billboard', type: 'BILLBOARD', address: 'Pali Road', city: 'Korba', lat: 22.3480, lng: 82.7600, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 22000, traffic: 28000, landmark: 'Pali', vendorIdx: 5 },
        { code: 'KRB-006', name: 'Balco Nagar Hoarding', type: 'HOARDING', address: 'Balco Nagar Main', city: 'Korba', lat: 22.3650, lng: 82.7350, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 26000, traffic: 32000, landmark: 'Balco Nagar', vendorIdx: 5 },
        { code: 'KRB-007', name: 'Urga Gantry', type: 'GANTRY', address: 'Urga Junction', city: 'Korba', lat: 22.3700, lng: 82.7300, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 35000, traffic: 38000, landmark: 'Urga', vendorIdx: 5 },
        { code: 'KRB-008', name: 'Manikpur Billboard', type: 'BILLBOARD', address: 'Manikpur Road', city: 'Korba', lat: 22.3530, lng: 82.7650, w: 25, h: 12, lighting: 'BACK_LIT', rate: 20000, traffic: 25000, landmark: 'Manikpur', vendorIdx: 5 },
        { code: 'KRB-009', name: 'Katghora Road Unipole', type: 'UNIPOLE', address: 'Katghora Road', city: 'Korba', lat: 22.3450, lng: 82.7700, w: 18, h: 9, lighting: 'FRONT_LIT', rate: 16000, traffic: 20000, landmark: 'Katghora Road', vendorIdx: 5 },
        { code: 'KRB-010', name: 'Banki Mongra Hoarding', type: 'HOARDING', address: 'Banki Mongra Chowk', city: 'Korba', lat: 22.3580, lng: 82.7520, w: 35, h: 15, lighting: 'FRONT_LIT', rate: 24000, traffic: 28000, landmark: 'Banki Mongra', vendorIdx: 5 },
        // ── RAJNANDGAON (8 assets) ──
        { code: 'RJN-001', name: 'Bus Stand Billboard', type: 'BILLBOARD', address: 'Near Bus Stand, Rajnandgaon', city: 'Rajnandgaon', lat: 21.0972, lng: 81.0289, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 25000, traffic: 35000, landmark: 'Bus Stand', vendorIdx: 2 },
        { code: 'RJN-002', name: 'Station Road Hoarding', type: 'HOARDING', address: 'Station Road', city: 'Rajnandgaon', lat: 21.0950, lng: 81.0320, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 28000, traffic: 38000, landmark: 'Railway Station', vendorIdx: 2 },
        { code: 'RJN-003', name: 'Ganj Mandi Gantry', type: 'GANTRY', address: 'Ganj Mandi Road', city: 'Rajnandgaon', lat: 21.1000, lng: 81.0250, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 35000, traffic: 40000, landmark: 'Ganj Mandi', vendorIdx: 2 },
        { code: 'RJN-004', name: 'Khandwa Road Unipole', type: 'UNIPOLE', address: 'Khandwa Road', city: 'Rajnandgaon', lat: 21.0920, lng: 81.0350, w: 18, h: 9, lighting: 'BACK_LIT', rate: 18000, traffic: 22000, landmark: 'Khandwa Road', vendorIdx: 2 },
        { code: 'RJN-005', name: 'Nehru Chowk Billboard', type: 'BILLBOARD', address: 'Nehru Chowk', city: 'Rajnandgaon', lat: 21.0990, lng: 81.0270, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 22000, traffic: 30000, landmark: 'Nehru Chowk', vendorIdx: 2 },
        { code: 'RJN-006', name: 'Dongargarh Road Hoarding', type: 'HOARDING', address: 'Dongargarh Road', city: 'Rajnandgaon', lat: 21.0880, lng: 81.0200, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 24000, traffic: 32000, landmark: 'Dongargarh Road', vendorIdx: 2 },
        { code: 'RJN-007', name: 'Civil Lines Gantry', type: 'GANTRY', address: 'Civil Lines Road', city: 'Rajnandgaon', lat: 21.1020, lng: 81.0310, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 32000, traffic: 36000, landmark: 'Civil Lines', vendorIdx: 2 },
        { code: 'RJN-008', name: 'Amapara Unipole', type: 'UNIPOLE', address: 'Amapara Market', city: 'Rajnandgaon', lat: 21.0960, lng: 81.0260, w: 18, h: 9, lighting: 'FRONT_LIT', rate: 16000, traffic: 20000, landmark: 'Amapara', vendorIdx: 2 },
        // ── JAGDALPUR (7 assets) ──
        { code: 'JGD-001', name: 'Dharampura Billboard', type: 'BILLBOARD', address: 'Dharampura Road, Jagdalpur', city: 'Jagdalpur', lat: 19.0860, lng: 82.0217, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 22000, traffic: 28000, landmark: 'Dharampura', vendorIdx: 6 },
        { code: 'JGD-002', name: 'Bus Stand Hoarding', type: 'HOARDING', address: 'Near Bus Stand', city: 'Jagdalpur', lat: 19.0830, lng: 82.0180, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 25000, traffic: 32000, landmark: 'Bus Stand', vendorIdx: 6 },
        { code: 'JGD-003', name: 'Gol Bazaar Gantry', type: 'GANTRY', address: 'Gol Bazaar', city: 'Jagdalpur', lat: 19.0880, lng: 82.0240, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 30000, traffic: 35000, landmark: 'Gol Bazaar', vendorIdx: 6 },
        { code: 'JGD-004', name: 'Chitrakoot Road Unipole', type: 'UNIPOLE', address: 'Chitrakoot Road', city: 'Jagdalpur', lat: 19.0810, lng: 82.0150, w: 18, h: 9, lighting: 'BACK_LIT', rate: 15000, traffic: 18000, landmark: 'Chitrakoot Road', vendorIdx: 6 },
        { code: 'JGD-005', name: 'Lal Bagh Billboard', type: 'BILLBOARD', address: 'Near Lal Bagh Palace', city: 'Jagdalpur', lat: 19.0900, lng: 82.0200, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 20000, traffic: 25000, landmark: 'Lal Bagh', vendorIdx: 6 },
        { code: 'JGD-006', name: 'Danteshwari Road Hoarding', type: 'HOARDING', address: 'Danteshwari Temple Road', city: 'Jagdalpur', lat: 19.0850, lng: 82.0260, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 23000, traffic: 30000, landmark: 'Danteshwari Mandir', vendorIdx: 6 },
        { code: 'JGD-007', name: 'Koraput Road Gantry', type: 'GANTRY', address: 'Koraput Road', city: 'Jagdalpur', lat: 19.0790, lng: 82.0130, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 28000, traffic: 33000, landmark: 'Koraput Road', vendorIdx: 6 },
        // ── AMBIKAPUR (5 assets) ──
        { code: 'AMB-001', name: 'Station Road Billboard', type: 'BILLBOARD', address: 'Station Road, Ambikapur', city: 'Ambikapur', lat: 23.1186, lng: 83.1988, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 20000, traffic: 25000, landmark: 'Railway Station', vendorIdx: 7 },
        { code: 'AMB-002', name: 'Main Market Hoarding', type: 'HOARDING', address: 'Main Market Road', city: 'Ambikapur', lat: 23.1200, lng: 83.2020, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 22000, traffic: 28000, landmark: 'Main Market', vendorIdx: 7 },
        { code: 'AMB-003', name: 'Bus Stand Gantry', type: 'GANTRY', address: 'Near Bus Stand', city: 'Ambikapur', lat: 23.1160, lng: 83.1960, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 28000, traffic: 30000, landmark: 'Bus Stand', vendorIdx: 7 },
        { code: 'AMB-004', name: 'Darri Road Unipole', type: 'UNIPOLE', address: 'Darri Road', city: 'Ambikapur', lat: 23.1220, lng: 83.2050, w: 18, h: 9, lighting: 'BACK_LIT', rate: 14000, traffic: 18000, landmark: 'Darri Road', vendorIdx: 7 },
        { code: 'AMB-005', name: 'Collectorate Road Billboard', type: 'BILLBOARD', address: 'Near Collectorate', city: 'Ambikapur', lat: 23.1170, lng: 83.1940, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 18000, traffic: 22000, landmark: 'Collectorate', vendorIdx: 7 },
        // ── RAIGARH (5 assets) ──
        { code: 'RGH-001', name: 'Gandhi Chowk Billboard', type: 'BILLBOARD', address: 'Gandhi Chowk, Raigarh', city: 'Raigarh', lat: 21.8974, lng: 83.3950, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 22000, traffic: 28000, landmark: 'Gandhi Chowk', vendorIdx: 4 },
        { code: 'RGH-002', name: 'Station Road Hoarding', type: 'HOARDING', address: 'Station Road', city: 'Raigarh', lat: 21.8950, lng: 83.3920, w: 35, h: 18, lighting: 'FRONT_LIT', rate: 25000, traffic: 32000, landmark: 'Railway Station', vendorIdx: 4 },
        { code: 'RGH-003', name: 'Kotra Road Gantry', type: 'GANTRY', address: 'Kotra Road', city: 'Raigarh', lat: 21.9000, lng: 83.3980, w: 25, h: 10, lighting: 'FRONT_LIT', rate: 32000, traffic: 35000, landmark: 'Kotra Road', vendorIdx: 4 },
        { code: 'RGH-004', name: 'Chakradhar Nagar Unipole', type: 'UNIPOLE', address: 'Chakradhar Nagar', city: 'Raigarh', lat: 21.8930, lng: 83.3890, w: 18, h: 9, lighting: 'BACK_LIT', rate: 15000, traffic: 20000, landmark: 'Chakradhar Nagar', vendorIdx: 4 },
        { code: 'RGH-005', name: 'Sarangarh Road Billboard', type: 'BILLBOARD', address: 'Sarangarh Road', city: 'Raigarh', lat: 21.9020, lng: 83.4010, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 20000, traffic: 26000, landmark: 'Sarangarh Road', vendorIdx: 4 },
        // ── DHAMTARI (5 assets) ──
        { code: 'DHM-001', name: 'Bus Stand Billboard', type: 'BILLBOARD', address: 'Near Bus Stand, Dhamtari', city: 'Dhamtari', lat: 20.7071, lng: 81.5497, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 18000, traffic: 22000, landmark: 'Bus Stand', vendorIdx: 0 },
        { code: 'DHM-002', name: 'Gangrel Road Hoarding', type: 'HOARDING', address: 'Gangrel Dam Road', city: 'Dhamtari', lat: 20.7100, lng: 81.5530, w: 30, h: 15, lighting: 'FRONT_LIT', rate: 20000, traffic: 28000, landmark: 'Gangrel Road', vendorIdx: 0 },
        { code: 'DHM-003', name: 'Collectorate Gantry', type: 'GANTRY', address: 'Near Collectorate', city: 'Dhamtari', lat: 20.7050, lng: 81.5470, w: 22, h: 10, lighting: 'FRONT_LIT', rate: 25000, traffic: 30000, landmark: 'Collectorate', vendorIdx: 0 },
        { code: 'DHM-004', name: 'Gandhi Chowk Unipole', type: 'UNIPOLE', address: 'Gandhi Chowk', city: 'Dhamtari', lat: 20.7080, lng: 81.5510, w: 15, h: 8, lighting: 'BACK_LIT', rate: 12000, traffic: 16000, landmark: 'Gandhi Chowk', vendorIdx: 0 },
        { code: 'DHM-005', name: 'Court Road Billboard', type: 'BILLBOARD', address: 'Court Road', city: 'Dhamtari', lat: 20.7040, lng: 81.5450, w: 25, h: 12, lighting: 'FRONT_LIT', rate: 16000, traffic: 20000, landmark: 'Court Road', vendorIdx: 0 },
    ];
    console.log(`Creating ${assetData.length} assets across Chhattisgarh...`);
    const statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'PARTIALLY_BOOKED', 'PARTIALLY_BOOKED', 'FULLY_BOOKED', 'MAINTENANCE'];
    const assets = [];
    for (let i = 0; i < assetData.length; i++) {
        const a = assetData[i];
        const asset = await prisma.asset.create({
            data: {
                code: a.code, name: a.name, type: a.type,
                status: (a.status || statuses[i % statuses.length]),
                address: a.address, city: a.city, state: 'Chhattisgarh',
                latitude: a.lat, longitude: a.lng, width: a.w, height: a.h,
                lighting: a.lighting, faces: a.type === 'GANTRY' ? 2 : 1,
                monthlyRate: a.rate, dailyRate: Math.round(a.rate / 30),
                trafficCount: a.traffic, landmark: a.landmark,
                vendorId: vendors[a.vendorIdx].id,
            },
        });
        assets.push(asset);
    }
    console.log(`${assets.length} assets created.`);
    // ═══════════════════════════════════════════════
    // ═══ PHOTOS (4-6 per asset) ═══
    // ═══════════════════════════════════════════════
    const photoAngles = ['Front view', 'Side angle', 'Night view', 'Street level view', 'Close-up detail', 'Wide angle context'];
    let totalPhotos = 0;
    for (const asset of assets) {
        const numPhotos = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numPhotos; i++) {
            await prisma.assetPhoto.create({
                data: { assetId: asset.id, url: `https://picsum.photos/seed/${asset.code}-${i}/800/600`, caption: photoAngles[i] || `View ${i + 1}`, isPrimary: i === 0 },
            });
            totalPhotos++;
        }
    }
    console.log(`${totalPhotos} photos created.`);
    // ═══════════════════════════════════════════════
    // ═══ CLIENTS (12) ═══
    // ═══════════════════════════════════════════════
    const clients = await Promise.all([
        prisma.client.create({ data: { companyName: 'Raipur Motors Pvt Ltd', contactPerson: 'Sanjay Gupta', email: 'sanjay@raipurmotors.com', phone: '+919876543220', address: 'GE Road, Raipur', city: 'Raipur', industry: 'Automotive', gstNumber: '22MNOPQ9012R3Z7' } }),
        prisma.client.create({ data: { companyName: 'CG Jewellers', contactPerson: 'Anita Jain', email: 'anita@cgjewellers.in', phone: '+919876543221', address: 'Sadar Bazaar, Raipur', city: 'Raipur', industry: 'Retail/Jewellery' } }),
        prisma.client.create({ data: { companyName: 'NayaDuniya Real Estate', contactPerson: 'Vikash Agrawal', email: 'vikash@nayaduniya.com', phone: '+919876543222', address: 'Shankar Nagar, Raipur', city: 'Raipur', industry: 'Real Estate' } }),
        prisma.client.create({ data: { companyName: 'CG Super Bazaar', contactPerson: 'Dinesh Soni', email: 'dinesh@cgsuperbazaar.com', phone: '+919876543223', address: 'Pandri, Raipur', city: 'Raipur', industry: 'Retail/FMCG', gstNumber: '22XYZAB5678C4Z8' } }),
        prisma.client.create({ data: { companyName: 'Shri Balaji Hospitals', contactPerson: 'Dr. Meena Tiwari', email: 'meena@balajihospitals.in', phone: '+919876543224', address: 'VIP Road, Raipur', city: 'Raipur', industry: 'Healthcare' } }),
        prisma.client.create({ data: { companyName: 'Bhilai Steel Furniture', contactPerson: 'Rakesh Sharma', email: 'rakesh@bhilaisteelfurniture.com', phone: '+919876543225', address: 'Sector 6, Bhilai', city: 'Bhilai', industry: 'Furniture/Manufacturing' } }),
        prisma.client.create({ data: { companyName: 'Chhattisgarh Infotech', contactPerson: 'Pooja Mishra', email: 'pooja@cginfotech.in', phone: '+919876543226', address: 'Magneto Mall, Raipur', city: 'Raipur', industry: 'IT/Technology', gstNumber: '22CDEFG3456H5Z9' } }),
        prisma.client.create({ data: { companyName: 'Kosa Silk House', contactPerson: 'Sunita Dewangan', email: 'sunita@kosasilk.com', phone: '+919876543227', address: 'MG Road, Raipur', city: 'Raipur', industry: 'Textiles/Fashion' } }),
        prisma.client.create({ data: { companyName: 'Bilaspur Agro Industries', contactPerson: 'Mohan Patel', email: 'mohan@bilaspuragro.com', phone: '+919876543228', address: 'Link Road, Bilaspur', city: 'Bilaspur', industry: 'Agriculture' } }),
        prisma.client.create({ data: { companyName: 'Green Valley Schools', contactPerson: 'Anuradha Singh', email: 'anuradha@greenvalley.edu.in', phone: '+919876543229', address: 'Devendra Nagar, Raipur', city: 'Raipur', industry: 'Education' } }),
        prisma.client.create({ data: { companyName: 'Durg Auto World', contactPerson: 'Pankaj Verma', email: 'pankaj@durgauto.com', phone: '+919876543240', address: 'Station Road, Durg', city: 'Durg', industry: 'Automotive' } }),
        prisma.client.create({ data: { companyName: 'Mahadev Construction', contactPerson: 'Kishan Sahu', email: 'kishan@mahadevcon.in', phone: '+919876543241', address: 'Ring Road, Raipur', city: 'Raipur', industry: 'Construction/Real Estate', gstNumber: '22HIJKL7890M6Z0' } }),
    ]);
    console.log(`${clients.length} clients created.`);
    // ═══════════════════════════════════════════════
    // ═══ CLIENT USERS (4) ═══
    // ═══════════════════════════════════════════════
    const clientPw = await pw('client123');
    const clientUser1 = await prisma.user.create({ data: { email: 'sanjay@raipurmotors.com', password: clientPw, name: 'Sanjay Gupta', phone: '+919876543220', role: 'CLIENT', clientId: clients[0].id } });
    const clientUser2 = await prisma.user.create({ data: { email: 'anita@cgjewellers.in', password: clientPw, name: 'Anita Jain', phone: '+919876543221', role: 'CLIENT', clientId: clients[1].id } });
    const clientUser3 = await prisma.user.create({ data: { email: 'pooja@cginfotech.in', password: clientPw, name: 'Pooja Mishra', phone: '+919876543226', role: 'CLIENT', clientId: clients[6].id } });
    const clientUser4 = await prisma.user.create({ data: { email: 'pankaj@durgauto.com', password: clientPw, name: 'Pankaj Verma', phone: '+919876543240', role: 'CLIENT', clientId: clients[10].id } });
    console.log('4 client users created.');
    // ═══════════════════════════════════════════════
    // ═══ RENTAL AGREEMENTS (15) ═══
    // ═══════════════════════════════════════════════
    const rentalAgreements = [];
    for (let i = 0; i < 15; i++) {
        const asset = assets[i * 6]; // every 6th asset
        const vendor = vendors[assetData[i * 6].vendorIdx];
        const startDate = new Date('2024-01-01');
        startDate.setMonth(startDate.getMonth() + (i % 4));
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + (i % 3 === 0 ? 2 : 1));
        const ra = await prisma.rentalAgreement.create({
            data: {
                assetId: asset.id, vendorId: vendor.id,
                startDate, endDate,
                monthlyRent: Math.round(assetData[i * 6].rate * 0.4),
                securityDeposit: Math.round(assetData[i * 6].rate * 1.5),
                agreementUrl: `/agreements/RA-${String(i + 1).padStart(3, '0')}.pdf`,
                isActive: i < 12,
            },
        });
        rentalAgreements.push(ra);
    }
    console.log(`${rentalAgreements.length} rental agreements created.`);
    // ═══════════════════════════════════════════════
    // ═══ CAMPAIGNS (15) ═══
    // ═══════════════════════════════════════════════
    const campaignDefs = [
        { name: 'Raipur Motors Monsoon Sale 2025', clientIdx: 0, status: 'LIVE', start: '2025-07-01', end: '2025-09-30', budget: 500000, desc: 'Monsoon season sale campaign across Raipur city with premium billboard placements', assignee: sales1.id },
        { name: 'CG Jewellers Diwali Collection', clientIdx: 1, status: 'LIVE', start: '2025-10-01', end: '2025-11-30', budget: 350000, desc: 'Diwali festive collection launch campaign', assignee: sales1.id },
        { name: 'NayaDuniya Premium Villas Launch', clientIdx: 2, status: 'CLIENT_APPROVED', start: '2025-11-01', end: '2026-02-28', budget: 800000, desc: 'Premium residential project launch across CG', assignee: sales2.id },
        { name: 'CG Super Bazaar Grand Opening', clientIdx: 3, status: 'COMPLETED', start: '2025-01-15', end: '2025-03-15', budget: 250000, desc: 'New store opening campaign with city-wide coverage', assignee: sales1.id },
        { name: 'Balaji Hospital Health Camp Drive', clientIdx: 4, status: 'LIVE', start: '2025-08-01', end: '2025-12-31', budget: 420000, desc: 'Free health camp awareness drive across districts', assignee: sales3.id },
        { name: 'Bhilai Steel Furniture Clearance', clientIdx: 5, status: 'CREATIVE_PENDING', start: '2026-01-01', end: '2026-03-31', budget: 180000, desc: 'Year-end clearance sale in Bhilai-Durg region', assignee: sales2.id },
        { name: 'CG Infotech Digital Awareness', clientIdx: 6, status: 'PROPOSAL_SENT', start: '2026-04-01', end: '2026-06-30', budget: 550000, desc: 'Brand awareness campaign for new software product launch', assignee: sales1.id },
        { name: 'Kosa Silk Navratri Festival', clientIdx: 7, status: 'DRAFT', start: '2026-09-15', end: '2026-10-30', budget: 300000, desc: 'Navratri festive season silk saree promotion', assignee: sales3.id },
        { name: 'Bilaspur Agro Kisan Mela', clientIdx: 8, status: 'COMPLETED', start: '2025-02-01', end: '2025-04-30', budget: 200000, desc: 'Agricultural products promotion during Kisan Mela season', assignee: sales2.id },
        { name: 'Green Valley Admissions 2026', clientIdx: 9, status: 'CREATIVE_APPROVED', start: '2026-01-15', end: '2026-04-30', budget: 280000, desc: 'School admission season campaign with district coverage', assignee: sales1.id },
        { name: 'Durg Auto World Year-End Sale', clientIdx: 10, status: 'LIVE', start: '2025-11-15', end: '2026-01-15', budget: 320000, desc: 'Year-end automobile sale in Durg-Bhilai area', assignee: sales3.id },
        { name: 'Mahadev Construction Township', clientIdx: 11, status: 'CLIENT_APPROVED', start: '2026-03-01', end: '2026-08-31', budget: 950000, desc: 'New township project awareness on highways and city centers', assignee: sales2.id },
        { name: 'Raipur Motors Electric Launch', clientIdx: 0, status: 'DRAFT', start: '2026-06-01', end: '2026-08-31', budget: 600000, desc: 'Electric vehicle showroom launch campaign', assignee: sales1.id },
        { name: 'CG Jewellers Anniversary', clientIdx: 1, status: 'CANCELLED', start: '2025-05-01', end: '2025-06-30', budget: 180000, desc: '25th anniversary celebration campaign (cancelled due to budget)', assignee: sales1.id },
        { name: 'Super Bazaar Dussehra Offers', clientIdx: 3, status: 'COMPLETED', start: '2025-09-20', end: '2025-10-25', budget: 150000, desc: 'Dussehra festival special offers campaign', assignee: sales3.id },
    ];
    const campaigns = [];
    for (const c of campaignDefs) {
        const campaign = await prisma.campaign.create({
            data: {
                name: c.name, clientId: clients[c.clientIdx].id,
                status: c.status, startDate: new Date(c.start), endDate: new Date(c.end),
                totalBudget: c.budget, description: c.desc, assignedToId: c.assignee,
            },
        });
        campaigns.push(campaign);
    }
    console.log(`${campaigns.length} campaigns created.`);
    // ═══════════════════════════════════════════════
    // ═══ BOOKINGS (40) ═══
    // ═══════════════════════════════════════════════
    const bookingDefs = [
        // Campaign 0 (Monsoon Sale - LIVE) — 5 bookings
        { campIdx: 0, assetIdx: 0, start: '2025-07-01', end: '2025-09-30', status: 'CONFIRMED', amount: 225000 },
        { campIdx: 0, assetIdx: 3, start: '2025-07-15', end: '2025-08-31', status: 'CONFIRMED', amount: 180000 },
        { campIdx: 0, assetIdx: 5, start: '2025-07-01', end: '2025-09-30', status: 'CONFIRMED', amount: 165000 },
        { campIdx: 0, assetIdx: 8, start: '2025-08-01', end: '2025-09-30', status: 'HOLD', amount: 140000 },
        { campIdx: 0, assetIdx: 14, start: '2025-07-01', end: '2025-09-30', status: 'CONFIRMED', amount: 210000 },
        // Campaign 1 (Diwali Collection - LIVE) — 4 bookings
        { campIdx: 1, assetIdx: 1, start: '2025-10-01', end: '2025-11-30', status: 'CONFIRMED', amount: 130000 },
        { campIdx: 1, assetIdx: 7, start: '2025-10-01', end: '2025-11-30', status: 'CONFIRMED', amount: 300000 },
        { campIdx: 1, assetIdx: 22, start: '2025-10-15', end: '2025-11-30', status: 'HOLD', amount: 102000 },
        { campIdx: 1, assetIdx: 27, start: '2025-10-01', end: '2025-11-30', status: 'CONFIRMED', amount: 144000 },
        // Campaign 2 (Premium Villas - APPROVED) — 4 bookings
        { campIdx: 2, assetIdx: 4, start: '2025-11-01', end: '2026-02-28', status: 'CONFIRMED', amount: 220000 },
        { campIdx: 2, assetIdx: 13, start: '2025-11-01', end: '2026-02-28', status: 'CONFIRMED', amount: 380000 },
        { campIdx: 2, assetIdx: 24, start: '2025-12-01', end: '2026-02-28', status: 'HOLD', amount: 270000 },
        { campIdx: 2, assetIdx: 18, start: '2025-11-01', end: '2026-01-31', status: 'CONFIRMED', amount: 264000 },
        // Campaign 3 (Grand Opening - COMPLETED) — 3 bookings
        { campIdx: 3, assetIdx: 9, start: '2025-01-15', end: '2025-03-15', status: 'COMPLETED', amount: 70000 },
        { campIdx: 3, assetIdx: 11, start: '2025-01-15', end: '2025-03-15', status: 'COMPLETED', amount: 100000 },
        { campIdx: 3, assetIdx: 20, start: '2025-02-01', end: '2025-03-15', status: 'COMPLETED', amount: 78000 },
        // Campaign 4 (Health Camp - LIVE) — 4 bookings
        { campIdx: 4, assetIdx: 2, start: '2025-08-01', end: '2025-12-31', status: 'CONFIRMED', amount: 225000 },
        { campIdx: 4, assetIdx: 6, start: '2025-08-01', end: '2025-12-31', status: 'CONFIRMED', amount: 425000 },
        { campIdx: 4, assetIdx: 30, start: '2025-09-01', end: '2025-12-31', status: 'CONFIRMED', amount: 160000 },
        { campIdx: 4, assetIdx: 57, start: '2025-10-01', end: '2025-12-31', status: 'HOLD', amount: 105000 },
        // Campaign 5 (Steel Furniture - CREATIVE_PENDING) — 3 bookings
        { campIdx: 5, assetIdx: 31, start: '2026-01-01', end: '2026-03-31', status: 'CONFIRMED', amount: 105000 },
        { campIdx: 5, assetIdx: 33, start: '2026-01-01', end: '2026-03-31', status: 'CONFIRMED', amount: 165000 },
        { campIdx: 5, assetIdx: 35, start: '2026-01-15', end: '2026-03-31', status: 'HOLD', amount: 80000 },
        // Campaign 8 (Kisan Mela - COMPLETED) — 3 bookings
        { campIdx: 8, assetIdx: 57, start: '2025-02-01', end: '2025-04-30', status: 'COMPLETED', amount: 66000 },
        { campIdx: 8, assetIdx: 59, start: '2025-02-01', end: '2025-04-30', status: 'COMPLETED', amount: 84000 },
        { campIdx: 8, assetIdx: 62, start: '2025-03-01', end: '2025-04-30', status: 'COMPLETED', amount: 60000 },
        // Campaign 9 (Green Valley Admissions) — 3 bookings
        { campIdx: 9, assetIdx: 12, start: '2026-01-15', end: '2026-04-30', status: 'CONFIRMED', amount: 105000 },
        { campIdx: 9, assetIdx: 16, start: '2026-01-15', end: '2026-04-30', status: 'CONFIRMED', amount: 98000 },
        { campIdx: 9, assetIdx: 25, start: '2026-02-01', end: '2026-04-30', status: 'HOLD', amount: 114000 },
        // Campaign 10 (Durg Auto - LIVE) — 3 bookings
        { campIdx: 10, assetIdx: 45, start: '2025-11-15', end: '2026-01-15', status: 'CONFIRMED', amount: 76000 },
        { campIdx: 10, assetIdx: 47, start: '2025-11-15', end: '2026-01-15', status: 'CONFIRMED', amount: 90000 },
        { campIdx: 10, assetIdx: 50, start: '2025-12-01', end: '2026-01-15', status: 'CONFIRMED', amount: 45000 },
        // Campaign 11 (Mahadev Township) — 3 bookings
        { campIdx: 11, assetIdx: 10, start: '2026-03-01', end: '2026-08-31', status: 'CONFIRMED', amount: 360000 },
        { campIdx: 11, assetIdx: 19, start: '2026-03-01', end: '2026-08-31', status: 'HOLD', amount: 252000 },
        { campIdx: 11, assetIdx: 23, start: '2026-04-01', end: '2026-08-31', status: 'HOLD', amount: 390000 },
        // Campaign 14 (Dussehra Offers - COMPLETED) — 2 bookings
        { campIdx: 14, assetIdx: 15, start: '2025-09-20', end: '2025-10-25', status: 'COMPLETED', amount: 66000 },
        { campIdx: 14, assetIdx: 17, start: '2025-09-20', end: '2025-10-25', status: 'COMPLETED', amount: 56000 },
    ];
    const bookings = [];
    for (const b of bookingDefs) {
        const booking = await prisma.booking.create({
            data: {
                campaignId: campaigns[b.campIdx].id, assetId: assets[b.assetIdx].id,
                startDate: new Date(b.start), endDate: new Date(b.end),
                status: b.status, amount: b.amount,
                holdExpiresAt: b.status === 'HOLD' ? new Date(Date.now() + 48 * 60 * 60 * 1000) : undefined,
            },
        });
        bookings.push(booking);
    }
    console.log(`${bookings.length} bookings created.`);
    // ═══════════════════════════════════════════════
    // ═══ CREATIVES (20) ═══
    // ═══════════════════════════════════════════════
    const creativeStatuses = ['PENDING', 'APPROVED', 'APPROVED', 'REJECTED', 'APPROVED'];
    const creativeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const creativeDefs = [];
    // Add 1-2 creatives per confirmed/completed booking
    const confirmedBookings = bookings.filter((_, i) => ['CONFIRMED', 'COMPLETED'].includes(bookingDefs[i].status));
    for (let i = 0; i < Math.min(20, confirmedBookings.length); i++) {
        const b = confirmedBookings[i];
        const bIdx = bookings.indexOf(b);
        const status = creativeStatuses[i % creativeStatuses.length];
        creativeDefs.push({
            bookingId: b.id, assetId: assets[bookingDefs[bIdx].assetIdx].id,
            fileUrl: `/uploads/creative-${String(i + 1).padStart(3, '0')}.${creativeTypes[i % 3] === 'application/pdf' ? 'pdf' : i % 2 === 0 ? 'jpg' : 'png'}`,
            fileName: `creative-${String(i + 1).padStart(3, '0')}.${creativeTypes[i % 3] === 'application/pdf' ? 'pdf' : i % 2 === 0 ? 'jpg' : 'png'}`,
            fileType: creativeTypes[i % 3],
            status: status,
            rejectionReason: status === 'REJECTED' ? 'Logo resolution too low. Please provide at least 300 DPI artwork.' : undefined,
            uploadedById: [sales1.id, sales2.id, sales3.id][i % 3],
            reviewedById: status !== 'PENDING' ? admin.id : undefined,
        });
    }
    for (const c of creativeDefs) {
        await prisma.creative.create({ data: c });
    }
    console.log(`${creativeDefs.length} creatives created.`);
    // ═══════════════════════════════════════════════
    // ═══ PROPOSALS (8) ═══
    // ═══════════════════════════════════════════════
    const proposalDefs = [
        { campIdx: 0, clientIdx: 0, title: 'Raipur Motors Monsoon Campaign Proposal', desc: 'Comprehensive OOH campaign plan for monsoon season sale with 5 strategic locations in Raipur.', budget: 500000, assetIdxs: [0, 3, 5, 8, 14], status: 'APPROVED' },
        { campIdx: 1, clientIdx: 1, title: 'CG Jewellers Diwali 2025 Proposal', desc: 'Premium billboard placements for Diwali festive collection launch. Focus on high-traffic chowks.', budget: 350000, assetIdxs: [1, 7, 22, 27], status: 'APPROVED' },
        { campIdx: 2, clientIdx: 2, title: 'NayaDuniya Premium Villas - OOH Strategy', desc: 'Highway and arterial road presence for premium real estate project across Raipur and nearby cities.', budget: 800000, assetIdxs: [4, 13, 18, 24], status: 'APPROVED' },
        { campIdx: 6, clientIdx: 6, title: 'CG Infotech Brand Awareness Package', desc: 'Strategic outdoor presence for new software product launch across 6 key locations.', budget: 550000, assetIdxs: [2, 7, 12, 21, 25, 28], status: 'SENT' },
        { campIdx: 7, clientIdx: 7, title: 'Kosa Silk Navratri Festival Campaign', desc: 'Festive season campaign targeting women shoppers in market areas of Raipur.', budget: 300000, assetIdxs: [1, 5, 9, 20], status: 'DRAFT' },
        { campIdx: 11, clientIdx: 11, title: 'Mahadev Construction Township Mega Plan', desc: 'Large-scale OOH deployment for new township project. Highway gantries and city hoardings.', budget: 950000, assetIdxs: [10, 13, 19, 23, 24, 29], status: 'APPROVED' },
        { campIdx: 12, clientIdx: 0, title: 'Raipur Motors EV Launch Campaign', desc: 'Electric vehicle showroom launch with modern digital and traditional billboard mix.', budget: 600000, assetIdxs: [3, 7, 14, 18, 24], status: 'DRAFT' },
        { campIdx: 9, clientIdx: 9, title: 'Green Valley School Admissions 2026', desc: 'School admission awareness across residential areas. Focus on parent demographics.', budget: 280000, assetIdxs: [12, 16, 25], status: 'APPROVED' },
    ];
    for (const p of proposalDefs) {
        const proposalAssets = p.assetIdxs.map((idx) => ({
            assetId: assets[idx].id, name: assets[idx].name, code: assets[idx].code,
            city: assetData[idx].city, type: assetData[idx].type,
            width: assetData[idx].w, height: assetData[idx].h,
            monthlyRate: assetData[idx].rate,
            address: assetData[idx].address, vendor: vendors[assetData[idx].vendorIdx].name,
            score: 50 + Math.floor(Math.random() * 40),
        }));
        await prisma.proposal.create({
            data: {
                campaignId: campaigns[p.campIdx].id, clientId: clients[p.clientIdx].id,
                title: p.title, description: p.desc, totalBudget: p.budget,
                assets: proposalAssets, status: p.status,
            },
        });
    }
    console.log(`${proposalDefs.length} proposals created.`);
    // ═══════════════════════════════════════════════
    // ═══ INVOICES (20) ═══
    // ═══════════════════════════════════════════════
    const invoiceDefs = [
        { num: 'INV-2025-001', campIdx: 0, clientIdx: 0, amount: 405000, status: 'PAID', due: '2025-08-15', paid: '2025-08-10' },
        { num: 'INV-2025-002', campIdx: 0, clientIdx: 0, amount: 225000, status: 'PAID', due: '2025-09-15', paid: '2025-09-12' },
        { num: 'INV-2025-003', campIdx: 1, clientIdx: 1, amount: 350000, status: 'SENT', due: '2025-11-15', paid: null },
        { num: 'INV-2025-004', campIdx: 1, clientIdx: 1, amount: 174000, status: 'OVERDUE', due: '2025-10-30', paid: null },
        { num: 'INV-2025-005', campIdx: 2, clientIdx: 2, amount: 400000, status: 'SENT', due: '2025-12-15', paid: null },
        { num: 'INV-2025-006', campIdx: 2, clientIdx: 2, amount: 400000, status: 'DRAFT', due: '2026-01-15', paid: null },
        { num: 'INV-2025-007', campIdx: 3, clientIdx: 3, amount: 250000, status: 'PAID', due: '2025-04-15', paid: '2025-04-08' },
        { num: 'INV-2025-008', campIdx: 4, clientIdx: 4, amount: 210000, status: 'PAID', due: '2025-09-15', paid: '2025-09-14' },
        { num: 'INV-2025-009', campIdx: 4, clientIdx: 4, amount: 210000, status: 'SENT', due: '2025-12-15', paid: null },
        { num: 'INV-2025-010', campIdx: 5, clientIdx: 5, amount: 180000, status: 'DRAFT', due: '2026-02-15', paid: null },
        { num: 'INV-2025-011', campIdx: 8, clientIdx: 8, amount: 200000, status: 'PAID', due: '2025-05-15', paid: '2025-05-20' },
        { num: 'INV-2025-012', campIdx: 9, clientIdx: 9, amount: 140000, status: 'SENT', due: '2026-03-15', paid: null },
        { num: 'INV-2025-013', campIdx: 9, clientIdx: 9, amount: 140000, status: 'DRAFT', due: '2026-05-15', paid: null },
        { num: 'INV-2025-014', campIdx: 10, clientIdx: 10, amount: 160000, status: 'SENT', due: '2026-01-15', paid: null },
        { num: 'INV-2025-015', campIdx: 10, clientIdx: 10, amount: 160000, status: 'OVERDUE', due: '2025-12-15', paid: null },
        { num: 'INV-2025-016', campIdx: 11, clientIdx: 11, amount: 475000, status: 'SENT', due: '2026-04-15', paid: null },
        { num: 'INV-2025-017', campIdx: 14, clientIdx: 3, amount: 150000, status: 'PAID', due: '2025-11-15', paid: '2025-11-10' },
        { num: 'INV-2025-018', campIdx: 3, clientIdx: 3, amount: 125000, status: 'PAID', due: '2025-03-15', paid: '2025-03-12' },
        { num: 'INV-2025-019', campIdx: 4, clientIdx: 4, amount: 105000, status: 'OVERDUE', due: '2025-11-15', paid: null },
        { num: 'INV-2025-020', campIdx: 11, clientIdx: 11, amount: 475000, status: 'DRAFT', due: '2026-07-15', paid: null },
    ];
    for (const inv of invoiceDefs) {
        const tax = Math.round(inv.amount * 0.18);
        await prisma.invoice.create({
            data: {
                invoiceNumber: inv.num, campaignId: campaigns[inv.campIdx].id, clientId: clients[inv.clientIdx].id,
                amount: inv.amount, tax, totalAmount: inv.amount + tax,
                status: inv.status, dueDate: new Date(inv.due),
                paidAt: inv.paid ? new Date(inv.paid) : undefined,
            },
        });
    }
    console.log(`${invoiceDefs.length} invoices created.`);
    // ═══════════════════════════════════════════════
    // ═══ FIELD CHECKINS (25) ═══
    // ═══════════════════════════════════════════════
    const conditions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Good', 'Excellent'];
    const checkinNotes = [
        'Billboard in great condition. Vinyl intact, no fading.',
        'Minor dust accumulation. Suggested cleaning before next campaign.',
        'Structure solid. Lighting working properly at night.',
        'Some peeling on bottom-right corner. Needs vinyl patch.',
        'Area has heavy traffic as reported. Good visibility from 200m.',
        'Recent rain damage on frame. Sent maintenance request.',
        'All good. Fresh creative installed yesterday.',
        'Lighting not working on right side. Reported to vendor.',
        'Good condition. New campaign creative looks vibrant.',
        'Vegetation partially blocking view from south approach. Needs trimming.',
    ];
    const fieldUsers = [field1, field2, field3];
    for (let i = 0; i < 25; i++) {
        const assetIdx = (i * 4) % assets.length;
        const asset = assets[assetIdx];
        const checkDate = new Date('2025-06-01');
        checkDate.setDate(checkDate.getDate() + i * 5);
        await prisma.fieldCheckin.create({
            data: {
                assetId: asset.id, userId: fieldUsers[i % 3].id,
                latitude: assetData[assetIdx].lat + (Math.random() - 0.5) * 0.001,
                longitude: assetData[assetIdx].lng + (Math.random() - 0.5) * 0.001,
                notes: checkinNotes[i % checkinNotes.length],
                photoUrls: [`https://picsum.photos/seed/checkin-${i}-1/800/600`, `https://picsum.photos/seed/checkin-${i}-2/800/600`],
                condition: conditions[i % conditions.length],
                createdAt: checkDate,
            },
        });
    }
    console.log('25 field checkins created.');
    // ═══════════════════════════════════════════════
    // ═══ NOTIFICATIONS (40) ═══
    // ═══════════════════════════════════════════════
    const notifDefs = [
        // Admin notifications
        { userId: admin.id, type: 'BOOKING_CREATED', title: 'New Booking Created', message: 'Booking for GE Road Hoarding confirmed for Raipur Motors Monsoon Sale.', isRead: true, daysAgo: 60 },
        { userId: admin.id, type: 'CREATIVE_UPLOADED', title: 'Creative Uploaded', message: 'New creative uploaded for CG Jewellers Diwali campaign. Pending review.', isRead: false, daysAgo: 15 },
        { userId: admin.id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Rs.4,77,900 received from Raipur Motors Pvt Ltd (INV-2025-001).', isRead: true, daysAgo: 45 },
        { userId: admin.id, type: 'HOLD_EXPIRING', title: 'Hold Expiring Soon', message: 'Hold on City Center Mall Billboard expires in 24 hours.', isRead: false, daysAgo: 2 },
        { userId: admin.id, type: 'INVOICE_GENERATED', title: 'Invoice Generated', message: 'Invoice INV-2025-016 generated for Mahadev Construction. Amount: Rs.5,60,500.', isRead: false, daysAgo: 1 },
        // Sales notifications
        { userId: sales1.id, type: 'BOOKING_CONFIRMED', title: 'Booking Confirmed', message: 'Booking #RPR-001 for Raipur Motors campaign has been confirmed.', isRead: true, daysAgo: 55 },
        { userId: sales1.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Campaign Status Updated', message: 'CG Super Bazaar Grand Opening campaign marked as COMPLETED.', isRead: true, daysAgo: 40 },
        { userId: sales1.id, type: 'PROPOSAL_READY', title: 'Proposal Ready', message: 'Proposal for CG Infotech Brand Awareness is ready for review.', isRead: false, daysAgo: 5 },
        { userId: sales1.id, type: 'CREATIVE_APPROVED', title: 'Creative Approved', message: 'Creative for Magneto Mall Hoarding approved by admin.', isRead: true, daysAgo: 20 },
        { userId: sales1.id, type: 'RENTAL_EXPIRY_ALERT', title: 'Rental Agreement Expiring', message: 'Rental agreement for RPR-006 Station Road Hoarding expires in 30 days.', isRead: false, daysAgo: 3 },
        { userId: sales2.id, type: 'BOOKING_CREATED', title: 'New Booking', message: 'New booking created for NayaDuniya Premium Villas on NH-6 Highway Gantry.', isRead: true, daysAgo: 30 },
        { userId: sales2.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Campaign Approved', message: 'Mahadev Construction Township campaign approved by client.', isRead: false, daysAgo: 7 },
        { userId: sales2.id, type: 'CREATIVE_REJECTED', title: 'Creative Rejected', message: 'Creative for Bhilai Steel Furniture rejected. Reason: Low resolution logo.', isRead: false, daysAgo: 4 },
        { userId: sales3.id, type: 'BOOKING_CONFIRMED', title: 'Booking Confirmed', message: 'Durg Auto World booking on Station Road Billboard confirmed.', isRead: true, daysAgo: 25 },
        { userId: sales3.id, type: 'HOLD_EXPIRING', title: 'Hold Expiring', message: 'Hold for Bilaspur Vyapar Vihar Billboard expires in 12 hours.', isRead: false, daysAgo: 1 },
        { userId: sales3.id, type: 'INVOICE_GENERATED', title: 'New Invoice', message: 'Invoice INV-2025-014 created for Durg Auto World. Amount: Rs.1,88,800.', isRead: false, daysAgo: 8 },
        // Field notifications
        { userId: field1.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'New Campaign Live', message: 'Balaji Hospital Health Camp Drive campaign is now LIVE. Check assigned assets.', isRead: true, daysAgo: 35 },
        { userId: field1.id, type: 'BOOKING_CONFIRMED', title: 'Inspection Required', message: 'New booking confirmed on Telibandha Lake Road. Please schedule site visit.', isRead: false, daysAgo: 10 },
        { userId: field2.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Campaign Update', message: 'Green Valley Admissions campaign creative approved. Installation scheduled.', isRead: false, daysAgo: 6 },
        { userId: field2.id, type: 'BOOKING_CREATED', title: 'New Assignment', message: 'Please inspect Sector 6 Market Hoarding in Bhilai for new booking.', isRead: true, daysAgo: 28 },
        { userId: field3.id, type: 'RENTAL_EXPIRY_ALERT', title: 'Vendor Inspection Due', message: 'Rental inspection due for VIP Road Gantry. Please visit within 7 days.', isRead: false, daysAgo: 2 },
        // Finance notifications
        { userId: finance1.id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Rs.2,95,000 received from CG Super Bazaar (INV-2025-007).', isRead: true, daysAgo: 50 },
        { userId: finance1.id, type: 'INVOICE_GENERATED', title: 'Invoice Overdue', message: 'Invoice INV-2025-004 for CG Jewellers is overdue by 15 days.', isRead: false, daysAgo: 3 },
        { userId: finance1.id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'Rs.2,36,000 received from Bilaspur Agro Industries (INV-2025-011).', isRead: true, daysAgo: 42 },
        { userId: finance1.id, type: 'INVOICE_GENERATED', title: 'Invoice Created', message: 'Invoice INV-2025-020 drafted for Mahadev Construction. Amount: Rs.5,60,500.', isRead: false, daysAgo: 1 },
        // Client notifications
        { userId: clientUser1.id, type: 'PROPOSAL_READY', title: 'Proposal Ready', message: 'Your Monsoon Sale 2025 campaign proposal is ready for review.', isRead: true, daysAgo: 65 },
        { userId: clientUser1.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Campaign Live', message: 'Your Raipur Motors Monsoon Sale 2025 campaign is now LIVE!', isRead: true, daysAgo: 55 },
        { userId: clientUser1.id, type: 'INVOICE_GENERATED', title: 'Invoice Available', message: 'Invoice INV-2025-001 is available for download. Amount: Rs.4,77,900.', isRead: true, daysAgo: 48 },
        { userId: clientUser1.id, type: 'CREATIVE_APPROVED', title: 'Creative Approved', message: 'Your billboard creative for GE Road Hoarding has been approved.', isRead: true, daysAgo: 52 },
        { userId: clientUser2.id, type: 'PROPOSAL_READY', title: 'Proposal Ready', message: 'Your Diwali Collection 2025 campaign proposal is ready for review.', isRead: false, daysAgo: 20 },
        { userId: clientUser2.id, type: 'BOOKING_CONFIRMED', title: 'Booking Confirmed', message: 'Your billboard on Magneto Mall has been confirmed for Oct-Nov 2025.', isRead: true, daysAgo: 18 },
        { userId: clientUser2.id, type: 'INVOICE_GENERATED', title: 'Invoice Pending', message: 'Invoice INV-2025-004 of Rs.2,05,320 is due. Please make payment.', isRead: false, daysAgo: 5 },
        { userId: clientUser3.id, type: 'PROPOSAL_READY', title: 'Proposal Ready', message: 'Your CG Infotech Brand Awareness proposal is ready. Please review.', isRead: false, daysAgo: 5 },
        { userId: clientUser3.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Proposal Sent', message: 'AdVantage has sent you a campaign proposal for Digital Awareness.', isRead: false, daysAgo: 5 },
        { userId: clientUser4.id, type: 'BOOKING_CONFIRMED', title: 'Booking Confirmed', message: 'Your billboards in Durg are confirmed for the Year-End Sale campaign.', isRead: true, daysAgo: 22 },
        { userId: clientUser4.id, type: 'CAMPAIGN_STATUS_CHANGE', title: 'Campaign Live', message: 'Your Durg Auto World Year-End Sale campaign is now LIVE!', isRead: true, daysAgo: 20 },
        { userId: clientUser4.id, type: 'INVOICE_GENERATED', title: 'Invoice Overdue', message: 'Invoice INV-2025-015 is overdue. Please clear the dues at earliest.', isRead: false, daysAgo: 3 },
        // Extra notifications for variety
        { userId: admin.id, type: 'BOOKING_CANCELLED', title: 'Booking Cancelled', message: 'CG Jewellers Anniversary campaign booking cancelled.', isRead: true, daysAgo: 38 },
        { userId: sales1.id, type: 'BOOKING_CANCELLED', title: 'Campaign Cancelled', message: 'CG Jewellers Anniversary campaign has been cancelled by client.', isRead: true, daysAgo: 38 },
        { userId: admin.id, type: 'CREATIVE_UPLOADED', title: 'Bulk Creative Upload', message: '5 new creatives uploaded for Green Valley Admissions campaign.', isRead: false, daysAgo: 6 },
    ];
    for (const n of notifDefs) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - n.daysAgo);
        await prisma.notification.create({
            data: { userId: n.userId, type: n.type, title: n.title, message: n.message, isRead: n.isRead, createdAt },
        });
    }
    console.log(`${notifDefs.length} notifications created.`);
    // ═══════════════════════════════════════════════
    // ═══ ACTIVITY LOGS (50) ═══
    // ═══════════════════════════════════════════════
    const activityDefs = [
        { userId: admin.id, action: 'LOGIN', entity: 'User', desc: 'Admin logged in from 192.168.1.10', daysAgo: 0 },
        { userId: admin.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[0].id, desc: 'Created campaign: Raipur Motors Monsoon Sale 2025', daysAgo: 65 },
        { userId: admin.id, action: 'STATUS_CHANGE', entity: 'Campaign', entityId: campaigns[0].id, desc: 'Campaign status changed from DRAFT to LIVE', daysAgo: 55 },
        { userId: admin.id, action: 'CREATE', entity: 'Asset', entityId: assets[0].id, desc: 'Created asset: GE Road Hoarding - Jaistambh Chowk', daysAgo: 90 },
        { userId: admin.id, action: 'UPDATE', entity: 'Asset', entityId: assets[7].id, desc: 'Updated monthly rate for Magneto Mall Hoarding from 140000 to 150000', daysAgo: 70 },
        { userId: admin.id, action: 'CREATE', entity: 'Vendor', entityId: vendors[0].id, desc: 'Created vendor: CG Media Solutions', daysAgo: 95 },
        { userId: admin.id, action: 'CREATE', entity: 'Client', entityId: clients[0].id, desc: 'Created client: Raipur Motors Pvt Ltd', daysAgo: 80 },
        { userId: admin.id, action: 'STATUS_CHANGE', entity: 'Creative', desc: 'Approved creative for GE Road Hoarding', daysAgo: 52 },
        { userId: admin.id, action: 'STATUS_CHANGE', entity: 'Creative', desc: 'Rejected creative for Sector 6 Hoarding - Low resolution', daysAgo: 4 },
        { userId: admin.id, action: 'EXPORT', entity: 'Report', desc: 'Exported monthly revenue report for Oct 2025', daysAgo: 12 },
        { userId: sales1.id, action: 'LOGIN', entity: 'User', desc: 'Sales user logged in', daysAgo: 0 },
        { userId: sales1.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[1].id, desc: 'Created campaign: CG Jewellers Diwali Collection', daysAgo: 30 },
        { userId: sales1.id, action: 'CREATE', entity: 'Booking', entityId: bookings[0].id, desc: 'Created booking for GE Road Hoarding', daysAgo: 58 },
        { userId: sales1.id, action: 'CREATE', entity: 'Booking', entityId: bookings[1].id, desc: 'Created booking for VIP Road Gantry', daysAgo: 56 },
        { userId: sales1.id, action: 'CREATE', entity: 'Proposal', desc: 'Generated proposal for Raipur Motors Monsoon Campaign', daysAgo: 66 },
        { userId: sales1.id, action: 'CREATE', entity: 'Proposal', desc: 'Generated proposal for CG Jewellers Diwali 2025', daysAgo: 28 },
        { userId: sales1.id, action: 'STATUS_CHANGE', entity: 'Booking', entityId: bookings[5].id, desc: 'Booking status changed from HOLD to CONFIRMED', daysAgo: 18 },
        { userId: sales1.id, action: 'CREATE', entity: 'Client', entityId: clients[1].id, desc: 'Created client: CG Jewellers', daysAgo: 75 },
        { userId: sales1.id, action: 'EXPORT', entity: 'Proposal', desc: 'Exported PDF proposal for CG Infotech', daysAgo: 5 },
        { userId: sales1.id, action: 'UPDATE', entity: 'Campaign', entityId: campaigns[13].id, desc: 'Campaign CG Jewellers Anniversary cancelled', daysAgo: 38 },
        { userId: sales2.id, action: 'LOGIN', entity: 'User', desc: 'Sales user Neha logged in', daysAgo: 1 },
        { userId: sales2.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[2].id, desc: 'Created campaign: NayaDuniya Premium Villas Launch', daysAgo: 35 },
        { userId: sales2.id, action: 'CREATE', entity: 'Booking', entityId: bookings[9].id, desc: 'Created booking for Pandri Chowk Billboard', daysAgo: 33 },
        { userId: sales2.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[5].id, desc: 'Created campaign: Bhilai Steel Furniture Clearance', daysAgo: 15 },
        { userId: sales2.id, action: 'CREATE', entity: 'Proposal', desc: 'Generated proposal for Mahadev Construction Township', daysAgo: 10 },
        { userId: sales3.id, action: 'LOGIN', entity: 'User', desc: 'Sales user Rohit logged in', daysAgo: 0 },
        { userId: sales3.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[4].id, desc: 'Created campaign: Balaji Hospital Health Camp Drive', daysAgo: 40 },
        { userId: sales3.id, action: 'CREATE', entity: 'Booking', entityId: bookings[16].id, desc: 'Created booking for Telibandha Lake Road', daysAgo: 38 },
        { userId: sales3.id, action: 'CREATE', entity: 'Campaign', entityId: campaigns[10].id, desc: 'Created campaign: Durg Auto World Year-End Sale', daysAgo: 25 },
        { userId: sales3.id, action: 'STATUS_CHANGE', entity: 'Campaign', entityId: campaigns[14].id, desc: 'Campaign Dussehra Offers marked as COMPLETED', daysAgo: 8 },
        { userId: field1.id, action: 'LOGIN', entity: 'User', desc: 'Field user Amit logged in', daysAgo: 1 },
        { userId: field1.id, action: 'CREATE', entity: 'FieldCheckin', desc: 'Checked in at GE Road Hoarding - Condition: Excellent', daysAgo: 10 },
        { userId: field1.id, action: 'CREATE', entity: 'FieldCheckin', desc: 'Checked in at Magneto Mall Hoarding - Condition: Good', daysAgo: 5 },
        { userId: field2.id, action: 'CREATE', entity: 'FieldCheckin', desc: 'Checked in at Sector 6 Market Hoarding - Condition: Fair', daysAgo: 8 },
        { userId: field2.id, action: 'CREATE', entity: 'FieldCheckin', desc: 'Checked in at VIP Road Gantry - Condition: Needs Repair', daysAgo: 3 },
        { userId: field3.id, action: 'CREATE', entity: 'FieldCheckin', desc: 'Checked in at Link Road Hoarding Bilaspur - Condition: Good', daysAgo: 6 },
        { userId: finance1.id, action: 'LOGIN', entity: 'User', desc: 'Finance user logged in', daysAgo: 0 },
        { userId: finance1.id, action: 'CREATE', entity: 'Invoice', desc: 'Generated invoice INV-2025-001 for Raipur Motors', daysAgo: 48 },
        { userId: finance1.id, action: 'STATUS_CHANGE', entity: 'Invoice', desc: 'Invoice INV-2025-001 marked as PAID', daysAgo: 45 },
        { userId: finance1.id, action: 'CREATE', entity: 'Invoice', desc: 'Generated invoice INV-2025-003 for CG Jewellers', daysAgo: 15 },
        { userId: finance1.id, action: 'STATUS_CHANGE', entity: 'Invoice', desc: 'Invoice INV-2025-004 marked as OVERDUE', daysAgo: 3 },
        { userId: finance1.id, action: 'EXPORT', entity: 'Report', desc: 'Exported accounts receivable report', daysAgo: 2 },
        { userId: clientUser1.id, action: 'LOGIN', entity: 'User', desc: 'Client user Sanjay logged in', daysAgo: 2 },
        { userId: clientUser1.id, action: 'UPDATE', entity: 'Proposal', desc: 'Client approved Monsoon Sale proposal', daysAgo: 60 },
        { userId: clientUser2.id, action: 'LOGIN', entity: 'User', desc: 'Client user Anita logged in', daysAgo: 1 },
        { userId: clientUser3.id, action: 'LOGIN', entity: 'User', desc: 'Client user Pooja logged in', daysAgo: 3 },
        { userId: clientUser4.id, action: 'LOGIN', entity: 'User', desc: 'Client user Pankaj logged in', daysAgo: 5 },
        { userId: admin.id, action: 'CREATE', entity: 'Client', entityId: clients[11].id, desc: 'Created client: Mahadev Construction', daysAgo: 14 },
        { userId: admin.id, action: 'UPDATE', entity: 'Vendor', entityId: vendors[3].id, desc: 'Updated reliability score for Bhilai Hoardings Co from 85 to 88', daysAgo: 20 },
        { userId: admin.id, action: 'DELETE', entity: 'SavedFilter', desc: 'Deleted saved filter: Old assets view', daysAgo: 30 },
    ];
    for (const a of activityDefs) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - a.daysAgo);
        await prisma.activityLog.create({
            data: {
                userId: a.userId, action: a.action, entity: a.entity,
                entityId: a.entityId, metadata: { description: a.desc },
                ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
                createdAt,
            },
        });
    }
    console.log(`${activityDefs.length} activity logs created.`);
    // ═══════════════════════════════════════════════
    // ═══ CAMPAIGN ANALYTICS (180 days across campaigns) ═══
    // ═══════════════════════════════════════════════
    let totalAnalytics = 0;
    // Analytics for each LIVE/COMPLETED campaign with confirmed bookings
    const analyticsCampaigns = [
        { campIdx: 0, bookingIdxs: [0, 1, 2, 4], startDate: '2025-07-01', days: 90 },
        { campIdx: 1, bookingIdxs: [5, 6, 8], startDate: '2025-10-01', days: 60 },
        { campIdx: 3, bookingIdxs: [13, 14, 15], startDate: '2025-01-15', days: 60 },
        { campIdx: 4, bookingIdxs: [16, 17, 18], startDate: '2025-08-01', days: 90 },
        { campIdx: 8, bookingIdxs: [23, 24, 25], startDate: '2025-02-01', days: 75 },
        { campIdx: 10, bookingIdxs: [29, 30, 31], startDate: '2025-11-15', days: 60 },
        { campIdx: 14, bookingIdxs: [35, 36], startDate: '2025-09-20', days: 35 },
    ];
    for (const ac of analyticsCampaigns) {
        for (const bIdx of ac.bookingIdxs) {
            if (!bookings[bIdx])
                continue;
            const startDate = new Date(ac.startDate);
            // Every 3rd day to keep record count reasonable
            for (let d = 0; d < ac.days; d += 3) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + d);
                try {
                    await prisma.campaignAnalytics.create({
                        data: {
                            campaignId: campaigns[ac.campIdx].id,
                            bookingId: bookings[bIdx].id,
                            date,
                            impressions: Math.floor(Math.random() * 15000) + 5000,
                            reach: Math.floor(Math.random() * 8000) + 2000,
                            cpm: Math.round((Math.random() * 60 + 15) * 100) / 100,
                        },
                    });
                    totalAnalytics++;
                }
                catch {
                    // Skip duplicates (same bookingId + date)
                }
            }
        }
    }
    console.log(`${totalAnalytics} analytics records created.`);
    // ═══════════════════════════════════════════════
    // ═══ SAVED FILTERS (6) ═══
    // ═══════════════════════════════════════════════
    await prisma.savedFilter.create({ data: { userId: admin.id, name: 'Raipur Available', entity: 'Asset', filters: { city: 'Raipur', status: 'AVAILABLE' }, isDefault: true } });
    await prisma.savedFilter.create({ data: { userId: admin.id, name: 'High Value Campaigns', entity: 'Campaign', filters: { minBudget: 500000 } } });
    await prisma.savedFilter.create({ data: { userId: sales1.id, name: 'My Active Campaigns', entity: 'Campaign', filters: { status: 'LIVE', assignedToId: sales1.id }, isDefault: true } });
    await prisma.savedFilter.create({ data: { userId: sales1.id, name: 'Overdue Invoices', entity: 'Invoice', filters: { status: 'OVERDUE' } } });
    await prisma.savedFilter.create({ data: { userId: finance1.id, name: 'Unpaid Invoices', entity: 'Invoice', filters: { status: ['SENT', 'OVERDUE'] }, isDefault: true } });
    await prisma.savedFilter.create({ data: { userId: field1.id, name: 'Needs Repair Assets', entity: 'Asset', filters: { status: 'MAINTENANCE' } } });
    console.log('6 saved filters created.');
    // ═══════════════════════════════════════════════
    // ═══ ENQUIRIES (15) ═══
    // ═══════════════════════════════════════════════
    const enquiryDefs = [
        { companyName: 'Sunrise Hospitals', contactPerson: 'Dr. Ravi Nair', email: 'ravi@sunrisehospitals.com', phone: '+919800112233', industry: 'Healthcare', cities: ['Raipur', 'Bilaspur'], assetTypes: ['BILLBOARD', 'HOARDING'], budget: 500000, requirements: 'Need high-visibility billboards near major hospitals and highways for brand awareness campaign', status: 'NEW', priority: 'HIGH', source: 'Website', assignedToId: sales1.id },
        { companyName: 'CG Steel Works', contactPerson: 'Manoj Tiwari', email: 'manoj@cgsteel.in', phone: '+919800223344', industry: 'Manufacturing', cities: ['Bhilai', 'Durg'], assetTypes: ['HOARDING', 'WALL_WRAP'], budget: 300000, requirements: 'Looking for industrial area billboards for recruitment drive', status: 'CONTACTED', priority: 'MEDIUM', source: 'Referral', assignedToId: sales2.id },
        { companyName: 'Royal Builders', contactPerson: 'Vikram Singh', email: 'vikram@royalbuilders.com', phone: '+919800334455', industry: 'Real Estate', cities: ['Raipur', 'Durg', 'Bhilai'], assetTypes: ['BILLBOARD', 'UNIPOLE', 'DIGITAL_SCREEN'], budget: 800000, requirements: 'Launching new township project, need premium locations across CG cities', status: 'QUALIFIED', priority: 'URGENT', source: 'Cold Call', assignedToId: sales1.id },
        { companyName: 'Metro Mall Raipur', contactPerson: 'Deepak Agarwal', email: 'deepak@metromall.in', phone: '+919800445566', industry: 'Retail', cities: ['Raipur'], assetTypes: ['DIGITAL_SCREEN', 'BUS_SHELTER'], budget: 400000, requirements: 'Grand opening campaign - need digital screens and bus shelters within 5km radius', status: 'PROPOSAL_SENT', priority: 'HIGH', source: 'Website', assignedToId: sales3.id },
        { companyName: 'CG University', contactPerson: 'Prof. Meena Sharma', email: 'admissions@cguniv.edu', phone: '+919800556677', industry: 'Education', cities: ['Raipur', 'Bilaspur', 'Korba'], assetTypes: ['BILLBOARD', 'POLE_KIOSK'], budget: 200000, requirements: 'Admission season campaign across CG cities', status: 'CONVERTED', priority: 'MEDIUM', source: 'Email', assignedToId: sales1.id },
        { companyName: 'Fresh Dairy CG', contactPerson: 'Ramesh Patel', email: 'ramesh@freshdairy.in', phone: '+919800667788', industry: 'FMCG', cities: ['Raipur', 'Durg'], assetTypes: ['BUS_SHELTER', 'POLE_KIOSK'], budget: 150000, requirements: 'Product launch campaign for new milk brand', status: 'LOST', priority: 'LOW', source: 'Referral', assignedToId: sales2.id },
        { companyName: 'Apex Fitness', contactPerson: 'Karan Malhotra', email: 'karan@apexfitness.in', phone: '+919800778899', industry: 'Health & Fitness', cities: ['Raipur'], assetTypes: ['BILLBOARD', 'DIGITAL_SCREEN'], budget: 250000, requirements: 'New gym launch, target young professionals in city center', status: 'NEW', priority: 'MEDIUM', source: 'Social Media' },
        { companyName: 'CG Pharma Ltd', contactPerson: 'Dr. Sunita Roy', email: 'sunita@cgpharma.com', phone: '+919800889900', industry: 'Pharmaceutical', cities: ['Raipur', 'Bilaspur', 'Korba', 'Raigarh'], assetTypes: ['HOARDING', 'WALL_WRAP'], budget: 600000, requirements: 'Health awareness campaign across Chhattisgarh', status: 'CONTACTED', priority: 'HIGH', source: 'Conference', assignedToId: sales3.id },
        { companyName: 'Quick Bites Restaurant', contactPerson: 'Ajay Soni', email: 'ajay@quickbites.in', phone: '+919800990011', industry: 'Food & Beverage', cities: ['Raipur'], assetTypes: ['POLE_KIOSK', 'BUS_SHELTER'], budget: 100000, requirements: 'Restaurant chain launch, need visibility near major intersections', status: 'QUALIFIED', priority: 'LOW', source: 'Walk-in', assignedToId: sales1.id },
        { companyName: 'TechVista Solutions', contactPerson: 'Arjun Deshmukh', email: 'arjun@techvista.io', phone: '+919801001122', industry: 'IT Services', cities: ['Raipur', 'Bhilai'], assetTypes: ['DIGITAL_SCREEN', 'BILLBOARD'], budget: 350000, requirements: 'Hiring campaign for tech talent in CG', status: 'NEW', priority: 'MEDIUM', source: 'LinkedIn' },
        { companyName: 'Golden Jewellers', contactPerson: 'Ritu Agarwal', email: 'ritu@goldenjewellers.in', phone: '+919801112233', industry: 'Jewellery', cities: ['Raipur', 'Bilaspur'], assetTypes: ['BILLBOARD', 'UNIPOLE'], budget: 450000, requirements: 'Wedding season campaign, premium locations only', status: 'CONTACTED', priority: 'HIGH', source: 'Referral', assignedToId: sales2.id },
        { companyName: 'EcoGreen Developers', contactPerson: 'Sameer Joshi', email: 'sameer@ecogreen.in', phone: '+919801223344', industry: 'Real Estate', cities: ['Raipur'], assetTypes: ['BILLBOARD', 'HOARDING', 'GANTRY'], budget: 1000000, requirements: 'Smart city project launch, large format billboards on highways', status: 'PROPOSAL_SENT', priority: 'URGENT', source: 'Website', assignedToId: sales1.id },
        { companyName: 'CG Auto Parts', contactPerson: 'Dinesh Kumar', email: 'dinesh@cgautoparts.com', phone: '+919801334455', industry: 'Automotive', cities: ['Durg', 'Bhilai', 'Rajnandgaon'], assetTypes: ['HOARDING'], budget: 180000, requirements: 'Brand visibility in industrial belt', status: 'LOST', priority: 'LOW', source: 'Cold Call', assignedToId: sales3.id },
        { companyName: 'Vedanta School', contactPerson: 'Kavita Mishra', email: 'kavita@vedantaschool.edu', phone: '+919801445566', industry: 'Education', cities: ['Raipur'], assetTypes: ['BILLBOARD', 'BUS_SHELTER'], budget: 120000, requirements: 'Admission campaign for academic year 2026-27', status: 'NEW', priority: 'MEDIUM', source: 'Email' },
        { companyName: 'SmartHome Electronics', contactPerson: 'Vivek Pandey', email: 'vivek@smarthome.in', phone: '+919801556677', industry: 'Electronics', cities: ['Raipur', 'Durg'], assetTypes: ['DIGITAL_SCREEN', 'BILLBOARD'], budget: 550000, requirements: 'Festive season campaign for new product line', status: 'QUALIFIED', priority: 'HIGH', source: 'Website', assignedToId: sales2.id },
    ];
    for (const eq of enquiryDefs) {
        const data = {
            companyName: eq.companyName, contactPerson: eq.contactPerson, email: eq.email,
            phone: eq.phone, industry: eq.industry, cities: eq.cities, assetTypes: eq.assetTypes,
            budget: eq.budget, requirements: eq.requirements, status: eq.status, priority: eq.priority, source: eq.source,
            notes: [{ text: `Initial enquiry received via ${eq.source || 'direct contact'}`, by: admin.id, at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }],
        };
        if (eq.assignedToId)
            data.assignedToId = eq.assignedToId;
        if (eq.clientId)
            data.clientId = eq.clientId;
        if (eq.campaignId)
            data.campaignId = eq.campaignId;
        if (eq.lostReason)
            data.lostReason = 'Budget constraints - postponed to next quarter';
        if (eq.status === 'CONVERTED')
            data.convertedAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
        await prisma.enquiry.create({ data });
    }
    console.log(`Created ${enquiryDefs.length} enquiries`);
    // ═══════════════════════════════════════════════
    // ═══ SUMMARY ═══
    // ═══════════════════════════════════════════════
    console.log('\n════════════════════════════════════════');
    console.log('  SEED COMPLETE - Summary');
    console.log('════════════════════════════════════════');
    console.log(`Users:              12 (4 internal + 4 client + 4 extra)`);
    console.log(`Vendors:            8`);
    console.log(`Assets:             ${assets.length}`);
    console.log(`Photos:             ${totalPhotos}`);
    console.log(`Clients:            ${clients.length}`);
    console.log(`Rental Agreements:  ${rentalAgreements.length}`);
    console.log(`Campaigns:          ${campaigns.length}`);
    console.log(`Bookings:           ${bookings.length}`);
    console.log(`Creatives:          ${creativeDefs.length}`);
    console.log(`Proposals:          ${proposalDefs.length}`);
    console.log(`Enquiries:          ${enquiryDefs.length}`);
    console.log(`Invoices:           ${invoiceDefs.length}`);
    console.log(`Field Checkins:     25`);
    console.log(`Notifications:      ${notifDefs.length}`);
    console.log(`Activity Logs:      ${activityDefs.length}`);
    console.log(`Analytics:          ${totalAnalytics}`);
    console.log(`Saved Filters:      6`);
    console.log('────────────────────────────────────────');
    console.log('Login Credentials:');
    console.log('  Admin:   admin@advantage.ai / admin123');
    console.log('  Sales:   sales@advantage.ai / sales123');
    console.log('  Sales2:  neha@advantage.ai / sales123');
    console.log('  Sales3:  rohit@advantage.ai / sales123');
    console.log('  Field:   field@advantage.ai / field123');
    console.log('  Field2:  suresh@advantage.ai / field123');
    console.log('  Field3:  ravi@advantage.ai / field123');
    console.log('  Finance: finance@advantage.ai / admin123');
    console.log('  Client1: sanjay@raipurmotors.com / client123');
    console.log('  Client2: anita@cgjewellers.in / client123');
    console.log('  Client3: pooja@cginfotech.in / client123');
    console.log('  Client4: pankaj@durgauto.com / client123');
    console.log('════════════════════════════════════════\n');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map