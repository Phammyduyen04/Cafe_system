-- AlterTable
ALTER TABLE `accounts` ADD COLUMN `google_id` VARCHAR(255) NULL,
    MODIFY `password_hash` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `accounts_google_id_key` ON `accounts`(`google_id`);
