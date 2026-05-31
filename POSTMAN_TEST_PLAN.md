# Kế Hoạch Kiểm Thử Postman - Cafe System

## Thông Tin Chung

| Mục | Thông tin |
|-----|-----------|
| Base URL | `http://localhost:3000` |
| Auth Header | `Authorization: Bearer <token>` |
| Content-Type | `application/json` (trừ upload dùng `multipart/form-data`) |

## Cấu Trúc Response Chuẩn

```json
// Success
{ "success": true, "data": {}, "message": "..." }

// Paginated
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 } }

// Error
{ "success": false, "message": "..." }
```

## Biến Môi Trường Postman (Environment Variables)

```
base_url        = http://localhost:3000
admin_token     = (lấy sau khi login bằng admin)
manager_token   = (lấy sau khi login bằng manager)
staff_token     = (lấy sau khi login bằng staff/employee)
customer_token  = (lấy sau khi login bằng customer)
customer_id     = (lấy sau khi tạo/lấy customer)
product_id      = (lấy sau khi tạo product)
category_id     = (lấy sau khi tạo category)
topping_id      = (lấy sau khi tạo topping)
order_id        = (lấy sau khi tạo order)
payment_id      = (lấy sau khi tạo payment)
employee_id     = (lấy sau khi tạo employee)
shift_id        = (lấy sau khi tạo shift)
promotion_id    = (lấy sau khi tạo promotion)
discount_id     = (lấy sau khi tạo discount)
role_id         = (lấy sau khi tạo role)
account_id      = (lấy sau khi tạo account)
refresh_token   = (lấy sau khi login)
```

---

## 1. AUTH SERVICE (Port 3001 → Gateway: `/api/auth`)

### 1.1 Đăng Ký & Đăng Nhập

#### TC-AUTH-001: Đăng ký tài khoản Customer
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body:**
```json
{
  "username": "customer01",
  "password": "Password123!",
  "email": "customer01@gmail.com",
  "full_name": "Nguyen Van A",
  "user_type": "CUSTOMER",
  "phone_number": "0901111111"
}
```
- **Expected:** `201` - `success: true`, có `data.account_id`
- **Lưu:** `account_id` vào biến môi trường

#### TC-AUTH-002: Đăng ký tài khoản trùng username
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body:** Dùng lại `username: "customer01"` từ TC-AUTH-001
- **Expected:** `400/409` - `success: false`, thông báo trùng username

#### TC-AUTH-003: Đăng nhập thành công (Customer)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
  "username": "customer01",
  "password": "Password123!"
}
```
- **Expected:** `200` - có `data.token` và `data.refreshToken`
- **Lưu:** `customer_token`, `refresh_token`

#### TC-AUTH-004: Đăng nhập thành công (Admin)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
  "username": "admin",
  "password": "<admin_password>"
}
```
- **Expected:** `200` - có `data.token`
- **Lưu:** `admin_token`

#### TC-AUTH-005: Đăng nhập thành công (Manager)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
  "username": "manager01",
  "password": "<manager_password>"
}
```
- **Expected:** `200` - có `data.token`
- **Lưu:** `manager_token`

#### TC-AUTH-006: Đăng nhập sai mật khẩu
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/login`
- **Body:**
```json
{
  "username": "customer01",
  "password": "SaiMatKhau"
}
```
- **Expected:** `401` - `success: false`

#### TC-AUTH-007: Làm mới token (Refresh Token)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/refresh-token`
- **Body:**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```
- **Expected:** `200` - có `data.token` mới

#### TC-AUTH-008: Quên mật khẩu
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/forgot-password`
- **Body:**
```json
{
  "email": "customer01@gmail.com"
}
```
- **Expected:** `200` - email gửi thành công

#### TC-AUTH-009: Lấy thông tin tài khoản hiện tại
- **Method:** `GET`
- **URL:** `{{base_url}}/api/auth/me`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - thông tin tài khoản customer01

#### TC-AUTH-010: Đổi mật khẩu
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/auth/change-password`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```
- **Expected:** `200` - `success: true`

#### TC-AUTH-011: Đăng xuất
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/logout`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```
- **Expected:** `200` - `success: true`

---

### 1.2 Quản Lý Roles (Admin/Manager)

#### TC-AUTH-012: Tạo role mới
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/roles`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Body:**
```json
{
  "role_name": "BARISTA",
  "description": "Nhân viên pha chế"
}
```
- **Expected:** `201` - có `data.role_id`
- **Lưu:** `role_id`

#### TC-AUTH-013: Lấy danh sách roles
- **Method:** `GET`
- **URL:** `{{base_url}}/api/auth/roles`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Expected:** `200` - danh sách roles

#### TC-AUTH-014: Gán role cho tài khoản
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/roles/assign`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Body:**
```json
{
  "account_id": "{{account_id}}",
  "role_id": "{{role_id}}"
}
```
- **Expected:** `200` - `success: true`

