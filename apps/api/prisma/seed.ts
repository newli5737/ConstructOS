import { PrismaClient, PaymentMethod, PaymentStatus, SalesOrderStatus, PurchaseOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting constructOS Seeding ---');

  // 1. Roles & Permissions
  const permissionsList = [
    { code: 'sales:view', module: 'sales', action: 'view', description: 'Xem danh sách đơn bán' },
    { code: 'sales:create', module: 'sales', action: 'create', description: 'Tạo đơn bán' },
    { code: 'sales:confirm', module: 'sales', action: 'confirm', description: 'Duyệt đơn bán' },
    { code: 'purchase:view', module: 'purchase', action: 'view', description: 'Xem đơn mua/nhập' },
    { code: 'purchase:create', module: 'purchase', action: 'create', description: 'Tạo phiếu nhập' },
    { code: 'inventory:view', module: 'inventory', action: 'view', description: 'Xem tồn kho' },
    { code: 'inventory:adjust', module: 'inventory', action: 'adjust', description: 'Điều chỉnh kho' },
    { code: 'debt:view', module: 'debt', action: 'view', description: 'Xem công nợ' },
    { code: 'reports:profit:view', module: 'reports', action: 'profit:view', description: 'Xem lợi nhuận & giá vốn' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  const roleAdmin = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'Chủ cửa hàng / Quản trị viên', description: 'Toàn quyền hệ thống' },
  });

  const roleSales = await prisma.role.upsert({
    where: { code: 'SALES' },
    update: {},
    create: { code: 'SALES', name: 'Nhân viên bán hàng', description: 'Tạo đơn bán, thu tiền, xem tồn kho' },
  });

  const roleWarehouse = await prisma.role.upsert({
    where: { code: 'WAREHOUSE' },
    update: {},
    create: { code: 'WAREHOUSE', name: 'Thủ kho', description: 'Nhập xuất tồn, kiểm kê bãi và kho' },
  });

  const roleAccountant = await prisma.role.upsert({
    where: { code: 'ACCOUNTANT' },
    update: {},
    create: { code: 'ACCOUNTANT', name: 'Kế toán / Thu ngân', description: 'Quản lý công nợ, thu chi, báo cáo' },
  });

  // 2. Demo Users
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const salesPasswordHash = await bcrypt.hash('Sales@123', 10);
  const whPasswordHash = await bcrypt.hash('Warehouse@123', 10);
  const accPasswordHash = await bcrypt.hash('Accountant@123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@constructos.local',
      fullName: 'Trần Văn Hoàng (Admin/Chủ Cửa Hàng)',
      passwordHash,
      phone: '0903112233',
      roles: { create: [{ roleId: roleAdmin.id }] },
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { username: 'sales' },
    update: {},
    create: {
      username: 'sales',
      email: 'sales@constructos.local',
      fullName: 'Nguyễn Thị Thu (Bán hàng)',
      passwordHash: salesPasswordHash,
      phone: '0912334455',
      roles: { create: [{ roleId: roleSales.id }] },
    },
  });

  await prisma.user.upsert({
    where: { username: 'warehouse' },
    update: {},
    create: {
      username: 'warehouse',
      email: 'warehouse@constructos.local',
      fullName: 'Lê Minh Tuấn (Thủ kho)',
      passwordHash: whPasswordHash,
      phone: '0988776655',
      roles: { create: [{ roleId: roleWarehouse.id }] },
    },
  });

  await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {},
    create: {
      username: 'accountant',
      email: 'accountant@constructos.local',
      fullName: 'Phạm Thu Hương (Kế toán)',
      passwordHash: accPasswordHash,
      phone: '0977665544',
      roles: { create: [{ roleId: roleAccountant.id }] },
    },
  });

  // 3. Warehouses
  const whChinh = await prisma.warehouse.upsert({
    where: { code: 'KHO-CHINH' },
    update: {},
    create: { code: 'KHO-CHINH', name: 'Kho Tổng / Trụ sở chính', address: '124 Đại Lộ Xây Dựng, Hà Nội', isDefault: true },
  });

  const whCatDa = await prisma.warehouse.upsert({
    where: { code: 'BAI-CAT-DA' },
    update: {},
    create: { code: 'BAI-CAT-DA', name: 'Bãi Cát Đá & Sỏi San Lấp', address: 'Bến phà Cầu Đôi, QL32', isDefault: false },
  });

  const whPhuKien = await prisma.warehouse.upsert({
    where: { code: 'KHO-PHUKIEN' },
    update: {},
    create: { code: 'KHO-PHUKIEN', name: 'Kho Sơn & Phụ Kiện Điện Nước', address: 'Kho phụ số 2, Cụm CN Hòa Lạc', isDefault: false },
  });

  // 4. Categories
  const catXiMang = await prisma.productCategory.upsert({
    where: { code: 'XI-MANG' },
    update: {},
    create: { code: 'XI-MANG', name: 'Xi măng & Bột bả', sortOrder: 1 },
  });

  const catSatThep = await prisma.productCategory.upsert({
    where: { code: 'SAT-THEP' },
    update: {},
    create: { code: 'SAT-THEP', name: 'Sắt thép xây dựng', sortOrder: 2 },
  });

  const catCatDa = await prisma.productCategory.upsert({
    where: { code: 'CAT-DA' },
    update: {},
    create: { code: 'CAT-DA', name: 'Cát, Đá, Sỏi các loại', sortOrder: 3 },
  });

  const catGach = await prisma.productCategory.upsert({
    where: { code: 'GACH-NGOI' },
    update: {},
    create: { code: 'GACH-NGOI', name: 'Gạch, Ngói xây dựng', sortOrder: 4 },
  });

  const catSonDienNuoc = await prisma.productCategory.upsert({
    where: { code: 'SON-DIEN-NUOC' },
    update: {},
    create: { code: 'SON-DIEN-NUOC', name: 'Sơn & Ống nước phụ kiện', sortOrder: 5 },
  });

  // 5. Price Lists
  const priceListLe = await prisma.priceList.upsert({
    where: { code: 'GIA-LE' },
    update: {},
    create: { code: 'GIA-LE', name: 'Bảng giá Bán lẻ', isDefault: true, description: 'Áp dụng cho khách vãng lai và nhà dân' },
  });

  const priceListTho = await prisma.priceList.upsert({
    where: { code: 'GIA-THO' },
    update: {},
    create: { code: 'GIA-THO', name: 'Bảng giá Thợ & Đội thi công', description: 'Ưu đãi cho anh em thầu thợ khu vực' },
  });

  const priceListDaiLy = await prisma.priceList.upsert({
    where: { code: 'GIA-DAILY' },
    update: {},
    create: { code: 'GIA-DAILY', name: 'Bảng giá Đại lý & Dự án lớn', description: 'Chiết khấu cao nhất cho đơn hàng công trình lớn' },
  });

  // 6. Customer Groups
  const grpLe = await prisma.customerGroup.upsert({
    where: { code: 'GRP-LE' },
    update: {},
    create: { code: 'GRP-LE', name: 'Khách lẻ / Xây nhà dân', priceListId: priceListLe.id },
  });

  const grpTho = await prisma.customerGroup.upsert({
    where: { code: 'GRP-THO' },
    update: {},
    create: { code: 'GRP-THO', name: 'Nhà thầu / Đội thợ', priceListId: priceListTho.id },
  });

  const grpDaiLy = await prisma.customerGroup.upsert({
    where: { code: 'GRP-DAILY' },
    update: {},
    create: { code: 'GRP-DAILY', name: 'Công ty XD & Đại lý', priceListId: priceListDaiLy.id },
  });

  // 7. Suppliers
  const nccHaTien = await prisma.supplier.upsert({
    where: { code: 'NCC-0001' },
    update: {},
    create: {
      code: 'NCC-0001',
      name: 'Công ty Cổ phần Xi Măng Hà Tiên 1',
      phone: '028 3823 0000',
      address: 'Số 9 Võ Văn Tần, Q3, TP.HCM',
      taxCode: '0300445566',
      paymentTermDays: 30,
      currentDebt: 45000000,
    },
  });

  const nccHoaPhat = await prisma.supplier.upsert({
    where: { code: 'NCC-0002' },
    update: {},
    create: {
      code: 'NCC-0002',
      name: 'Tập đoàn Thép Hòa Phát (Chi nhánh Miền Bắc)',
      phone: '024 3974 7755',
      address: '66 Nguyễn Du, Hai Bà Trưng, Hà Nội',
      taxCode: '0101234567',
      paymentTermDays: 45,
      currentDebt: 120000000,
    },
  });

  const nccMoCat = await prisma.supplier.upsert({
    where: { code: 'NCC-0003' },
    update: {},
    create: {
      code: 'NCC-0003',
      name: 'Doanh nghiệp khai thác Cát Sỏi Sông Lô',
      phone: '0912 889 900',
      address: 'Bến phà Vĩnh Tường, Vĩnh Phúc',
      paymentTermDays: 15,
      currentDebt: 15000000,
    },
  });

  const nccBinhMinh = await prisma.supplier.upsert({
    where: { code: 'NCC-0004' },
    update: {},
    create: {
      code: 'NCC-0004',
      name: 'Công ty CP Nhựa Bình Minh',
      phone: '028 3969 0973',
      address: '240 Hậu Giang, Q6, TP.HCM',
      paymentTermDays: 30,
      currentDebt: 22000000,
    },
  });

  // 8. Products & Units & Prices
  const demoProducts = [
    {
      sku: 'XM-HT-PCB40',
      name: 'Xi măng Hà Tiên PCB40 Đa dụng',
      categoryId: catXiMang.id,
      baseUnit: 'Bao',
      costPrice: 85000,
      minStock: 200,
      units: [
        { unitName: 'Tấn', factor: 20, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Bao', price: 95000 },
        { priceListId: priceListTho.id, unitName: 'Bao', price: 90000 },
        { priceListId: priceListDaiLy.id, unitName: 'Bao', price: 87000 },
        { priceListId: priceListLe.id, unitName: 'Tấn', price: 1900000 },
        { priceListId: priceListTho.id, unitName: 'Tấn', price: 1800000 },
        { priceListId: priceListDaiLy.id, unitName: 'Tấn', price: 1740000 },
      ],
      warehouseQty: { [whChinh.id]: 650, [whPhuKien.id]: 80 },
    },
    {
      sku: 'XM-NS-PCB40',
      name: 'Xi măng Nghi Sơn PCB40',
      categoryId: catXiMang.id,
      baseUnit: 'Bao',
      costPrice: 82000,
      minStock: 150,
      units: [
        { unitName: 'Tấn', factor: 20, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Bao', price: 92000 },
        { priceListId: priceListTho.id, unitName: 'Bao', price: 87000 },
        { priceListId: priceListDaiLy.id, unitName: 'Bao', price: 84500 },
      ],
      warehouseQty: { [whChinh.id]: 420 },
    },
    {
      sku: 'ST-HP-D10',
      name: 'Thép Hòa Phát phi 10 CB300 (Cây 11.7m)',
      categoryId: catSatThep.id,
      baseUnit: 'Cây',
      costPrice: 98000,
      minStock: 100,
      units: [
        { unitName: 'Kg', factor: 0.138, isDefaultPurchase: false },
        { unitName: 'Bó', factor: 100, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Cây', price: 112000 },
        { priceListId: priceListTho.id, unitName: 'Cây', price: 106000 },
        { priceListId: priceListDaiLy.id, unitName: 'Cây', price: 102000 },
      ],
      warehouseQty: { [whChinh.id]: 350 },
    },
    {
      sku: 'ST-HP-D16',
      name: 'Thép Hòa Phát phi 16 CB400 (Cây 11.7m)',
      categoryId: catSatThep.id,
      baseUnit: 'Cây',
      costPrice: 245000,
      minStock: 80,
      units: [
        { unitName: 'Bó', factor: 50, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Cây', price: 275000 },
        { priceListId: priceListTho.id, unitName: 'Cây', price: 262000 },
        { priceListId: priceListDaiLy.id, unitName: 'Cây', price: 254000 },
      ],
      warehouseQty: { [whChinh.id]: 190 },
    },
    {
      sku: 'ST-HP-PHI6',
      name: 'Thép cuộn tròn trơn phi 6 Hòa Phát',
      categoryId: catSatThep.id,
      baseUnit: 'Kg',
      costPrice: 15200,
      minStock: 1000,
      units: [
        { unitName: 'Tạ', factor: 100, isDefaultPurchase: false },
        { unitName: 'Tấn', factor: 1000, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Kg', price: 17500 },
        { priceListId: priceListTho.id, unitName: 'Kg', price: 16400 },
        { priceListId: priceListDaiLy.id, unitName: 'Kg', price: 15800 },
      ],
      warehouseQty: { [whChinh.id]: 4200 },
    },
    {
      sku: 'CAT-VANG-LO',
      name: 'Cát vàng thô sàng sông Lô hạt đẹp',
      categoryId: catCatDa.id,
      baseUnit: 'm3',
      costPrice: 280000,
      minStock: 30,
      units: [
        { unitName: 'Xe 3 khối', factor: 3, isDefaultSale: true },
        { unitName: 'Xe 7 khối', factor: 7, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'm3', price: 360000 },
        { priceListId: priceListTho.id, unitName: 'm3', price: 330000 },
        { priceListId: priceListDaiLy.id, unitName: 'm3', price: 310000 },
      ],
      warehouseQty: { [whCatDa.id]: 180 },
    },
    {
      sku: 'CAT-XAY-TO',
      name: 'Cát đen mịn xây tô cao cấp',
      categoryId: catCatDa.id,
      baseUnit: 'm3',
      costPrice: 160000,
      minStock: 25,
      units: [
        { unitName: 'Xe 3 khối', factor: 3, isDefaultSale: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'm3', price: 210000 },
        { priceListId: priceListTho.id, unitName: 'm3', price: 190000 },
        { priceListId: priceListDaiLy.id, unitName: 'm3', price: 178000 },
      ],
      warehouseQty: { [whCatDa.id]: 120 },
    },
    {
      sku: 'DA-1X2-XANH',
      name: 'Đá 1x2 xanh đổ sàn bê tông',
      categoryId: catCatDa.id,
      baseUnit: 'm3',
      costPrice: 320000,
      minStock: 40,
      units: [
        { unitName: 'Xe 3 khối', factor: 3, isDefaultSale: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'm3', price: 410000 },
        { priceListId: priceListTho.id, unitName: 'm3', price: 380000 },
        { priceListId: priceListDaiLy.id, unitName: 'm3', price: 350000 },
      ],
      warehouseQty: { [whCatDa.id]: 160 },
    },
    {
      sku: 'GACH-TUYNEL-4L',
      name: 'Gạch tuynel 4 lỗ Đồng Tâm chất lượng cao',
      categoryId: catGach.id,
      baseUnit: 'Viên',
      costPrice: 1050,
      minStock: 5000,
      units: [
        { unitName: 'Thiên (1000 viên)', factor: 1000, isDefaultSale: true },
        { unitName: 'Pallet (500 viên)', factor: 500, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Viên', price: 1350 },
        { priceListId: priceListTho.id, unitName: 'Viên', price: 1220 },
        { priceListId: priceListDaiLy.id, unitName: 'Viên', price: 1150 },
      ],
      warehouseQty: { [whChinh.id]: 28000 },
    },
    {
      sku: 'ONG-BM-D90',
      name: 'Ống nhựa PVC Bình Minh phi 90 C1 (Cây 4m)',
      categoryId: catSonDienNuoc.id,
      baseUnit: 'Cây',
      costPrice: 88000,
      minStock: 30,
      units: [
        { unitName: 'Bó 5 cây', factor: 5, isDefaultPurchase: true },
      ],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Cây', price: 110000 },
        { priceListId: priceListTho.id, unitName: 'Cây', price: 100000 },
        { priceListId: priceListDaiLy.id, unitName: 'Cây', price: 94000 },
      ],
      warehouseQty: { [whPhuKien.id]: 95 },
    },
    {
      sku: 'SON-DULUX-WT-18L',
      name: 'Sơn ngoại thất Dulux Weathershield Thùng 18L',
      categoryId: catSonDienNuoc.id,
      baseUnit: 'Thùng',
      costPrice: 2450000,
      minStock: 10,
      units: [],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Thùng', price: 2950000 },
        { priceListId: priceListTho.id, unitName: 'Thùng', price: 2750000 },
        { priceListId: priceListDaiLy.id, unitName: 'Thùng', price: 2620000 },
      ],
      warehouseQty: { [whPhuKien.id]: 24 },
    },
    {
      sku: 'SIKA-LATEX-TH-25L',
      name: 'Phụ gia chống thấm & tác nhân kết nối Sika Latex TH Can 25L',
      categoryId: catSonDienNuoc.id,
      baseUnit: 'Can',
      costPrice: 1320000,
      minStock: 8,
      units: [],
      prices: [
        { priceListId: priceListLe.id, unitName: 'Can', price: 1650000 },
        { priceListId: priceListTho.id, unitName: 'Can', price: 1520000 },
        { priceListId: priceListDaiLy.id, unitName: 'Can', price: 1450000 },
      ],
      warehouseQty: { [whPhuKien.id]: 18 },
    },
  ];

  const createdProducts: any[] = [];
  for (const item of demoProducts) {
    const { units, prices, warehouseQty, ...pData } = item;
    const product = await prisma.product.upsert({
      where: { sku: pData.sku },
      update: {},
      create: {
        ...pData,
        units: { create: units },
        prices: { create: prices },
      },
    });

    createdProducts.push(product);

    // Initial stock balances
    for (const [whId, qty] of Object.entries(warehouseQty)) {
      await prisma.stockBalance.upsert({
        where: { warehouseId_productId: { warehouseId: whId, productId: product.id } },
        update: { quantity: qty },
        create: {
          warehouseId: whId,
          productId: product.id,
          quantity: qty,
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: whId,
          movementType: 'PURCHASE_IN',
          quantity: qty,
          balanceAfter: qty,
          refType: 'INITIAL_STOCK',
          refId: 'SEED',
          unitCost: product.costPrice,
          note: 'Tồn đầu kỳ khởi tạo hệ thống',
        },
      });
    }
  }

  // 9. Customers & Sites & Debts
  const custTuanPhat = await prisma.customer.upsert({
    where: { code: 'KH-0001' },
    update: {},
    create: {
      code: 'KH-0001',
      name: 'Công ty XD & Thương Mại Tuấn Phát',
      phone: '0983 221 445',
      address: 'Khu Đô Thị Louis City, Đại Mỗ, Nam Từ Liêm, Hà Nội',
      taxCode: '0108899123',
      groupId: grpDaiLy.id,
      creditLimit: 150000000,
      paymentTermDays: 45,
      currentDebt: 48500000,
      sites: {
        create: [
          { name: 'Công trình Biệt thự Louis City B4-12', address: 'Lô B4-12 Louis City, Nam Từ Liêm' },
          { name: 'Dự án Nhà xưởng Phúc Thọ', address: 'Cụm CN Phúc Thọ, Hà Nội' },
        ],
      },
    },
    include: { sites: true },
  });

  const custHaiDang = await prisma.customer.upsert({
    where: { code: 'KH-0002' },
    update: {},
    create: {
      code: 'KH-0002',
      name: 'Nhà Thầu Thi Công Hải Đăng',
      phone: '0915 678 990',
      address: 'Số 45 Ngõ 102 Khuất Duy Tiến, Thanh Xuân, Hà Nội',
      groupId: grpTho.id,
      creditLimit: 60000000,
      paymentTermDays: 30,
      currentDebt: 24600000,
      sites: {
        create: [
          { name: 'Công trình Nhà phố 5 tầng anh Tuấn', address: 'Số 18 Dịch Vọng Hậu, Cầu Giấy' },
        ],
      },
    },
    include: { sites: true },
  });

  const custBacHung = await prisma.customer.upsert({
    where: { code: 'KH-0003' },
    update: {},
    create: {
      code: 'KH-0003',
      name: 'Đội Thợ Xây Bác Hùng (Thợ cả)',
      phone: '0972 345 611',
      address: 'Thôn 3, Thạch Hòa, Thạch Thất, Hà Nội',
      groupId: grpTho.id,
      creditLimit: 30000000,
      paymentTermDays: 20,
      currentDebt: 12200000,
    },
  });

  const custLeMinh = await prisma.customer.upsert({
    where: { code: 'KH-0004' },
    update: {},
    create: {
      code: 'KH-0004',
      name: 'Anh Lê Văn Minh (Chủ nhà tự xây)',
      phone: '0904 991 223',
      address: 'Khu Tái định cư Đại học Quốc Gia, Hòa Lạc',
      groupId: grpLe.id,
      creditLimit: 20000000,
      paymentTermDays: 10,
      currentDebt: 0,
    },
  });

  // Seed Opening Debt Ledgers for Customers
  await prisma.debtLedger.create({
    data: {
      partnerType: 'CUSTOMER',
      partnerId: custTuanPhat.id,
      refType: 'OPENING_BALANCE',
      refId: custTuanPhat.id,
      debit: 48500000,
      credit: 0,
      balanceAfter: 48500000,
      note: 'Dư nợ công trình đầu kỳ',
    },
  });

  await prisma.debtLedger.create({
    data: {
      partnerType: 'CUSTOMER',
      partnerId: custHaiDang.id,
      refType: 'OPENING_BALANCE',
      refId: custHaiDang.id,
      debit: 24600000,
      credit: 0,
      balanceAfter: 24600000,
      note: 'Dư nợ thợ thi công đầu kỳ',
    },
  });

  // 10. Demo Sales Orders (1 Confirmed with partial paid, 1 Fully Delivered, 1 Draft)
  const xmHaTien = createdProducts.find((p) => p.sku === 'XM-HT-PCB40');
  const thepD10 = createdProducts.find((p) => p.sku === 'ST-HP-D10');
  const catVang = createdProducts.find((p) => p.sku === 'CAT-VANG-LO');
  const gach4L = createdProducts.find((p) => p.sku === 'GACH-TUYNEL-4L');

  // Order 1: Confirmed with Partial payment
  const order1 = await prisma.salesOrder.upsert({
    where: { code: 'BH-2611-0001' },
    update: {},
    create: {
      code: 'BH-2611-0001',
      customerId: custTuanPhat.id,
      siteId: custTuanPhat.sites[0]?.id,
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: SalesOrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PARTIAL,
      subtotal: 28400000,
      discountAmount: 400000,
      shippingFee: 500000,
      total: 28500000,
      paidAmount: 15000000,
      salespersonId: salesUser.id,
      note: 'Giao đợt 1 đổ cột tầng 1 biệt thự Louis City',
      items: {
        create: [
          {
            productId: xmHaTien.id,
            unitName: 'Bao',
            quantity: 100,
            baseQuantity: 100,
            unitPrice: 87000,
            lineTotal: 8700000,
            costAtSale: 85000,
          },
          {
            productId: thepD10.id,
            unitName: 'Cây',
            quantity: 100,
            baseQuantity: 100,
            unitPrice: 102000,
            lineTotal: 10200000,
            costAtSale: 98000,
          },
          {
            productId: catVang.id,
            unitName: 'm3',
            quantity: 30,
            baseQuantity: 30,
            unitPrice: 310000,
            lineTotal: 9300000,
            costAtSale: 280000,
          },
        ],
      },
    },
  });

  // Payment for Order 1
  const pay1 = await prisma.payment.upsert({
    where: { code: 'PT-2611-0001' },
    update: {},
    create: {
      code: 'PT-2611-0001',
      type: 'RECEIPT',
      partnerType: 'CUSTOMER',
      partnerId: custTuanPhat.id,
      amount: 15000000,
      method: PaymentMethod.TRANSFER,
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      note: 'Tạm ứng đợt 1 qua chuyển khoản Techcombank',
      allocations: {
        create: [
          {
            orderType: 'SALES_ORDER',
            orderId: order1.id,
            amount: 15000000,
          },
        ],
      },
    },
  });

  // Order 2: Completed / Delivered for Khách Bác Hùng
  const order2 = await prisma.salesOrder.upsert({
    where: { code: 'BH-2611-0002' },
    update: {},
    create: {
      code: 'BH-2611-0002',
      customerId: custBacHung.id,
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: SalesOrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.UNPAID,
      subtotal: 15440000,
      discountAmount: 0,
      shippingFee: 300000,
      total: 15740000,
      paidAmount: 0,
      salespersonId: salesUser.id,
      note: 'Xe 5 tấn bến xe Thạch Thất nhận',
      items: {
        create: [
          {
            productId: gach4L.id,
            unitName: 'Viên',
            quantity: 8000,
            baseQuantity: 8000,
            unitPrice: 1220,
            lineTotal: 9760000,
            costAtSale: 1050,
          },
          {
            productId: xmHaTien.id,
            unitName: 'Bao',
            quantity: 60,
            baseQuantity: 60,
            unitPrice: 90000,
            lineTotal: 5400000,
            costAtSale: 85000,
          },
        ],
      },
    },
  });

  // 11. Initial Settings
  await prisma.setting.upsert({
    where: { key: 'storeName' },
    update: {},
    create: { key: 'storeName', value: 'constructOS — Vật Liệu Xây Dựng & Sắt Thép' },
  });

  await prisma.setting.upsert({
    where: { key: 'storePhone' },
    update: {},
    create: { key: 'storePhone', value: '0908 123 456' },
  });

  await prisma.setting.upsert({
    where: { key: 'storeAddress' },
    update: {},
    create: { key: 'storeAddress', value: '124 Đại Lộ Xây Dựng, Cụm Công Nghiệp Hòa Lạc, Hà Nội' },
  });

  await prisma.setting.upsert({
    where: { key: 'storeTaxCode' },
    update: {},
    create: { key: 'storeTaxCode', value: '0109988776' },
  });

  await prisma.setting.upsert({
    where: { key: 'bankName' },
    update: {},
    create: { key: 'bankName', value: 'MBBank' },
  });

  await prisma.setting.upsert({
    where: { key: 'bankAccountNo' },
    update: {},
    create: { key: 'bankAccountNo', value: '999988886666' },
  });

  await prisma.setting.upsert({
    where: { key: 'bankAccountName' },
    update: {},
    create: { key: 'bankAccountName', value: 'CONSTRUCTOS STORE' },
  });

  await prisma.setting.upsert({
    where: { key: 'allowNegativeStock' },
    update: {},
    create: { key: 'allowNegativeStock', value: 'true' },
  });

  console.log('--- constructOS Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
