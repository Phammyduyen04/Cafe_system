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

-- Khách hàng mẫu (không có account liên kết)
INSERT IGNORE INTO customers (customer_id, full_name, email, phone_number, points, customer_type, account_id, customer_status) VALUES
  ('271b98ec-26a0-11f1-b826-fedf79f60332', 'Nguyễn Minh Anh', 'minhanh@gmail.com',   '0901234567', 150, 'REGULAR', NULL, 'ACTIVE'),
  ('271b9e4a-26a0-11f1-b826-fedf79f60332', 'Trần Thanh Huy',  'thanhhuy@gmail.com',  '0912345678', 80,  'REGULAR', NULL, 'ACTIVE'),
  ('271bb35f-26a0-11f1-b826-fedf79f60332', 'Lê Bảo Châu',     'baochau@gmail.com',   '0923456789', 320, 'VIP',     NULL, 'ACTIVE'),
  ('271bb5fb-26a0-11f1-b826-fedf79f60332', 'Phạm Thị Hồng',   'hong.pham@gmail.com', '0934567890', 50,  'REGULAR', NULL, 'ACTIVE'),
  ('271bb734-26a0-11f1-b826-fedf79f60332', 'Võ Hoàng Dũng',   'hoangdung@gmail.com', '0945678901', 200, 'VIP',     NULL, 'ACTIVE');

-- Khách hàng đã đăng ký qua Google/Email (account_id liên kết với auth_db)
INSERT IGNORE INTO customers (customer_id, full_name, email, phone_number, points, customer_type, account_id, customer_status) VALUES
  ('849af837-b432-4e74-929b-c49cec7583fa', 'Phạm Mỹ Dung',   'tdlop10a8pmdung@gmail.com', NULL, 0, 'REGULAR', '1d5fcc83-3b84-4967-b598-61ad4dca356c', 'ACTIVE'),
  ('e8d481e6-09a7-4531-bda2-4de491840490', 'Mỹ Duyên Phạm',  'pmd20040412@gmail.com',     NULL, 0, 'REGULAR', '531a2d5b-0eea-4bec-a992-a2a5b9775e3b', 'ACTIVE'),
  ('ed83bdc8-f8bd-4f77-be0d-bbd6872099d2', 'Tú Vy Lê',       'letuvy399@gmail.com',       NULL, 0, 'REGULAR', '529816ca-8ff8-4c60-b460-8243524f01f5', 'ACTIVE');
