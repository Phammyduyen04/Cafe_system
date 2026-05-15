-- CreateTable
CREATE TABLE `payments` (
    `payment_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `remaining_amount` DECIMAL(12, 2) NOT NULL,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `payment_method` VARCHAR(20) NOT NULL DEFAULT 'CASH',
    `payment_url` TEXT NULL,
    `provider_order_id` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_order_id_key`(`order_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_sessions` (
    `payment_session_id` VARCHAR(36) NOT NULL,
    `payment_id` VARCHAR(36) NOT NULL,
    `session_code` VARCHAR(50) NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expired_at` DATETIME(3) NOT NULL,
    `ended_at` DATETIME(3) NULL,
    `session_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `initiated_by` VARCHAR(100) NULL,
    `device_info` VARCHAR(255) NULL,
    `note` TEXT NULL,

    UNIQUE INDEX `payment_sessions_session_code_key`(`session_code`),
    PRIMARY KEY (`payment_session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `transaction_id` VARCHAR(36) NOT NULL,
    `payment_session_id` VARCHAR(36) NOT NULL,
    `payment_method_id` VARCHAR(36) NOT NULL,
    `transaction_code` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `transaction_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `gateway_response` TEXT NULL,
    `note` VARCHAR(255) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_transactions_transaction_code_key`(`transaction_code`),
    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `payment_method_id` VARCHAR(36) NOT NULL,
    `method_code` VARCHAR(20) NOT NULL,
    `method_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `payment_methods_method_code_key`(`method_code`),
    PRIMARY KEY (`payment_method_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_sessions` ADD CONSTRAINT `payment_sessions_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`payment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_payment_session_id_fkey` FOREIGN KEY (`payment_session_id`) REFERENCES `payment_sessions`(`payment_session_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`payment_method_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