#### TC-AUTH-015: Thu hồi role
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/roles/revoke`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Body:**
```json
{
  "account_id": "{{account_id}}",
  "role_id": "{{role_id}}"
}
```
- **Expected:** `200` - `success: true`

---

### 1.3 Quản Lý Tài Khoản (Admin)

#### TC-AUTH-016: Lấy danh sách tài khoản
- **Method:** `GET`
- **URL:** `{{base_url}}/api/auth/admin/accounts`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Expected:** `200` - danh sách accounts

#### TC-AUTH-017: Tạo tài khoản nhân viên
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/admin/accounts`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Body:**
```json
{
  "fullName": "Tran Thi B",
  "email": "b@gmail.com",
  "position": "STAFF",
  "phoneNumber": "0901234567"
}
```
- **Expected:** `201` - `success: true`

#### TC-AUTH-018: Kích hoạt/vô hiệu hoá tài khoản
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/auth/admin/accounts/{{account_id}}/status`
- **Headers:** `Authorization: Bearer {{admin_token}}`
- **Body:**
```json
{
  "account_status": "INACTIVE"
}
```
- **Expected:** `200` - `success: true`

#### TC-AUTH-019: Customer không được truy cập admin endpoint
- **Method:** `GET`
- **URL:** `{{base_url}}/api/auth/admin/accounts`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `403` - `success: false`

---

## 2. CUSTOMER SERVICE (Port 3002 → Gateway: `/api/customers`)

### 2.1 Quản Lý Khách Hàng

#### TC-CUST-001: Tạo khách hàng mới (Manager)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/customers`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "fullName": "Le Van C",
  "email": "levanc@gmail.com",
  "phone_number": "0901234567",
  "customerType": "REGULAR"
}
```
- **Expected:** `201` - có `data.customer_id`
- **Lưu:** `customer_id`

#### TC-CUST-002: Lấy danh sách khách hàng (Manager)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers?page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách có pagination

#### TC-CUST-003: Lấy danh sách với tìm kiếm
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers?search=Le Van&page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - kết quả lọc theo từ khóa

#### TC-CUST-004: Lấy chi tiết khách hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - thông tin đầy đủ customer

#### TC-CUST-005: Lấy khách hàng theo account ID
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers/by-account/{{account_id}}`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - thông tin customer

#### TC-CUST-006: Customer cập nhật profile của mình
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/customers/me`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "full_name": "Nguyen Van A Updated",
  "email": "updated@gmail.com",
  "phone_number": "0987654321"
}
```
- **Expected:** `200` - `success: true`

---

### 2.2 Quản Lý Điểm Thưởng

#### TC-CUST-007: Xem điểm của khách hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}/points`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - số điểm hiện tại

#### TC-CUST-008: Xem lịch sử điểm
- **Method:** `GET`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}/point-logs`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - lịch sử thay đổi điểm

#### TC-CUST-009: Điều chỉnh điểm (Manager)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}/points/adjust`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "points": 50,
  "reason": "Điều chỉnh điểm thủ công"
}
```
- **Expected:** `200` - `success: true`, điểm được cộng thêm 50

#### TC-CUST-010: Quy đổi điểm (Manager)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}/points/redeem`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "points": 20,
  "reason": "Đổi điểm lấy voucher"
}
```
- **Expected:** `200` - `success: true`, điểm bị trừ 20

#### TC-CUST-011: Quy đổi điểm vượt quá số điểm có
- **Method:** `POST`
- **URL:** `{{base_url}}/api/customers/{{customer_id}}/points/redeem`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "points": 999999,
  "reason": "Test"
}
```
- **Expected:** `400` - `success: false`, không đủ điểm

---

## 3. PRODUCT SERVICE (Port 3005 → Gateway: `/api/products`)

### 3.1 Quản Lý Danh Mục (Category)

#### TC-PROD-001: Tạo danh mục
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/categories`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "categoryName": "Cà Phê",
  "description": "Các loại đồ uống từ cà phê"
}
```
- **Expected:** `201` - có `data.categoryId`
- **Lưu:** `category_id`

#### TC-PROD-002: Lấy danh sách danh mục (Public)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/categories`
- **Expected:** `200` - danh sách categories

