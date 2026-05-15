# Staff Service API Test Guide

Base URL (qua Gateway): `http://localhost:3000`
Staff Service trực tiếp: `http://localhost:3007`

> **Lưu ý**: Tất cả request (trừ Login) phải có header `Authorization: Bearer <accessToken>`

---

## Tài khoản thực tế

| Username | Password | Role | Loại | employeeId |
|---|---|---|---|---|
| `manager01` | `Man@123` | MANAGER | — | — |
| `nhanvien01` | `123456` | EMPLOYEE | FULL_TIME | EMP-007 |
| `parttime01` | `123456` | EMPLOYEE | PART_TIME | EMP-013 |

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
  "username": "parttime01",
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
  "username": "nhanvien01",
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
  "fullName": "Nguyen Van B",
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
  "fullName": "Tran Thi D",
  "position": "CASHIER",
  "employeeType": "PART_TIME",
  "maxWorkingHours": 20
}
```
**Kết quả mong đợi**: `201 Created` → lưu `employeeId`, `accountId: null`

---

### 1.3 Tạo nhân viên - EMPLOYEE không có quyền
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <nhanvien01_token>
Content-Type: application/json

{
  "fullName": "Le Van C",
  "position": "WAITER",
  "employeeType": "PART_TIME"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 1.4 Tạo nhân viên - thiếu trường bắt buộc
```
POST http://localhost:3000/api/staff/employees
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "fullName": "Le Van D"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Họ tên, vị trí và loại nhân viên là bắt buộc"`

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

### 1.9 Filter nhân viên chưa có tài khoản
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
**Kết quả mong đợi**: `200 OK`, chỉ trả về EMP-007 (nhanvien01) và EMP-013 (parttime01)

---

### 1.11 Lấy chi tiết nhân viên
```
GET http://localhost:3000/api/staff/employees/EMP-007
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` — thông tin Nguyen Van A, `employeeType: "FULL_TIME"`

---

### 1.12 Lấy chi tiết - không tồn tại
```
GET http://localhost:3000/api/staff/employees/nonexistent-id
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `404 Not Found` — `"Không tìm thấy nhân viên"`

---

### 1.13 Cập nhật thông tin nhân viên (MANAGER)
```
PUT http://localhost:3000/api/staff/employees/EMP-007
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "position": "WAITER"
}
```
**Kết quả mong đợi**: `200 OK` với thông tin đã cập nhật

---

### 1.14 Gắn accountId vào hồ sơ nhân viên
```
PUT http://localhost:3000/api/staff/employees/<employeeId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "accountId": "<accountId nhận từ auth-service>"
}
```
**Kết quả mong đợi**: `200 OK`, `accountId` được cập nhật

---

### 1.15 Gắn accountId đã thuộc nhân viên khác
```
PUT http://localhost:3000/api/staff/employees/<employeeId2>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "accountId": "2e2e5688-477f-11f1-9d16-1e906c3b3997"
}
```
**Kết quả mong đợi**: `409 Conflict` — `"Tài khoản này đã được liên kết với nhân viên khác"`

---

### 1.16 Cập nhật nhân viên - EMPLOYEE không có quyền
```
PUT http://localhost:3000/api/staff/employees/EMP-013
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "fullName": "Hacked Name"
}
```
**Kết quả mong đợi**: `403 Forbidden`

---

### 1.17 Lấy nhân viên theo accountId
```
GET http://localhost:3000/api/staff/employees/by-account/2e2e5688-477f-11f1-9d16-1e906c3b3997
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` — trả về EMP-007 Nguyen Van A

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
**Kết quả mong đợi**: `400 Bad Request` — `"Vui lòng nhập lý do khi vô hiệu hóa nhân viên"`

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
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên đã ở trạng thái không hoạt động"`

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
**Kết quả mong đợi**: `200 OK`, `status: "ACTIVE"`, `inactiveReason: null`

---

### 2.5 Activate nhân viên - không có lý do
```
PUT http://localhost:3000/api/staff/employees/<inactiveEmployeeId>/activate
Authorization: Bearer <manager_token>
Content-Type: application/json

{}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Vui lòng nhập lý do khi kích hoạt lại nhân viên"`

---

### 2.6 Activate nhân viên đã ACTIVE
```
PUT http://localhost:3000/api/staff/employees/EMP-007/activate
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Test"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên đã ở trạng thái hoạt động"`

