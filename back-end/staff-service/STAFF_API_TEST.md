# Staff Service API Test Guide

Base URL (qua Gateway): `http://localhost:3000`
Staff Service trực tiếp: `http://localhost:3007`

> **Lưu ý**: Tất cả request (trừ Login) phải có header `Authorization: Bearer <accessToken>`

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

### 0.2 Login STAFF (PART_TIME)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "staff_parttime01",
  "password": "123456"
}
```
**Kết quả mong đợi**: `200 OK` → lưu `accessToken` của PART_TIME staff

---

### 0.3 Login STAFF (FULL_TIME)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "staff_fulltime01",
  "password": "123456"
}
```
**Kết quả mong đợi**: `200 OK` → lưu `accessToken` của FULL_TIME staff

---

## Nhóm 1: Employee CRUD

> **Quy trình nghiệp vụ tạo nhân viên:**
> 1. Manager tạo hồ sơ nhân viên (chưa cần accountId)
> 2. Admin vào auth-service tạo tài khoản → nhận `accountId`
> 3. Manager gắn `accountId` vào hồ sơ qua `PUT /:id`

### 1.1 Tạo nhân viên FULL_TIME (MANAGER) — chưa có tài khoản
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "fullName": "Nguyen Van A",
  "position": "BARISTA",
  "employeeType": "FULL_TIME",
  "maxWorkingHours": 40
}
```
**Kết quả mong đợi**: `201 Created` → lưu `employeeId`, `accountId: null`

---

### 1.2 Tạo nhân viên PART_TIME (MANAGER) — chưa có tài khoản
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "fullName": "Tran Thi B",
  "position": "CASHIER",
  "employeeType": "PART_TIME",
  "maxWorkingHours": 20
}
```
**Kết quả mong đợi**: `201 Created` → lưu `employeeId`, `accountId: null`

---

### 1.3 Tạo nhân viên - STAFF không có quyền
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "fullName": "Le Van C",
  "position": "WAITER",
  "employeeType": "PART_TIME"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 1.4 Tạo nhân viên - position không hợp lệ
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "fullName": "Le Van D",
  "position": "INVALID_ROLE",
  "employeeType": "FULL_TIME"
}
```
**Kết quả mong đợi**: `400 Bad Request` (Mongoose validation error)

---

### 1.5 Lấy danh sách nhân viên (mặc định page=1, limit=10)
```
GET http://localhost:3000/api/staff/employees
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với pagination `{ page, limit, total, totalPages }`

---

### 1.6 Lấy danh sách có phân trang
```
GET http://localhost:3000/api/staff/employees?page=1&limit=5
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, tối đa 5 nhân viên

---

### 1.7 Filter theo position và status
```
GET http://localhost:3000/api/staff/employees?position=BARISTA&status=ACTIVE
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ trả về BARISTA đang ACTIVE

---

### 1.8 Filter theo employeeType
```
GET http://localhost:3000/api/staff/employees?employeeType=PART_TIME
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ trả về PART_TIME

---

### 1.9 Filter nhân viên chưa có tài khoản (admin cần biết để tạo account)
```
GET http://localhost:3000/api/staff/employees?hasAccount=false
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ trả về nhân viên có `accountId: null`

---

### 1.10 Filter nhân viên đã có tài khoản
```
GET http://localhost:3000/api/staff/employees?hasAccount=true
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ trả về nhân viên có `accountId` khác null

---

### 1.11 Lấy chi tiết nhân viên
```
GET http://localhost:3000/api/staff/employees/<employeeId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với thông tin đầy đủ, bao gồm `accountId: null`, `inactiveReason: null`

---