#### TC-PROD-003: Cập nhật danh mục
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/products/categories/{{category_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "categoryName": "Cà Phê Đặc Biệt",
  "status": "ACTIVE"
}
```
- **Expected:** `200` - `success: true`

#### TC-PROD-004: Xóa danh mục
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/products/categories/{{category_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

---

### 3.2 Quản Lý Sản Phẩm

#### TC-PROD-005: Tạo sản phẩm mới
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "productName": "Cà Phê Sữa Đá",
  "price": 35000,
  "description": "Cà phê phin truyền thống với sữa đặc và đá",
  "productCategoryId": "{{category_id}}",
  "status": "ACTIVE",
  "isAvailable": true
}
```
- **Expected:** `201` - có `data.productId`
- **Lưu:** `product_id`

#### TC-PROD-006: Lấy danh sách sản phẩm (Public)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products?page=1&limit=10`
- **Expected:** `200` - danh sách sản phẩm có pagination

#### TC-PROD-007: Lọc sản phẩm theo danh mục
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products?categoryId={{category_id}}&status=ACTIVE`
- **Expected:** `200` - sản phẩm thuộc danh mục đã chọn

#### TC-PROD-008: Tìm kiếm sản phẩm
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products?search=Cà Phê&page=1&limit=10`
- **Expected:** `200` - kết quả tìm kiếm

#### TC-PROD-009: Lấy chi tiết sản phẩm
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/{{product_id}}`
- **Expected:** `200` - thông tin đầy đủ sản phẩm

#### TC-PROD-010: Cập nhật sản phẩm
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/products/{{product_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "price": 38000,
  "isAvailable": true
}
```
- **Expected:** `200` - `success: true`

#### TC-PROD-011: Xóa sản phẩm
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/products/{{product_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

#### TC-PROD-012: Upload ảnh sản phẩm
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/upload/product`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:** `form-data` → key `image`, value: file ảnh JPG/PNG (max 5MB)
- **Expected:** `200` - có URL ảnh trong response

---

### 3.3 Quản Lý Topping

#### TC-PROD-013: Tạo topping
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/toppings`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "toppingName": "Trân Châu Đen",
  "price": 10000,
  "isAvailable": true,
  "status": "ACTIVE"
}
```
- **Expected:** `201` - có `data.toppingId`
- **Lưu:** `topping_id`

#### TC-PROD-014: Lấy danh sách topping (Public)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/toppings`
- **Expected:** `200` - danh sách toppings

#### TC-PROD-015: Cập nhật topping
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/products/toppings/{{topping_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "price": 12000,
  "isAvailable": true
}
```
- **Expected:** `200` - `success: true`

#### TC-PROD-016: Xóa topping
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/products/toppings/{{topping_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

---

### 3.4 Quản Lý Nguyên Liệu

#### TC-PROD-017: Tạo nguyên liệu
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/ingredients`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "ingredientName": "Cà Phê Arabica",
  "quantity": 5000,
  "unit": "g",
  "cost_per_unit": 200,
  "supplier": "Công ty ABC"
}
```
- **Expected:** `201` - có `data.ingredientId`
- **Lưu:** `ingredient_id`

#### TC-PROD-018: Lấy danh sách nguyên liệu (Manager)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/ingredients`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách nguyên liệu

#### TC-PROD-019: Nhập kho nguyên liệu
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/ingredients/{{ingredient_id}}/import`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "quantity": 2000,
  "supplier": "Công ty ABC",
  "cost_per_unit": 180,
  "note": "Nhập hàng tháng 4"
}
```
- **Expected:** `200` - số lượng được cập nhật

#### TC-PROD-020: Xem lịch sử nhập kho
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/ingredients/{{ingredient_id}}/import-logs`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - lịch sử nhập kho

#### TC-PROD-021: Customer không truy cập được nguyên liệu
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/ingredients`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `403` - `success: false`

---

### 3.5 Quản Lý Đánh Giá (Review)

#### TC-PROD-022: Gửi đánh giá (Public - không cần đăng nhập)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/reviews`
- **Body:**
```json
{
  "customerName": "Nguyen Van A",
  "rating": 5,
  "comment": "Cà phê rất ngon, phục vụ nhiệt tình!",
  "productId": "{{product_id}}",
  "email": "customer01@gmail.com"
}
```
- **Expected:** `201` - `success: true`

#### TC-PROD-023: Lấy đánh giá cửa hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/reviews`
- **Expected:** `200` - danh sách đánh giá

#### TC-PROD-024: Lấy đánh giá theo sản phẩm
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/reviews/product/{{product_id}}`
- **Expected:** `200` - đánh giá của sản phẩm đó

#### TC-PROD-025: Gửi đánh giá với rating không hợp lệ
- **Method:** `POST`
- **URL:** `{{base_url}}/api/products/reviews`
- **Body:**
```json
{
  "customerName": "Test",
  "rating": 6,
  "comment": "Test"
}
```
- **Expected:** `400` - `success: false`, rating phải từ 1-5

---

## 4. ORDER SERVICE (Port 3003 → Gateway: `/api/orders`)

### 4.1 Giỏ Hàng (Cart)

> Lưu ý: Cart gắn với `customer_id`, cần đăng nhập bằng customer token

#### TC-ORD-001: Thêm sản phẩm vào giỏ
- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders/cart/items`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "product_id": "{{product_id}}",
  "product_name": "Cà Phê Sữa Đá",
  "size": "M",
  "sugar_level": "70%",
  "ice_level": "100%",
  "unit_price": 35000,
  "quantity": 2,
  "item_note": "Ít đường",
  "toppings": [
    {
      "topping_id": "{{topping_id}}",
      "topping_name": "Trân Châu Đen",
      "topping_price": 10000,
      "quantity": 1
    }
  ]
}
```
- **Expected:** `201` - `success: true`
- **Lưu:** `cart_item_id`

#### TC-ORD-002: Lấy giỏ hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/cart`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - giỏ hàng với items đã thêm

#### TC-ORD-003: Cập nhật item trong giỏ
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/orders/cart/items/{{cart_item_id}}`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "quantity": 3,
  "item_note": "Không đường"
}
```
- **Expected:** `200` - `success: true`

#### TC-ORD-004: Xóa item khỏi giỏ
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/orders/cart/items/{{cart_item_id}}`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - `success: true`

#### TC-ORD-005: Xóa toàn bộ giỏ hàng
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/orders/cart`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - `success: true`

---

### 4.2 Tạo & Quản Lý Đơn Hàng

#### TC-ORD-006: Checkout (Tạo đơn từ giỏ - Online)
> Cần thêm sản phẩm vào giỏ trước (TC-ORD-001)

- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders/checkout`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "order_type": "TAKE_AWAY",
  "payment_method": "MOMO",
  "note": "Giao nhanh giúp tôi"
}
```
- **Expected:** `201` - có `data.order_id`, `data.order_code`
- **Lưu:** `order_id`

#### TC-ORD-007: Tạo đơn tại quầy (Staff/Manager)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "customer_id": "{{customer_id}}",
  "order_type": "DINE_IN",
  "payment_method": "CASH",
  "note": "Bàn số 3",
  "items": [
    {
      "product_id": "{{product_id}}",
      "product_name": "Cà Phê Sữa Đá",
      "size": "L",
      "sugar_level": "100%",
      "ice_level": "50%",
      "unit_price": 35000,
      "quantity": 1,
      "toppings": []
    }
  ]
}
```
- **Expected:** `201` - có `data.order_id`
- **Lưu:** `order_id`

#### TC-ORD-008: Tạo đơn không có khách hàng (Walk-in)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "order_type": "TAKE_AWAY",
  "payment_method": "CASH",
  "items": [
    {
      "product_id": "{{product_id}}",
      "product_name": "Cà Phê Sữa Đá",
      "unit_price": 35000,
      "quantity": 1,
      "toppings": []
    }
  ]
}
```
- **Expected:** `201` - `success: true`

