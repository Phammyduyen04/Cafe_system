# Order Service - Postman Test Guide

> **Base URL (qua Gateway):** `http://localhost:3000`  
> **Base URL (trực tiếp):** `http://localhost:3003`  
> **Content-Type:** `application/json`  
> **⚠️ Tất cả route đều yêu cầu:** `Authorization: Bearer {{accessToken}}`

---

## Luồng trạng thái đơn hàng

```
PENDING → CONFIRMED → PREPARING → READY → COMPLETED
         ↘            ↘           ↘        ↘
          CANCELLED    CANCELLED   CANCELLED  CANCELLED
```

---

## 1. TẠO ĐƠN HÀNG

### 1.1 Tạo đơn hàng cơ bản *(ADMIN/MANAGER/CASHIER)*

```
POST {{base}}/api/orders
```

**Body (tối thiểu):**
```json
{
  "orderType": "DINE_IN",
  "items": [
    {
      "productId": "PROD-001",
      "productName": "Cà phê đen",
      "unitPrice": 25000,
      "quantity": 2
    }
  ]
}
```

**Body (đầy đủ - có topping, discount, customer):**
```json
{
  "customerId": "{{customerId}}",
  "orderType": "TAKE_AWAY",
  "note": "Ít đường",
  "items": [
    {
      "productId": "PROD-001",
      "productName": "Cà phê đen",
      "unitPrice": 25000,
      "quantity": 2,
      "itemNote": "Không đường",
      "toppings": [
        {
          "toppingName": "Thêm đá",
          "toppingPrice": 5000,
          "quantity": 1
        }
      ]
    },
    {
      "productId": "PROD-002",
      "productName": "Bạc xỉu",
      "unitPrice": 35000,
      "quantity": 1
    }
  ],
  "discounts": [
    {
      "discountId": "DISC-001",
      "discountName": "Giảm 10%",
      "discountType": "PERCENT",
      "discountValue": 10,
      "appliedAmount": 9000
    }
  ]
}
```

> 💡 `order_code` và `order_id` sẽ được tự động tạo.  
> 💡 Sau khi tạo order, **payment-service sẽ tự động tạo payment record** qua RabbitMQ event `order.created`.

### 1.2 Tạo TAKE_AWAY order

```json
{
  "orderType": "TAKE_AWAY",
  "items": [
    {
      "productId": "PROD-002",
      "productName": "Bạc xỉu",
      "unitPrice": 35000,
      "quantity": 3
    }
  ]
}
```

---

## 2. XEM ĐƠN HÀNG

### 2.1 Lấy tất cả đơn hàng

```
GET {{base}}/api/orders
```

**Query params tùy chọn:**
```
GET {{base}}/api/orders?page=1&limit=10&status=PENDING
GET {{base}}/api/orders?customerId={{customerId}}
```

### 2.2 Lấy đơn hàng theo ID

```
GET {{base}}/api/orders/{{orderId}}
```

### 2.3 Xem lịch sử trạng thái đơn hàng

```
GET {{base}}/api/orders/{{orderId}}/status-logs
```

---

## 3. CẬP NHẬT TRẠNG THÁI

> *(ADMIN/MANAGER/CASHIER/BARISTA)*

### 3.1 Xác nhận đơn hàng (PENDING → CONFIRMED)

```
PUT {{base}}/api/orders/{{orderId}}/status
```

**Body:**
```json
{
  "status": "CONFIRMED",
  "note": "Đã xác nhận đơn"
}
```

### 3.2 Bắt đầu pha chế (CONFIRMED → PREPARING)

```json
{
  "status": "PREPARING",
  "note": "Đang pha chế"
}
```

### 3.3 Sẵn sàng (PREPARING → READY)

```json
{
  "status": "READY",
  "note": "Đồ uống đã sẵn sàng"
}
```

### 3.4 Hoàn thành (READY → COMPLETED)

```json
{
  "status": "COMPLETED",
  "note": "Khách đã nhận hàng"
}
```

> 💡 Khi status = COMPLETED, **customer-service sẽ tự động cộng điểm** cho khách qua RabbitMQ event `order.completed`.

### 3.5 Huỷ đơn hàng (bất kỳ → CANCELLED)

```json
{
  "status": "CANCELLED",
  "note": "Khách huỷ đơn"
}
```

### 3.6 Test transition không hợp lệ (phải báo lỗi)

```json
{
  "status": "COMPLETED",
  "note": "Thử nhảy từ PENDING → COMPLETED"
}
```
> Kết quả mong đợi: `400 Cannot transition from PENDING to COMPLETED`

---

## 4. THỨ TỰ TEST ĐỀ XUẤT

| # | Action | Endpoint | Ghi chú |
|---|--------|----------|---------|
| 1 | Tạo đơn DINE_IN | POST /api/orders | Lưu `orderId` |
| 2 | Lấy danh sách | GET /api/orders | Verify có 1 order PENDING |
| 3 | Lấy chi tiết | GET /api/orders/{{orderId}} | Verify items đúng |
| 4 | Xem status logs | GET /api/orders/{{orderId}}/status-logs | Verify log PENDING |
| 5 | Confirm | PUT /api/orders/{{orderId}}/status | status: CONFIRMED |
| 6 | Preparing | PUT /api/orders/{{orderId}}/status | status: PREPARING |
| 7 | Ready | PUT /api/orders/{{orderId}}/status | status: READY |
| 8 | Complete | PUT /api/orders/{{orderId}}/status | status: COMPLETED |
| 9 | Xem status logs | GET /api/orders/{{orderId}}/status-logs | Verify toàn bộ history |
| 10 | Test invalid | PUT /api/orders/{{orderId}}/status | status: CONFIRMED → phải lỗi |
| 11 | Tạo order thứ 2 | POST /api/orders | Để test cancel |
| 12 | Cancel | PUT /api/orders/{{orderId2}}/status | status: CANCELLED |
