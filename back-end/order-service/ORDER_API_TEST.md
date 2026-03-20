# ORDER SERVICE - API TEST (Postman)

**Base URL (qua Gateway):** `http://localhost:3000`
**Base URL (trực tiếp):** `http://localhost:3003`
**Auth:** Bearer Token (JWT) trong header `Authorization`

> ⚠️ **Trước khi test:** Cần có sẵn `productId` và `toppingId` hợp lệ từ product-service.

---

## 1. KHÁCH HÀNG - ĐẶT ĐƠN ONLINE

### 1.1 Xem giỏ hàng

```
GET {{base}}/api/orders/cart
Authorization: Bearer <customer_token>
```

---

### 1.2 Thêm món vào giỏ hàng (có topping)

> Hệ thống tự lấy `productName` và `unitPrice` từ product-service.
> Topping chỉ cần `toppingId` và `quantity` — giá được lấy tự động.

```
POST {{base}}/api/orders/cart/items
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "PROD-003",
  "size": "L",
  "sugarLevel": "75%",
  "iceLevel": "50%",
  "quantity": 2,
  "itemNote": "Ít đá hơn chút",
  "toppings": [
    { "toppingId": "TOP-XXXXXXXX", "quantity": 1 },
    { "toppingId": "TOP-YYYYYYYY", "quantity": 2 }
  ]
}
```

> Thay `TOP-XXXXXXXX` bằng `toppingId` thực từ bước tạo topping trong product-service.

---

### 1.3 Thêm món không có topping

```
POST {{base}}/api/orders/cart/items
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "PROD-001",
  "size": "M",
  "sugarLevel": "50%",
  "iceLevel": "100%",
  "quantity": 1
}
```

> Các trường không truyền sẽ dùng mặc định: `sugarLevel = 100%`, `iceLevel = 100%`, `quantity = 1`

---

### 1.4 Cập nhật số lượng món trong giỏ

> `itemId` lấy từ response của GET cart (`cart_item_id`)

```
PUT {{base}}/api/orders/cart/items/:itemId
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Chỉ đổi số lượng:**
```json
{
  "quantity": 3
}
```

**Đổi nhiều thuộc tính cùng lúc:**
```json
{
  "quantity": 2,
  "size": "M",
  "sugarLevel": "25%",
  "iceLevel": "0%",
  "itemNote": "Không đường"
}
```

**Cập nhật lại topping (thay toàn bộ):**
```json
{
  "toppings": [
    { "toppingId": "TOP-XXXXXXXX", "quantity": 1 }
  ]
}
```

**Xóa hết topping:**
```json
{
  "toppings": []
}
```

---

### 1.5 Xóa một món khỏi giỏ hàng

```
DELETE {{base}}/api/orders/cart/items/:itemId
Authorization: Bearer <customer_token>
```

---

### 1.6 Xóa toàn bộ giỏ hàng

```
DELETE {{base}}/api/orders/cart
Authorization: Bearer <customer_token>
```

---

### 1.7 Đặt đơn từ giỏ hàng (Checkout)

> Tạo đơn hàng ONLINE từ giỏ hàng hiện tại.
> Trạng thái ban đầu: **PENDING**
> Giỏ hàng tự động xóa sau khi đặt thành công.

```
POST {{base}}/api/orders/checkout
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Body cơ bản:**
```json
{
  "orderType": "TAKE_AWAY"
}
```

**Body đầy đủ:**
```json
{
  "orderType": "DINE_IN",
  "note": "Bàn số 3, giao trước 12h"
}
```

**Body có giảm giá:**
```json
{
  "orderType": "TAKE_AWAY",
  "note": "",
  "discounts": [
    {
      "discountId": "DISC-001",
      "discountName": "Giảm 10%",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "appliedAmount": 10600
    }
  ]
}
```

---

### 1.8 Xem danh sách đơn hàng của tôi

```
GET {{base}}/api/orders/my-orders
Authorization: Bearer <customer_token>

# Phân trang
GET {{base}}/api/orders/my-orders?page=1&limit=5
```

---

### 1.9 Hủy đơn hàng *(chỉ khi trạng thái PENDING)*