#### TC-ORD-009: Lấy danh sách đơn hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders?page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách đơn hàng có pagination

#### TC-ORD-010: Lọc đơn hàng theo trạng thái
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders?status=PENDING&page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - chỉ hiển thị đơn PENDING

#### TC-ORD-011: Lấy chi tiết đơn hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/{{order_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - thông tin đầy đủ đơn hàng

#### TC-ORD-012: Lấy đơn hàng của tôi (Customer)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/my-orders?page=1&limit=10`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - chỉ hiện đơn của customer đó

#### TC-ORD-013: Cập nhật trạng thái đơn hàng
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/orders/{{order_id}}/status`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "status": "PROCESSING",
  "note": "Đang pha chế"
}
```
- **Expected:** `200` - `success: true`

#### TC-ORD-014: Hoàn thành đơn hàng
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/orders/{{order_id}}/status`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "status": "COMPLETED"
}
```
- **Expected:** `200` - `success: true` (sẽ trigger cộng điểm cho customer)

#### TC-ORD-015: Hủy đơn của tôi (Customer)
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/orders/my-orders/{{order_id}}/cancel`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - `success: true`

#### TC-ORD-016: Xem lịch sử trạng thái đơn hàng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/{{order_id}}/status-logs`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - lịch sử thay đổi trạng thái

#### TC-ORD-017: Customer không tạo được đơn tại quầy
- **Method:** `POST`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:** (giống TC-ORD-007)
- **Expected:** `403` - `success: false`

