# Promotion Service API Test Guide

Base URL (qua Gateway): `http://localhost:3000`
Promotion Service trực tiếp: `http://localhost:3006`

> **Lưu ý**: Các endpoint GET (list, detail, check, coupon) là **public** — không cần token.
> Các endpoint POST/PUT/DELETE và `/calculate`, `/use`, `/usage` cần header:
> `Authorization: Bearer <accessToken>`

---

## Nhóm 0: Xác thực (Lấy token)

### 0.1 Login MANAGER
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "manager01",
  "password": "Man@123"
}
```
**Kết quả mong đợi**: `200 OK` → lưu `accessToken` của manager

---

### 0.2 Login EMPLOYEE (để test endpoint `/calculate` và `/use`)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "nhanvien01",
  "password": "123456"
}
```
**Kết quả mong đợi**: `200 OK` → lưu `accessToken` của employee

> Tài khoản thực tế: `nhanvien01` (EMP-007) hoặc `parttime01` (EMP-013), cả hai đều có role EMPLOYEE.

---

## Nhóm 1: Discount — CRUD

> **Discount** = Giảm giá theo % hoặc số tiền cố định.
> Quy trình: Tạo → Cập nhật điều kiện → Kiểm tra áp dụng → Tính tiền → Ghi nhận.

### 1.1 Tạo discount PERCENT hợp lệ (MANAGER)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm 20% cuối tuần",
  "discountType": "PERCENT",
  "discountValue": 20,
  "description": "Áp dụng cho tất cả đơn vào thứ 7 và chủ nhật",
  "startDate": "2026-05-17",
  "endDate": "2026-12-31",
  "couponCode": "WEEKEND20",
  "maxUsage": 100
}
```
**Kết quả mong đợi**: `201 Created` → lưu `discountId` (dạng `DISC_001`)

---

### 1.2 Tạo discount FIXED hợp lệ (MANAGER)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm 30.000đ đơn từ 150.000đ",
  "discountType": "FIXED",
  "discountValue": 30000,
  "description": "Áp dụng cho đơn hàng từ 150.000đ trở lên",
  "startDate": "2026-05-17",
  "endDate": "2026-06-30"
}
```
**Kết quả mong đợi**: `201 Created` → lưu `discountId`, `couponCode: null`, `maxUsage: null`

---

### 1.3 Tạo discount — PERCENT > 100 (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm vô lý",
  "discountType": "PERCENT",
  "discountValue": 150,
  "startDate": "2026-05-17",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Phần trăm giảm phải từ 1 đến 100"

---

### 1.4 Tạo discount — PERCENT = 0 (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm 0%",
  "discountType": "PERCENT",
  "discountValue": 0,
  "startDate": "2026-05-17",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Phần trăm giảm phải từ 1 đến 100"

---

### 1.5 Tạo discount — FIXED âm (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm âm",
  "discountType": "FIXED",
  "discountValue": -5000,
  "startDate": "2026-05-17",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Số tiền giảm phải lớn hơn 0"

---

### 1.6 Tạo discount — endDate trước startDate (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Ngày sai",
  "discountType": "PERCENT",
  "discountValue": 10,
  "startDate": "2026-12-31",
  "endDate": "2026-05-17"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Ngày kết thúc phải cùng ngày hoặc sau ngày bắt đầu"

---