---

### 2.7 Kiểm tra thông báo INACTIVE khi staff đăng nhập

Sau khi deactivate nhân viên, staff đăng nhập bình thường rồi frontend gọi:
```
GET http://localhost:3000/api/staff/employees/by-account/<accountId>
Authorization: Bearer <staff_token>
```
**Kết quả mong đợi**: `200 OK` với `status: "INACTIVE"` và `inactiveReason: "<lý do manager nhập>"`.
Frontend đọc hai field này và hiển thị thông báo cho nhân viên.

---

## Nhóm 3: Employee Availability

> **Quy tắc**:
> - Chỉ nhân viên **PART_TIME** mới được cập nhật lịch rảnh (role EMPLOYEE)
> - **FULL_TIME** không cần và không được phép set availability
> - EMPLOYEE chỉ được cập nhật lịch rảnh của **chính mình**

### 3.1 Xem lịch rảnh của nhân viên
```
GET http://localhost:3000/api/staff/employees/EMP-013/availability
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK` với `availableDays` và `availableTimeRanges`

---

### 3.2 PART_TIME tự cập nhật lịch rảnh của bản thân
```
PUT http://localhost:3000/api/staff/employees/EMP-013/availability
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "availableDays": ["MON", "WED", "FRI", "SAT"],
  "availableTimeRanges": [
    { "start": "08:00", "end": "12:00" },
    { "start": "13:00", "end": "17:00" }
  ]
}
```
**Kết quả mong đợi**: `200 OK` — `"Cập nhật lịch rảnh thành công"`

---

### 3.3 PART_TIME cập nhật lịch rảnh của người khác - bị từ chối
```
PUT http://localhost:3000/api/staff/employees/EMP-007/availability
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "availableDays": ["TUE"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `403 Forbidden` — `"Bạn chỉ có thể cập nhật lịch rảnh của bản thân"`

---

### 3.4 FULL_TIME cập nhật lịch rảnh - bị từ chối
```
PUT http://localhost:3000/api/staff/employees/EMP-007/availability
Authorization: Bearer <nhanvien01_token>
Content-Type: application/json

