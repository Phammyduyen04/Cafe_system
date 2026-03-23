// =================================================================
// MongoDB Seed Data — chạy tự động khi container khởi tạo lần đầu
// Mount vào /docker-entrypoint-initdb.d/mongo-init.js
// =================================================================

// ─────────────────────────────────────────────
// 1. PRODUCT_DB
// ─────────────────────────────────────────────
db = db.getSiblingDB('product_db');

// --- Product Categories ---
db.product_categories.insertMany([
  { categoryId: 'CAT-001', categoryName: 'Cà phê',             description: 'Các loại cà phê truyền thống và đặc biệt', status: 'ACTIVE' },
  { categoryId: 'CAT-002', categoryName: 'Trà nguyên bản',     description: 'Trà tự nhiên, thanh mát',                  status: 'ACTIVE' },
  { categoryId: 'CAT-003', categoryName: 'Trà sữa',            description: 'Trà sữa đa dạng hương vị',                 status: 'ACTIVE' },
  { categoryId: 'CAT-004', categoryName: 'Đá xay',             description: 'Đá xay mát lạnh sảng khoái',              status: 'ACTIVE' },
  { categoryId: 'CAT-005', categoryName: 'Sinh tố & nước ép',  description: 'Sinh tố và nước ép trái cây tươi',         status: 'ACTIVE' },
  { categoryId: 'CAT-006', categoryName: 'Bánh & ăn nhẹ',      description: 'Bánh ngọt, bánh mặn và snack',            status: 'ACTIVE' },
]);