### 1.7 Tạo discount — couponCode trùng (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Discount trùng mã",
  "discountType": "PERCENT",
  "discountValue": 15,
  "startDate": "2026-05-17",
  "endDate": "2026-12-31",
  "couponCode": "WEEKEND20"
}
```
**Kết quả mong đợi**: `409 Conflict` — "Mã coupon này đã được sử dụng"

---

### 1.8 Tạo discount — không có quyền (EMPLOYEE)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "discountName": "Test",
  "discountType": "PERCENT",
  "discountValue": 10,
  "startDate": "2026-05-17",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 1.9 Lấy danh sách discount (public)
```
GET http://localhost:3000/api/promotions/discounts
```
**Kết quả mong đợi**: `200 OK` với pagination `{ page, limit, total, totalPages }`

---

### 1.10 Filter theo status
```
GET http://localhost:3000/api/promotions/discounts?status=ACTIVE
```
**Kết quả mong đợi**: `200 OK`, chỉ discount ACTIVE

---

### 1.11 Lấy chi tiết discount theo ID (public)
```
GET http://localhost:3000/api/promotions/discounts/<discountId>
```
**Kết quả mong đợi**: `200 OK` với thông tin discount + `conditions`

---

### 1.12 Lấy chi tiết — không tồn tại
```
GET http://localhost:3000/api/promotions/discounts/DISC_999
```
**Kết quả mong đợi**: `404 Not Found`

---

### 1.13 Cập nhật discount (MANAGER)
```
PUT http://localhost:3000/api/promotions/discounts/<discountId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Giảm 20% cuối tuần (cập nhật)",
  "maxUsage": 200
}
```
**Kết quả mong đợi**: `200 OK` với thông tin đã cập nhật

---

### 1.14 Cập nhật discount ACTIVE — sửa ngày (lỗi)
```
PUT http://localhost:3000/api/promotions/discounts/<activeDiscountId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "startDate": "2026-06-01"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Không thể sửa ngày khi chương trình đang hoạt động"

---

### 1.15 Hủy discount — soft delete (MANAGER)
```
DELETE http://localhost:3000/api/promotions/discounts/<discountId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, `status: "CANCELLED"` (record vẫn còn trong DB)

---

### 1.16 Cập nhật discount đã CANCELLED (lỗi)
```
PUT http://localhost:3000/api/promotions/discounts/<cancelledDiscountId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Sửa sau khi hủy"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Không thể sửa chương trình đã hết hạn hoặc đã hủy"

---

### 1.17 Tạo discount — startDate là ngày trong quá khứ (lỗi)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Test ngày quá khứ",
  "discountType": "PERCENT",
  "discountValue": 10,
  "startDate": "2026-05-01",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Ngày bắt đầu không được là ngày trong quá khứ"

---

### 1.18 Tạo discount — startDate = endDate = hôm nay (thành công, trạng thái ACTIVE)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Flash sale hôm nay",
  "discountType": "PERCENT",
  "discountValue": 15,
  "startDate": "2026-05-16",
  "endDate": "2026-05-16",
  "couponCode": "TODAY15"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "ACTIVE"`

> Discount cùng ngày sẽ chuyển sang `EXPIRED` lúc 00:00 UTC ngày hôm sau (tức 07:00 sáng hôm sau theo giờ Việt Nam).

---

## Nhóm 2: Discount — Điều kiện áp dụng

### 2.1 Cập nhật điều kiện discount (MANAGER)
```
PUT http://localhost:3000/api/promotions/discounts/<discountId>/conditions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "minimumOrderAmount": 150000,
  "applicableCustomerTypes": ["REGULAR", "VIP"],
  "applicableProductIds": ["prod_001", "prod_002"],
  "applicableCategoryIds": ["cat_coffee"],
  "timeFrames": [
    { "from": "08:00", "to": "11:00" },
    { "from": "14:00", "to": "17:00" }
  ]
}
```
**Kết quả mong đợi**: `200 OK` với điều kiện đã cập nhật

---

### 2.2 Cập nhật điều kiện — không có điều kiện nào (áp dụng cho tất cả)
```
PUT http://localhost:3000/api/promotions/discounts/<discountId>/conditions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "minimumOrderAmount": null,
  "applicableCustomerTypes": [],
  "applicableProductIds": [],
  "applicableCategoryIds": [],
  "timeFrames": []
}
```
**Kết quả mong đợi**: `200 OK` — discount áp dụng không giới hạn

---

### 2.3 Cập nhật điều kiện discount đã CANCELLED (lỗi)
```
PUT http://localhost:3000/api/promotions/discounts/<cancelledDiscountId>/conditions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "minimumOrderAmount": 100000
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Không thể cập nhật điều kiện của chương trình đã hết hạn hoặc đã hủy"

---

## Nhóm 3: Discount — Kiểm tra & Tra cứu mã

