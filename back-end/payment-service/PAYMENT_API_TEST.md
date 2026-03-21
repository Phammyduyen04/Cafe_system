# Payment Service - Postman Test Guide

> **Base URL (qua Gateway):** `http://localhost:3000`
> **Base URL (trực tiếp):** `http://localhost:3004`
> **Content-Type:** `application/json`
> **Tất cả route yêu cầu:** `Authorization: Bearer {{accessToken}}` (trừ MoMo IPN)

---

## Tổng quan luồng thanh toán

```
         Client tạo Order (kèm paymentMethod)
                      ↓
         order-service lưu đơn hàng
                      ↓
         order-service gọi HTTP → payment-service /initiate
                      ↓
    ┌─────────────────┼─────────────────┐
    ↓                 ↓                 ↓
  CASH              MOMO               QR
    ↓                 ↓                 ↓
 Payment          Gọi MoMo API    Tạo VietQR URL
 PENDING          trả về payUrl    trả về qrUrl
    ↓                 ↓                 ↓
 Nhân viên        Khách mở link    Khách quét QR
 thu tiền →       thanh toán →     chuyển khoản →
 cash-confirm     MoMo IPN tự     NV xác nhận →
    ↓             động callback    qr-confirm
    ↓                 ↓                 ↓
 COMPLETED        COMPLETED        COMPLETED
```

**3 phương thức thanh toán:**

| Phương thức | Giá trị `paymentMethod` | Xác nhận bởi |
|---|---|---|
| Tiền mặt | `CASH` | Nhân viên gọi `cash-confirm` |
| Ví MoMo | `MOMO` | Tự động qua MoMo IPN callback |
| Chuyển khoản QR | `QR` | Nhân viên gọi `qr-confirm` |

---

## 0. CHUẨN BỊ TRƯỚC KHI TEST

### 0.1 Tạo Payment Methods (chỉ cần làm 1 lần)

> ADMIN/MANAGER mới được tạo payment method

```
POST {{base}}/api/payments/methods
```

Tạo lần lượt 3 method:

```json
{ "methodCode": "CASH", "methodName": "Tiền mặt", "description": "Thanh toán tiền mặt tại quầy" }
```
```json
{ "methodCode": "MOMO", "methodName": "Ví MoMo", "description": "Thanh toán qua ví MoMo" }
```
```json
{ "methodCode": "BANK_TRANSFER", "methodName": "Chuyển khoản QR", "description": "Chuyển khoản qua mã QR ngân hàng" }
```

> Lưu lại các `payment_method_id` trả về.

### 0.2 Kiểm tra payment methods đã tạo

```
GET {{base}}/api/payments/methods
```

---

## 1. KỊCH BẢN 1: THANH TOÁN TIỀN MẶT (CASH)

> Dùng cho đơn tại quầy (IN_STORE). Nhân viên thu tiền mặt rồi xác nhận.

### Bước 1: Tạo đơn hàng tại quầy (order-service)

```
POST {{base}}/api/orders
```

```json
{
  "orderType": "DINE_IN",
  "orderChannel": "IN_STORE",
  "paymentMethod": "CASH",
  "items": [
    {
      "productId": "prod-001",
      "productName": "Cà phê sữa đá",
      "unitPrice": 35000,
      "quantity": 2
    }
  ],
  "note": "Bàn 5"
}
```

**Response chú ý:**
```json
{
  "data": {
    "order_id": "{{orderId}}",
    "order_code": "ORD-XXXXXX",
    "payment_method": "CASH",
    "total_amount": 70000,
    "paymentInfo": {
      "payment": {
        "payment_id": "{{paymentId}}",
        "payment_status": "PENDING",
        "payment_method": "CASH"
      }
    }
  }
}
```

> Lưu lại `paymentId` từ `paymentInfo.payment.payment_id`

### Bước 2: Xem chi tiết payment

```
GET {{base}}/api/payments/{{paymentId}}
```