---

## 5. PAYMENT SERVICE (Port 3004 → Gateway: `/api/payments`)

### 5.1 Phương Thức Thanh Toán

#### TC-PAY-001: Tạo phương thức thanh toán
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/methods`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "method_code": "CASH",
  "method_name": "Tiền mặt",
  "description": "Thanh toán tiền mặt tại quầy"
}
```
- **Expected:** `201` - `success: true`

#### TC-PAY-002: Lấy danh sách phương thức
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments/methods`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `200` - danh sách phương thức

---

### 5.2 Khởi Tạo & Xác Nhận Thanh Toán

#### TC-PAY-003: Khởi tạo thanh toán tiền mặt
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/initiate`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "orderId": "{{order_id}}",
  "totalAmount": 70000,
  "paymentMethod": "CASH",
  "orderCode": "ORD-001"
}
```
- **Expected:** `201` - có `data.payment_id`
- **Lưu:** `payment_id`

#### TC-PAY-004: Khởi tạo thanh toán MoMo
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/initiate`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "orderId": "{{order_id}}",
  "totalAmount": 70000,
  "paymentMethod": "MOMO",
  "orderCode": "ORD-002"
}
```
- **Expected:** `201` - có `data.payment_url` (URL MoMo để redirect)

#### TC-PAY-005: Khởi tạo thanh toán QR
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/initiate`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "orderId": "{{order_id}}",
  "totalAmount": 70000,
  "paymentMethod": "QR",
  "orderCode": "ORD-003"
}
```
- **Expected:** `201` - có thông tin QR code

#### TC-PAY-006: Xác nhận thanh toán tiền mặt
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/{{payment_id}}/cash-confirm`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "amountReceived": 100000,
  "change": 30000
}
```
- **Expected:** `200` - `success: true`, payment status → COMPLETED

#### TC-PAY-007: Xác nhận thanh toán QR
- **Method:** `POST`
- **URL:** `{{base_url}}/api/payments/{{payment_id}}/qr-confirm`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:** `{}`
- **Expected:** `200` - `success: true`

#### TC-PAY-008: Lấy danh sách payments
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments?page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách payments

#### TC-PAY-009: Lấy chi tiết payment
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments/{{payment_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - thông tin payment

#### TC-PAY-010: Lấy payment theo order ID
- **Method:** `GET`
- **URL:** `{{base_url}}/api/payments/order/{{order_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - payment của đơn hàng đó

---

## 6. PROMOTION SERVICE (Port 3006 → Gateway: `/api/promotions`)

### 6.1 Quản Lý Khuyến Mãi (Promotion)

#### TC-PROMO-001: Tạo chương trình khuyến mãi
- **Method:** `POST`
- **URL:** `{{base_url}}/api/promotions`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "promotionName": "Mua 2 tặng 1",
  "description": "Mua 2 ly cà phê tặng 1 ly trà",
  "benefitType": "BUY_X_GET_Y",
  "couponCode": "MUA2TANG1",
  "maxUsage": 100,
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z"
}
```
- **Expected:** `201` - có `data.promotionId`
- **Lưu:** `promotion_id`

#### TC-PROMO-002: Lấy danh sách khuyến mãi (Public)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions?status=ACTIVE&page=1&limit=10`
- **Expected:** `200` - danh sách promotion đang active

#### TC-PROMO-003: Tìm khuyến mãi theo mã coupon
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/coupon/MUA2TANG1`
- **Expected:** `200` - thông tin khuyến mãi

#### TC-PROMO-004: Kiểm tra khuyến mãi áp dụng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/check?orderAmount=100000&customerType=REGULAR`
- **Expected:** `200` - danh sách khuyến mãi có thể áp dụng

#### TC-PROMO-005: Cập nhật điều kiện khuyến mãi
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/promotions/{{promotion_id}}/conditions`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "conditions": [
    {
      "type": "MIN_AMOUNT",
      "value": 50000,
      "operator": "GREATER_THAN"
    }
  ]
}
```
- **Expected:** `200` - `success: true`

#### TC-PROMO-006: Xóa khuyến mãi
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/promotions/{{promotion_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

---

### 6.2 Quản Lý Giảm Giá (Discount)

#### TC-PROMO-007: Tạo chương trình giảm giá
- **Method:** `POST`
- **URL:** `{{base_url}}/api/promotions/discounts`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "discountName": "Giảm 20% cuối tuần",
  "discountType": "PERCENT",
  "discountValue": 20,
  "description": "Giảm 20% vào thứ 7 và Chủ nhật",
  "couponCode": "WEEKEND20",
  "maxUsage": 200,
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z"
}
```
- **Expected:** `201` - có `data.discountId`
- **Lưu:** `discount_id`

#### TC-PROMO-008: Tạo giảm giá cố định (FIXED)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/promotions/discounts`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "discountName": "Giảm 15k đơn từ 100k",
  "discountType": "FIXED",
  "discountValue": 15000,
  "couponCode": "GIAM15K",
  "maxUsage": 50,
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z"
}
```
- **Expected:** `201` - `success: true`

#### TC-PROMO-009: Lấy danh sách giảm giá (Public)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/discounts?status=ACTIVE&page=1&limit=10`
- **Expected:** `200` - danh sách discounts

#### TC-PROMO-010: Tìm giảm giá theo mã coupon
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/discounts/coupon/WEEKEND20`
- **Expected:** `200` - thông tin giảm giá

#### TC-PROMO-011: Kiểm tra giảm giá có thể áp dụng
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/discounts/check?orderAmount=150000`
- **Expected:** `200` - danh sách giảm giá phù hợp

---

### 6.3 Tính Toán & Sử Dụng

#### TC-PROMO-012: Tính tiền giảm (Preview - không cần đăng nhập)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/promotions/calculate`
- **Body:**
```json
{
  "type": "discount",
  "programId": "{{discount_id}}",
  "orderAmount": 150000,
  "customerType": "REGULAR"
}
```
- **Expected:** `200` - có `discountAmount`, `finalAmount`

#### TC-PROMO-013: Ghi nhận sử dụng khuyến mãi
- **Method:** `POST`
- **URL:** `{{base_url}}/api/promotions/use`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:**
```json
{
  "type": "discount",
  "programId": "{{discount_id}}",
  "orderId": "{{order_id}}",
  "customerId": "{{customer_id}}",
  "originalAmount": 150000,
  "discountAmount": 30000
}
```
- **Expected:** `200` - `success: true`

#### TC-PROMO-014: Xem lịch sử sử dụng khuyến mãi
- **Method:** `GET`
- **URL:** `{{base_url}}/api/promotions/usage/{{promotion_id}}?page=1&limit=20`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - lịch sử sử dụng

---

## 7. STAFF SERVICE (Port 3007 → Gateway: `/api/staff`)

### 7.1 Quản Lý Nhân Viên

#### TC-STAFF-001: Tạo nhân viên mới
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/employees`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "fullName": "Pham Thi D",
  "position": "BARISTA",
  "employeeType": "FULL_TIME",
  "maxWorkingHours": 8,
  "status": "ACTIVE"
}
```
- **Expected:** `201` - có `data.employeeId` (dạng EMP-001)
- **Lưu:** `employee_id`

#### TC-STAFF-002: Tạo nhân viên bán thời gian
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/employees`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "fullName": "Hoang Van E",
  "position": "WAITER",
  "employeeType": "PART_TIME",
  "maxWorkingHours": 4
}
```
- **Expected:** `201` - `success: true`

#### TC-STAFF-003: Lấy danh sách nhân viên
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/employees?page=1&limit=10`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách nhân viên

#### TC-STAFF-004: Lọc nhân viên theo vị trí
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/employees?position=BARISTA&status=ACTIVE`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - chỉ hiển thị Barista đang active

#### TC-STAFF-005: Lấy chi tiết nhân viên
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - thông tin đầy đủ nhân viên

#### TC-STAFF-006: Cập nhật thông tin nhân viên
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "position": "CASHIER",
  "maxWorkingHours": 10
}
```
- **Expected:** `200` - `success: true`

#### TC-STAFF-007: Vô hiệu hóa nhân viên
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}/deactivate`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "inactiveReason": "Nghỉ việc"
}
```
- **Expected:** `200` - `success: true`, status → INACTIVE

#### TC-STAFF-008: Kích hoạt lại nhân viên
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}/activate`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "reactivateReason": "Quay lại làm việc"
}
```
- **Expected:** `200` - `success: true`, status → ACTIVE

#### TC-STAFF-009: Cập nhật khả năng làm việc
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}/availability`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "availableFrom": "2026-05-01",
  "availableTo": "2026-05-31",
  "daysPerWeek": 5,
  "notes": "Có thể làm thứ 2 đến thứ 6"
}
```
- **Expected:** `200` - `success: true`

---

### 7.2 Quản Lý Ca Làm Việc (Shift)

#### TC-STAFF-010: Tạo ca làm việc
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/shifts`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "shiftName": "Ca Sáng",
  "startTime": "07:00",
  "endTime": "12:00",
  "workingDate": "2026-05-05",
  "status": "PLANNED"
}
```
- **Expected:** `201` - có `data.shiftId`
- **Lưu:** `shift_id`

#### TC-STAFF-011: Lấy danh sách ca
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/shifts`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách ca làm việc