### 3.1 Kiểm tra discount áp dụng được (public)
```
GET http://localhost:3000/api/promotions/discounts/check?orderAmount=200000&productIds=prod_001,prod_002&categoryIds=cat_coffee&customerType=REGULAR
```
**Kết quả mong đợi**: `200 OK`, danh sách discount đang ACTIVE thỏa điều kiện

---

### 3.2 Kiểm tra — orderAmount không đủ tối thiểu
```
GET http://localhost:3000/api/promotions/discounts/check?orderAmount=50000&productIds=prod_001&categoryIds=cat_coffee&customerType=REGULAR
```
**Kết quả mong đợi**: `200 OK`, mảng rỗng `[]` (không có discount nào khớp)

---

### 3.3 Kiểm tra — ngoài khung giờ
```
GET http://localhost:3000/api/promotions/discounts/check?orderAmount=200000&productIds=prod_001&categoryIds=cat_coffee&customerType=REGULAR
```
> Gọi API vào ngoài `timeFrames` đã đặt (ví dụ: 22:00)
**Kết quả mong đợi**: `200 OK`, mảng rỗng `[]`

---

### 3.4 Tra cứu discount theo mã coupon (public)
```
GET http://localhost:3000/api/promotions/discounts/coupon/WEEKEND20
```
**Kết quả mong đợi**: `200 OK`, thông tin discount + điều kiện

---

### 3.5 Tra cứu — mã viết thường (tự động normalize)
```
GET http://localhost:3000/api/promotions/discounts/coupon/weekend20
```
**Kết quả mong đợi**: `200 OK`, tìm được vì backend normalize thành `WEEKEND20`

---

### 3.6 Tra cứu — mã không tồn tại
```
GET http://localhost:3000/api/promotions/discounts/coupon/INVALID999
```
**Kết quả mong đợi**: `404 Not Found` — "Mã coupon không hợp lệ hoặc không tồn tại"

---

### 3.7 Tra cứu — mã của discount đã CANCELLED
```
GET http://localhost:3000/api/promotions/discounts/coupon/<mã_của_discount_đã_hủy>
```
**Kết quả mong đợi**: `400 Bad Request` — "Chương trình giảm giá này không còn hoạt động"

---

## Nhóm 4: Promotion — CRUD

> **Promotion** = Khuyến mãi kiểu tặng sản phẩm (mua X tặng Y, tặng kèm món...).
> Không giảm tiền — trả về `rewardProducts` là danh sách sản phẩm được tặng.

### 4.1 Tạo promotion hợp lệ — BUY_X_GET_Y (MANAGER)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Mua 2 tặng 1 Espresso",
  "benefitType": "BUY_X_GET_Y",
  "description": "Mua 2 ly Espresso bất kỳ, tặng thêm 1 ly",
  "startDate": "2026-05-17",
  "endDate": "2026-05-31",
  "couponCode": "B2G1ESP",
  "maxUsage": 50
}
```
**Kết quả mong đợi**: `201 Created` → lưu `promotionId` (dạng `PROMO_001`)

---

### 4.2 Tạo promotion — GIFT_WITH_ORDER không giới hạn (MANAGER)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Tặng bánh sinh nhật cho đơn từ 300.000đ",
  "benefitType": "GIFT_WITH_ORDER",
  "description": "Áp dụng trong tháng sinh nhật quán",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```
**Kết quả mong đợi**: `201 Created`, `couponCode: null`, `maxUsage: null`

---

### 4.3 Tạo promotion — benefitType không hợp lệ (lỗi)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Loại sai",
  "benefitType": "INVALID_TYPE",
  "startDate": "2026-05-17",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` (Mongoose validation error — không thuộc enum)

---

### 4.4 Tạo promotion — couponCode trùng (lỗi)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Promotion trùng mã",
  "benefitType": "FREE_ITEM",
  "startDate": "2026-05-17",
  "endDate": "2026-12-31",
  "couponCode": "B2G1ESP"
}
```
**Kết quả mong đợi**: `409 Conflict` — "Mã coupon này đã được sử dụng"

---

