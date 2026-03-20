# Product Service - Postman Test Guide

> **Base URL (qua Gateway):** `http://localhost:3000`
> **Base URL (trực tiếp):** `http://localhost:3005`
> **Content-Type:** `application/json`
> **⚠️ Các route POST/PUT/DELETE yêu cầu:** `Authorization: Bearer {{accessToken}}` (role ADMIN hoặc MANAGER)

---

## 1. CATEGORY (Danh mục sản phẩm)

### 1.1 Lấy tất cả danh mục *(không cần token)*

```
GET {{base}}/api/products/categories
```

### 1.2 Lấy danh mục theo ID *(không cần token)*

```
GET {{base}}/api/products/categories/{{categoryId}}
```

### 1.3 Tạo danh mục *(yêu cầu ADMIN/MANAGER)*

```
POST {{base}}/api/products/categories
```

**Body:**
```json
{ "categoryId": "CAT-001", "categoryName": "Cà phê", "description": "Các loại đồ uống từ cà phê" }
```
```json
{ "categoryId": "CAT-002", "categoryName": "Trà", "description": "Các loại trà" }
```
```json
{ "categoryId": "CAT-003", "categoryName": "Sinh tố", "description": "Sinh tố trái cây" }
```

### 1.4 Cập nhật danh mục

```
PUT {{base}}/api/products/categories/{{categoryId}}
```

**Body:**
```json
{
  "categoryName": "Cà phê đặc biệt",
  "description": "Các loại cà phê cao cấp"
}
```

### 1.5 Xóa danh mục *(soft delete)*

```
DELETE {{base}}/api/products/categories/{{categoryId}}
```

---

## 2. PRODUCTS (Sản phẩm)

### 2.1 Lấy tất cả sản phẩm *(không cần token)*

```
GET {{base}}/api/products
```

**Query params tùy chọn:**
```
GET {{base}}/api/products?page=1&limit=10&search=cà phê&categoryId=CAT-001&status=ACTIVE
```

### 2.2 Lấy sản phẩm theo ID *(không cần token)*

```
GET {{base}}/api/products/{{productId}}
```

### 2.3 Tạo sản phẩm *(yêu cầu ADMIN/MANAGER)*

```
POST {{base}}/api/products
```

**Body:**
```json
{
  "productId": "PROD-001",
  "productName": "Cà phê đen",
  "price": 25000,
  "description": "Cà phê đen truyền thống",
  "productCategoryId": "CAT-001"
}
```
```json
{
  "productId": "PROD-002",
  "productName": "Bạc xỉu",
  "price": 35000,
  "description": "Cà phê sữa đá",
  "productCategoryId": "CAT-001"
}
```
```json
{
  "productId": "PROD-003",
  "productName": "Trà đào",
  "price": 45000,
  "description": "Trà đào thơm mát",
  "productCategoryId": "CAT-002"
}
```

### 2.4 Cập nhật sản phẩm

```
PUT {{base}}/api/products/{{productId}}
```

**Body:**
```json
{
  "productName": "Cà phê đen đá",
  "price": 28000,
  "description": "Cà phê đen đá lạnh"
}
```

### 2.5 Xóa sản phẩm *(soft delete, status → INACTIVE)*

```
DELETE {{base}}/api/products/{{productId}}
```

---

## 3. TOPPINGS (Topping)

> GET là public. POST/PUT/DELETE yêu cầu ADMIN/MANAGER.

### 3.1 Lấy tất cả topping *(không cần token)*

```
GET {{base}}/api/products/toppings
```

**Chỉ lấy topping đang khả dụng:**
```
GET {{base}}/api/products/toppings?available=true
```

### 3.2 Lấy topping theo ID *(không cần token)*

```
GET {{base}}/api/products/toppings/{{toppingId}}
```

> `toppingId` là giá trị trả về khi tạo topping, dạng `TOP-XXXXXXXX`