{
  "availableDays": ["MON"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên toàn thời gian không cần đặt lịch rảnh"`

---

### 3.5 MANAGER cập nhật lịch rảnh cho PART_TIME
```
PUT http://localhost:3000/api/staff/employees/EMP-013/availability
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
PUT http://localhost:3000/api/staff/employees/EMP-007/availability
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "availableDays": ["MON"],
  "availableTimeRanges": []
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên toàn thời gian không cần đặt lịch rảnh"`

---

## Nhóm 4: Ca làm việc của nhân viên

### 4.1 Xem danh sách ca của nhân viên
```
GET http://localhost:3000/api/staff/employees/EMP-007/shifts
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách ca được phân công

---

### 4.2 Filter ca theo ngày
```
GET http://localhost:3000/api/staff/employees/EMP-007/shifts?date=2026-05-15
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ ca ngày 15/05/2026

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
  "workingDate": "2026-05-20"
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
  "shiftName": "Ca lỗi",
  "startTime": "14:00",
  "endTime": "08:00",
  "workingDate": "2026-05-20"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Giờ bắt đầu phải trước giờ kết thúc"`

---

### 5.3 Tạo ca - workingDate là ngày quá khứ
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca quá khứ",
  "startTime": "08:00",
  "endTime": "12:00",
  "workingDate": "2025-01-01"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Ngày làm việc không được là ngày trong quá khứ"`

---

### 5.4 Tạo ca - EMPLOYEE không có quyền
```
POST http://localhost:3000/api/staff/shifts
Authorization: Bearer <nhanvien01_token>
Content-Type: application/json

{
  "shiftName": "Ca thử",
  "startTime": "08:00",
  "endTime": "12:00",
  "workingDate": "2026-05-20"
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
GET http://localhost:3000/api/staff/shifts?date=2026-05-20
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ ca ngày 20/05

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
**Kết quả mong đợi**: `404 Not Found` — `"Không tìm thấy ca làm việc"`

---

### 5.10 Cập nhật tên ca
```
PUT http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftName": "Ca sáng thứ 6 (đã sửa)"
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

### 5.12 Hủy ca - có lý do (MANAGER)
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

### 5.13 Hủy ca - không có lý do
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Vui lòng nhập lý do khi hủy ca làm việc"`

---

### 5.14 Hủy ca đã COMPLETED
```
DELETE http://localhost:3000/api/staff/shifts/<completedShiftId>
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "reason": "Thử hủy ca đã hoàn thành"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Không thể hủy ca làm việc đã hoàn thành"`

---

## Nhóm 6: Phân công ca (Shift Assignments)

> Cần 1 ca ở trạng thái PLANNED/ACTIVE và nhân viên đã có tài khoản + availability phù hợp.

### 6.1 Phân công nhân viên vào ca - thành công
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "EMP-013"
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
  "employeeId": "EMP-013"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên đã được gán vào ca này"`

---

### 6.3 Phân công - conflict giờ (trùng giờ cùng ngày)

Tạo ca thứ 2 cùng ngày trùng giờ, rồi assign cùng nhân viên:
```
POST http://localhost:3000/api/staff/shifts/<shiftId2>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "EMP-013"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Xung đột lịch: nhân viên đã có ca \"...\" (...) vào ngày ..."`

---

### 6.4 Phân công - ngày không khớp availability
```
POST http://localhost:3000/api/staff/shifts/<shiftIdWrongDay>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "EMP-013"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên không rảnh vào ... (ngày làm: ...)"`

---

### 6.5 Phân công FULL_TIME - vượt 40h/tuần
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "EMP-007"
}
```
> Trước đó đã assign EMP-007 vào các ca trong cùng tuần với tổng ≥ 40h

**Kết quả mong đợi**: `400 Bad Request` — `"Không thể gán: nhân viên sẽ vượt quá 40h/tuần (hiện tại: 40.0h, ca mới: Xh)"`

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
**Kết quả mong đợi**: `400 Bad Request` — `"Không thể gán nhân viên chưa có tài khoản"`

---

### 6.7 Phân công - nhân viên INACTIVE
```
POST http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "<inactiveEmployeeId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Không thể gán nhân viên không hoạt động vào ca"`

---

### 6.8 Phân công - ca đã COMPLETED hoặc CANCELLED
```
POST http://localhost:3000/api/staff/shifts/<completedShiftId>/assignments
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "employeeId": "EMP-007"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Không thể gán nhân viên vào ca không ở trạng thái PLANNED hoặc ACTIVE"`

---

### 6.9 Xem danh sách phân công của ca
```
GET http://localhost:3000/api/staff/shifts/<shiftId>/assignments
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách assignments với `assignmentStatus`

---

### 6.10 Hủy phân công (soft delete → CANCELLED)
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>/assignments/<employeeId>
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, `assignmentStatus: "CANCELLED"` (record vẫn còn trong DB)

---

### 6.11 Hủy phân công - không tìm thấy hoặc đã hủy
```
DELETE http://localhost:3000/api/staff/shifts/<shiftId>/assignments/nonexistent-employee
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `404 Not Found` — `"Không tìm thấy phân công hoặc đã bị hủy"`

---

## Nhóm 7: Chấm công (Attendance)

> Flow chuẩn: Assign → Check-in → Check-out → Xem attendance

### 7.1 Check-in đúng giờ (ON_TIME)

EMPLOYEE tự check-in (trong vòng 15 phút đầu của `startTime`):
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `201 Created`, `status: "ON_TIME"` — `"Chấm công vào thành công"`

MANAGER check-in thay cho nhân viên:
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>",
  "employeeId": "EMP-013"
}
```

---

### 7.2 Check-in trễ (LATE)

Gọi sau 15 phút kể từ `startTime`:
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime01_token>
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
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "shiftId": "<shiftIdNotAssigned>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên chưa được phân công vào ca này"`

---

### 7.4 Check-in - đã check-in rồi
```
POST http://localhost:3000/api/staff/attendance/check-in
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Nhân viên đã chấm công vào ca này"`

---

### 7.5 Check-out thành công
```
POST http://localhost:3000/api/staff/attendance/check-out
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "shiftId": "<shiftId>"
}
```
**Kết quả mong đợi**: `200 OK`, có `checkOutTime`, `actualHours` — `"Chấm công ra thành công"`

---

### 7.6 Check-out sớm (EARLY_LEAVE)

