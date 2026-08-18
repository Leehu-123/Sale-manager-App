const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu quá trình seed dữ liệu...');

  // 1. Seed Users (4 users)
  console.log('Đang tạo Users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@glassapp.com' },
    update: {},
    create: {
      email: 'admin@glassapp.com',
      name: 'Admin Nguyễn',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { email: 'manager@glassapp.com' },
    update: {},
    create: {
      email: 'manager@glassapp.com',
      name: 'Manager Trần',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'SALES_MANAGER',
    },
  });

  const salesRep = await prisma.user.upsert({
    where: { email: 'sales@glassapp.com' },
    update: {},
    create: {
      email: 'sales@glassapp.com',
      name: 'Sales Lê',
      passwordHash: await bcrypt.hash('sales123', 10),
      role: 'SALES_REP',
    },
  });

  const techStaff = await prisma.user.upsert({
    where: { email: 'tech@glassapp.com' },
    update: {},
    create: {
      email: 'tech@glassapp.com',
      name: 'Tech Phạm',
      passwordHash: await bcrypt.hash('tech123', 10),
      role: 'TECH_STAFF',
    },
  });

  // 2. Seed Customers (5 customers)
  console.log('Đang tạo Customers...');
  const customersData = [
    { name: 'Công ty Xây dựng A', email: 'contact@xaydunga.com', phone: '0901111111', tier: 'TIER_1', creditLimit: 500000000 },
    { name: 'Nội thất B', email: 'info@noithatb.com', phone: '0902222222', tier: 'TIER_2', creditLimit: 200000000 },
    { name: 'Kiến trúc C', email: 'hello@kientrucc.com', phone: '0903333333', tier: 'TIER_3', creditLimit: 50000000 },
    { name: 'Nguyễn Văn D (Lẻ)', email: 'vand@gmail.com', phone: '0904444444', tier: 'RETAIL', creditLimit: 0 },
    { name: 'Trần Thị E (Lẻ)', email: 'thie@gmail.com', phone: '0905555555', tier: 'RETAIL', creditLimit: 0 },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({ data: c });
    customers.push(customer);
  }

  // 3. Seed Projects (6 projects)
  console.log('Đang tạo Projects (Leads)...');
  const projectsData = [
    { name: 'Dự án Cửa Kính Tòa Nhà A', customerId: customers[0].id, assignedToId: salesManager.id, status: 'NEW' },
    { name: 'Vách Ngăn Văn Phòng B', customerId: customers[1].id, assignedToId: salesRep.id, status: 'SURVEYING' },
    { name: 'Kính Cường Lực Ban Công', customerId: customers[2].id, assignedToId: salesRep.id, status: 'QUOTING' },
    { name: 'Cầu Thang Kính Nhà Phố', customerId: customers[3].id, assignedToId: salesRep.id, status: 'NEGOTIATING' },
    { name: 'Thay Kính Cửa Sổ', customerId: customers[4].id, assignedToId: salesManager.id, status: 'WON' },
    { name: 'Mái Kính Lấy Sáng', customerId: customers[0].id, assignedToId: salesRep.id, status: 'LOST' },
  ];

  const projects = [];
  for (const p of projectsData) {
    const project = await prisma.project.create({ data: p });
    projects.push(project);
  }

  // 4. Seed DealSpecifications
  console.log('Đang tạo DealSpecifications...');
  await prisma.dealSpecification.create({
    data: {
      projectId: projects[0].id,
      description: 'Cửa kính tòa nhà văn phòng, yêu cầu cách âm tốt',
      area: 150.5,
      glassColor: 'Trắng trong',
      glassThickness: 12,
      hardware: 'Phụ kiện VVP',
      installationType: 'Mặt dựng nhôm kính',
    }
  });

  await prisma.dealSpecification.create({
    data: {
      projectId: projects[1].id,
      description: 'Vách ngăn chia phòng ban',
      area: 85.0,
      glassColor: 'Mờ',
      glassThickness: 10,
      hardware: 'Phụ kiện kẹp',
      installationType: 'Lắp đặt trong nhà',
    }
  });

  // 5. Seed PricingConfigs
  console.log('Đang tạo PricingConfigs...');
  const pricingData = [
    { productType: 'CUONG_LUC', thickness: 8, pricePerSqM: 450000 },
    { productType: 'CUONG_LUC', thickness: 10, pricePerSqM: 550000 },
    { productType: 'CUONG_LUC', thickness: 12, pricePerSqM: 700000 },
    { productType: 'KINH_DAN', thickness: 8.38, pricePerSqM: 600000 },
    { productType: 'KINH_DAN', thickness: 10.38, pricePerSqM: 750000 },
  ];

  for (const p of pricingData) {
    await prisma.pricingConfig.create({ data: p });
  }

  console.log('Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
