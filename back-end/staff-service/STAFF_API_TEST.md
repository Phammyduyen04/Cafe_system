# Staff Service — Kịch bản test Postman

**Base URL:** `http://localhost:3000`

> Biến cần lưu: `{{base_url}}`, `{{manager_token}}`, `{{staff_token}}`, `{{staff_account_id}}`, `{{employee_id_1}}`, `{{employee_id_2}}`, `{{shift_id_1}}`, `{{shift_id_2}}`

> **QUAN TRONG — Trước khi test:**
> 1. **Xóa 3 collection** trong MongoDB (staff_db): `employees`, `work_shift`, `shift_assignments`, `employee_availabilities`
> 2. **Restart staff-service** (dừng và chạy lại `node src/server.js`)
> 3. **Chạy lại từ Bước Chuẩn bị** để lấy token mới

---

## Chuẩn bị — Lấy token

**POST** `{{base_url}}/api/auth/login` — MANAGER
```json
{ "username": "manager01", "password": "manager01" }
```
Luu `manager_token` = `response.data.token`

**POST** `{{base_url}}/api/auth/login` — STAFF
```json
{ "username": "staff01", "password": "staff01" }
```
Luu `staff_token` = `response.data.token`
Luu `staff_account_id` = `response.data.account.accountId`

---

## LUONG 1 — Quan ly nhan vien (MANAGER)

### Buoc 1: Tao nhan vien moi (khong can gui employeeId — tu sinh)
**POST** `{{base_url}}/api/staff/employees`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "fullName": "Tran Gia Huy",
  "position": "Barista",
  "employeeType": "PART_TIME",
  "maxWorkingHours": 24
}
```
201 — `employeeId` duoc tu sinh UUID, `status: "ACTIVE"`
Luu `employee_id_1` = `response.data.employeeId`

### Buoc 2: Tao nhan vien thu hai
**POST** `{{base_url}}/api/staff/employees`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "fullName": "Tran Thi B",
  "position": "Cashier",
  "employeeType": "PART_TIME"
}
```
201
Luu `employee_id_2` = `response.data.employeeId`