> Kiểm tra: `payment_status = "PENDING"`, `total_amount = 70000`

### Bước 3: Nhân viên xác nhận thu tiền mặt

```
POST {{base}}/api/payments/{{paymentId}}/cash-confirm
```

```json
{
  "amountReceived": 100000,
  "change": 30000
}
```

| Field | Ý nghĩa |
|---|---|
| `amountReceived` | Số tiền khách đưa |
| `change` | Tiền thừa trả lại (phải = amountReceived - total_amount) |

**Response:**
```json
{
  "message": "Cash payment confirmed",
  "data": {
    "payment_status": "COMPLETED",
    "paid_amount": 70000,
    "remaining_amount": 0
  }
}
```

### Bước 4: Verify kết quả

```
GET {{base}}/api/payments/{{paymentId}}
```

> Kiểm tra:
> - `payment_status` = `COMPLETED`
> - `paid_amount` = `70000`
> - `remaining_amount` = `0`
> - `sessions[0].transactions[0].note` = `"Thu: 100000 | Thoi: 30000"`

---

## 2. KỊCH BẢN 2: THANH TOÁN MOMO

> Dùng cho cả online và tại quầy. MoMo tự động xác nhận qua IPN callback.

### Yêu cầu trước khi test MoMo

1. **Bật ngrok** (MoMo cần URL công khai để gửi IPN):
   ```bash
   ngrok http 3004
   ```
2. **Cập nhật `.env`** với URL ngrok:
   ```
   MOMO_IPN_URL=https://xxxx.ngrok-free.app/api/payments/momo/ipn
   MOMO_REDIRECT_URL=https://xxxx.ngrok-free.app/payment/result
   ```
3. **Restart payment-service**

### Bước 1: Tạo đơn hàng với MoMo (order-service)

```
POST {{base}}/api/orders
```

```json
{
  "orderType": "TAKE_AWAY",
  "orderChannel": "IN_STORE",
  "paymentMethod": "MOMO",
  "items": [
    {
      "productId": "prod-001",
      "productName": "Trà sữa trân châu",
      "unitPrice": 45000,
      "quantity": 1
    }
  ]
}
```

**Response chú ý:**
```json
{
  "data": {
    "order_id": "{{orderId}}",
    "total_amount": 45000,
    "payment_method": "MOMO",
    "paymentInfo": {
      "payment": {
        "payment_id": "{{paymentId}}",
        "payment_status": "PENDING",
        "payment_method": "MOMO",
        "payment_url": "https://test-payment.momo.vn/...",
        "provider_order_id": "MOMO-XXXXXX-YYYYYY"
      },
      "payUrl": "https://test-payment.momo.vn/...",
      "deeplink": "momo://...",
      "qrCodeUrl": "https://test-payment.momo.vn/..."
    }
  }
}
```

> Lưu lại:
> - `paymentId` = `paymentInfo.payment.payment_id`
> - `payUrl` = URL thanh toán MoMo (mở trên trình duyệt)

### Bước 2: Khách thanh toán trên MoMo

1. Mở `payUrl` trên trình duyệt
2. Trang MoMo test hiển thị → quét bằng app MoMo
3. Xác nhận thanh toán trên app MoMo

> Sau khi thanh toán xong, MoMo tự động gọi IPN về:
> `POST {{ngrokUrl}}/api/payments/momo/ipn`
> Payment-service nhận callback → verify chữ ký → cập nhật `COMPLETED`

### Bước 3: Verify kết quả

```
GET {{base}}/api/payments/{{paymentId}}
```

> Kiểm tra:
> - `payment_status` = `COMPLETED`
> - `paid_amount` = `45000`
> - `sessions[0].transactions[0].gateway_response` chứa MoMo `transId`

### (Tùy chọn) Test MoMo IPN thủ công bằng Postman

> Nếu không muốn thanh toán qua app MoMo, bạn có thể giả lập IPN callback:

```
POST {{base}}/api/payments/momo/ipn
```