### 4.5 Lấy danh sách promotion (public)
```
GET http://localhost:3000/api/promotions
```
**Kết quả mong đợi**: `200 OK` với pagination

---

### 4.6 Filter theo status
```
GET http://localhost:3000/api/promotions?status=ACTIVE&page=1&limit=5
```
**Kết quả mong đợi**: `200 OK`, tối đa 5 promotion đang ACTIVE

---

### 4.7 Lấy chi tiết promotion (public)
```
GET http://localhost:3000/api/promotions/<promotionId>
```
**Kết quả mong đợi**: `200 OK`, thông tin promotion + `conditions` (triggerProducts, rewardProducts, ...)

---

### 4.8 Hủy promotion — soft delete (MANAGER)
```
DELETE http://localhost:3000/api/promotions/<promotionId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, `status: "CANCELLED"`

---

### 4.9 Tạo promotion — startDate là ngày trong quá khứ (lỗi)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Test ngày quá khứ",
  "benefitType": "FREE_ITEM",
  "startDate": "2026-04-01",
  "endDate": "2026-12-31"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Ngày bắt đầu không được là ngày trong quá khứ"

---

### 4.10 Tạo promotion — startDate = endDate = hôm nay (thành công, trạng thái ACTIVE)
```
POST http://localhost:3000/api/promotions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "promotionName": "Khuyến mãi hôm nay",
  "benefitType": "FREE_ITEM",
  "description": "Áp dụng duy nhất trong ngày hôm nay",
  "startDate": "2026-05-16",
  "endDate": "2026-05-16",
  "couponCode": "TODAYPROMO"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "ACTIVE"`

> Promotion cùng ngày sẽ chuyển sang `EXPIRED` lúc 00:00 UTC ngày hôm sau (07:00 sáng hôm sau theo giờ Việt Nam).

---

## Nhóm 5: Promotion — Điều kiện áp dụng

### 5.1 Cập nhật điều kiện promotion (MANAGER)
```
PUT http://localhost:3000/api/promotions/<promotionId>/conditions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "triggerProducts": [
    { "productId": "prod_esp_001", "quantity": 2 }
  ],
  "rewardProducts": [
    { "productId": "prod_esp_001", "quantity": 1 }
  ],
  "minimumOrderAmount": null,
  "applicableCustomerTypes": []
}
```
**Kết quả mong đợi**: `200 OK`, điều kiện cập nhật — mua 2 Espresso tặng 1 Espresso

---

### 5.2 Cập nhật điều kiện — có giới hạn loại khách hàng
```
PUT http://localhost:3000/api/promotions/<promotionId>/conditions
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "triggerProducts": [
    { "productId": "prod_cake_001", "quantity": 1 }
  ],
  "rewardProducts": [
    { "productId": "prod_cake_002", "quantity": 1 }
  ],
  "minimumOrderAmount": 300000,
  "applicableCustomerTypes": ["VIP"]
}
```
**Kết quả mong đợi**: `200 OK`

---

### 5.3 Kiểm tra promotion áp dụng được (public)
```
GET http://localhost:3000/api/promotions/check?productIds=prod_esp_001,prod_latte_001&orderAmount=150000&customerType=REGULAR
```
**Kết quả mong đợi**: `200 OK`, danh sách promotion áp dụng được (có `conditions` kèm theo)

---

### 5.4 Kiểm tra — không có sản phẩm trigger
```
GET http://localhost:3000/api/promotions/check?productIds=prod_other_001&orderAmount=150000
```
**Kết quả mong đợi**: `200 OK`, mảng rỗng `[]`

---

### 5.5 Tra cứu promotion theo mã coupon (public)
```
GET http://localhost:3000/api/promotions/coupon/B2G1ESP
```
**Kết quả mong đợi**: `200 OK`, thông tin promotion + điều kiện

---

### 5.6 Tra cứu — promotion đã đạt giới hạn sử dụng
```
GET http://localhost:3000/api/promotions/coupon/<mã_đã_dùng_hết>
```
**Kết quả mong đợi**: `400 Bad Request` — "Chương trình khuyến mãi đã đạt giới hạn sử dụng"

---

## Nhóm 6: Tính tiền — Calculate (Preview)

> `POST /api/promotions/calculate` — Preview số tiền sau giảm, **không ghi nhận**.
> Dùng trước khi tạo đơn để hiển thị giá cho khách.

### 6.1 Tính tiền DISCOUNT — PERCENT thành công
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderAmount": 200000,
  "productIds": ["prod_001", "prod_002"],
  "categoryIds": ["cat_coffee"],
  "customerType": "REGULAR"
}
```
**Kết quả mong đợi**: `200 OK`
```json
{
  "type": "DISCOUNT",
  "program": { "discountId": "DISC_001", "discountType": "PERCENT", "discountValue": 20, "..." : "..." },
  "originalAmount": 200000,
  "discountAmount": 40000,
  "finalAmount": 160000,
  "rewardProducts": []
}
```