### Buoc 3: Thieu truong bat buoc — loi
**POST** `{{base_url}}/api/staff/employees`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "position": "Barista", "employeeType": "FULL_TIME" }
```
400 — "Full name, position, and employee type are required"

### Buoc 4: Xem danh sach nhan vien (co phan trang)
**GET** `{{base_url}}/api/staff/employees?page=1&limit=5`
Header: `Authorization: Bearer {{manager_token}}`
200 — danh sach + pagination

### Buoc 5: Tim kiem theo position
**GET** `{{base_url}}/api/staff/employees?position=Barista`
Header: `Authorization: Bearer {{manager_token}}`
200 — chi nhan vien co `position = "Barista"`

### Buoc 6: Xem chi tiet nhan vien
**GET** `{{base_url}}/api/staff/employees/{{employee_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
200

### Buoc 7: Cap nhat thong tin nhan vien
**PUT** `{{base_url}}/api/staff/employees/{{employee_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "fullName": "Tran Gia Huy (Updated)",
  "maxWorkingHours": 48
}
```
200 — thong tin cap nhat

### Buoc 8: Gan accountId cua staff vao employee_id_1 (de test Luong 2)
**PUT** `{{base_url}}/api/staff/employees/{{employee_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "accountId": "{{staff_account_id}}"
}
```
200 — `accountId` duoc gan vao employee_id_1
> Buoc nay can thiet de STAFF co the cap nhat lich ranh cua chinh minh o Luong 2


### Buoc 9: Xoa mem nhan vien (soft delete)
**DELETE** `{{base_url}}/api/staff/employees/{{employee_id_2}}`
Header: `Authorization: Bearer {{manager_token}}`
200 — `response.data.status = "INACTIVE"` (khong xoa khoi DB)

> Kiem tra: GET `{{base_url}}/api/staff/employees/{{employee_id_2}}` van tra ve nhan vien nhung `status: "INACTIVE"`
> GET danh sach nhan vien se KHONG thay employee_id_2 (vi mac dinh chi lay ACTIVE)

---

## LUONG 2 — Lich san sang lam viec (Availability)

> **Luu y**: Can hoan thanh Luong 1 Buoc 8 truoc (gan accountId cho employee_id_1)

### Buoc 1: Xem lich ranh cua nhan vien
**GET** `{{base_url}}/api/staff/employees/{{employee_id_1}}/availability`
Header: `Authorization: Bearer {{staff_token}}`
200 — `availableDays: []`, `availableTimeRanges: []`

### Buoc 2: STAFF cap nhat lich ranh cua chinh minh
**PUT** `{{base_url}}/api/staff/employees/{{employee_id_1}}/availability`
Header: `Authorization: Bearer {{staff_token}}`
```json
{
  "availableDays": ["MON", "TUE", "WED", "THU", "FRI"],
  "availableTimeRanges": [
    { "start": "07:00", "end": "15:00" }
  ]
}
```
200 — lich ranh cap nhat
> Chi hoat dong khi `employee.accountId === token.accountId` (da gan o Buoc 8 Luong 1)

### Buoc 3: STAFF cap nhat lich ranh cua nguoi khac — loi
**PUT** `{{base_url}}/api/staff/employees/{{employee_id_2}}/availability`
Header: `Authorization: Bearer {{staff_token}}`
```json
{
  "availableDays": ["SAT", "SUN"]
}
```
403 — "You can only update your own availability"


---

## LUONG 3 — Quan ly ca lam viec (MANAGER)

### Buoc 1: Tao ca moi (khong can gui shiftId — tu sinh)
**POST** `{{base_url}}/api/staff/shifts`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "shiftName": "Ca Sang",
  "startTime": "07:00",
  "endTime": "15:00",
  "workingDate": "2026-04-01"
}
```
201 — `shiftId` tu sinh UUID, `status: "PLANNED"`
Luu `shift_id_1` = `response.data.shiftId`

### Buoc 2: Tao ca thu hai
**POST** `{{base_url}}/api/staff/shifts`
Header: `Authorization: Bearer {{manager_token}}`
```json
{
  "shiftName": "Ca Chieu",
  "startTime": "15:00",
  "endTime": "23:00",
  "workingDate": "2026-04-01"
}
```
201 — `shiftId` tu sinh UUID, `status: "PLANNED"`
Luu `shift_id_2` = `response.data.shiftId`

### Buoc 3: Thieu truong bat buoc — loi
**POST** `{{base_url}}/api/staff/shifts`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "shiftName": "Ca Toi", "startTime": "23:00" }
```
400 — "Shift name, start time, end time, and working date are required"

### Buoc 4: Xem danh sach ca (co phan trang)
**GET** `{{base_url}}/api/staff/shifts?page=1&limit=10`
Header: `Authorization: Bearer {{manager_token}}`
200 — danh sach + pagination

### Buoc 5: Loc ca theo ngay
**GET** `{{base_url}}/api/staff/shifts?date=2026-04-01`
Header: `Authorization: Bearer {{manager_token}}`
200 — chi ca ngay 2026-04-01

### Buoc 6: Loc ca theo trang thai
**GET** `{{base_url}}/api/staff/shifts?status=PLANNED`
Header: `Authorization: Bearer {{manager_token}}`
200 — chi ca PLANNED

### Buoc 7: Xem chi tiet ca (kem danh sach assignments)
**GET** `{{base_url}}/api/staff/shifts/{{shift_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
200 — thong tin ca + `assignments: []`

### Buoc 8: Cap nhat ten ca
**PUT** `{{base_url}}/api/staff/shifts/{{shift_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "shiftName": "Ca Sang (Updated)" }
```
200 — `shiftName` cap nhat, `status` giu nguyen "PLANNED"

### Buoc 9: Cap nhat trang thai ca (PLANNED → ACTIVE)
**PUT** `{{base_url}}/api/staff/shifts/{{shift_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "status": "ACTIVE" }
```
200 — `status: "ACTIVE"`
> ID truyen vao la `shiftId` UUID (lay tu `response.data.shiftId` khi tao ca, khong phai `_id` MongoDB)

### Buoc 10: Cap nhat trang thai ca ve COMPLETED
**PUT** `{{base_url}}/api/staff/shifts/{{shift_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "status": "COMPLETED" }
```
200 — `status: "COMPLETED"`

### Buoc 11: Ca khong ton tai — loi
**PUT** `{{base_url}}/api/staff/shifts/00000000-0000-0000-0000-000000000000`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "status": "ACTIVE" }
```
404 — "Shift not found"

---

## LUONG 4 — Gan nhan vien vao ca

> **Luu y**: employee_id_1 phai co `status: "ACTIVE"` va shift_id_1 phai co `status: "PLANNED"` hoac `"ACTIVE"`

### Buoc 1: Gan nhan vien vao ca PLANNED
**POST** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "employeeId": "{{employee_id_1}}" }
```
201 — `assignmentStatus: "ASSIGNED"`

### Buoc 2: Gan lai nhan vien da co — loi trung
**POST** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "employeeId": "{{employee_id_1}}" }
```
409 — "Duplicate entry. Resource already exists."

### Buoc 3: Gan nhan vien INACTIVE — loi
**POST** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "employeeId": "{{employee_id_2}}" }
```
400 — "Cannot assign an inactive employee to a shift"
> employee_id_2 da bi xoa mem (INACTIVE) o Luong 1 Buoc 10

### Buoc 4: Xem danh sach assignments cua ca
**GET** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments`
Header: `Authorization: Bearer {{manager_token}}`
200 — danh sach nhan vien duoc gan

### Buoc 5: Go nhan vien khoi ca
**DELETE** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments/{{employee_id_1}}`
Header: `Authorization: Bearer {{manager_token}}`
200 — "Assignment removed"

### Buoc 6: Huy ca (soft delete)
**DELETE** `{{base_url}}/api/staff/shifts/{{shift_id_2}}`
Header: `Authorization: Bearer {{manager_token}}`
200 — `response.data.status = "CANCELLED"`

### Buoc 7: Gan vao ca da CANCELLED — loi
**POST** `{{base_url}}/api/staff/shifts/{{shift_id_2}}/assignments`
Header: `Authorization: Bearer {{manager_token}}`
```json
{ "employeeId": "{{employee_id_1}}" }
```
400 — "Cannot assign employee to a shift that is not PLANNED or ACTIVE"

### Buoc 8: STAFF khong duoc gan nhan vien
**POST** `{{base_url}}/api/staff/shifts/{{shift_id_1}}/assignments`
Header: `Authorization: Bearer {{staff_token}}`
```json
{ "employeeId": "{{employee_id_1}}" }
```
403 — Forbidden

---

## Tom tat quyen han

| Chuc nang | MANAGER | STAFF |
|---|:---:|:---:|
| Tao nhan vien | Yes | No |
| Xem danh sach nhan vien | Yes | Yes |
| Xem chi tiet nhan vien | Yes | Yes |
| Cap nhat nhan vien | Yes | No |
| Xoa nhan vien (soft) | Yes | No |
| Cap nhat lich ranh | Yes (bat ky) | Yes (chi cua minh) |
| Tao ca lam viec | Yes | No |
| Xem danh sach ca | Yes | Yes |
| Cap nhat ca | Yes | No |
| Huy ca (soft delete) | Yes | No |
| Gan nhan vien vao ca | Yes | No |
| Go nhan vien khoi ca | Yes | No |
| Xem assignments cua ca | Yes | Yes |

## Quy tac nghiep vu

- **employeeId / shiftId**: tu sinh UUID, client khong can gui; API chap nhan ca UUID (`shiftId`) lan MongoDB ObjectId (`_id`) trong URL param
- **Soft delete nhan vien**: `status: "INACTIVE"` — hien thi trong response, khong xuat hien trong GET danh sach (mac dinh chi lay ACTIVE)
- **Soft delete ca**: `status: "CANCELLED"` — hien thi trong response
- **Gan ca**: chi khi shift `PLANNED` hoac `ACTIVE` + employee `ACTIVE`
- **Lich ranh**: STAFF chi cap nhat cua chinh minh (so sanh `accountId` tu token) — phai gan accountId truoc
- **Pagination**: mac dinh `page=1&limit=10`
- **Thu tu test**: Luong 1 → Luong 2 → Luong 3 → Luong 4 (phu thuoc du lieu tao truoc)