> Endpoint này **KHÔNG cần Authorization header** (public endpoint).

```json
{
  "partnerCode": "MOMO",
  "orderId": "{{provider_order_id}}",
  "requestId": "{{provider_order_id}}",
  "amount": 45000,
  "orderInfo": "Thanh toan don hang ORD-XXXXXX",
  "orderType": "momo_wallet",
  "transId": 123456789,
  "resultCode": 0,
  "message": "Successful.",
  "payType": "qr",
  "responseTime": 1700000000000,
  "extraData": "",
  "signature": "{{tính_bằng_hmac_sha256}}"
}
```

> Lưu ý: `signature` phải được tính đúng bằng HMAC-SHA256 với `secretKey`.
> Nếu chỉ test flow, có thể tạm comment dòng `verifyMomoCallback` trong `payment.service.js`.

---

## 3. KỊCH BẢN 3: THANH TOÁN CHUYỂN KHOẢN QR

> Dùng cho cả online và tại quầy. Hệ thống tạo mã QR VietQR, khách quét để chuyển khoản, nhân viên xác nhận.

### Bước 1: Tạo đơn hàng với QR (order-service)

```
POST {{base}}/api/orders
```

```json
{
  "orderType": "TAKE_AWAY",
  "orderChannel": "IN_STORE",
  "paymentMethod": "QR",
  "items": [
    {
      "productId": "prod-002",
      "productName": "Matcha Latte",
      "unitPrice": 55000,
      "quantity": 1
    }
  ]
}
```

**Response chú ý:**
```json
{
  "data": {
    "order_id": "{{orderId}}",
    "total_amount": 55000,
    "payment_method": "QR",
    "paymentInfo": {
      "payment": {
        "payment_id": "{{paymentId}}",
        "payment_status": "PENDING",
        "payment_method": "QR",
        "payment_url": "https://img.vietqr.io/image/MB-0123456789-compact2.jpg?amount=55000&addInfo=..."
      },
      "qrUrl": "https://img.vietqr.io/image/MB-0123456789-compact2.jpg?amount=55000&addInfo=..."
    }
  }
}
```

> Lưu lại:
> - `paymentId` = `paymentInfo.payment.payment_id`
> - `qrUrl` = URL ảnh QR (mở trên trình duyệt hoặc hiển thị cho khách quét)

### Bước 2: Khách quét mã QR

1. Mở `qrUrl` trên trình duyệt → hiển thị ảnh mã QR
2. Khách mở app ngân hàng → quét mã QR
3. App ngân hàng tự điền: số tài khoản, số tiền, nội dung chuyển khoản
4. Khách xác nhận chuyển khoản

> Khi test, **không cần chuyển tiền thật** — chỉ cần kiểm tra QR hiển thị đúng thông tin rồi bỏ qua bước chuyển khoản.

### Bước 3: Nhân viên xác nhận đã nhận chuyển khoản

> Nhân viên kiểm tra app ngân hàng, thấy tiền về → bấm xác nhận.

```
POST {{base}}/api/payments/{{paymentId}}/qr-confirm
```

> Không cần body. Chỉ cần token của nhân viên (ADMIN/MANAGER/STAFF).

**Response:**
```json
{
  "message": "QR payment confirmed",
  "data": {
    "payment_status": "COMPLETED",
    "paid_amount": 55000,
    "remaining_amount": 0
  }
}
```

### Bước 4: Verify kết quả

```
GET {{base}}/api/payments/{{paymentId}}
```

> Kiểm tra:
> - `payment_status` = `COMPLETED`
> - `paid_amount` = `55000`
> - `sessions[0].transactions[0].note` chứa tên nhân viên xác nhận

---

## 4. CHECKOUT TỪ GIỎ HÀNG (Khách hàng online)

> Khách hàng online đặt đơn từ giỏ hàng, chọn phương thức thanh toán.

### Bước 1: Thêm sản phẩm vào giỏ hàng (order-service)