### 3.3 Tạo topping *(yêu cầu ADMIN/MANAGER)*

```
POST {{base}}/api/products/toppings
```

**Body:**
```json
{
  "toppingName": "Trân châu đen",
  "price": 5000
}
```
```json
{
  "toppingName": "Pudding trứng",
  "price": 8000
}
```
```json
{
  "toppingName": "Thạch trái cây",
  "price": 6000
}
```
```json
{
  "toppingName": "Kem cheese",
  "price": 10000
}
```

> **Response trả về `toppingId`** dạng `TOP-XXXXXXXX` — lưu lại để dùng khi đặt hàng.

### 3.4 Cập nhật topping *(yêu cầu ADMIN/MANAGER)*

```
PUT {{base}}/api/products/toppings/{{toppingId}}
```

**Body (cập nhật giá):**
```json
{
  "price": 6000
}
```

**Body (tạm ngừng bán):**
```json
{
  "isAvailable": false
}
```

**Body (ngừng hoạt động):**
```json
{
  "status": "INACTIVE"
}
```

### 3.5 Xóa topping *(yêu cầu ADMIN/MANAGER)*

```
DELETE {{base}}/api/products/toppings/{{toppingId}}
```

---

## 4. INGREDIENTS (Nguyên liệu)

> ⚠️ **Tất cả ingredient routes yêu cầu token**

### 4.1 Lấy tất cả nguyên liệu

```
GET {{base}}/api/products/ingredients
```

### 4.2 Lấy nguyên liệu theo ID

```
GET {{base}}/api/products/ingredients/{{ingredientId}}
```

### 4.3 Tạo nguyên liệu *(yêu cầu ADMIN/MANAGER)*

```
POST {{base}}/api/products/ingredients
```

**Body:**
```json
{
  "ingredientId": "ING-001",
  "ingredientName": "Cà phê hạt",
  "unit": "kg",
  "quantityInStock": 50,
  "minimumStock": 10
}
```
```json
{
  "ingredientId": "ING-002",
  "ingredientName": "Sữa tươi",
  "unit": "lít",
  "quantityInStock": 100,
  "minimumStock": 20
}
```

### 4.4 Nhập kho nguyên liệu

```
POST {{base}}/api/products/ingredients/{{ingredientId}}/import
```

**Body:**
```json
{
  "quantityImported": 30,
  "unitPrice": 150000,
  "supplier": "Công ty XYZ",
  "note": "Nhập kho tháng 3"
}
```

### 4.5 Xem lịch sử nhập kho

```
GET {{base}}/api/products/ingredients/{{ingredientId}}/import-logs
```

---

## 5. THỨ TỰ TEST ĐỀ XUẤT

| # | Action | Endpoint | Ghi chú |
|---|--------|----------|---------|
| 1 | Tạo category | POST /api/products/categories | Tạo CAT-001, CAT-002, CAT-003 |
| 2 | Lấy tất cả category | GET /api/products/categories | Verify |
| 3 | Tạo sản phẩm | POST /api/products | Tạo PROD-001, PROD-002, PROD-003 |
| 4 | Lấy tất cả sản phẩm | GET /api/products | Verify |
| 5 | Tạo topping | POST /api/products/toppings | Tạo ít nhất 2-3 topping, lưu toppingId |
| 6 | Lấy tất cả topping | GET /api/products/toppings | Verify |
| 7 | Lấy topping khả dụng | GET /api/products/toppings?available=true | Verify filter |
| 8 | Cập nhật topping | PUT /api/products/toppings/{{toppingId}} | Đổi giá |
| 9 | Tạo nguyên liệu | POST /api/products/ingredients | Tạo ING-001, ING-002 |
| 10 | Nhập kho | POST /api/products/ingredients/ING-001/import | Verify stock tăng |
| 11 | Xem import logs | GET /api/products/ingredients/ING-001/import-logs | |