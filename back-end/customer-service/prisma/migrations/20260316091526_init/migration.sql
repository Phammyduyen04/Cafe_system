-- CreateTable
CREATE TABLE `customers` (
    `customer_id` VARCHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone_number` VARCHAR(20) NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `account_id` VARCHAR(36) NULL,
    `customer_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_phone_number_key`(`phone_number`),
    UNIQUE INDEX `customers_account_id_key`(`account_id`),
    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_point_logs` (
    `point_log_id` VARCHAR(36) NOT NULL,
    `customer_id` VARCHAR(191) NOT NULL,
    `change_type` VARCHAR(20) NOT NULL,
    `points_changed` INTEGER NOT NULL,
    `reason` VARCHAR(255) NULL,
    `order_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`point_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_point_logs` ADD CONSTRAINT `customer_point_logs_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;
