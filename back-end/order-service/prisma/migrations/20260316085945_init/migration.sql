-- CreateTable
CREATE TABLE `orders` (
    `order_id` VARCHAR(36) NOT NULL,
    `customer_id` VARCHAR(36) NULL,
    `order_code` VARCHAR(50) NOT NULL,
    `order_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order_type` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `subtotal_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `promotion_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `created_by` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_details` (
    `order_detail_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(50) NOT NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `item_note` VARCHAR(255) NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`order_detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item_toppings` (
    `order_item_topping_id` VARCHAR(36) NOT NULL,
    `order_item_id` VARCHAR(191) NOT NULL,
    `topping_name` VARCHAR(200) NOT NULL,
    `topping_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`order_item_topping_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_logs` (
    `status_log_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `old_status` VARCHAR(20) NULL,
    `new_status` VARCHAR(20) NOT NULL,
    `changed_by` VARCHAR(100) NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(255) NULL,

    PRIMARY KEY (`status_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_discounts` (
    `order_discount_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `discount_id` VARCHAR(50) NOT NULL,
    `discount_name` VARCHAR(200) NOT NULL,
    `discount_type` VARCHAR(20) NOT NULL,
    `discount_value` DECIMAL(12, 2) NOT NULL,
    `applied_amount` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`order_discount_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_promotions` (
    `order_promotion_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `promotion_id` VARCHAR(50) NOT NULL,
    `promotion_name` VARCHAR(200) NOT NULL,
    `benefit_type` VARCHAR(50) NOT NULL,
    `benefit_value` DECIMAL(12, 2) NOT NULL,
    `applied_amount` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`order_promotion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_details` ADD CONSTRAINT `order_details_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item_toppings` ADD CONSTRAINT `order_item_toppings_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_details`(`order_detail_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_logs` ADD CONSTRAINT `order_status_logs_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_discounts` ADD CONSTRAINT `order_discounts_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_promotions` ADD CONSTRAINT `order_promotions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;