#### TC-STAFF-012: Gán nhân viên vào ca
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/shifts/{{shift_id}}/assignments`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "employeeId": "{{employee_id}}"
}
```
- **Expected:** `201` - `success: true`

#### TC-STAFF-013: Xem danh sách nhân viên trong ca
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/shifts/{{shift_id}}/assignments`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - danh sách nhân viên được gán

#### TC-STAFF-014: Xem ca làm việc của nhân viên
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/employees/{{employee_id}}/shifts`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - các ca đã gán cho nhân viên

#### TC-STAFF-015: Hủy gán nhân viên khỏi ca
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/staff/shifts/{{shift_id}}/assignments/{{employee_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

#### TC-STAFF-016: Cập nhật ca làm việc
- **Method:** `PUT`
- **URL:** `{{base_url}}/api/staff/shifts/{{shift_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Body:**
```json
{
  "shiftName": "Ca Sáng Sớm",
  "startTime": "06:30",
  "endTime": "11:30"
}
```
- **Expected:** `200` - `success: true`

#### TC-STAFF-017: Xóa ca làm việc
- **Method:** `DELETE`
- **URL:** `{{base_url}}/api/staff/shifts/{{shift_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - `success: true`

---

### 7.3 Chấm Công (Attendance)

#### TC-STAFF-018: Check-in (Staff)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/attendance/check-in`
- **Headers:** `Authorization: Bearer {{staff_token}}`
- **Body:**
```json
{
  "employeeId": "{{employee_id}}",
  "note": "Đúng giờ"
}
```
- **Expected:** `201` - `success: true`, có `checkInTime`

#### TC-STAFF-019: Check-out (Staff)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/attendance/check-out`
- **Headers:** `Authorization: Bearer {{staff_token}}`
- **Body:**
```json
{
  "employeeId": "{{employee_id}}",
  "note": "Hoàn thành ca"
}
```
- **Expected:** `200` - `success: true`, có `checkOutTime`

#### TC-STAFF-020: Xem lịch sử chấm công của nhân viên
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/attendance/employee/{{employee_id}}`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - lịch sử check-in/check-out

#### TC-STAFF-021: Xem báo cáo chấm công tổng hợp (Manager)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/staff/attendance/summary`
- **Headers:** `Authorization: Bearer {{manager_token}}`
- **Expected:** `200` - báo cáo chấm công

#### TC-STAFF-022: Customer không thể check-in
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/attendance/check-in`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:** `{ "note": "Test" }`
- **Expected:** `403` - `success: false`

---

## 8. Kịch Bản Kiểm Thử End-to-End (E2E)

### E2E-001: Luồng Đặt Hàng Online Hoàn Chỉnh

```
1.  [AUTH] POST /api/auth/register           → Đăng ký customer
2.  [AUTH] POST /api/auth/login              → Đăng nhập → lấy token
3.  [PROD] GET  /api/products                → Xem thực đơn
4.  [PROD] GET  /api/products/toppings       → Xem toppings
5.  [ORD]  POST /api/orders/cart/items       → Thêm vào giỏ
6.  [ORD]  GET  /api/orders/cart             → Xem giỏ hàng
7.  [PROMO] GET /api/promotions/discounts/coupon/WEEKEND20  → Kiểm tra mã
8.  [PROMO] POST /api/promotions/calculate   → Tính tiền giảm
9.  [ORD]  POST /api/orders/checkout         → Tạo đơn hàng
10. [PAY]  POST /api/payments/initiate       → Khởi tạo thanh toán
11. [PAY]  POST /api/payments/:id/cash-confirm → Xác nhận thanh toán
12. [ORD]  PUT  /api/orders/:id/status       → Cập nhật COMPLETED
13. [CUST] GET  /api/customers/:id/points    → Kiểm tra điểm được cộng
14. [PROD] POST /api/products/reviews        → Gửi đánh giá
```

---

### E2E-002: Luồng Bán Hàng Tại Quầy

```
1.  [AUTH] POST /api/auth/login (manager)    → Đăng nhập manager
2.  [CUST] GET  /api/customers?search=...    → Tìm khách hàng
3.  [PROD] GET  /api/products                → Xem thực đơn
4.  [ORD]  POST /api/orders                  → Tạo đơn tại quầy
5.  [PAY]  POST /api/payments/initiate       → Khởi tạo thanh toán
6.  [PAY]  POST /api/payments/:id/cash-confirm → Xác nhận tiền mặt
7.  [ORD]  PUT  /api/orders/:id/status       → Cập nhật COMPLETED
```

---

### E2E-003: Luồng Quản Lý Nhân Viên

```
1.  [AUTH] POST /api/auth/login (manager)     → Đăng nhập manager
2.  [AUTH] POST /api/auth/admin/accounts      → Tạo tài khoản nhân viên
3.  [STAFF] POST /api/staff/employees         → Tạo hồ sơ nhân viên
4.  [STAFF] POST /api/staff/shifts            → Tạo ca làm việc
5.  [STAFF] POST /api/staff/shifts/:id/assignments → Gán nhân viên vào ca
6.  [STAFF] POST /api/staff/attendance/check-in → Nhân viên check-in
7.  [STAFF] POST /api/staff/attendance/check-out → Nhân viên check-out
8.  [STAFF] GET  /api/staff/attendance/summary  → Xem báo cáo chấm công
```

---

## 9. Kiểm Thử Bảo Mật & Edge Cases

### TC-SEC-001: Truy cập không có token
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** (không có Authorization)
- **Expected:** `401` - `success: false`

### TC-SEC-002: Token không hợp lệ
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** `Authorization: Bearer invalid_token_here`
- **Expected:** `401` - `success: false`

### TC-SEC-003: Token hết hạn
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders`
- **Headers:** `Authorization: Bearer <expired_token>`
- **Expected:** `401` - `success: false`

### TC-SEC-004: Phân quyền sai role (Customer gọi Manager API)
- **Method:** `POST`
- **URL:** `{{base_url}}/api/staff/employees`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Body:** `{ "fullName": "Test", "position": "BARISTA", "employeeType": "FULL_TIME" }`
- **Expected:** `403` - `success: false`

### TC-SEC-005: Lấy thông tin đơn hàng của người khác (Customer)
- **Method:** `GET`
- **URL:** `{{base_url}}/api/orders/<order_id_của_người_khác>`
- **Headers:** `Authorization: Bearer {{customer_token}}`
- **Expected:** `403/404` - `success: false`

### TC-SEC-006: Truy cập trang không tồn tại
- **Method:** `GET`
- **URL:** `{{base_url}}/api/not-exist`
- **Expected:** `404`

### TC-SEC-007: Body thiếu field bắt buộc
- **Method:** `POST`
- **URL:** `{{base_url}}/api/auth/register`
- **Body:** `{ "username": "test123" }` *(thiếu password)*
- **Expected:** `400` - `success: false`

### TC-SEC-008: ID không tồn tại
- **Method:** `GET`
- **URL:** `{{base_url}}/api/products/NON_EXISTENT_ID`
- **Expected:** `404` - `success: false`

---

## 10. Lưu Ý Khi Kiểm Thử

### Thứ Tự Thực Hiện Gợi Ý:
1. **Khởi động services:** Đảm bảo tất cả 7 services và Docker đang chạy
2. **Auth trước:** Chạy TC-AUTH-003 đến TC-AUTH-005 để lấy tokens
3. **Tạo dữ liệu nền:** Category → Product → Topping → Customer → Employee
4. **Kiểm thử chức năng:** Theo từng section
5. **E2E cuối cùng:** Sau khi có đủ dữ liệu

### Postman Collection Structure:
```
📁 Cafe System API
  📁 0. Setup (lấy tokens)
  📁 1. Auth Service
  📁 2. Customer Service
  📁 3. Product Service
  📁 4. Order Service
  📁 5. Payment Service
  📁 6. Promotion Service
  📁 7. Staff Service
  📁 8. E2E Flows
  📁 9. Security Tests
```

### Pre-request Script Gợi Ý (tự động lấy token):
```javascript
// Thêm vào Pre-request Script của Collection
if (!pm.environment.get("customer_token")) {
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/api/auth/login",
        method: "POST",
        header: { "Content-Type": "application/json" },
        body: {
            mode: "raw",
            raw: JSON.stringify({ username: "customer01", password: "Password123!" })
        }
    }, (err, res) => {
        pm.environment.set("customer_token", res.json().data.token);
    });
}
```

### Test Script Gợi Ý (tự động lưu biến):
```javascript
// Thêm vào Tests tab sau khi tạo resource
const res = pm.response.json();
if (res.success && res.data) {
    // Ví dụ cho product
    pm.environment.set("product_id", res.data.productId);
    // Ví dụ cho order
    // pm.environment.set("order_id", res.data.order_id);
}
pm.test("Status code is 201", () => pm.response.to.have.status(201));
pm.test("Response success", () => pm.expect(res.success).to.be.true);
```