```
PUT {{base}}/api/orders/my-orders/:orderId/cancel
Authorization: Bearer <customer_token>
```

---

## 2. NHÂN VIÊN - TẠO ĐƠN TẠI QUẦY

> Yêu cầu role: **ADMIN**, **MANAGER**, hoặc **CASHIER**
> Trạng thái ban đầu: **CONFIRMED** (tiếp nhận ngay)

### 2.1 Tạo đơn tại quầy - khách tại quán

```
POST {{base}}/api/orders
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "orderType": "DINE_IN",
  "orderChannel": "IN_STORE",
  "note": "Bàn số 5",
  "items": [
    {
      "productId": "PROD-003",
      "productName": "Trà đào",
      "size": "L",
      "sugarLevel": "75%",
      "iceLevel": "50%",
      "unitPrice": 45000,
      "quantity": 2,
      "toppings": [
        {
          "toppingName": "Trân châu đen",
          "toppingPrice": 5000,
          "quantity": 1
        }
      ]
    },
    {
      "productId": "PROD-001",
      "productName": "Cà phê đen",
      "size": "M",
      "sugarLevel": "100%",
      "iceLevel": "100%",
      "unitPrice": 25000,
      "quantity": 1
    }
  ]
}
```

---

### 2.2 Tạo đơn tại quầy - khách mang đi

```
POST {{base}}/api/orders
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "orderType": "TAKE_AWAY",
  "orderChannel": "IN_STORE",
  "items": [
    {
      "productId": "PROD-002",
      "productName": "Bạc xỉu",
      "size": "L",
      "sugarLevel": "75%",
      "iceLevel": "100%",
      "unitPrice": 35000,
      "quantity": 1
    }
  ]
}
```

---

### 2.3 Tạo đơn tại quầy - có giảm giá

```
POST {{base}}/api/orders
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "orderType": "DINE_IN",
  "orderChannel": "IN_STORE",
  "items": [
    {
      "productId": "PROD-003",
      "productName": "Trà đào",
      "size": "L",
      "sugarLevel": "100%",
      "iceLevel": "50%",
      "unitPrice": 45000,
      "quantity": 3,
      "toppings": [
        {
          "toppingName": "Thạch trái cây",
          "toppingPrice": 6000,
          "quantity": 2
        }
      ]
    }
  ],
  "discounts": [
    {
      "discountId": "DISC-HAPPY",
      "discountName": "Happy Hour -20%",
      "discountType": "PERCENTAGE",
      "discountValue": 20,
      "appliedAmount": 30600
    }
  ]
}
```

---

## 3. NHÂN VIÊN - QUẢN LÝ ĐƠN HÀNG

### 3.1 Xem tất cả đơn hàng

```
GET {{base}}/api/orders
Authorization: Bearer <staff_token>

# Lọc theo trạng thái
GET {{base}}/api/orders?status=PENDING

# Lọc đơn online đang chờ tiếp nhận
GET {{base}}/api/orders?status=PENDING&orderChannel=ONLINE

# Lọc đơn tại quầy
GET {{base}}/api/orders?orderChannel=IN_STORE

# Phân trang
GET {{base}}/api/orders?page=1&limit=20
```

---

### 3.2 Xem chi tiết đơn hàng

```
GET {{base}}/api/orders/:orderId
Authorization: Bearer <staff_token>
```

---

### 3.3 Tiếp nhận đơn online (PENDING → CONFIRMED)

```
PUT {{base}}/api/orders/:orderId/status
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "CONFIRMED",
  "note": "Tiếp nhận đơn online"
}
```

---

### 3.4 Bắt đầu pha chế (CONFIRMED → PREPARING)

```
PUT {{base}}/api/orders/:orderId/status
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "PREPARING"
}
```

---

### 3.5 Đơn đã xong - chờ lấy (PREPARING → READY)

```
PUT {{base}}/api/orders/:orderId/status
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "READY"
}
```

---

### 3.6 Hoàn thành đơn hàng (READY → COMPLETED)

```
PUT {{base}}/api/orders/:orderId/status
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "COMPLETED"
}
```