### 1.12 Lấy chi tiết - không tồn tại
```
GET http://localhost:3000/api/staff/employees/nonexistent-id
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `404 Not Found`

---

### 1.13 Cập nhật thông tin nhân viên (MANAGER)
```
PUT http://localhost:3000/api/staff/employees/<employeeId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "fullName": "Nguyen Van A Updated",
  "position": "WAITER"
}
```
**Kết quả mong đợi**: `200 OK` với thông tin đã cập nhật

---

### 1.14 Gắn accountId vào hồ sơ nhân viên (sau khi admin tạo tài khoản)
```
PUT http://localhost:3000/api/staff/employees/<employeeId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "accountId": "<accountId nhận từ auth-service>"
}
```
**Kết quả mong đợi**: `200 OK`, `accountId` được cập nhật — nhân viên có thể được phân công ca

---

### 1.15 Gắn accountId trùng với nhân viên khác
```
PUT http://localhost:3000/api/staff/employees/<employeeId2>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "accountId": "<accountId đã gắn cho nhân viên khác>"
}
```
**Kết quả mong đợi**: `409 Conflict` — "This accountId is already linked to another employee"

---

### 1.16 Cập nhật nhân viên - STAFF không có quyền
```
PUT http://localhost:3000/api/staff/employees/<employeeId>
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "fullName": "Hacked Name"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 1.17 Lấy nhân viên theo accountId
```
GET http://localhost:3000/api/staff/employees/by-account/<accountId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`. Nếu nhân viên đang INACTIVE, response sẽ có `status: "INACTIVE"` và `inactiveReason: "<lý do>"` — frontend dùng field này để hiển thị thông báo khi staff đăng nhập.

---

## Nhóm 2: Deactivate & Activate Nhân viên

### 2.1 Deactivate nhân viên - có lý do (MANAGER)
```
PUT http://localhost:3000/api/staff/employees/<employeeId>/deactivate
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Vi phạm nội quy lần 2: đi trễ liên tục"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "INACTIVE"`, `inactiveReason: "Vi phạm nội quy lần 2: đi trễ liên tục"`

---

### 2.2 Deactivate nhân viên - không có lý do
```
PUT http://localhost:3000/api/staff/employees/<employeeId>/deactivate
Authorization: Bearer <manager_token>
Content-Type: application/json

{}
```
**Kết quả mong đợi**: `400 Bad Request` — "Reason is required when deactivating an employee"

---

### 2.3 Deactivate nhân viên đã INACTIVE
```
PUT http://localhost:3000/api/staff/employees/<inactiveEmployeeId>/deactivate
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Lý do khác"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee is already inactive"

---

### 2.4 Activate lại nhân viên - có lý do (MANAGER)
```
PUT http://localhost:3000/api/staff/employees/<inactiveEmployeeId>/activate
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Đã xử lý xong vi phạm, nhân viên được quay trở lại làm việc"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "ACTIVE"`, `inactiveReason: null`, `reactivateReason: "Đã xử lý xong..."`

---

### 2.5 Activate nhân viên - không có lý do
```
PUT http://localhost:3000/api/staff/employees/<inactiveEmployeeId>/activate
Authorization: Bearer <manager_token>
Content-Type: application/json

{}
```
**Kết quả mong đợi**: `400 Bad Request` — "Reason is required when reactivating an employee"

---

### 2.6 Activate nhân viên đã ACTIVE
```
PUT http://localhost:3000/api/staff/employees/<activeEmployeeId>/activate
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Test"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee is already active"

---

### 2.6 Kiểm tra thông báo INACTIVE khi staff đăng nhập

Sau khi deactivate nhân viên, staff đó đăng nhập bình thường (auth-service không chặn), rồi frontend gọi:
```
GET http://localhost:3000/api/staff/employees/by-account/<accountId>
Authorization: Bearer <staff_token>
```
**Kết quả mong đợi**: `200 OK` với `status: "INACTIVE"` và `inactiveReason: "<lý do manager nhập>"`.
Frontend đọc hai field này và hiển thị thông báo: *"Tài khoản của bạn bị vô hiệu hóa. Lý do: ..."*

---

## Nhóm 3: Employee Availability

> **Quy tắc**:
> - Chỉ nhân viên **PART_TIME** mới được cập nhật lịch rảnh
> - **FULL_TIME** làm cả tuần nên không cần và không được phép set availability

### 3.1 Xem lịch rảnh của nhân viên
```
GET http://localhost:3000/api/staff/employees/<employeeId>/availability
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với `availableDays` và `availableTimeRanges`

---

### 3.2 PART_TIME STAFF tự cập nhật lịch rảnh của bản thân
```
PUT http://localhost:3000/api/staff/employees/<partTimeEmployeeId>/availability
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "availableDays": ["MON", "WED", "FRI", "SAT"],
  "availableTimeRanges": [
    { "start": "08:00", "end": "12:00" },
    { "start": "13:00", "end": "17:00" }
  ]
}
```
**Kết quả mong đợi**: `200 OK`

---