```
POST {{base}}/api/orders/cart/items
```

```json
{
  "productId": "prod-001",
  "productName": "Cà phê sữa đá",
  "unitPrice": 35000,
  "quantity": 2
}
```

### Bước 2: Checkout với phương thức thanh toán

```
POST {{base}}/api/orders/checkout
```

```json
{
  "orderType": "TAKE_AWAY",
  "paymentMethod": "MOMO",
  "note": "Giao nhanh"
}
```

> `paymentMethod` có thể là `"CASH"`, `"MOMO"`, hoặc `"QR"`.
> Response giống kịch bản tương ứng ở trên (có `paymentInfo.payUrl` nếu MOMO, `paymentInfo.qrUrl` nếu QR).

### Bước 3: Hoàn tất thanh toán

- Nếu `MOMO`: khách mở `payUrl` thanh toán → tự động `COMPLETED`
- Nếu `QR`: khách quét `qrUrl` chuyển khoản → nhân viên gọi `qr-confirm`
- Nếu `CASH`: nhân viên thu tiền → gọi `cash-confirm`

---

## 5. API THAM KHẢO

### Payments

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/payments` | ADMIN/MANAGER/STAFF | Danh sách payments (hỗ trợ `?page=&limit=&status=`) |
| GET | `/api/payments/:id` | Token | Chi tiết payment theo ID |
| GET | `/api/payments/order/:orderId` | Token | Tìm payment theo order ID |
| POST | `/api/payments/initiate` | Token | Khởi tạo payment (gọi từ order-service) |
| POST | `/api/payments/:id/cash-confirm` | ADMIN/MANAGER/STAFF | Xác nhận thu tiền mặt |
| POST | `/api/payments/:id/qr-confirm` | ADMIN/MANAGER/STAFF | Xác nhận nhận chuyển khoản QR |
| POST | `/api/payments/momo/ipn` | Không cần | MoMo IPN callback (public) |

### Payment Methods

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/payments/methods` | Token | Danh sách phương thức thanh toán |
| POST | `/api/payments/methods` | ADMIN/MANAGER | Tạo phương thức thanh toán mới |

---

## 6. ERROR CASES

| Test Case | Expected |
|---|---|
| `cash-confirm` nhưng payment không phải CASH | 400 - This payment is not a cash payment |
| `cash-confirm` với `amountReceived` < `total_amount` | 400 - Amount received is less than total amount |
| `cash-confirm` với `change` sai | 400 - Change should be ... |
| `cash-confirm` cho payment đã COMPLETED | 400 - Payment already completed |
| `qr-confirm` nhưng payment không phải QR | 400 - This payment is not a QR payment |
| `qr-confirm` cho payment đã COMPLETED | 400 - Payment already completed |
| MoMo IPN với chữ ký sai | 400 - Invalid MoMo signature |
| Tạo đơn với MOMO nhưng MoMo API lỗi | 400 - MoMo: ... |
| CASH method chưa tạo trong DB | 500 - CASH payment method not configured |
| BANK_TRANSFER method chưa tạo trong DB | 500 - BANK_TRANSFER payment method not configured |
| Lấy payment không tồn tại | 404 - Payment not found |
| Tạo payment method thiếu `methodCode` | 400 - Method code and name are required |

---

## 7. CẤU HÌNH MÔI TRƯỜNG (.env)

```env
# MoMo Test Sandbox
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=https://xxxx.ngrok-free.app/api/payments/momo/ipn
MOMO_REDIRECT_URL=https://xxxx.ngrok-free.app/payment/result

# VietQR
VIETQR_BANK_ID=MB
VIETQR_ACCOUNT_NUMBER=0123456789
VIETQR_ACCOUNT_NAME=NGUYEN VAN A
```

> MoMo IPN cần URL công khai → dùng `ngrok http 3004` rồi cập nhật `MOMO_IPN_URL`.
> VietQR không cần API key. Thay thông tin ngân hàng bằng tài khoản thật của quán.