---

### 3.7 Hủy đơn

```
PUT {{base}}/api/orders/:orderId/status
Authorization: Bearer <staff_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "CANCELLED",
  "note": "Khách yêu cầu hủy"
}
```

---

### 3.8 Xem lịch sử trạng thái đơn hàng

```
GET {{base}}/api/orders/:orderId/status-logs
Authorization: Bearer <staff_token>
```

---

## 4. LUỒNG TRẠNG THÁI ĐƠN HÀNG

```
ONLINE:    PENDING → CONFIRMED → PREPARING → READY → COMPLETED
                ↘        ↘           ↘         ↘
                              CANCELLED

IN_STORE:  CONFIRMED → PREPARING → READY → COMPLETED
                ↘           ↘        ↘
                          CANCELLED
```

---

## 5. CẤU TRÚC ITEM

### 5.1 Cart item (đặt online qua giỏ hàng)

| Field | Type | Bắt buộc | Giá trị hợp lệ |
|-------|------|----------|----------------|
| `productId` | string | ✅ | ID sản phẩm từ product-service |
| `size` | string | ❌ | `M`, `L` — mặc định không có |
| `sugarLevel` | string | ❌ | `0%`, `25%`, `50%`, `75%`, `100%` — mặc định `100%` |
| `iceLevel` | string | ❌ | `0%`, `25%`, `50%`, `75%`, `100%` — mặc định `100%` |
| `quantity` | number | ❌ | 1 – 200 — mặc định `1` |
| `itemNote` | string | ❌ | Ghi chú riêng cho món |
| `toppings[].toppingId` | string | ✅ (nếu có topping) | `toppingId` từ product-service |
| `toppings[].quantity` | number | ❌ | 1 – 200 — mặc định `1` |

> `productName` và `unitPrice` **không cần gửi** — hệ thống tự lấy từ product-service.

---

### 5.2 In-store order item (nhân viên tạo tại quầy)

| Field | Type | Bắt buộc | Giá trị hợp lệ |
|-------|------|----------|----------------|
| `productId` | string | ✅ | ID sản phẩm |
| `productName` | string | ✅ | Tên sản phẩm |
| `unitPrice` | number | ✅ | Đơn giá (VND) |
| `size` | string | ❌ | `M`, `L` |
| `sugarLevel` | string | ❌ | `0%`, `25%`, `50%`, `75%`, `100%` |
| `iceLevel` | string | ❌ | `0%`, `25%`, `50%`, `75%`, `100%` |
| `quantity` | number | ✅ | Số lượng |
| `itemNote` | string | ❌ | Ghi chú |
| `toppings[].toppingName` | string | ✅ (nếu có topping) | Tên topping |
| `toppings[].toppingPrice` | number | ✅ (nếu có topping) | Đơn giá topping |
| `toppings[].quantity` | number | ❌ | Mặc định `1` |

---

## 6. THỨ TỰ TEST ĐỀ XUẤT (Online flow)

| # | Action | Mô tả |
|---|--------|-------|
| 1 | Đăng nhập customer | Lấy `customer_token` |
| 2 | Tạo sản phẩm & topping | Dùng ADMIN token, lưu `productId` và `toppingId` |
| 3 | Xem giỏ hàng | Giỏ trống ban đầu |
| 4 | Thêm món có topping | POST /cart/items với `toppingId` hợp lệ |
| 5 | Thêm món không topping | POST /cart/items |
| 6 | Xem giỏ hàng | Xác nhận 2 món |
| 7 | Cập nhật số lượng | PUT /cart/items/:itemId |
| 8 | Checkout | POST /checkout → nhận `orderId`, status = PENDING |
| 9 | Xem đơn của tôi | GET /my-orders |
| 10 | Nhân viên tiếp nhận | PUT /orders/:orderId/status → CONFIRMED |
| 11 | Bắt đầu pha chế | PUT → PREPARING |
| 12 | Xong pha chế | PUT → READY |
| 13 | Hoàn thành | PUT → COMPLETED |

---

## 7. HEALTH CHECK

```
GET {{base}}/api/health
```