### 3.3 PART_TIME STAFF cập nhật lịch rảnh của người khác - bị từ chối
```
PUT http://localhost:3000/api/staff/employees/<otherEmployeeId>/availability
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "availableDays": ["TUE"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `403 Forbidden` — "You can only update your own availability"

---

### 3.4 FULL_TIME STAFF cập nhật lịch rảnh - bị từ chối
```
PUT http://localhost:3000/api/staff/employees/<fullTimeEmployeeId>/availability
Authorization: Bearer <fulltime_staff_token>
Content-Type: application/json

{
  "availableDays": ["MON"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Full-time employees do not need to set availability as they work all week"

---

### 3.5 MANAGER cập nhật lịch rảnh cho PART_TIME nhân viên bất kỳ
```
PUT http://localhost:3000/api/staff/employees/<partTimeEmployeeId>/availability
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "availableDays": ["TUE", "THU", "SUN"],
  "availableTimeRanges": [
    { "start": "09:00", "end": "18:00" }
  ]
}
```
**Kết quả mong đợi**: `200 OK`

---

### 3.6 MANAGER cập nhật lịch rảnh cho FULL_TIME - bị từ chối
```
PUT http://localhost:3000/api/staff/employees/<fullTimeEmployeeId>/availability
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "availableDays": ["MON"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Full-time employees do not need to set availability as they work all week"

---

## Nhóm 4: Ca làm việc của nhân viên

### 4.1 Xem danh sách ca của nhân viên
```
GET http://localhost:3000/api/staff/employees/<employeeId>/shifts
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách ca được phân công

---

### 4.2 Filter ca theo ngày
```
GET http://localhost:3000/api/staff/employees/<employeeId>/shifts?date=2026-03-27
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ ca ngày 27/03/2026

---

## Nhóm 5: Shift CRUD

### 5.1 Tạo ca làm việc hợp lệ (MANAGER)
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca Sáng",
  "startTime": "08:00",
  "endTime": "12:00",
  "workingDate": "2026-03-27"
}
```
**Kết quả mong đợi**: `201 Created` → lưu `shiftId`

---

### 5.2 Tạo ca - startTime >= endTime
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca loi",
  "startTime": "14:00",
  "endTime": "08:00",
  "workingDate": "2026-03-27"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "startTime must be before endTime"

---

### 5.3 Tạo ca - workingDate là ngày quá khứ
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca qua khu",
  "startTime": "08:00",
  "endTime": "12:00",
  "workingDate": "2025-01-01"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "workingDate cannot be in the past"

---

### 5.4 Tạo ca - STAFF không có quyền
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "shiftName": "Ca thu",
  "startTime": "08:00",
  "endTime": "12:00",
  "workingDate": "2026-03-27"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 5.5 Lấy danh sách ca
```
GET http://localhost:3000/api/staff/shifts
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với pagination

---

### 5.6 Filter ca theo ngày
```
GET http://localhost:3000/api/staff/shifts?date=2026-03-27
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ ca ngày 27/03

---

### 5.7 Filter ca theo status
```
GET http://localhost:3000/api/staff/shifts?status=PLANNED
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ ca PLANNED

---

### 5.8 Lấy chi tiết ca
```
GET http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` bao gồm danh sách assignments

---

### 5.9 Lấy chi tiết ca - không tồn tại
```
GET http://localhost:3000/api/staff/shifts/nonexistent-id
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `404 Not Found`

---

### 5.10 Cập nhật tên ca
```
PUT http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca sang thu 6 (da sua)"
}
```
**Kết quả mong đợi**: `200 OK`

---

### 5.11 Chuyển trạng thái PLANNED → ACTIVE
```
PUT http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "ACTIVE"`

---

### 5.12 Chuyển trạng thái ACTIVE → COMPLETED
```
PUT http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "COMPLETED"`

---

### 5.13 Hủy ca - có lý do (MANAGER)
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Thiếu nhân lực, không thể tổ chức ca này"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "CANCELLED"`, `cancelReason: "Thiếu nhân lực..."`

---

### 5.14 Hủy ca - không có lý do
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{}
```
**Kết quả mong đợi**: `400 Bad Request` — "Reason is required when cancelling a shift"

---

### 5.15 Hủy ca đã COMPLETED
```
DELETE http://localhost:3000/api/staff/shifts/<completedShiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Thử hủy ca đã hoàn thành"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Cannot cancel a shift that has already been completed"

---

## Nhóm 6: Phân công ca (Shift Assignments)

> Cần 1 ca ở trạng thái PLANNED/ACTIVE và nhân viên PART_TIME đã có availability phù hợp.

### 6.1 Phân công nhân viên vào ca - thành công
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<partTimeEmployeeId>"
}
```
**Kết quả mong đợi**: `201 Created`, `assignmentStatus: "ASSIGNED"`

---

### 6.2 Phân công trùng - đã được assign ca này rồi
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<partTimeEmployeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee is already assigned to this shift"

---

### 6.3 Phân công - conflict giờ (nhân viên đã có ca khác trùng giờ cùng ngày)

Tạo ca thứ 2 cùng ngày, trùng giờ, rồi assign cùng nhân viên:
```
POST http://localhost:3000/api/staff/shifts/<shiftId2>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<partTimeEmployeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Schedule conflict: employee already has shift..."

---

### 6.4 Phân công - ngày không khớp availability
```
POST http://localhost:3000/api/staff/shifts/<shiftIdWrongDay>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<partTimeEmployeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee is not available on ..."

---

### 6.5 Phân công FULL_TIME - vượt 40h/tuần
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<fullTimeEmployeeId>"
}
```
> Trước đó đã assign nhân viên FULL_TIME này vào các ca trong cùng tuần với tổng ≥ 40h
**Kết quả mong đợi**: `400 Bad Request` — "Cannot assign: employee would exceed 40h/week (current: 40.0h, new shift: 4.0h)"

---

### 6.6 Phân công - nhân viên chưa có tài khoản
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<employeeId chưa có accountId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Cannot assign employee who does not have an account yet"

---

### 6.6 Phân công - nhân viên INACTIVE
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<inactiveEmployeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Cannot assign an inactive employee to a shift"

---

### 6.7 Phân công - ca đã COMPLETED hoặc CANCELLED
```
POST http://localhost:3000/api/staff/shifts/<completedShiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<employeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Cannot assign employee to a shift that is not PLANNED or ACTIVE"

---

### 6.8 Xem danh sách phân công của ca
```
GET http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách assignments với `assignmentStatus`

---

### 6.9 Hủy phân công (soft delete → CANCELLED)
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>/assignments/<employeeId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, `assignmentStatus: "CANCELLED"` (record vẫn còn trong DB)

---

### 6.10 Hủy phân công - không tìm thấy hoặc đã hủy
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>/assignments/nonexistent-employee
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `404 Not Found` — "Assignment not found or already cancelled"

---

## Nhóm 7: Chấm công (Attendance)

> Flow chuẩn: Assign → Check-in → Check-out → Xem attendance

### 7.1 Check-in đúng giờ (ON_TIME)

STAFF tự check-in (gọi trước hoặc trong vòng 15 phút đầu của `startTime`):
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "ON_TIME"`

MANAGER check-in thay cho nhân viên:
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>",
  "employeeId": "<employeeId>"
}
```

---

### 7.2 Check-in trễ (LATE)

Gọi sau 15 phút kể từ `startTime`:
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "LATE"`

---

### 7.3 Check-in - chưa được phân công
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftIdNotAssigned>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee is not assigned to this shift"

---

### 7.4 Check-in - đã check-in rồi
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "Employee has already checked in for this shift"

---

### 7.5 Check-out thành công
```
POST http://localhost:3000/api/staff/attendance/check-out
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `200 OK`, có `checkOutTime`, `actualHours` được tính tự động

---

### 7.6 Check-out sớm (EARLY_LEAVE)

Gọi trước 15 phút kể từ `endTime`:
```
POST http://localhost:3000/api/staff/attendance/check-out
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `200 OK`, `status: "EARLY_LEAVE"`

---

### 7.7 Check-out - chưa check-in
```
POST http://localhost:3000/api/staff/attendance/check-out
Authorization: Bearer <parttime_staff_token>
Content-Type: application/json

{
  "shiftId": "<shiftIdNotCheckedIn>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — "No check-in record found for this shift"

---

### 7.8 Xem lịch sử chấm công của nhân viên (MANAGER)
```
GET http://localhost:3000/api/staff/attendance/employee/<employeeId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách attendance records sắp xếp mới nhất trước

---

### 7.9 Filter lịch sử theo ngày
```
GET http://localhost:3000/api/staff/attendance/employee/<employeeId>?dateFrom=2026-03-01&dateTo=2026-03-31
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ records trong tháng 3/2026

---

### 7.10 STAFF xem attendance của bản thân
```
GET http://localhost:3000/api/staff/attendance/employee/<ownEmployeeId>
Authorization: Bearer <staff_token>
```
**Kết quả mong đợi**: `200 OK`

---

### 7.11 STAFF xem attendance của người khác - bị từ chối
```
GET http://localhost:3000/api/staff/attendance/employee/<otherEmployeeId>
Authorization: Bearer <staff_token>
```
**Kết quả mong đợi**: `403 Forbidden` — "You can only view your own attendance records"

---

### 7.12 Tổng kết chấm công theo tháng (MANAGER)
```
GET http://localhost:3000/api/staff/attendance/summary?employeeId=<employeeId>&month=3&year=2026
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`
```json
{
  "employeeId": "...",
  "month": 3,
  "year": 2026,
  "totalShifts": 10,
  "totalHours": 45.5,
  "onTime": 8,
  "late": 2,
  "earlyLeave": 1,
  "records": [...]
}
```

---

## Tóm tắt Endpoints

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/staff/employees` | MANAGER | Tạo nhân viên |
| GET | `/api/staff/employees` | Auth | Danh sách (filter, pagination) |
| GET | `/api/staff/employees/:id` | Auth | Chi tiết nhân viên |
| GET | `/api/staff/employees/by-account/:accountId` | Auth | Tìm theo accountId |
| PUT | `/api/staff/employees/:id` | MANAGER | Cập nhật thông tin |
| PUT | `/api/staff/employees/:id/deactivate` | MANAGER | Vô hiệu hóa (bắt buộc `reason`) |
| PUT | `/api/staff/employees/:id/activate` | MANAGER | Kích hoạt lại (bắt buộc `reason`) |
| GET | `/api/staff/employees/:id/availability` | Auth | Xem lịch rảnh |
| PUT | `/api/staff/employees/:id/availability` | STAFF (PART_TIME only) | Tự cập nhật lịch rảnh |
| GET | `/api/staff/employees/:id/shifts` | Auth | Ca làm của nhân viên |
| POST | `/api/staff/shifts` | MANAGER | Tạo ca |
| GET | `/api/staff/shifts` | Auth | Danh sách ca |
| GET | `/api/staff/shifts/:id` | Auth | Chi tiết ca + assignments |
| PUT | `/api/staff/shifts/:id` | MANAGER | Cập nhật ca |
| DELETE | `/api/staff/shifts/:id` | MANAGER | Hủy ca (soft) |
| POST | `/api/staff/shifts/:id/assignments` | MANAGER | Phân công nhân viên |
| GET | `/api/staff/shifts/:id/assignments` | Auth | Xem phân công |
| DELETE | `/api/staff/shifts/:id/assignments/:employeeId` | MANAGER | Hủy phân công (soft) |
| POST | `/api/staff/attendance/check-in` | STAFF/MANAGER | Check-in |
| POST | `/api/staff/attendance/check-out` | STAFF/MANAGER | Check-out |
| GET | `/api/staff/attendance/employee/:id` | Auth | Lịch sử chấm công |
| GET | `/api/staff/attendance/summary` | MANAGER | Tổng kết theo tháng |

---

## Ghi chú quan trọng

- **Dang nhap**: Dung `username` + `password` (khong phai email)
- **FULL_TIME**: Không được set availability; manager gán ca tùy ý nhưng tổng giờ/tuần không vượt 40h (mặc định `maxWorkingHours=40`)
- **PART_TIME**: Chỉ staff tự cập nhật availability của bản thân; manager không được cập nhật lịch rảnh của staff
- **Trạng thái ca tự động**: PLANNED → ACTIVE → COMPLETED theo thời gian thực; manager hủy → CANCELLED (bắt buộc `reason`)
- **Deactivate/Activate**: Cả hai đều bắt buộc nhập `reason`. Nhân viên INACTIVE không thể được phân công hoặc check-in
- **Thong bao INACTIVE**: Sau khi staff dang nhap, frontend goi `/by-account/:accountId` de lay `status` va `inactiveReason` va hien thi thong bao
- **Soft delete**: Assignment huy giu record voi `assignmentStatus: "CANCELLED"`, ca huy giu `status: "CANCELLED"`
- **ADMIN**: Khong co quyen truy cap staff-service — chi MANAGER va STAFF