---

### 6.2 Tính tiền DISCOUNT — FIXED thành công
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_002",
  "orderAmount": 200000,
  "productIds": [],
  "categoryIds": [],
  "customerType": "REGULAR"
}
```
**Kết quả mong đợi**: `200 OK`, `discountAmount: 30000`, `finalAmount: 170000`

---

### 6.3 Tính tiền DISCOUNT — FIXED vượt quá tổng đơn (capped)
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_002",
  "orderAmount": 20000,
  "productIds": [],
  "categoryIds": [],
  "customerType": "REGULAR"
}
```
> discountValue = 30.000đ nhưng đơn chỉ có 20.000đ
**Kết quả mong đợi**: `200 OK`, `discountAmount: 20000`, `finalAmount: 0` (không âm)

---

### 6.4 Tính tiền PROMOTION — trả về rewardProducts
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "PROMOTION",
  "programId": "PROMO_001",
  "orderAmount": 150000,
  "productIds": ["prod_esp_001", "prod_esp_001"],
  "categoryIds": ["cat_coffee"],
  "customerType": "REGULAR"
}
```
**Kết quả mong đợi**: `200 OK`
```json
{
  "type": "PROMOTION",
  "program": { "promotionId": "PROMO_001", "..." : "..." },
  "originalAmount": 150000,
  "discountAmount": 0,
  "finalAmount": 150000,
  "rewardProducts": [{ "productId": "prod_esp_001", "quantity": 1 }]
}
```

---

### 6.5 Tính tiền — orderAmount không đủ điều kiện (lỗi)
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderAmount": 50000,
  "productIds": ["prod_001"],
  "categoryIds": ["cat_coffee"],
  "customerType": "REGULAR"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Đơn hàng tối thiểu 150.000đ"

---

### 6.6 Tính tiền — discount không còn ACTIVE (lỗi)
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "<discountId_đã_CANCELLED>",
  "orderAmount": 200000,
  "productIds": [],
  "categoryIds": [],
  "customerType": "REGULAR"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Chương trình không còn hoạt động"

---

### 6.7 Tính tiền — type không hợp lệ (lỗi)
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "VOUCHER",
  "programId": "DISC_001",
  "orderAmount": 200000
}
```
**Kết quả mong đợi**: `400 Bad Request` — "type phải là PROMOTION hoặc DISCOUNT"

---

### 6.8 Tính tiền — thiếu programId (lỗi)
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "orderAmount": 200000
}
```
**Kết quả mong đợi**: `400 Bad Request` — "type và programId là bắt buộc"

---

## Nhóm 7: Ghi nhận sử dụng — Use

> `POST /api/promotions/use` — Ghi nhận sau khi đơn hàng đã được tạo thành công.
> Mỗi `orderId` chỉ được ghi nhận **1 lần** (1 đơn = 1 chương trình).

### 7.1 Ghi nhận sử dụng DISCOUNT thành công
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderId": "ORDER_20260517_001",
  "customerId": "12",
  "originalAmount": 200000,
  "discountAmount": 40000
}
```
**Kết quả mong đợi**: `201 Created`
```json
{
  "programId": "DISC_001",
  "programType": "DISCOUNT",
  "orderId": "ORDER_20260517_001",
  "customerId": "12",
  "originalAmount": 200000,
  "discountAmount": 40000,
  "finalAmount": 160000,
  "usedAt": "..."
}
```
> `usageCount` của DISC_001 tăng từ 0 lên 1

