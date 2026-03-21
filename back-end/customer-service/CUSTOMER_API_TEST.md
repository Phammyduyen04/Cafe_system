# Customer Service — Kịch bản test Postman

**Base URL:** `http://localhost:3000`

---

## Chuẩn bị — Lấy token MANAGER & STAFF

**POST** `{{base_url}}/api/auth/login`
```json
{ "username": "manager01", "password": "manager01" }
```
Lưu `manager_token`

**POST** `{{base_url}}/api/auth/login`
```json
{ "username": "staff01", "password": "staff01" }
```
Lưu `staff_token`

---

## LUỒNG 1 — CUSTOMER tự đăng ký và quản lý tài khoản

### Bước 1: Đăng ký tài khoản
**POST** `{{base_url}}/api/auth/register`
```json
{
  "username": "customer01",
  "password": "customer01",
  "fullName": "Nguyen Van A",
  "email": "nguyenvana@gmail.com"
}
```
✅ `201` — tài khoản tạo thành công, customer profile tự động tạo, role CUSTOMER tự động gán
Lưu `account_id_1` = `response.data.accountId`

### Bước 2: Đăng nhập
**POST** `{{base_url}}/api/auth/login`
```json
{ "username": "customer_test_01", "password": "customer_test_01" }
```
✅ `200` — `roles: ["CUSTOMER"]`
Lưu `customer_token`

### Bước 3: Xác nhận customer profile đã được tạo tự động
**GET** `{{base_url}}/api/customers/by-account/{{account_id_1}}`
Header: `Authorization: Bearer {{customer_token}}`
✅ `200` — customer profile với `account_id` = `{{account_id_1}}`
Lưu `customer_id_1` = `response.data.customer_id`

### Bước 4: CUSTOMER cập nhật thông tin cá nhân
**PUT** `{{base_url}}/api/customers/me`
Header: `Authorization: Bearer {{customer_token}}`
```json
{
  "fullName": "Nguyen Van A (Updated)",
  "phoneNumber": "0909999888"
}
```
✅ `200` — thông tin cập nhật thành công

### Bước 5: Kiểm tra MANAGER không được cập nhật
**PUT** `{{base_url}}/api/customers/me`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "fullName": "Test" }
```
✅ `403` — Forbidden

---

## LUỒNG 2 — Tích điểm & Tự động nâng/hạ cấp VIP

### Bước 1: MANAGER cộng điểm lần 1
**POST** `{{base_url}}/api/customers/{{customer_id_1}}/points/adjust`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "points": 100, "reason": "Bonus khai truong" }
```
✅ `200` — `{ previousPoints: 0, newPoints: 100 }`

### Bước 2: MANAGER cộng điểm lần 2 → tự động lên VIP
```json
{ "points": 100, "reason": "Bonus them" }
```
✅ `200` — `{ previousPoints: 100, newPoints: 200 }`

### Bước 3: Kiểm tra đã lên VIP
**GET** `{{base_url}}/api/customers/{{customer_id_1}}`
Header: `Authorization: Bearer {{customer_token}}`
✅ `200` — `customer_type: "VIP"`, `points: 200`

### Bước 4: STAFF đổi điểm → tự động hạ về REGULAR
**POST** `{{base_url}}/api/customers/{{customer_id_1}}/points/redeem`
Header: `Authorization: Bearer {{staff_token}}`
```json
{ "points": 60, "reason": "Doi diem tang qua" }
```
✅ `200` — `{ previousPoints: 200, newPoints: 140, changed: -60 }`

### Bước 5: Kiểm tra đã hạ về REGULAR
**GET** `{{base_url}}/api/customers/{{customer_id_1}}`
Header: `Authorization: Bearer {{customer_token}}`
✅ `200` — `customer_type: "REGULAR"` (140 < 200 → hạ cấp)

### Bước 6: Xem lịch sử điểm
**GET** `{{base_url}}/api/customers/{{customer_id_1}}/point-logs`
Header: `Authorization: Bearer {{customer_token}}`
✅ `200` — 3 bản ghi (2 ADJUST + 1 REDEEM)

---

## LUỒNG 3 — Tạo customer walk-in (không có tài khoản)

### Bước 1: MANAGER tạo customer walk-in
**POST** `{{base_url}}/api/customers`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "fullName": "Khach Vang Lai", "phoneNumber": "0908888777" }
```
✅ `201` — `customer_type: "REGULAR"`, `account_id: null`
Lưu `customer_id_walkin`

### Bước 2: Xem danh sách customers
**GET** `{{base_url}}/api/customers?page=1&limit=10`
Header: `Authorization: Bearer {{manager_token}}`
✅ `200` — danh sách + pagination

---

## LUỒNG 4 — CUSTOMER tự xóa tài khoản

### Bước 1: Xóa không có confirm → lỗi
**DELETE** `{{base_url}}/api/customers/me`
Header: `Authorization: Bearer {{customer_token}}`
```json
{}
```
✅ `400` — yêu cầu xác nhận

### Bước 2: Xóa thành công
```json
{ "confirm": true }
```
✅ `200` — `customer_status` và `account_status` đều → "INACTIVE"

### Bước 3: Đăng nhập lại thất bại
**POST** `{{base_url}}/api/auth/login`
```json
{ "username": "customer_test_01", "password": "customer_test_01" }
```
✅ `403` — "Account is not active"

---

## Tóm tắt quyền hạn

| Chức năng | MANAGER | STAFF | CUSTOMER |
|---|:---:|:---:|:---:|
| Đăng ký tài khoản | ❌ | ❌ | ✅ (tự đăng ký) |
| Tạo customer walk-in | ✅ | ✅ | ✅ |
| Xem danh sách customers | ✅ | ✅ | ❌ |
| Xem chi tiết customer | ✅ | ✅ | ✅ |
| Cập nhật thông tin cá nhân | ❌ | ❌ | ✅ (`PUT /me`) |
| Nâng/hạ cấp VIP | Tự động | Tự động | Tự động |
| Cộng/trừ điểm thủ công | ✅ | ❌ | ❌ |
| Đổi điểm (redeem) | ✅ | ✅ | ✅ |
| Xóa tài khoản | ❌ | ❌ | ✅ (`DELETE /me` + confirm) |