Gọi trước 15 phút kể từ `endTime`:
```
POST http://localhost:3000/api/staff/attendance/check-out
Authorization: Bearer <parttime01_token>
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
Authorization: Bearer <parttime01_token>
Content-Type: application/json

{
  "shiftId": "<shiftIdNotCheckedIn>"
}
```
**Kết quả mong đợi**: `400 Bad Request` — `"Không tìm thấy bản ghi chấm công vào cho ca này"`

---

### 7.8 Xem lịch sử chấm công của nhân viên (MANAGER)
```
GET http://localhost:3000/api/staff/attendance/employee/EMP-013
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, danh sách attendance records sắp xếp mới nhất trước

---

### 7.9 Filter lịch sử theo ngày
```
GET http://localhost:3000/api/staff/attendance/employee/EMP-013?dateFrom=2026-05-01&dateTo=2026-05-31
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`, chỉ records trong tháng 5/2026

---

### 7.10 EMPLOYEE xem attendance của bản thân
```
GET http://localhost:3000/api/staff/attendance/employee/EMP-013
Authorization: Bearer <parttime01_token>
```
**Kết quả mong đợi**: `200 OK`

---

### 7.11 EMPLOYEE xem attendance của người khác - bị từ chối
```
GET http://localhost:3000/api/staff/attendance/employee/EMP-007
Authorization: Bearer <parttime01_token>
```
**Kết quả mong đợi**: `403 Forbidden` — `"Bạn chỉ có thể xem lịch sử chấm công của bản thân"`

---

### 7.12 Tổng kết chấm công theo tháng (MANAGER)
```
GET http://localhost:3000/api/staff/attendance/summary?employeeId=EMP-013&month=5&year=2026
Authorization: Bearer <manager_token>
```
**Kết quả mong đợi**: `200 OK`
```json
{
  "employeeId": "EMP-013",
  "month": 5,
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
| PUT | `/api/staff/employees/:id/availability` | EMPLOYEE (PART_TIME only) | Tự cập nhật lịch rảnh |
| GET | `/api/staff/employees/:id/shifts` | Auth | Ca làm của nhân viên |
| POST | `/api/staff/shifts` | MANAGER | Tạo ca |
| GET | `/api/staff/shifts` | Auth | Danh sách ca |
| GET | `/api/staff/shifts/:id` | Auth | Chi tiết ca + assignments |
| PUT | `/api/staff/shifts/:id` | MANAGER | Cập nhật ca |
| DELETE | `/api/staff/shifts/:id` | MANAGER | Hủy ca (soft, bắt buộc `reason`) |
| POST | `/api/staff/shifts/:id/assignments` | MANAGER | Phân công nhân viên |
| GET | `/api/staff/shifts/:id/assignments` | Auth | Xem phân công |
| DELETE | `/api/staff/shifts/:id/assignments/:employeeId` | MANAGER | Hủy phân công (soft) |
| POST | `/api/staff/attendance/check-in` | EMPLOYEE/MANAGER | Check-in |
| POST | `/api/staff/attendance/check-out` | EMPLOYEE/MANAGER | Check-out |
| GET | `/api/staff/attendance/employee/:id` | Auth | Lịch sử chấm công |
| GET | `/api/staff/attendance/summary` | MANAGER | Tổng kết theo tháng |

---

## Ghi chú quan trọng

- **Đăng nhập**: Dùng `username` + `password` (không phải email)
- **Role thực tế**: Hệ thống có ADMIN, MANAGER, EMPLOYEE, CUSTOMER — không có role STAFF
- **FULL_TIME** (EMP-007 / nhanvien01): Không được set availability; manager gán ca tùy ý nhưng tổng giờ/tuần không vượt 40h
- **PART_TIME** (EMP-013 / parttime01): Chỉ EMPLOYEE tự cập nhật availability của bản thân; manager không được cập nhật
- **Trạng thái ca tự động**: PLANNED → ACTIVE → COMPLETED theo thời gian thực; hủy → CANCELLED (bắt buộc `reason`)
- **Deactivate/Activate**: Cả hai đều bắt buộc nhập `reason`; nhân viên INACTIVE không thể được phân công hoặc check-in
- **Thông báo INACTIVE**: Sau khi staff đăng nhập, frontend gọi `/by-account/:accountId` để lấy `status` và `inactiveReason` và hiển thị thông báo
- **Soft delete**: Assignment hủy giữ record với `assignmentStatus: "CANCELLED"`; ca hủy giữ `status: "CANCELLED"`
- **Tất cả thông báo lỗi trả về tiếng Việt**