---

### 7.2 Ghi nhận sử dụng PROMOTION thành công
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "PROMOTION",
  "programId": "PROMO_001",
  "orderId": "ORDER_20260517_002",
  "customerId": "15",
  "originalAmount": 150000,
  "discountAmount": 0
}
```
**Kết quả mong đợi**: `201 Created`, `finalAmount: 150000`

---

### 7.3 Ghi nhận — orderId đã được dùng (lỗi — 1 đơn 1 chương trình)
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_002",
  "orderId": "ORDER_20260517_001",
  "customerId": "12",
  "originalAmount": 200000,
  "discountAmount": 30000
}
```
**Kết quả mong đợi**: `409 Conflict` — "Đơn hàng này đã áp dụng một chương trình khuyến mãi/giảm giá"

---

### 7.4 Ghi nhận — chương trình đã đạt maxUsage (lỗi)

> Trước đó tạo discount với `maxUsage: 1`, đã ghi nhận 1 lần, giờ ghi nhận lần 2:
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "<discountId_maxUsage_1>",
  "orderId": "ORDER_20260517_003",
  "customerId": "20",
  "originalAmount": 200000,
  "discountAmount": 20000
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Chương trình đã đạt giới hạn sử dụng"

---

### 7.5 Ghi nhận — thiếu orderId (lỗi)
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "originalAmount": 200000,
  "discountAmount": 40000
}
```
**Kết quả mong đợi**: `400 Bad Request` — "type, programId và orderId là bắt buộc"

---

### 7.6 Ghi nhận — không có token (lỗi)
```
POST http://localhost:3000/api/promotions/use
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderId": "ORDER_20260517_004",
  "originalAmount": 200000,
  "discountAmount": 40000
}
```
**Kết quả mong đợi**: `401 Unauthorized`

---

## Nhóm 8: Lịch sử sử dụng (Manager)

### 8.1 Xem lịch sử sử dụng của discount (MANAGER)
```
GET http://localhost:3000/api/promotions/usage/DISC_001
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với pagination, danh sách ghi nhận sử dụng
```json
{
  "data": [
    {
      "programId": "DISC_001",
      "programType": "DISCOUNT",
      "orderId": "ORDER_20260517_001",
      "customerId": "12",
      "originalAmount": 200000,
      "discountAmount": 40000,
      "finalAmount": 160000,
      "usedAt": "2026-05-17T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

### 8.2 Xem lịch sử với phân trang
```
GET http://localhost:3000/api/promotions/usage/PROMO_001?page=1&limit=5
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, tối đa 5 records

---

### 8.3 Xem lịch sử — chương trình chưa được dùng
```
GET http://localhost:3000/api/promotions/usage/DISC_002
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, `data: []`, `total: 0`

---

### 8.4 Xem lịch sử — không có quyền (EMPLOYEE)
```
GET http://localhost:3000/api/promotions/usage/DISC_001
Authorization: Bearer <employee_token>
```
**Kết quả mong đợi**: `403 Forbidden`

---

## Nhóm 9: Kiểm tra Cron Job (Status tự động)

> Cron chạy **mỗi phút**, so sánh theo **ngày** (UTC midnight): `PLANNED → ACTIVE → EXPIRED`.
> Sử dụng `startOfToday = new Date(Date.UTC(year, month, day))` để tránh lệch múi giờ.

### 9.1 Tạo discount PLANNED (startDate trong tương lai xa)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Flash sale năm 2099",
  "discountType": "PERCENT",
  "discountValue": 30,
  "startDate": "2099-01-01",
  "endDate": "2099-12-31"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "PLANNED"`

---

