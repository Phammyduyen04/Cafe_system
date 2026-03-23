-- ================================================
-- Tạo databases
-- ================================================
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS customer_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS payment_db;

-- ================================================
-- PAYMENT_DB — Seed phương thức thanh toán
-- ================================================
USE payment_db;

CREATE TABLE IF NOT EXISTS payment_methods (
  payment_method_id VARCHAR(36) PRIMARY KEY,
  method_code       VARCHAR(20) NOT NULL UNIQUE,
  method_name       VARCHAR(100) NOT NULL,
  is_active         TINYINT(1) DEFAULT 1,
  description       VARCHAR(255) DEFAULT NULL
);

INSERT IGNORE INTO payment_methods (payment_method_id, method_code, method_name, is_active, description) VALUES
  (UUID(), 'CASH', 'Tiền mặt',   1, 'Thanh toán bằng tiền mặt tại quầy'),
  (UUID(), 'MOMO', 'Ví MoMo',    1, 'Thanh toán qua ví điện tử MoMo'),
  (UUID(), 'QR',   'Chuyển khoản QR', 1, 'Thanh toán qua mã QR ngân hàng (VietQR)');

-- ================================================
-- CUSTOMER_DB — Seed khách hàng mẫu
-- ================================================
USE customer_db;

CREATE TABLE IF NOT EXISTS customers (
  customer_id     VARCHAR(36) PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE,
  phone_number    VARCHAR(20) UNIQUE,
  points          INT DEFAULT 0,
  customer_type   VARCHAR(20) DEFAULT 'REGULAR',
  account_id      VARCHAR(36) UNIQUE,
  customer_status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO customers (customer_id, full_name, email, phone_number, points, customer_type, customer_status) VALUES
  (UUID(), 'Nguyễn Minh Anh',  'minhanh@gmail.com',   '0901234567', 150, 'REGULAR', 'ACTIVE'),
  (UUID(), 'Trần Thanh Huy',   'thanhhuy@gmail.com',   '0912345678', 80,  'REGULAR', 'ACTIVE'),
  (UUID(), 'Lê Bảo Châu',      'baochau@gmail.com',    '0923456789', 320, 'VIP',     'ACTIVE'),
  (UUID(), 'Phạm Thị Hồng',    'hong.pham@gmail.com',  '0934567890', 50,  'REGULAR', 'ACTIVE'),
  (UUID(), 'Võ Hoàng Dũng',    'hoangdung@gmail.com',  '0945678901', 200, 'VIP',     'ACTIVE');