// --- Products ---
db.products.insertMany([
  // Cà phê
  { productId: 'PRD-001', productName: 'Cà phê đen đá',         price: 29000, description: 'Cà phê đen pha phin truyền thống, đậm đà hương vị Việt Nam', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-002', productName: 'Cà phê sữa đá',         price: 35000, description: 'Cà phê phin kết hợp sữa đặc, thơm béo hài hòa', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-003', productName: 'Bạc xỉu',               price: 35000, description: 'Cà phê nhẹ nhàng hòa quyện cùng sữa tươi', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-004', productName: 'Espresso',               price: 39000, description: 'Espresso nguyên chất, đậm đặc và thơm nồng', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-005', productName: 'Cappuccino',             price: 49000, description: 'Espresso kết hợp sữa tươi đánh bông mịn màng', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-006', productName: 'Latte',                  price: 49000, description: 'Espresso hòa quyện sữa tươi nóng, nhẹ nhàng tinh tế', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-007', productName: 'Americano',              price: 39000, description: 'Espresso pha nước nóng, hương vị sạch và sâu', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-008', productName: 'Caramel Macchiato',      price: 55000, description: 'Espresso, sữa tươi và caramel thơm ngọt', productCategoryId: 'CAT-001', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },

  // Trà nguyên bản
  { productId: 'PRD-009', productName: 'Trà sen vàng',           price: 35000, description: 'Trà xanh hương sen thanh tao, dịu nhẹ', productCategoryId: 'CAT-002', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-010', productName: 'Trà đào cam sả',         price: 45000, description: 'Trà đào kết hợp cam tươi và sả thơm mát', productCategoryId: 'CAT-002', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-011', productName: 'Trà nhài',               price: 30000, description: 'Trà hoa nhài nguyên chất, hương thơm dễ chịu', productCategoryId: 'CAT-002', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-012', productName: 'Trà vải',                price: 40000, description: 'Trà xanh kết hợp vải tươi thanh ngọt', productCategoryId: 'CAT-002', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },

  // Trà sữa
  { productId: 'PRD-013', productName: 'Trà sữa trân châu',     price: 45000, description: 'Trà sữa truyền thống với trân châu đen dẻo', productCategoryId: 'CAT-003', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-014', productName: 'Trà sữa matcha',         price: 49000, description: 'Matcha Nhật Bản hòa quyện sữa tươi', productCategoryId: 'CAT-003', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-015', productName: 'Trà sữa khoai môn',     price: 49000, description: 'Trà sữa khoai môn thơm bùi, ngọt tự nhiên', productCategoryId: 'CAT-003', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-016', productName: 'Hồng trà sữa',          price: 42000, description: 'Hồng trà đậm đà kết hợp sữa tươi béo ngậy', productCategoryId: 'CAT-003', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },

  // Đá xay
  { productId: 'PRD-017', productName: 'Cà phê đá xay',         price: 55000, description: 'Cà phê xay cùng đá, mát lạnh sảng khoái', productCategoryId: 'CAT-004', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-018', productName: 'Socola đá xay',          price: 55000, description: 'Socola đậm đà xay nhuyễn cùng đá và kem', productCategoryId: 'CAT-004', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-019', productName: 'Matcha đá xay',          price: 55000, description: 'Matcha Nhật xay đá mịn màng', productCategoryId: 'CAT-004', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },

  // Sinh tố & nước ép
  { productId: 'PRD-020', productName: 'Sinh tố xoài',           price: 45000, description: 'Xoài chín mọng xay mịn cùng sữa', productCategoryId: 'CAT-005', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-021', productName: 'Sinh tố bơ',             price: 49000, description: 'Bơ sáp béo ngậy xay cùng sữa đặc', productCategoryId: 'CAT-005', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-022', productName: 'Nước ép cam',            price: 39000, description: 'Cam tươi vắt nguyên chất, giàu vitamin C', productCategoryId: 'CAT-005', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-023', productName: 'Nước ép dưa hấu',       price: 35000, description: 'Dưa hấu tươi ép lạnh, giải nhiệt mùa hè', productCategoryId: 'CAT-005', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },

  // Bánh & ăn nhẹ
  { productId: 'PRD-024', productName: 'Bánh croissant bơ',      price: 35000, description: 'Croissant bơ Pháp nướng vàng giòn xốp', productCategoryId: 'CAT-006', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-025', productName: 'Bánh tiramisu',          price: 45000, description: 'Tiramisu cà phê béo ngậy, thơm hương cacao', productCategoryId: 'CAT-006', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-026', productName: 'Bánh mì que pate',       price: 20000, description: 'Bánh mì que giòn rụm kèm pate thơm béo', productCategoryId: 'CAT-006', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { productId: 'PRD-027', productName: 'Cookie socola',          price: 25000, description: 'Cookie socola chip giòn tan, đậm vị cacao', productCategoryId: 'CAT-006', image: '', status: 'ACTIVE', isAvailable: true, createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
]);

// --- Toppings ---
db.toppings.insertMany([
  { toppingId: 'TOP-001', toppingName: 'Trân châu đen',     price: 10000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-002', toppingName: 'Trân châu trắng',   price: 10000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-003', toppingName: 'Thạch cà phê',      price: 10000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-004', toppingName: 'Pudding trứng',      price: 12000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-005', toppingName: 'Kem cheese',         price: 15000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-006', toppingName: 'Shot espresso',      price: 15000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-007', toppingName: 'Đào miếng',          price: 10000, image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
  { toppingId: 'TOP-008', toppingName: 'Sương sáo',          price: 8000,  image: '', isAvailable: true, status: 'ACTIVE', createdBy: 'system', createdAt: new Date(), updatedAt: new Date() },
]);

// --- Ingredients ---
db.ingredients.insertMany([
  { ingredientId: 'ING-001', ingredientName: 'Cà phê robusta',   unit: 'kg', currentQuantity: 50, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-002', ingredientName: 'Cà phê arabica',   unit: 'kg', currentQuantity: 30, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-003', ingredientName: 'Sữa tươi',         unit: 'lít', currentQuantity: 100, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-004', ingredientName: 'Sữa đặc',          unit: 'lon', currentQuantity: 200, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-005', ingredientName: 'Đường',             unit: 'kg', currentQuantity: 40, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-006', ingredientName: 'Bột matcha',        unit: 'kg', currentQuantity: 10, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-007', ingredientName: 'Bột cacao',         unit: 'kg', currentQuantity: 15, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-008', ingredientName: 'Trà xanh',          unit: 'kg', currentQuantity: 20, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-009', ingredientName: 'Trà đen (hồng trà)', unit: 'kg', currentQuantity: 20, status: 'ACTIVE', updatedAt: new Date() },
  { ingredientId: 'ING-010', ingredientName: 'Kem whipping',      unit: 'lít', currentQuantity: 25, status: 'ACTIVE', updatedAt: new Date() },
]);

// --- Reviews (đánh giá cửa hàng — productId: null) ---
db.reviews.insertMany([
  { reviewId: 'REV-001', customerName: 'Nguyễn Minh Anh',   avatar: '', rating: 5, comment: 'Coffea thực sự là nơi tôi yêu thích mỗi buổi sáng. Cà phê đậm đà, không gian ấm cúng và nhân viên phục vụ rất nhiệt tình. Tôi luôn giới thiệu cho bạn bè và đồng nghiệp.',            productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-002', customerName: 'Trần Thanh Huy',    avatar: '', rating: 4, comment: 'Hương vị cà phê ở đây rất khác biệt so với các quán khác. Tôi đặc biệt thích món Americano — đậm vị nhưng không gắt. Chắc chắn sẽ quay lại thường xuyên hơn!',                        productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-003', customerName: 'Lê Bảo Châu',       avatar: '', rating: 5, comment: 'Không gian yên tĩnh, thức uống tuyệt vời và giá cả hợp lý. Coffea đã trở thành điểm đến lý tưởng của tôi mỗi cuối tuần để thư giãn và đọc sách.',                                     productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-004', customerName: 'Phạm Thị Hồng',     avatar: '', rating: 5, comment: 'Quán nhỏ xinh, ấm cúng. Menu đa dạng với nhiều loại thức uống hấp dẫn. Mình thích nhất là Bạc xỉu và Croissant bơ ở đây — combo hoàn hảo cho buổi sáng!',                             productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-005', customerName: 'Võ Hoàng Dũng',     avatar: '', rating: 4, comment: 'Mình là khách quen ở Coffea. Cà phê luôn tươi, pha chuẩn vị. Nhân viên vui vẻ và phục vụ nhanh. Wifi mạnh nữa nên rất thích hợp để làm việc.',                                          productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-006', customerName: 'Đặng Ngọc Trinh',   avatar: '', rating: 5, comment: 'Lần đầu ghé thử và ấn tượng ngay từ cách decor. Trà đào cam sả mát lịm, uống là ghiền. Sẽ rủ hội bạn đến vào cuối tuần!',                                                              productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-007', customerName: 'Huỳnh Quốc Bảo',    avatar: '', rating: 4, comment: 'Quán có phong cách rất riêng, chill và nhẹ nhàng. Espresso đậm đặc đúng gu. Chỉ tiếc là cuối tuần hơi đông, phải chờ chỗ ngồi.',                                                        productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-008', customerName: 'Ngô Khánh Linh',    avatar: '', rating: 5, comment: 'Đồ uống ngon, giá sinh viên rất hợp lý. Trà sữa trân châu là món gọi hoài không chán. Quán sạch sẽ, nhạc nhẹ dễ chịu — 10/10!',                                                        productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
  { reviewId: 'REV-009', customerName: 'Bùi Đức Anh',       avatar: '', rating: 5, comment: 'Một trong những quán cà phê chất lượng nhất khu vực. Từ hạt cà phê đến cách pha chế đều rất cẩn thận. Mình tin rằng Coffea sẽ ngày càng phát triển hơn nữa!',                            productId: null, isApproved: true, createdAt: new Date(), updatedAt: new Date() },
]);

print('✅ product_db seeded successfully');

// ─────────────────────────────────────────────
// 2. PROMOTION_DB
// ─────────────────────────────────────────────
db = db.getSiblingDB('promotion_db');

// --- Discounts ---
db.discounts.insertMany([
  {
    discountId: 'DISC-001',
    discountName: 'Giảm 10% đơn đầu tiên',
    discountType: 'PERCENT',
    discountValue: 10,
    description: 'Ưu đãi chào mừng khách hàng mới, giảm 10% cho đơn hàng đầu tiên',
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    discountId: 'DISC-002',
    discountName: 'Giảm 20.000đ đơn từ 100.000đ',
    discountType: 'FIXED',
    discountValue: 20000,
    description: 'Giảm trực tiếp 20.000đ cho đơn hàng từ 100.000đ trở lên',
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    discountId: 'DISC-003',
    discountName: 'Giảm 15% Happy Hour',
    discountType: 'PERCENT',
    discountValue: 15,
    description: 'Giảm 15% tất cả thức uống từ 14:00 – 16:00 mỗi ngày',
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// --- Discount Conditions ---
db.discount_conditions.insertMany([
  {
    discountId: 'DISC-001',
    minimumOrderAmount: null,
    applicableCustomerTypes: ['REGULAR'],
    applicableProductIds: [],
    applicableCategoryIds: [],
    timeFrames: [],
  },
  {
    discountId: 'DISC-002',
    minimumOrderAmount: 100000,
    applicableCustomerTypes: [],
    applicableProductIds: [],
    applicableCategoryIds: [],
    timeFrames: [],
  },
  {
    discountId: 'DISC-003',
    minimumOrderAmount: null,
    applicableCustomerTypes: [],
    applicableProductIds: [],
    applicableCategoryIds: [],
    timeFrames: [{ from: '14:00', to: '16:00' }],
  },
]);

// --- Promotions ---
db.promotions.insertMany([
  {
    promotionId: 'PROMO-001',
    promotionName: 'Mua 2 tặng 1 Cà phê',
    description: 'Mua 2 ly cà phê bất kỳ, tặng 1 ly Cà phê đen đá',
    benefitType: 'BUY_X_GET_Y',
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    promotionId: 'PROMO-002',
    promotionName: 'Combo Bánh + Cà phê',
    description: 'Mua 1 ly cà phê kèm 1 bánh croissant, tặng 1 cookie socola',
    benefitType: 'FREE_ITEM',
    status: 'ACTIVE',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2026-12-31'),
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// --- Promotion Conditions ---
db.promotion_conditions.insertMany([
  {
    promotionId: 'PROMO-001',
    triggerProducts: [
      { productId: 'PRD-001', quantity: 2 },
    ],
    rewardProducts: [
      { productId: 'PRD-001', quantity: 1 },
    ],
    minimumOrderAmount: null,
  },
  {
    promotionId: 'PROMO-002',
    triggerProducts: [
      { productId: 'PRD-002', quantity: 1 },
      { productId: 'PRD-024', quantity: 1 },
    ],
    rewardProducts: [
      { productId: 'PRD-027', quantity: 1 },
    ],
    minimumOrderAmount: null,
  },
]);

print('✅ promotion_db seeded successfully');

// ─────────────────────────────────────────────
// 3. STAFF_DB
// ─────────────────────────────────────────────
db = db.getSiblingDB('staff_db');

// --- Employees ---
db.employees.insertMany([
  { employeeId: 'EMP-001', fullName: 'Nguyễn Văn Quản',   position: 'Quản lý',       employeeType: 'FULL_TIME', maxWorkingHours: null, accountId: null, managerId: null,      status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { employeeId: 'EMP-002', fullName: 'Trần Thị Mai',       position: 'Barista',        employeeType: 'FULL_TIME', maxWorkingHours: null, accountId: null, managerId: 'EMP-001', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { employeeId: 'EMP-003', fullName: 'Lê Hoàng Nam',       position: 'Barista',        employeeType: 'FULL_TIME', maxWorkingHours: null, accountId: null, managerId: 'EMP-001', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { employeeId: 'EMP-004', fullName: 'Phạm Thị Lan',       position: 'Thu ngân',       employeeType: 'FULL_TIME', maxWorkingHours: null, accountId: null, managerId: 'EMP-001', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { employeeId: 'EMP-005', fullName: 'Võ Minh Tuấn',       position: 'Phục vụ',        employeeType: 'PART_TIME', maxWorkingHours: 20,   accountId: null, managerId: 'EMP-001', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
  { employeeId: 'EMP-006', fullName: 'Đặng Ngọc Hân',      position: 'Phục vụ',        employeeType: 'PART_TIME', maxWorkingHours: 20,   accountId: null, managerId: 'EMP-001', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
]);

// --- Work Shifts ---
db.work_shift.insertMany([
  { shiftId: 'SHIFT-001', shiftName: 'Ca sáng',  startTime: '06:00', endTime: '12:00', workingDate: '2026-03-24', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
  { shiftId: 'SHIFT-002', shiftName: 'Ca chiều',  startTime: '12:00', endTime: '18:00', workingDate: '2026-03-24', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
  { shiftId: 'SHIFT-003', shiftName: 'Ca tối',    startTime: '18:00', endTime: '22:00', workingDate: '2026-03-24', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
  { shiftId: 'SHIFT-004', shiftName: 'Ca sáng',  startTime: '06:00', endTime: '12:00', workingDate: '2026-03-25', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
  { shiftId: 'SHIFT-005', shiftName: 'Ca chiều',  startTime: '12:00', endTime: '18:00', workingDate: '2026-03-25', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
  { shiftId: 'SHIFT-006', shiftName: 'Ca tối',    startTime: '18:00', endTime: '22:00', workingDate: '2026-03-25', status: 'PLANNED', createdByManagerId: 'EMP-001', createdAt: new Date(), updatedAt: new Date() },
]);

// --- Shift Assignments ---
db.shift_assignments.insertMany([
  { shiftId: 'SHIFT-001', employeeId: 'EMP-002', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
  { shiftId: 'SHIFT-001', employeeId: 'EMP-004', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
  { shiftId: 'SHIFT-002', employeeId: 'EMP-003', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
  { shiftId: 'SHIFT-002', employeeId: 'EMP-005', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
  { shiftId: 'SHIFT-003', employeeId: 'EMP-002', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
  { shiftId: 'SHIFT-003', employeeId: 'EMP-006', assignedAt: new Date(), assignedBy: 'EMP-001', assignmentStatus: 'ASSIGNED' },
]);

// --- Employee Availability ---
db.employee_availabilities.insertMany([
  { employeeId: 'EMP-002', availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],           availableTimeRanges: [{ start: '06:00', end: '22:00' }], updatedAt: new Date() },
  { employeeId: 'EMP-003', availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],                   availableTimeRanges: [{ start: '06:00', end: '22:00' }], updatedAt: new Date() },
  { employeeId: 'EMP-004', availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],           availableTimeRanges: [{ start: '06:00', end: '18:00' }], updatedAt: new Date() },
  { employeeId: 'EMP-005', availableDays: ['MON', 'WED', 'FRI', 'SAT', 'SUN'],                   availableTimeRanges: [{ start: '12:00', end: '22:00' }], updatedAt: new Date() },
  { employeeId: 'EMP-006', availableDays: ['TUE', 'THU', 'SAT', 'SUN'],                           availableTimeRanges: [{ start: '14:00', end: '22:00' }], updatedAt: new Date() },
]);

print('✅ staff_db seeded successfully');
print('🎉 All MongoDB databases seeded!');