### 9.2 Tạo discount — startDate quá khứ bị từ chối (validation)
```
POST http://localhost:3000/api/promotions/discounts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "discountName": "Chương trình cũ",
  "discountType": "FIXED",
  "discountValue": 10000,
  "startDate": "2024-01-01",
  "endDate": "2024-06-30"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Ngày bắt đầu không được là ngày trong quá khứ"

> Hệ thống **không cho phép** tạo chương trình với ngày đã qua. Trạng thái `EXPIRED` chỉ xảy ra khi chương trình ACTIVE hết hạn sau khi cron chạy sang ngày tiếp theo.

---

### 9.3 Kiểm tra cron chuyển PLANNED → ACTIVE

Tạo discount với `startDate` = **ngày mai**, quan sát sau khi cron chạy vào 00:00 UTC (07:00 sáng VN):
```
GET http://localhost:3000/api/promotions/discounts/<discountId>
```
**Kết quả mong đợi**: `status` tự động chuyển từ `PLANNED` → `ACTIVE` vào đầu ngày startDate.

> Cron so sánh `startDate <= startOfToday` (UTC midnight) nên chuyển trạng thái đúng theo ngày, không bị lệch giờ.

---

### 9.4 Kiểm tra cron chuyển ACTIVE → EXPIRED

Tạo discount với `endDate` = **hôm nay**, để qua ngày hôm sau, rồi kiểm tra:
```
GET http://localhost:3000/api/promotions/discounts/<discountId>
```
**Kết quả mong đợi**: `status` tự động chuyển từ `ACTIVE` → `EXPIRED` vào 00:00 UTC ngày hôm sau (07:00 sáng VN).

---

## Nhóm 10: Kịch bản nghiệp vụ đầy đủ

> Mô phỏng luồng thực tế: Khách nhập mã → preview giá → đặt hàng → ghi nhận.

### 10.1 Luồng: Khách nhập mã coupon khi thanh toán

**Bước 1** — Khách nhập mã `WEEKEND20`:
```
GET http://localhost:3000/api/promotions/discounts/coupon/WEEKEND20
```
→ Nhận về thông tin discount (discountType, discountValue, điều kiện)

**Bước 2** — Preview số tiền sau giảm:
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderAmount": 200000,
  "productIds": ["prod_001"],
  "categoryIds": ["cat_coffee"],
  "customerType": "REGULAR"
}
```
→ Nhận: `discountAmount: 40000`, `finalAmount: 160000`

