# Payment Service - Postman Test Guide

> **Base URL (qua Gateway):** `http://localhost:3000`  
> **Base URL (trực tiếp):** `http://localhost:3004`  
> **Content-Type:** `application/json`  
> **⚠️ Tất cả route đều yêu cầu:** `Authorization: Bearer {{accessToken}}`

---

## Luồng thanh toán

```
1. Tạo Order (order-service)
       ↓ [RabbitMQ: order.created]
2. Payment record tự động được tạo (PENDING)
       ↓
3. Tạo Payment Session (ACTIVE, hết hạn sau 30 phút)
       ↓
4. Xử lý Transaction (gắn payment method + amount)
       ↓
5. Payment status → PARTIAL (nếu chưa đủ) | COMPLETED (nếu đủ)
```

---

## 1. PAYMENT METHODS (Phương thức thanh toán)

> ⚠️ **Phải tạo payment method TRƯỚC khi xử lý transaction**

### 1.1 Lấy tất cả payment methods *(chỉ cần token)*

```
GET {{base}}/api/payments/methods
```

### 1.2 Tạo payment method *(ADMIN/MANAGER)*

```
POST {{base}}/api/payments/methods
```

**Body (tạo lần lượt):**
```json
{
  "methodCode": "CASH",
  "methodName": "Tiền mặt",
  "description": "Thanh toán tiền mặt tại quầy"
}
```
```json
{
  "methodCode": "MOMO",
  "methodName": "Ví MoMo",
  "description": "Thanh toán qua ví MoMo"
}
```
```json
{
  "methodCode": "VNPAY",
  "methodName": "VNPay",
  "description": "Thanh toán qua VNPay"
}
```
```json
{
  "methodCode": "BANK_TRANSFER",
  "methodName": "Chuyển khoản ngân hàng",
  "description": "Chuyển khoản qua tài khoản ngân hàng"
}
```

> 💡 Lưu lại `payment_method_id` của phương thức CASH để dùng ở bước xử lý transaction.

---

## 2. PAYMENTS (Hồ sơ thanh toán)

> 💡 Payment record được **tự động tạo** khi order được tạo (qua RabbitMQ).  
> Bạn cần tạo order ở order-service trước, sau đó mới có payment record ở đây.

### 2.1 Lấy tất cả payments *(ADMIN/MANAGER/CASHIER)*

```
GET {{base}}/api/payments
```

**Query params:**
```
GET {{base}}/api/payments?page=1&limit=10&status=PENDING
GET {{base}}/api/payments?status=COMPLETED
```

### 2.2 Lấy payment theo payment ID

```
GET {{base}}/api/payments/{{paymentId}}
```

### 2.3 Lấy payment theo order ID *(tiện dùng nhất)*

```
GET {{base}}/api/payments/order/{{orderId}}
```

> 💡 Nếu bạn đã tạo order và biết `orderId`, dùng endpoint này để tìm `paymentId` và xem `total_amount`.

---

## 3. PAYMENT SESSIONS (Phiên thanh toán)

### 3.1 Tạo payment session *(ADMIN/MANAGER/CASHIER)*

```
POST {{base}}/api/payments/{{paymentId}}/sessions
```

**Body:**
```json
{
  "deviceInfo": "Quầy thu ngân 1",
  "note": "Thanh toán cho đơn hàng bàn 5"
}
```

Kết quả:
```json
{
  "data": {
    "payment_session_id": "uuid-string",
    "session_code": "SS-XXXXXX-YYYYYY",
    "session_status": "ACTIVE",
    "expired_at": "...",
    "initiated_by": "admin01"
  }
}
```

> 💡 Lưu lại `payment_session_id` để xử lý transaction.  
> ⚠️ Session hết hạn sau **30 phút**, cần xử lý transaction trong thời gian này.

---

## 4. TRANSACTIONS (Giao dịch)

### 4.1 Xử lý transaction — Thanh toán đủ 1 lần

```
POST {{base}}/api/payments/sessions/{{sessionId}}/transactions
```

**Body (thanh toán đủ):**
```json
{
  "paymentMethodId": "{{paymentMethodId_CASH}}",
  "amount": 50000
}
```
> Nhớ dùng `amount` = `total_amount` của payment để thanh toán đủ → status = `COMPLETED`

**Body (thanh toán một phần - partial):**
```json
{
  "paymentMethodId": "{{paymentMethodId_CASH}}",
  "amount": 25000
}
```
> Nếu `amount` < `total_amount` → status = `PARTIAL` (chưa đủ tiền)

### 4.2 Thanh toán phần còn lại (sau partial payment)

```
POST {{base}}/api/payments/sessions/{{sessionId}}/transactions
```

```json
{
  "paymentMethodId": "{{paymentMethodId_MOMO}}",
  "amount": 25000
}
```
> Lần 2 thanh toán đủ → status = `COMPLETED`, session tự động `COMPLETED`

---

## 5. KỊCH BẢN TEST ĐẦY ĐỦ

### Kịch bản 1: Thanh toán tiền mặt đủ 1 lần

| # | Action | Endpoint | Ghi chú |
|---|--------|----------|---------|
| 1 | Tạo payment methods | POST /api/payments/methods | CASH, MOMO, VNPAY |
| 2 | Tạo order | (order-service) POST /api/orders | Lưu `orderId` |
| 3 | Tìm payment | GET /api/payments/order/{{orderId}} | Lưu `paymentId`, `total_amount` |
| 4 | Tạo session | POST /api/payments/{{paymentId}}/sessions | Lưu `sessionId` |
| 5 | Thanh toán đủ | POST /api/payments/sessions/{{sessionId}}/transactions | amount = total_amount |
| 6 | Verify | GET /api/payments/{{paymentId}} | payment_status = COMPLETED |

---

### Kịch bản 2: Thanh toán chia đôi (2 phương thức)

| # | Action | Endpoint | Ghi chú |
|---|--------|----------|---------|
| 1 | Tạo order mới | (order-service) POST /api/orders | |
| 2 | Tìm payment | GET /api/payments/order/{{orderId}} | |
| 3 | Tạo session | POST /api/payments/{{paymentId}}/sessions | |
| 4 | Thanh toán một nửa | POST /api/payments/sessions/{{sessionId}}/transactions | amount = total/2 |
| 5 | Verify PARTIAL | GET /api/payments/{{paymentId}} | payment_status = PARTIAL |
| 6 | Thanh toán nửa còn lại | POST /api/payments/sessions/{{sessionId}}/transactions | amount = remaining_amount |
| 7 | Verify COMPLETED | GET /api/payments/{{paymentId}} | payment_status = COMPLETED |

---

## 6. ERROR CASES

| Test Case | Expected |
|-----------|----------|
| Tạo transaction với session hết hạn | 400 - Session has expired |
| Tạo transaction với session không ACTIVE | 400 - Session is not active |
| Tạo session cho payment COMPLETED | 400 - Payment already completed |
| Thiếu `paymentMethodId` hoặc `amount` | 400 - Payment method and amount are required |
| Lấy payment không tồn tại | 404 - Payment not found |
| Tạo payment method thiếu `methodCode` | 400 - Method code and name are required |
