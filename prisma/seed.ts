// =============================================================================
// Dafa Sales Management App - Database Seed
// Vietnamese Glass Construction Company - Initial Data Population
// =============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: generate padded code
function genCode(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(6, '0')}`;
}

// Helper: random item from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: random int between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: date offset from now
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

async function main() {
  console.log('🌱 Starting Dafa seed...\n');

  // =========================================================================
  // 1. TEAMS
  // =========================================================================
  console.log('Creating teams...');

  const teamHCM = await prisma.team.create({
    data: { name: 'Team Khu vực HCM', description: 'Đội ngũ kinh doanh khu vực TP. Hồ Chí Minh và miền Nam' },
  });

  const teamHN = await prisma.team.create({
    data: { name: 'Team Khu vực Hà Nội', description: 'Đội ngũ kinh doanh khu vực Hà Nội và miền Bắc' },
  });

  const teamMT = await prisma.team.create({
    data: { name: 'Team Khu vực Miền Trung', description: 'Đội ngũ kinh doanh khu vực miền Trung' },
  });

  console.log(`  ✅ Created 3 teams\n`);

  // =========================================================================
  // 2. USERS
  // =========================================================================
  console.log('Creating users...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@dafa.vn', password: hashedPassword, name: 'Nguyễn Văn Admin', phone: '0901000001', role: 'ADMIN', teamId: teamHCM.id },
  });

  const manager = await prisma.user.create({
    data: { email: 'manager@dafa.vn', password: hashedPassword, name: 'Trần Thị Manager', phone: '0901000002', role: 'MANAGER', teamId: teamHCM.id },
  });

  const sales1 = await prisma.user.create({
    data: { email: 'sales1@dafa.vn', password: hashedPassword, name: 'Lê Văn Bình', phone: '0901000003', role: 'SALES', teamId: teamHCM.id },
  });

  const sales2 = await prisma.user.create({
    data: { email: 'sales2@dafa.vn', password: hashedPassword, name: 'Phạm Thị Cúc', phone: '0901000004', role: 'SALES', teamId: teamHCM.id },
  });

  const sales3 = await prisma.user.create({
    data: { email: 'sales3@dafa.vn', password: hashedPassword, name: 'Hoàng Văn Dũng', phone: '0901000005', role: 'SALES', teamId: teamHN.id },
  });

  const sales4 = await prisma.user.create({
    data: { email: 'sales4@dafa.vn', password: hashedPassword, name: 'Ngô Thị Em', phone: '0901000006', role: 'SALES', teamId: teamHN.id },
  });

  const sales5 = await prisma.user.create({
    data: { email: 'sales5@dafa.vn', password: hashedPassword, name: 'Đỗ Văn Phát', phone: '0901000007', role: 'SALES', teamId: teamMT.id },
  });

  const salesUsers = [sales1, sales2, sales3, sales4, sales5];
  const allUsers = [admin, manager, ...salesUsers];

  console.log(`  ✅ Created 7 users\n`);

  // =========================================================================
  // 3. PRODUCTS (20 products)
  // =========================================================================
  console.log('Creating products...');

  const productsData = [
    { code: 'CL-08', name: 'Kính cường lực 8mm', group: 'TEMPERED_GLASS' as const, unit: 'SQM' as const, referencePrice: 380000, description: 'Kính cường lực trong suốt dày 8mm, tiêu chuẩn EN 12150' },
    { code: 'CL-10', name: 'Kính cường lực 10mm', group: 'TEMPERED_GLASS' as const, unit: 'SQM' as const, referencePrice: 480000, description: 'Kính cường lực trong suốt dày 10mm, tiêu chuẩn EN 12150' },
    { code: 'CL-12', name: 'Kính cường lực 12mm', group: 'TEMPERED_GLASS' as const, unit: 'SQM' as const, referencePrice: 580000, description: 'Kính cường lực trong suốt dày 12mm, tiêu chuẩn EN 12150' },
    { code: 'HCA-2L', name: 'Kính hộp cách âm 2 lớp', group: 'INSULATED_GLASS' as const, unit: 'SQM' as const, referencePrice: 850000, description: 'Kính hộp cách âm cách nhiệt 2 lớp (6mm + 12A + 6mm)' },
    { code: 'HCA-3L', name: 'Kính hộp cách âm 3 lớp', group: 'INSULATED_GLASS' as const, unit: 'SQM' as const, referencePrice: 1350000, description: 'Kính hộp cách âm cách nhiệt 3 lớp (6mm + 12A + 6mm + 12A + 6mm)' },
    { code: 'DAT-PVB', name: 'Kính dán an toàn PVB', group: 'LAMINATED_GLASS' as const, unit: 'SQM' as const, referencePrice: 650000, description: 'Kính dán an toàn với lớp PVB 0.76mm, 2 lớp kính 5mm' },
    { code: 'MX-XANH', name: 'Kính màu xanh', group: 'TINTED_GLASS' as const, unit: 'SQM' as const, referencePrice: 420000, description: 'Kính màu xanh dương dày 8mm, hấp thụ nhiệt tốt' },
    { code: 'MX-TRA', name: 'Kính màu trà', group: 'TINTED_GLASS' as const, unit: 'SQM' as const, referencePrice: 400000, description: 'Kính màu trà dày 8mm, giảm chói, thẩm mỹ cao' },
    { code: 'PQ-01', name: 'Kính phản quang', group: 'REFLECTIVE_GLASS' as const, unit: 'SQM' as const, referencePrice: 550000, description: 'Kính phản quang phủ gương 1 chiều dày 8mm' },
    { code: 'VK-VP', name: 'Vách kính văn phòng', group: 'GLASS_PARTITION' as const, unit: 'SQM' as const, referencePrice: 950000, description: 'Vách kính cường lực 10mm khung nhôm, bao gồm phụ kiện' },
    { code: 'CK-BLS', name: 'Cửa kính cường lực bản lề sàn', group: 'GLASS_DOOR' as const, unit: 'SET' as const, referencePrice: 2200000, description: 'Bộ cửa kính cường lực 12mm kèm bản lề sàn Dorma/GMT' },
    { code: 'LC-CL', name: 'Lan can kính cường lực', group: 'GLASS_RAILING' as const, unit: 'LINEAR_METER' as const, referencePrice: 1800000, description: 'Lan can kính cường lực 12mm, bao gồm tay vịn inox 304' },
    { code: 'CB-TAM', name: 'Cabin tắm kính', group: 'SHOWER_CABIN' as const, unit: 'SET' as const, referencePrice: 4500000, description: 'Cabin tắm kính cường lực 10mm, phụ kiện inox 304, kèm gioăng chống nước' },
    { code: 'MD-CW', name: 'Mặt dựng kính (curtain wall)', group: 'GLASS_FACADE' as const, unit: 'SQM' as const, referencePrice: 2500000, description: 'Hệ mặt dựng kính curtain wall, kính hộp Low-E, khung nhôm' },
    { code: 'PK-BLS', name: 'Phụ kiện bản lề sàn', group: 'ACCESSORIES' as const, unit: 'PIECE' as const, referencePrice: 1500000, description: 'Bản lề sàn Dorma BTS-75V hoặc tương đương' },
    { code: 'PK-SPIDER', name: 'Phụ kiện spider', group: 'ACCESSORIES' as const, unit: 'PIECE' as const, referencePrice: 350000, description: 'Spider inox 304 loại 1 chân, cho mặt dựng kính' },
    { code: 'TC-LDKINH', name: 'Thi công lắp đặt kính', group: 'INSTALLATION' as const, unit: 'SQM' as const, referencePrice: 120000, description: 'Dịch vụ thi công lắp đặt kính cường lực, kính dán' },
    { code: 'TC-DDKS', name: 'Dịch vụ đo đạc khảo sát', group: 'INSTALLATION' as const, unit: 'SET' as const, referencePrice: 500000, description: 'Dịch vụ đo đạc khảo sát tại công trình, lập bản vẽ thi công' },
    { code: 'VK-PHONG', name: 'Vách kính phòng họp', group: 'GLASS_PARTITION' as const, unit: 'SQM' as const, referencePrice: 1050000, description: 'Vách kính cường lực 10mm cách âm cho phòng họp' },
    { code: 'CK-TRUOT', name: 'Cửa kính trượt tự động', group: 'GLASS_DOOR' as const, unit: 'SET' as const, referencePrice: 18000000, description: 'Bộ cửa kính trượt tự động, motor Đức, kính cường lực 10mm' },
  ];

  const products = [];
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    products.push(created);
  }

  console.log(`  ✅ Created ${products.length} products\n`);

  // =========================================================================
  // 4. CUSTOMERS (50 customers)
  // =========================================================================
  console.log('Creating customers...');

  const customerTypes = ['INDIVIDUAL', 'CONTRACTOR', 'CONSTRUCTION_COMPANY', 'ARCHITECT', 'INVESTOR', 'DEALER', 'OTHER'] as const;
  const customerSources = ['WEBSITE', 'FACEBOOK', 'ZALO', 'GOOGLE_ADS', 'REFERRAL', 'RETURNING', 'TELESALES', 'SHOWROOM', 'OTHER'] as const;
  const customerStatuses = ['NEW', 'CONTACTED', 'CONSULTING', 'QUOTE_SENT', 'NEGOTIATING', 'PURCHASED', 'NO_NEED', 'UNREACHABLE', 'FOLLOW_UP'] as const;

  const provinces = [
    'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai',
    'Long An', 'Hải Phòng', 'Cần Thơ', 'Khánh Hòa', 'Bà Rịa - Vũng Tàu',
    'Quảng Ninh', 'Thừa Thiên Huế', 'Lâm Đồng', 'Nghệ An', 'Bắc Ninh',
  ];

  const projectNames = [
    'Chung cư Sunrise City', 'Tòa nhà văn phòng Green Tower', 'Biệt thự Thảo Điền',
    'Khách sạn Mường Thanh', 'Trung tâm thương mại Vincom', 'Nhà phố Cityland',
    'Chung cư The Sun Avenue', 'Tòa nhà Bitexco', 'Villa Park',
    'Căn hộ Masteri Thảo Điền', 'Văn phòng Saigon Centre', 'Nhà hàng Golden Gate',
    'Showroom Honda Phú Nhuận', 'Bệnh viện FV', 'Trường quốc tế BVIS',
    'Khách sạn Pullman', 'Chung cư Vinhomes Central Park', 'Biệt thự Sala',
    'Tòa nhà Pearl Plaza', 'Khu đô thị Phú Mỹ Hưng', 'Căn hộ Saigon Royal',
    'Nhà xưởng KCN Tân Bình', 'Văn phòng Lotte Center', 'Spa & Wellness Center',
    'Ngân hàng Vietcombank CN3', 'Resort Mũi Né', 'Nhà hàng Nhật Bản Sushi Ko',
    'Trung tâm hội nghị White Palace', 'Gym California Fitness', 'Siêu thị Co.opmart',
  ];

  const productNeedsList = [
    ['Kính cường lực', 'Lan can kính'],
    ['Vách kính văn phòng', 'Cửa kính'],
    ['Kính hộp cách âm', 'Mặt dựng kính'],
    ['Cabin tắm kính'],
    ['Kính cường lực', 'Cửa kính', 'Vách kính'],
    ['Mặt dựng kính', 'Kính phản quang'],
    ['Lan can kính', 'Kính cường lực', 'Cửa kính bản lề sàn'],
    ['Kính dán an toàn', 'Kính màu'],
    ['Vách kính phòng họp', 'Cửa kính trượt tự động'],
    ['Kính cường lực', 'Phụ kiện spider', 'Thi công lắp đặt'],
  ];

  const customerNames: { name: string; contactPerson?: string; type: typeof customerTypes[number] }[] = [
    { name: 'Nguyễn Văn An', type: 'INDIVIDUAL' },
    { name: 'Công ty TNHH Xây dựng Hoàng Phát', contactPerson: 'Ông Hoàng Minh', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Trần Thị Bích Ngọc', type: 'INDIVIDUAL' },
    { name: 'Công ty CP Kiến trúc Việt Design', contactPerson: 'Bà Lê Hương', type: 'ARCHITECT' },
    { name: 'Nhà thầu Phạm Quốc Tuấn', type: 'CONTRACTOR' },
    { name: 'Tập đoàn Đầu tư Sài Gòn Land', contactPerson: 'Ông Vũ Đức', type: 'INVESTOR' },
    { name: 'Đại lý kính Minh Tâm', contactPerson: 'Anh Tâm', type: 'DEALER' },
    { name: 'Lê Hoàng Nam', type: 'INDIVIDUAL' },
    { name: 'Công ty Xây dựng Thành Đạt', contactPerson: 'Ông Đạt', type: 'CONSTRUCTION_COMPANY' },
    { name: 'KTS Nguyễn Thanh Hải', type: 'ARCHITECT' },
    { name: 'Phạm Văn Đức', type: 'INDIVIDUAL' },
    { name: 'Công ty TNHH MTV Kính An Phú', contactPerson: 'Bà Phú', type: 'DEALER' },
    { name: 'Nhà thầu Trịnh Công Sơn', type: 'CONTRACTOR' },
    { name: 'Công ty CP BĐS Golden Home', contactPerson: 'Ông Hùng', type: 'INVESTOR' },
    { name: 'Bùi Thị Lan Anh', type: 'INDIVIDUAL' },
    { name: 'Công ty TNHH Nội thất Elegance', contactPerson: 'Bà Mai', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Nguyễn Hữu Thắng', type: 'CONTRACTOR' },
    { name: 'Công ty CP Đầu tư Phú Gia', contactPerson: 'Ông Gia', type: 'INVESTOR' },
    { name: 'Văn phòng KTS Trần Lê', contactPerson: 'KTS Trần Lê', type: 'ARCHITECT' },
    { name: 'Hoàng Thị Mai', type: 'INDIVIDUAL' },
    { name: 'Công ty TNHH Xây dựng Tiến Phát', contactPerson: 'Ông Tiến', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Đại lý kính Đông Á', contactPerson: 'Anh Long', type: 'DEALER' },
    { name: 'Trương Văn Hải', type: 'INDIVIDUAL' },
    { name: 'Công ty CP Kiến trúc ASpace', contactPerson: 'KTS Linh', type: 'ARCHITECT' },
    { name: 'Nhà thầu Đỗ Minh Quang', type: 'CONTRACTOR' },
    { name: 'Công ty TNHH Đầu tư TMS', contactPerson: 'Bà Thảo', type: 'INVESTOR' },
    { name: 'Phan Thanh Bình', type: 'INDIVIDUAL' },
    { name: 'Công ty Xây dựng Nam Á', contactPerson: 'Ông Nam', type: 'CONSTRUCTION_COMPANY' },
    { name: 'KTS Lý Minh Châu', type: 'ARCHITECT' },
    { name: 'Đại lý kính Phú Quốc', contactPerson: 'Anh Quốc', type: 'DEALER' },
    { name: 'Nguyễn Thị Hồng', type: 'INDIVIDUAL' },
    { name: 'Công ty CP Xây dựng Đại Việt', contactPerson: 'Ông Việt', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Nhà thầu Lê Quang Hiếu', type: 'CONTRACTOR' },
    { name: 'Vũ Đình Khoa', type: 'INDIVIDUAL' },
    { name: 'Công ty TNHH Trang trí Nội thất Mỹ Á', contactPerson: 'Bà Mỹ', type: 'OTHER' },
    { name: 'Công ty CP BĐS Sunshine', contactPerson: 'Ông Sơn', type: 'INVESTOR' },
    { name: 'Đặng Văn Tùng', type: 'CONTRACTOR' },
    { name: 'Công ty TNHH Kính Việt Nhật', contactPerson: 'Ông Hiệp', type: 'DEALER' },
    { name: 'Lý Thị Thanh Trúc', type: 'INDIVIDUAL' },
    { name: 'Công ty Xây dựng Phương Nam', contactPerson: 'Ông Phương', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Ngô Quốc Bảo', type: 'INDIVIDUAL' },
    { name: 'Công ty CP Kiến trúc Studio8', contactPerson: 'KTS Bảo', type: 'ARCHITECT' },
    { name: 'Nhà thầu Cao Minh Tú', type: 'CONTRACTOR' },
    { name: 'Tập đoàn Hòa Phát - CN Miền Nam', contactPerson: 'Ông Phát', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Trần Quốc Anh', type: 'INDIVIDUAL' },
    { name: 'Đại lý kính Hải Đăng', contactPerson: 'Anh Đăng', type: 'DEALER' },
    { name: 'Công ty TNHH Đầu tư Xây dựng An Khang', contactPerson: 'Bà Khang', type: 'CONSTRUCTION_COMPANY' },
    { name: 'Mai Xuân Đức', type: 'CONTRACTOR' },
    { name: 'Công ty CP Thiết kế Nội thất HomeStyle', contactPerson: 'Bà Hà', type: 'OTHER' },
    { name: 'Đinh Văn Lực', type: 'INDIVIDUAL' },
  ];

  const addresses = [
    '123 Nguyễn Huệ, Quận 1', '456 Lê Lợi, Quận 3', '789 Trần Hưng Đạo, Quận 5',
    '12 Phạm Văn Đồng, Thủ Đức', '34 Nguyễn Văn Linh, Quận 7',
    '56 Điện Biên Phủ, Bình Thạnh', '78 Cách Mạng Tháng 8, Quận 10',
    '90 Hoàng Quốc Việt, Cầu Giấy', '11 Trần Phú, Ba Đình', '22 Bạch Đằng, Hải Châu',
    '33 Nguyễn Tất Thành, Thanh Khê', '44 Hùng Vương, Ninh Kiều',
    '55 Trần Não, Quận 2', '66 Võ Văn Tần, Quận 3', '77 Lý Tự Trọng, Quận 1',
  ];

  const customers = [];
  for (let i = 0; i < 50; i++) {
    const c = customerNames[i];
    const customer = await prisma.customer.create({
      data: {
        code: genCode('KH', i + 1),
        type: c.type,
        name: c.name,
        contactPerson: c.contactPerson,
        phone: `09${randInt(10000000, 99999999)}`,
        email: i % 3 === 0 ? `contact${i + 1}@${c.name.includes('Công ty') ? 'company' : 'email'}.vn` : undefined,
        address: pick(addresses),
        province: pick(provinces),
        projectName: i % 2 === 0 ? pick(projectNames) : undefined,
        source: pick([...customerSources]),
        assignedToId: pick(salesUsers).id,
        status: pick([...customerStatuses]),
        productNeeds: pick(productNeedsList).join(', '),
        estimatedArea: i % 3 === 0 ? randInt(50, 2000) : undefined,
        estimatedBudget: i % 4 === 0 ? randInt(50, 5000) * 1000000 : undefined,
        notes: i % 5 === 0 ? 'Khách hàng tiềm năng, cần theo dõi sát' : undefined,
        nextFollowUpDate: i % 3 === 0 ? daysFromNow(randInt(1, 14)) : undefined,
      },
    });
    customers.push(customer);
  }

  console.log(`  ✅ Created ${customers.length} customers\n`);

  // =========================================================================
  // 5. CUSTOMER INTERACTIONS (40 interactions)
  // =========================================================================
  console.log('Creating customer interactions...');

  const interactionTypes = ['CALL', 'ZALO', 'EMAIL', 'IN_PERSON', 'SITE_SURVEY', 'SEND_QUOTE', 'FOLLOW_PAYMENT', 'OTHER'] as const;

  const interactionContents = [
    'Gọi điện tư vấn ban đầu, khách hỏi về kính cường lực cho nhà ở. Đã giới thiệu sản phẩm và báo giá sơ bộ.',
    'Trao đổi qua Zalo về mẫu kính và bảng màu. Khách quan tâm kính màu trà cho mặt tiền.',
    'Gửi email báo giá chi tiết cho dự án văn phòng. Khách yêu cầu giảm giá 5%.',
    'Gặp trực tiếp tại showroom. Khách xem mẫu cabin tắm kính và vách kính phòng họp.',
    'Khảo sát hiện trường tại công trình Quận 2. Đo đạc diện tích lắp đặt 350m2 vách kính.',
    'Gửi báo giá chính thức cho hạng mục lan can kính tầng 5-15. Tổng giá trị 890 triệu.',
    'Theo dõi thanh toán đợt 2. Khách hứa chuyển khoản trong tuần này.',
    'Khách gọi hỏi tiến độ thi công. Thông báo dự kiến hoàn thành trong 2 tuần.',
    'Tư vấn kỹ thuật về kính hộp cách âm cho phòng ngủ. Khách chọn loại 2 lớp.',
    'Gửi catalogue sản phẩm qua Zalo. Khách quan tâm mặt dựng kính curtain wall.',
    'Họp với đội thiết kế của khách để thống nhất bản vẽ thi công kính.',
    'Gọi nhắc lịch khảo sát. Khách xác nhận thứ 5 tuần sau.',
    'Gặp trực tiếp bàn giao hợp đồng ký. Khách thanh toán đặt cọc 30%.',
    'Trao đổi Zalo về tiến độ sản xuất. Kính đang gia công, dự kiến giao trong 10 ngày.',
    'Email thông báo thay đổi đơn giá do nguyên liệu tăng. Khách đồng ý báo giá mới.',
    'Khảo sát bổ sung tại công trình. Phát sinh thêm 20m2 kính mặt tiền.',
    'Gọi điện chăm sóc sau bán hàng. Khách phản hồi hài lòng với chất lượng thi công.',
    'Gặp khách tại văn phòng để đàm phán giá cho dự án mới. Khách yêu cầu chiết khấu 8%.',
    'Zalo gửi video mẫu thi công thực tế. Khách rất ấn tượng và muốn đặt hàng.',
    'Gọi điện theo dõi báo giá đã gửi tuần trước. Khách đang so sánh với đối thủ.',
    'Email gửi bảng so sánh sản phẩm Dafa vs đối thủ. Nêu rõ ưu điểm về chất lượng.',
    'Gặp trực tiếp tại công trình để nghiệm thu giai đoạn 1. Đạt yêu cầu.',
    'Tư vấn Zalo về giải pháp chống nóng cho kính mặt tiền hướng Tây.',
    'Gọi điện xác nhận đơn hàng mới. Khách đặt thêm 50m2 kính cường lực.',
    'Khảo sát và đo đạc tại biệt thự khách. Tổng diện tích kính khoảng 120m2.',
    'Gửi báo giá sửa đổi lần 2 theo yêu cầu khách. Giảm hạng mục phụ kiện.',
    'Gọi điện nhắc thanh toán công nợ quá hạn 15 ngày. Khách hẹn tuần sau.',
    'Trao đổi trực tiếp với kiến trúc sư về spec kính cho dự án chung cư.',
    'Zalo thông báo chương trình khuyến mãi tháng 6. Khách quan tâm.',
    'Email gửi chứng chỉ chất lượng kính và giấy bảo hành. Khách yêu cầu để hồ sơ thầu.',
    'Gọi điện follow-up sau khi gặp mặt. Khách cần thêm thời gian suy nghĩ.',
    'Gặp tại showroom, khách mang theo bản vẽ để tư vấn chi tiết.',
    'Khảo sát hiện trường dự án resort ven biển. Cần kính chịu mặn.',
    'Gọi điện thông báo kính đã sản xuất xong, sắp xếp lịch giao hàng.',
    'Zalo gửi hình ảnh mẫu kính đã gia công. Khách xác nhận OK.',
    'Gặp khách ký biên bản nghiệm thu hoàn công. Khách rất hài lòng.',
    'Gọi điện mời khách tham quan nhà máy sản xuất. Khách đồng ý đi vào cuối tuần.',
    'Email gửi báo cáo tiến độ dự án hàng tuần cho chủ đầu tư.',
    'Tư vấn qua Zalo về cửa kính trượt tự động cho sảnh văn phòng.',
    'Gặp để bàn giao hồ sơ bảo hành và hướng dẫn sử dụng.',
  ];

  const interactionsData = [];
  for (let i = 0; i < 40; i++) {
    interactionsData.push({
      customerId: customers[i % customers.length].id,
      userId: pick(salesUsers).id,
      type: pick([...interactionTypes]),
      content: interactionContents[i],
      result: i % 3 === 0 ? 'Khách phản hồi tích cực' : i % 3 === 1 ? 'Cần theo dõi thêm' : undefined,
      nextFollowUpDate: i % 4 === 0 ? daysFromNow(randInt(1, 14)) : undefined,
      createdAt: daysAgo(randInt(0, 60)),
    });
  }

  await prisma.customerInteraction.createMany({ data: interactionsData });

  console.log(`  ✅ Created 40 customer interactions\n`);

  // =========================================================================
  // 6. OPPORTUNITIES (30 opportunities)
  // =========================================================================
  console.log('Creating opportunities...');

  const oppStages = ['NEW_LEAD', 'CONTACTED', 'SURVEYED', 'CONSULTING', 'QUOTE_SENT', 'NEGOTIATING', 'CONTRACT_PENDING', 'WON', 'LOST'] as const;

  const lossReasons = [
    'Giá cao hơn đối thủ',
    'Khách chọn nhà cung cấp khác',
    'Dự án bị hủy',
    'Khách không đủ ngân sách',
    'Thời gian thi công không phù hợp',
  ];

  const opportunities = [];
  for (let i = 0; i < 30; i++) {
    const stage = pick([...oppStages]);
    const customer = customers[i % customers.length];

    const opp = await prisma.opportunity.create({
      data: {
        code: genCode('CH', i + 1),
        name: `Cơ hội - ${customer.name} - ${pick(projectNames)}`,
        customerId: customer.id,
        projectName: pick(projectNames),
        assignedToId: pick(salesUsers).id,
        products: pick(productNeedsList).join(', '),
        estimatedArea: randInt(50, 2000),
        estimatedValue: randInt(50, 5000) * 1000000,
        probability: stage === 'WON' ? 100 : stage === 'LOST' ? 0 : randInt(10, 90),
        stage,
        expectedCloseDate: daysFromNow(randInt(-30, 90)),
        lossReason: stage === 'LOST' ? pick(lossReasons) : undefined,
        competitor: stage === 'LOST' || stage === 'NEGOTIATING' ? 'Kính Hải Long' : undefined,
        notes: i % 4 === 0 ? 'Dự án ưu tiên, cần theo dõi sát tiến độ' : undefined,
      },
    });
    opportunities.push(opp);
  }

  console.log(`  ✅ Created ${opportunities.length} opportunities\n`);

  // =========================================================================
  // 7. QUOTES (20 quotes with items)
  // =========================================================================
  console.log('Creating quotes...');

  const quoteStatuses = ['DRAFT', 'SENT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;

  const quotes = [];
  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length];
    const opp = i < 15 ? opportunities[i % opportunities.length] : undefined;
    const status = pick([...quoteStatuses]);
    const createdDate = daysAgo(randInt(5, 60));
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Build items first to calculate totals
    const numItems = randInt(2, 5);
    const items: {
      productId: string;
      description: string;
      specification: string;
      thickness: string;
      length: number;
      width: number;
      area: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
      sortOrder: number;
    }[] = [];

    let subtotal = 0;
    for (let j = 0; j < numItems; j++) {
      const product = products[randInt(0, products.length - 1)];
      const length = parseFloat((Math.random() * 2 + 1).toFixed(2));
      const width = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
      const area = parseFloat((length * width).toFixed(2));
      const qty = randInt(1, 20);
      const unitPrice = product.referencePrice;
      const discount = pick([0, 0, 0, 5, 8, 10]);
      const itemTotal = Math.round(area * qty * unitPrice * (1 - discount / 100));

      items.push({
        productId: product.id,
        description: product.name,
        specification: product.description || '',
        thickness: product.name.match(/\d+mm/)?.[0] || '10mm',
        length,
        width,
        area,
        quantity: qty,
        unitPrice,
        discount,
        total: itemTotal,
        sortOrder: j + 1,
      });
      subtotal += itemTotal;
    }

    const shippingCost = pick([0, 500000, 1000000, 1500000]);
    const installationCost = pick([0, 0, 2000000, 5000000]);
    const vatRate = 10;
    const subWithExtra = subtotal + shippingCost + installationCost;
    const vatAmount = Math.round(subWithExtra * vatRate / 100);
    const total = subWithExtra + vatAmount;

    const quote = await prisma.quote.create({
      data: {
        code: genCode('BG', i + 1),
        customerId: customer.id,
        opportunityId: opp?.id,
        createdById: pick(salesUsers).id,
        status,
        expiryDate,
        shippingCost,
        installationCost,
        vatRate,
        subtotal,
        vatAmount,
        total,
        terms: 'Báo giá có hiệu lực 30 ngày. Giá chưa bao gồm VAT (trừ khi có ghi chú). Thời gian thi công sẽ được thống nhất sau khi ký hợp đồng.',
        notes: i % 3 === 0 ? 'Khách yêu cầu giảm giá nếu đặt số lượng lớn' : undefined,
        createdAt: createdDate,
        items: {
          create: items,
        },
      },
    });
    quotes.push(quote);
  }

  console.log(`  ✅ Created ${quotes.length} quotes with items\n`);

  // =========================================================================
  // 8. ORDERS (12 orders with items and payments)
  // =========================================================================
  console.log('Creating orders...');

  const orderStatuses = ['NEW', 'IN_PRODUCTION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
  const paymentStatuses = ['UNPAID', 'DEPOSITED', 'PARTIAL', 'FULLY_PAID'] as const;

  const orders = [];
  for (let i = 0; i < 12; i++) {
    const customer = customers[i];
    const opp = i < 8 ? opportunities[i] : undefined;
    const quote = i < 10 ? quotes[i] : undefined;
    const orderStatus = pick([...orderStatuses]);
    const paymentStatus = orderStatus === 'COMPLETED' ? 'FULLY_PAID' as const : orderStatus === 'CANCELLED' ? 'UNPAID' as const : pick([...paymentStatuses]);

    // Build order items
    const numItems = randInt(1, 4);
    const orderItems: {
      productId: string;
      description: string;
      specification: string;
      thickness: string;
      length: number;
      width: number;
      area: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
      sortOrder: number;
    }[] = [];

    let subtotal = 0;
    for (let j = 0; j < numItems; j++) {
      const product = products[randInt(0, products.length - 1)];
      const length = parseFloat((Math.random() * 2 + 1).toFixed(2));
      const width = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
      const area = parseFloat((length * width).toFixed(2));
      const qty = randInt(1, 15);
      const unitPrice = product.referencePrice;
      const discount = pick([0, 0, 5, 8]);
      const itemTotal = Math.round(area * qty * unitPrice * (1 - discount / 100));

      orderItems.push({
        productId: product.id,
        description: product.name,
        specification: product.description || '',
        thickness: product.name.match(/\d+mm/)?.[0] || '10mm',
        length,
        width,
        area,
        quantity: qty,
        unitPrice,
        discount,
        total: itemTotal,
        sortOrder: j + 1,
      });
      subtotal += itemTotal;
    }

    const orderDiscount = pick([0, 0, 500000, 1000000]);
    const vatRate = 10;
    const afterDiscount = subtotal - orderDiscount;
    const vatAmount = Math.round(afterDiscount * vatRate / 100);
    const total = afterDiscount + vatAmount;

    let paidAmount = 0;
    if (paymentStatus === 'FULLY_PAID') paidAmount = total;
    else if (paymentStatus === 'DEPOSITED') paidAmount = Math.round(total * 0.3);
    else if (paymentStatus === 'PARTIAL') paidAmount = Math.round(total * 0.6);

    const signedDate = daysAgo(randInt(10, 90));

    const order = await prisma.order.create({
      data: {
        code: genCode('DH', i + 1),
        customerId: customer.id,
        opportunityId: opp?.id,
        quoteId: quote?.id,
        assignedToId: pick(salesUsers).id,
        projectName: pick(projectNames),
        status: orderStatus,
        paymentStatus,
        subtotal,
        discount: orderDiscount,
        vatRate,
        vatAmount,
        total,
        paidAmount,
        remainingAmount: total - paidAmount,
        signedDate,
        expectedDeliveryDate: new Date(signedDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        notes: i % 3 === 0 ? 'Ưu tiên sản xuất và giao hàng' : undefined,
        items: {
          create: orderItems,
        },
      },
    });
    orders.push(order);

    // Create payment records for orders that have payments
    if (paidAmount > 0) {
      if (paymentStatus === 'DEPOSITED') {
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: paidAmount,
            paymentDate: new Date(signedDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-01`,
            notes: 'Đặt cọc 30%',
            createdById: pick(salesUsers).id,
          },
        });
      } else if (paymentStatus === 'PARTIAL') {
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: Math.round(total * 0.3),
            paymentDate: new Date(signedDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-01`,
            notes: 'Đặt cọc 30%',
            createdById: pick(salesUsers).id,
          },
        });
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: Math.round(total * 0.3),
            paymentDate: new Date(signedDate.getTime() + 20 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-02`,
            notes: 'Thanh toán đợt 2',
            createdById: pick(salesUsers).id,
          },
        });
      } else if (paymentStatus === 'FULLY_PAID') {
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: Math.round(total * 0.3),
            paymentDate: new Date(signedDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-01`,
            notes: 'Đặt cọc 30%',
            createdById: pick(salesUsers).id,
          },
        });
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: Math.round(total * 0.3),
            paymentDate: new Date(signedDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-02`,
            notes: 'Thanh toán đợt 2 - 30%',
            createdById: pick(salesUsers).id,
          },
        });
        await prisma.orderPayment.create({
          data: {
            orderId: order.id,
            amount: total - Math.round(total * 0.3) * 2,
            paymentDate: new Date(signedDate.getTime() + 35 * 24 * 60 * 60 * 1000),
            method: 'transfer',
            reference: `CK-${genCode('DH', i + 1)}-03`,
            notes: 'Thanh toán đợt cuối - nghiệm thu',
            createdById: pick(salesUsers).id,
          },
        });
      }
    }
  }

  console.log(`  ✅ Created ${orders.length} orders with items and payments\n`);

  // =========================================================================
  // 9. TASKS (40 tasks)
  // =========================================================================
  console.log('Creating tasks...');

  const taskTypes = ['CALL', 'ZALO', 'EMAIL', 'MEETING', 'SITE_SURVEY', 'SEND_QUOTE', 'FOLLOW_QUOTE', 'FOLLOW_PAYMENT', 'FOLLOW_UP'] as const;
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  const taskStatusOptions = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const;

  const taskTitles = [
    'Gọi điện tư vấn sản phẩm',
    'Gửi báo giá kính cường lực',
    'Zalo gửi catalogue sản phẩm',
    'Hẹn khảo sát công trình',
    'Họp thảo luận dự án mới',
    'Gửi email xác nhận đơn hàng',
    'Theo dõi thanh toán đợt 2',
    'Follow up báo giá đã gửi',
    'Nhắc khách thanh toán công nợ',
    'Khảo sát và đo đạc hiện trường',
    'Chuẩn bị hồ sơ dự thầu',
    'Liên hệ khách hàng mới từ website',
    'Gặp mặt đàm phán hợp đồng',
    'Gửi mẫu kính cho khách xem',
    'Tư vấn giải pháp kính tiết kiệm năng lượng',
    'Theo dõi tiến độ sản xuất',
    'Báo cáo tiến độ dự án cho khách',
    'Sắp xếp lịch giao hàng',
    'Follow up khách hàng sau khảo sát',
    'Cập nhật báo giá theo yêu cầu mới',
  ];

  const tasksData = [];
  for (let i = 0; i < 40; i++) {
    const taskStatus = pick([...taskStatusOptions]);
    const dueDate = taskStatus === 'OVERDUE' ? daysAgo(randInt(1, 15)) : taskStatus === 'DONE' ? daysAgo(randInt(0, 10)) : daysFromNow(randInt(0, 14));
    const assignedTo = pick(salesUsers);

    tasksData.push({
      title: taskTitles[i % taskTitles.length],
      customerId: customers[i % customers.length].id,
      opportunityId: i % 3 === 0 ? opportunities[i % opportunities.length].id : undefined,
      assignedToId: assignedTo.id,
      createdById: pick([manager, admin]).id,
      type: pick([...taskTypes]),
      dueDate,
      priority: pick([...taskPriorities]),
      status: taskStatus,
      notes: i % 4 === 0 ? 'Cần ưu tiên xử lý' : undefined,
      completedAt: taskStatus === 'DONE' ? daysAgo(randInt(0, 5)) : undefined,
    });
  }

  await prisma.task.createMany({ data: tasksData });

  console.log(`  ✅ Created 40 tasks\n`);

  // =========================================================================
  // 10. KPIs (current month + 2 previous months for each sales user)
  // =========================================================================
  console.log('Creating KPI records...');

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed (June = 6)
  const currentYear = now.getFullYear();    // 2026

  // Generate months: current month and 2 previous
  const kpiMonths: { month: number; year: number }[] = [];
  for (let offset = 0; offset < 3; offset++) {
    let m = currentMonth - offset;
    let y = currentYear;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    kpiMonths.push({ month: m, year: y });
  }

  const kpisData = [];
  for (const user of salesUsers) {
    for (const { month, year } of kpiMonths) {
      const isCurrentMonth = month === currentMonth && year === currentYear;
      const targetRevenue = randInt(300, 800) * 1000000;
      const targetNewCustomers = randInt(5, 15);
      const targetInteractions = randInt(30, 60);

      kpisData.push({
        userId: user.id,
        month,
        year,
        targetRevenue,
        targetNewCustomers,
        targetInteractions,
        // For past months, actuals are closer to targets; for current month, partial progress
        actualRevenue: isCurrentMonth ? Math.round(targetRevenue * (randInt(30, 70) / 100)) : Math.round(targetRevenue * (randInt(60, 120) / 100)),
        actualNewCustomers: isCurrentMonth ? randInt(1, Math.ceil(targetNewCustomers * 0.6)) : randInt(Math.floor(targetNewCustomers * 0.5), Math.ceil(targetNewCustomers * 1.2)),
        actualInteractions: isCurrentMonth ? randInt(10, Math.ceil(targetInteractions * 0.5)) : randInt(Math.floor(targetInteractions * 0.7), Math.ceil(targetInteractions * 1.1)),
      });
    }
  }

  await prisma.kPI.createMany({ data: kpisData });

  console.log(`  ✅ Created ${kpisData.length} KPI records\n`);

  // =========================================================================
  // 11. SETTINGS
  // =========================================================================
  console.log('Creating settings...');

  const settingsData = [
    { key: 'company_name', value: 'Dafa', description: 'Tên công ty' },
    { key: 'company_address', value: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM', description: 'Địa chỉ công ty' },
    { key: 'company_phone', value: '028-1234-5678', description: 'Số điện thoại công ty' },
    { key: 'company_email', value: 'info@dafa.vn', description: 'Email công ty' },
    { key: 'company_website', value: 'https://dafa.vn', description: 'Website công ty' },
    { key: 'company_tax_id', value: '0312345678', description: 'Mã số thuế' },
    { key: 'default_vat_rate', value: '10', description: 'Thuế VAT mặc định (%)' },
    { key: 'default_quote_terms', value: 'Báo giá có hiệu lực 30 ngày. Giá chưa bao gồm VAT (trừ khi có ghi chú). Thời gian thi công sẽ được thống nhất sau khi ký hợp đồng.', description: 'Điều khoản báo giá mặc định' },
    { key: 'default_quote_validity_days', value: '30', description: 'Số ngày hiệu lực báo giá mặc định' },
  ];

  await prisma.setting.createMany({ data: settingsData });

  console.log(`  ✅ Created ${settingsData.length} settings\n`);

  // =========================================================================
  // DONE
  // =========================================================================
  console.log('🎉 Seed completed successfully!');
  console.log('Summary:');
  console.log('  - 3 Teams');
  console.log('  - 7 Users');
  console.log('  - 20 Products');
  console.log('  - 50 Customers');
  console.log('  - 40 Customer Interactions');
  console.log('  - 30 Opportunities');
  console.log('  - 20 Quotes (with items)');
  console.log('  - 12 Orders (with items and payments)');
  console.log('  - 40 Tasks');
  console.log(`  - ${kpisData.length} KPI Records`);
  console.log('  - 9 Settings');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