**Bước 3** — Sau khi order-service tạo đơn thành công, ghi nhận:
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "DISCOUNT",
  "programId": "DISC_001",
  "orderId": "ORDER_20260517_010",
  "customerId": "5",
  "originalAmount": 200000,
  "discountAmount": 40000
}
```
→ `usageCount` tăng 1, lịch sử được ghi lại.

---

### 10.2 Luồng: Khuyến mãi BUY_X_GET_Y

**Bước 1** — Kiểm tra promotion áp dụng được:
```
GET http://localhost:3000/api/promotions/check?productIds=prod_esp_001,prod_esp_001&orderAmount=100000&customerType=REGULAR
```
→ Nhận danh sách promotion, trong đó có PROMO_001 (B2G1ESP)

**Bước 2** — Tính tiền (không giảm giá, trả về sản phẩm tặng):
```
POST http://localhost:3000/api/promotions/calculate
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "PROMOTION",
  "programId": "PROMO_001",
  "orderAmount": 100000,
  "productIds": ["prod_esp_001", "prod_esp_001"],
  "categoryIds": [],
  "customerType": "REGULAR"
}
```
→ `discountAmount: 0`, `finalAmount: 100000`, `rewardProducts: [{ productId: "prod_esp_001", quantity: 1 }]`

**Bước 3** — Ghi nhận sau khi đơn tạo:
```
POST http://localhost:3000/api/promotions/use
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "type": "PROMOTION",
  "programId": "PROMO_001",
  "orderId": "ORDER_20260517_011",
  "customerId": "5",
  "originalAmount": 100000,
  "discountAmount": 0
}
```

---

## Tóm tắt Endpoints

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| **DISCOUNT** | | | |
| GET | `/api/promotions/discounts` | Public | Danh sách discount (filter, pagination) |
| GET | `/api/promotions/discounts/check` | Public | Kiểm tra discount áp dụng được |
| GET | `/api/promotions/discounts/coupon/:code` | Public | Tra cứu theo mã coupon |
| GET | `/api/promotions/discounts/:id` | Public | Chi tiết discount + conditions |
| POST | `/api/promotions/discounts` | MANAGER | Tạo discount |
| PUT | `/api/promotions/discounts/:id` | MANAGER | Cập nhật discount |
| DELETE | `/api/promotions/discounts/:id` | MANAGER | Hủy discount (soft) |
| PUT | `/api/promotions/discounts/:id/conditions` | MANAGER | Cập nhật điều kiện |
| **PROMOTION** | | | |
| GET | `/api/promotions` | Public | Danh sách promotion (filter, pagination) |
| GET | `/api/promotions/check` | Public | Kiểm tra promotion áp dụng được |
| GET | `/api/promotions/coupon/:code` | Public | Tra cứu theo mã coupon |
| GET | `/api/promotions/:id` | Public | Chi tiết promotion + conditions |
| POST | `/api/promotions` | MANAGER | Tạo promotion |
| PUT | `/api/promotions/:id` | MANAGER | Cập nhật promotion |
| DELETE | `/api/promotions/:id` | MANAGER | Hủy promotion (soft) |
| PUT | `/api/promotions/:id/conditions` | MANAGER | Cập nhật điều kiện |
| **CALCULATE** | | | |
| POST | `/api/promotions/calculate` | Auth | Preview giá sau giảm (không ghi nhận) |
| POST | `/api/promotions/use` | Auth | Ghi nhận sử dụng sau khi đơn tạo xong |
| GET | `/api/promotions/usage/:programId` | MANAGER | Lịch sử sử dụng của chương trình |

---

## Ghi chú quan trọng

- **1 đơn hàng = 1 chương trình**: `orderId` là unique trong `usage_history` — không thể ghi nhận 2 chương trình khác nhau cho cùng 1 đơn.
- **Soft delete**: Hủy discount/promotion chỉ đổi `status → CANCELLED`, không xóa khỏi DB — `usageCount` và lịch sử vẫn còn.
- **Cron job**: Chạy mỗi phút, so sánh theo **ngày UTC** (`startOfToday = UTC midnight`), tự động: `PLANNED → ACTIVE` (khi đến startDate) và `ACTIVE → EXPIRED` (khi qua endDate). Dùng ngày UTC để tránh lệch múi giờ.
- **Validation ngày**: `startDate` không được là ngày trong quá khứ. `endDate` phải >= `startDate` (cùng ngày được phép — single-day promotion/discount).
- **Promotion/discount cùng ngày**: `startDate = endDate = hôm nay` → tạo thành công, trạng thái `ACTIVE`. Sẽ chuyển `EXPIRED` lúc 00:00 UTC ngày hôm sau (07:00 sáng VN).
- **couponCode**: Lưu dạng **UPPERCASE**, tự động normalize — gõ thường hay hoa đều tìm được.
- **maxUsage**: `null` = không giới hạn số lần dùng. Khi `usageCount >= maxUsage`, chương trình không còn áp dụng được và không hiện trong kết quả `/check`.
- **PERCENT discount**: Giảm tối đa 100%, tối thiểu 1% — validate khi tạo và cập nhật.
- **FIXED discount**: Không giảm nhiều hơn tổng đơn (`finalAmount` không âm).
- **Promotion**: Không giảm giá tiền — trả về `rewardProducts` (sản phẩm tặng kèm). `discountAmount` luôn = 0.
- **Calculate**: Endpoint preview, **không ghi nhận** và **không tăng** `usageCount` — gọi bao nhiêu lần cũng được.
- **benefitType** hợp lệ: `BUY_X_GET_Y`, `FREE_ITEM`, `GIFT_WITH_ORDER`.
- **ID formats**: discountId dạng `DISC_001`, promotionId dạng `PROMO_001`.
- **Tài khoản test**: manager `manager01/Man@123`; employee `nhanvien01/123456` (EMP-007) hoặc `parttime01/123456` (EMP-013).
