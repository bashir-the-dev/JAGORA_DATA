-- ============================================================================
-- Al'amin Jagora Data VTU & Telecom Reseller Platform
-- MySQL Database Schema for cPanel Hosting
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+01:00"; -- West Africa Time (Lagos)

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `username` VARCHAR(50) NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `full_name` VARCHAR(100) NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `pin` VARCHAR(255) NOT NULL,
  `transaction_pin` VARCHAR(255) NULL,
  `auth_token` VARCHAR(255) NULL,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `bonus_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `referral_code` VARCHAR(32) NULL UNIQUE,
  `referred_by` VARCHAR(32) NULL,
  `referral_rewarded` TINYINT(1) NOT NULL DEFAULT 0,
  `role` ENUM('user', 'agent', 'admin') NOT NULL DEFAULT 'user',
  `status` ENUM('active', 'suspended', 'deactivated') NOT NULL DEFAULT 'active',
  `account_tier` VARCHAR(30) NOT NULL DEFAULT 'Standard',
  `bvn_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `nin_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `virtual_accounts` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_phone` (`phone`),
  INDEX `idx_user_username` (`username`),
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_status` (`status`),
  INDEX `idx_user_auth_token` (`auth_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: transactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reference` VARCHAR(100) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL,
  `user_phone` VARCHAR(20) NOT NULL DEFAULT '',
  `type` VARCHAR(50) NOT NULL COMMENT 'DATA, AIRTIME, ELECTRICITY, CABLE, EXAM_PIN, WALLET_FUNDING',
  `title` VARCHAR(150) NOT NULL,
  `description` VARCHAR(255) NULL,
  `recipient` VARCHAR(60) NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `charged` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `balance_before` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `balance_after` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `old_balance` DECIMAL(12, 2) NULL,
  `new_balance` DECIMAL(12, 2) NULL,
  `status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SUCCESS',
  `provider` VARCHAR(60) NOT NULL DEFAULT 'Direct',
  `token_generated` VARCHAR(255) NULL,
  `upstream_ref` VARCHAR(120) NULL,
  `upstream_reference` VARCHAR(120) NULL,
  `upstream_response` TEXT NULL,
  `extra_data` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tx_ref` (`reference`),
  INDEX `idx_tx_user_id` (`user_id`),
  INDEX `idx_tx_phone` (`user_phone`),
  INDEX `idx_tx_upstream` (`upstream_reference`),
  INDEX `idx_tx_user_history` (`user_phone`, `created_at` DESC),
  INDEX `idx_tx_userid_history` (`user_id`, `created_at` DESC),
  INDEX `idx_tx_status_type_created` (`status`, `type`, `created_at`),
  INDEX `idx_tx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: data_plans & vtu_plans (Telecom Data Bundles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `data_plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `plan_id` VARCHAR(50) NOT NULL UNIQUE,
  `network` VARCHAR(20) NOT NULL COMMENT 'mtn, glo, airtel, 9mobile',
  `type` VARCHAR(30) NOT NULL COMMENT 'SME, Gifting, Corporate Gifting',
  `size` VARCHAR(30) NOT NULL COMMENT '500MB, 1GB, 2GB, etc.',
  `price` DECIMAL(10, 2) NOT NULL,
  `validity` VARCHAR(50) NOT NULL DEFAULT '30 Days',
  `provider_code` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  INDEX `idx_plans_catalog` (`is_active`, `network`, `price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vtu_plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `provider_id` VARCHAR(50) NOT NULL DEFAULT 'payflex',
  `network` ENUM('MTN', 'GLO', 'AIRTEL', '9MOBILE') NOT NULL,
  `plan_name` VARCHAR(150) NOT NULL,
  `original_wholesale_price` DECIMAL(10, 2) NOT NULL,
  `custom_retail_price` DECIMAL(10, 2) NOT NULL,
  `api_plan_id` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `category` VARCHAR(50) NOT NULL DEFAULT 'SME',
  `size` VARCHAR(30) NOT NULL DEFAULT '1GB',
  `validity` VARCHAR(50) NOT NULL DEFAULT '30 Days',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_synced_at` TIMESTAMP NULL DEFAULT NULL,
  -- Compatibility virtual columns / aliases for older scripts
  `plan_id` VARCHAR(100) GENERATED ALWAYS AS (`api_plan_id`) VIRTUAL,
  `selling_price` DECIMAL(10, 2) GENERATED ALWAYS AS (`custom_retail_price`) VIRTUAL,
  `reseller_price` DECIMAL(10, 2) GENERATED ALWAYS AS (`original_wholesale_price`) VIRTUAL,
  `is_active` TINYINT(1) GENERATED ALWAYS AS (IF(`status` = 'active', 1, 0)) VIRTUAL,
  UNIQUE KEY `idx_provider_net_api_plan` (`provider_id`, `network`, `api_plan_id`),
  INDEX `idx_vtu_active_net_price` (`status`, `network`, `custom_retail_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: virtual_accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `virtual_accounts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(30) NOT NULL,
  `account_name` VARCHAR(150) NOT NULL,
  `reference` VARCHAR(100) NULL,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'Monnify',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_va_user_id` (`user_id`),
  INDEX `idx_va_account_number` (`account_number`),
  INDEX `idx_va_reference` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: webhook_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `provider` VARCHAR(50) NOT NULL,
  `reference` VARCHAR(100) NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `user_id` INT UNSIGNED NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'received',
  `raw_payload` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wh_provider_ref` (`provider`, `reference`),
  INDEX `idx_wh_user_id` (`user_id`),
  INDEX `idx_wh_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: settings & system_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `key_name` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value_json` JSON NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` TEXT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: feedbacks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_phone` VARCHAR(20) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: password_resets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(120) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `challenge_id` VARCHAR(64) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reset_email` (`email`),
  INDEX `idx_reset_challenge` (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Table: login_attempts (Brute-Force Attack Defense & IP Lockout)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `identifier` VARCHAR(100) NOT NULL DEFAULT 'admin',
  `attempt_count` INT NOT NULL DEFAULT 1,
  `locked_until` DATETIME NULL,
  `last_attempt_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_ip_identifier` (`ip_address`, `identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Initial Seed Data
-- ----------------------------------------------------------------------------

-- Seed Default Admin & Demo User
INSERT INTO `users` (`phone`, `name`, `email`, `password_hash`, `pin`, `balance`, `bonus_balance`, `role`)
VALUES
('08001234567', 'Bashir Abubakar', 'bashirabubakar650@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0.00, 0.00, 'admin')
ON DUPLICATE KEY UPDATE `phone`=`phone`;

-- Seed Popular Data Plans (data_plans)
INSERT INTO `data_plans` (`plan_id`, `network`, `type`, `size`, `price`, `validity`, `provider_code`, `is_active`) VALUES
('mtn-500mb', 'mtn', 'SME', '500MB', 150.00, '30 Days', 'M500MBS', 1),
('mtn-1gb', 'mtn', 'SME', '1GB', 290.00, '30 Days', 'M1GBS', 1),
('mtn-2gb', 'mtn', 'SME', '2GB', 580.00, '30 Days', 'M2GBS', 1),
('mtn-3gb', 'mtn', 'SME', '3GB', 870.00, '30 Days', 'M3GBS', 1),
('mtn-5gb', 'mtn', 'SME', '5GB', 1450.00, '30 Days', 'M5GBS', 1),
('mtn-10gb', 'mtn', 'SME', '10GB', 2900.00, '30 Days', 'M10GBS', 1),
('mtn-cg-500mb', 'mtn', 'Corporate Gifting', '500MB', 160.00, '30 Days', 'M500MBS', 1),
('mtn-cg-1gb', 'mtn', 'Corporate Gifting', '1GB', 295.00, '30 Days', 'M1GBS', 1),
('mtn-cg-2gb', 'mtn', 'Corporate Gifting', '2GB', 590.00, '30 Days', 'M2GBS', 1),
('mtn-cg-3gb', 'mtn', 'Corporate Gifting', '3GB', 885.00, '30 Days', 'M3GBS', 1),
('mtn-cg-5gb', 'mtn', 'Corporate Gifting', '5GB', 1475.00, '30 Days', 'M5GBS', 1),
('mtn-cg-10gb', 'mtn', 'Corporate Gifting', '10GB', 2950.00, '30 Days', 'M10GBS', 1),
('mtn-cg-15gb', 'mtn', 'Corporate Gifting', '15GB', 4400.00, '30 Days', 'M15GBS', 1),
('mtn-cg-20gb', 'mtn', 'Corporate Gifting', '20GB', 5850.00, '30 Days', 'M20GBS', 1),
('mtn-share-1gb-7d', 'mtn', 'Data Share', '1GB', 450.00, '7 Days', 'M1GBS', 1),
('mtn-share-2gb-7d', 'mtn', 'Data Share', '2GB', 850.00, '7 Days', 'M2GBS', 1),
('mtn-share-3gb-7d', 'mtn', 'Data Share', '3GB', 1200.00, '7 Days', 'M3GBS', 1),
('mtn-share-5gb-30d', 'mtn', 'Data Share', '5GB', 1800.00, '30 Days', 'M5GBS', 1),
('mtn-gifting-25gb', 'mtn', 'Direct Gifting', '25GB', 7500.00, '30 Days', 'M25GB', 1),
('mtn-gifting-40gb', 'mtn', 'Direct Gifting', '40GB', 11500.00, '30 Days', 'M40GB', 1),
('airtel-500mb', 'airtel', 'Corporate Gifting', '500MB', 160.00, '30 Days', 'A500MB', 1),
('airtel-1gb', 'airtel', 'Corporate Gifting', '1GB', 295.00, '30 Days', 'A1GB', 1),
('airtel-2gb', 'airtel', 'Corporate Gifting', '2GB', 590.00, '30 Days', 'A2GB2', 1),
('airtel-3gb', 'airtel', 'Corporate Gifting', '3GB', 885.00, '30 Days', 'A3GB', 1),
('airtel-4gb', 'airtel', 'Corporate Gifting', '4GB', 1180.00, '30 Days', 'A4GB', 1),
('airtel-5gb', 'airtel', 'Corporate Gifting', '5GB', 1475.00, '30 Days', 'A5GB', 1),
('airtel-10gb', 'airtel', 'Corporate Gifting', '10GB', 2950.00, '30 Days', 'A10GB', 1),
('airtel-15gb', 'airtel', 'Corporate Gifting', '15GB', 4400.00, '30 Days', 'A13GB', 1),
('airtel-20gb', 'airtel', 'Corporate Gifting', '20GB', 5850.00, '30 Days', 'A20GB', 1),
('airtel-gift-1gb-7d', 'airtel', 'Direct Gifting', '1GB', 795.00, '7 Days', 'A1GB', 1),
('airtel-gift-1.5gb-7d', 'airtel', 'Direct Gifting', '1.5GB', 995.00, '7 Days', 'A1a5GBS', 1),
('airtel-gift-8gb-30d', 'airtel', 'Direct Gifting', '8GB', 2975.00, '30 Days', 'A8GB', 1),
('airtel-gift-25gb-30d', 'airtel', 'Direct Gifting', '25GB', 7900.00, '30 Days', 'A25GB', 1),
('glo-500mb', 'glo', 'Corporate Gifting', '500MB', 150.00, '30 Days', 'G500MB', 1),
('glo-1gb', 'glo', 'Corporate Gifting', '1GB', 285.00, '30 Days', 'G1GB4', 1),
('glo-2gb', 'glo', 'Corporate Gifting', '2GB', 570.00, '30 Days', 'G2GB4', 1),
('glo-3gb', 'glo', 'Corporate Gifting', '3GB', 855.00, '30 Days', 'G3GB4', 1),
('glo-5gb', 'glo', 'Corporate Gifting', '5GB', 1425.00, '30 Days', 'G5GB4', 1),
('glo-10gb', 'glo', 'Corporate Gifting', '10GB', 2850.00, '30 Days', 'G10GB2', 1),
('glo-1.5gb', 'glo', 'Gifting Bundle', '1.5GB', 530.00, '30 Days', 'G1GB4', 1),
('glo-3gb-gift', 'glo', 'Gifting Bundle', '3GB', 1000.00, '30 Days', 'G3GB4', 1),
('glo-7gb', 'glo', 'Gifting Bundle', '7GB', 2000.00, '30 Days', 'G5GB4', 1),
('glo-14gb', 'glo', 'Gifting Bundle', '14GB', 3900.00, '30 Days', 'G10GB2', 1),
('9mob-500mb', '9mobile', 'SME', '500MB', 150.00, '30 Days', 'E500MB', 1),
('9mob-1gb', '9mobile', 'SME', '1GB', 250.00, '30 Days', 'E1GB', 1),
('9mob-1.5gb', '9mobile', 'SME', '1.5GB', 375.00, '30 Days', 'E1GB', 1),
('9mob-2gb', '9mobile', 'SME', '2GB', 500.00, '30 Days', 'E2GB', 1),
('9mob-3gb', '9mobile', 'SME', '3GB', 750.00, '30 Days', 'E3GB', 1),
('9mob-4gb', '9mobile', 'SME', '4GB', 1000.00, '30 Days', 'E3GB', 1),
('9mob-5gb', '9mobile', 'SME', '5GB', 1250.00, '30 Days', 'E5GB', 1),
('9mob-10gb', '9mobile', 'SME', '10GB', 2500.00, '30 Days', 'E10GB', 1),
('9mob-15gb', '9mobile', 'SME', '15GB', 3750.00, '30 Days', 'E15GB', 1),
('9mob-20gb', '9mobile', 'SME', '20GB', 500.00, '30 Days', 'E20GB', 1),
('9mob-40gb', '9mobile', 'SME', '40GB', 9900.00, '30 Days', 'E40GB', 1)
ON DUPLICATE KEY UPDATE `price`=VALUES(`price`);

-- Seed Popular VTU Plans (vtu_plans)
INSERT INTO `vtu_plans` (`network`, `category`, `plan_id`, `plan_name`, `selling_price`, `reseller_price`, `validity`, `is_active`) VALUES
('mtn', 'SME', 'mtn-500mb', 'MTN SME 500MB', 150.00, 145.50, '30 Days', 1),
('mtn', 'SME', 'mtn-1gb', 'MTN SME 1GB', 290.00, 281.30, '30 Days', 1),
('mtn', 'SME', 'mtn-2gb', 'MTN SME 2GB', 580.00, 562.60, '30 Days', 1),
('mtn', 'SME', 'mtn-3gb', 'MTN SME 3GB', 870.00, 843.90, '30 Days', 1),
('mtn', 'SME', 'mtn-5gb', 'MTN SME 5GB', 1450.00, 1406.50, '30 Days', 1),
('mtn', 'SME', 'mtn-10gb', 'MTN SME 10GB', 2900.00, 2813.00, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-500mb', 'MTN Corporate Gifting 500MB', 160.00, 155.20, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-1gb', 'MTN Corporate Gifting 1GB', 295.00, 286.15, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-2gb', 'MTN Corporate Gifting 2GB', 590.00, 572.30, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-3gb', 'MTN Corporate Gifting 3GB', 885.00, 858.45, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-5gb', 'MTN Corporate Gifting 5GB', 1475.00, 1430.75, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-10gb', 'MTN Corporate Gifting 10GB', 2950.00, 2861.50, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-15gb', 'MTN Corporate Gifting 15GB', 4400.00, 4268.00, '30 Days', 1),
('mtn', 'Corporate Gifting', 'mtn-cg-20gb', 'MTN Corporate Gifting 20GB', 5850.00, 5674.50, '30 Days', 1),
('mtn', 'Data Share', 'mtn-share-1gb-7d', 'MTN Data Share 1GB', 450.00, 436.50, '7 Days', 1),
('mtn', 'Data Share', 'mtn-share-2gb-7d', 'MTN Data Share 2GB', 850.00, 824.50, '7 Days', 1),
('mtn', 'Data Share', 'mtn-share-3gb-7d', 'MTN Data Share 3GB', 1200.00, 1164.00, '7 Days', 1),
('mtn', 'Data Share', 'mtn-share-5gb-30d', 'MTN Data Share 5GB', 1800.00, 1746.00, '30 Days', 1),
('mtn', 'Direct Gifting', 'mtn-gifting-25gb', 'MTN Direct Gifting 25GB', 7500.00, 7275.00, '30 Days', 1),
('mtn', 'Direct Gifting', 'mtn-gifting-40gb', 'MTN Direct Gifting 40GB', 11500.00, 11155.00, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-500mb', 'AIRTEL Corporate Gifting 500MB', 160.00, 155.20, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-1gb', 'AIRTEL Corporate Gifting 1GB', 295.00, 286.15, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-2gb', 'AIRTEL Corporate Gifting 2GB', 590.00, 572.30, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-3gb', 'AIRTEL Corporate Gifting 3GB', 885.00, 858.45, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-4gb', 'AIRTEL Corporate Gifting 4GB', 1180.00, 1144.60, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-5gb', 'AIRTEL Corporate Gifting 5GB', 1475.00, 1430.75, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-10gb', 'AIRTEL Corporate Gifting 10GB', 2950.00, 2861.50, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-15gb', 'AIRTEL Corporate Gifting 15GB', 4400.00, 4268.00, '30 Days', 1),
('airtel', 'Corporate Gifting', 'airtel-20gb', 'AIRTEL Corporate Gifting 20GB', 5850.00, 5674.50, '30 Days', 1),
('airtel', 'Direct Gifting', 'airtel-gift-1gb-7d', 'AIRTEL Direct Gifting 1GB', 795.00, 771.15, '7 Days', 1),
('airtel', 'Direct Gifting', 'airtel-gift-1.5gb-7d', 'AIRTEL Direct Gifting 1.5GB', 995.00, 965.15, '7 Days', 1),
('airtel', 'Direct Gifting', 'airtel-gift-8gb-30d', 'AIRTEL Direct Gifting 8GB', 2975.00, 2885.75, '30 Days', 1),
('airtel', 'Direct Gifting', 'airtel-gift-25gb-30d', 'AIRTEL Direct Gifting 25GB', 7900.00, 7663.00, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-500mb', 'GLO Corporate Gifting 500MB', 150.00, 145.50, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-1gb', 'GLO Corporate Gifting 1GB', 285.00, 276.45, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-2gb', 'GLO Corporate Gifting 2GB', 570.00, 552.90, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-3gb', 'GLO Corporate Gifting 3GB', 855.00, 829.35, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-5gb', 'GLO Corporate Gifting 5GB', 1425.00, 1382.25, '30 Days', 1),
('glo', 'Corporate Gifting', 'glo-10gb', 'GLO Corporate Gifting 10GB', 2850.00, 2764.50, '30 Days', 1),
('glo', 'Gifting Bundle', 'glo-1.5gb', 'GLO Gifting Bundle 1.5GB', 530.00, 514.10, '30 Days', 1),
('glo', 'Gifting Bundle', 'glo-3gb-gift', 'GLO Gifting Bundle 3GB', 1000.00, 970.00, '30 Days', 1),
('glo', 'Gifting Bundle', 'glo-7gb', 'GLO Gifting Bundle 7GB', 2000.00, 1940.00, '30 Days', 1),
('glo', 'Gifting Bundle', 'glo-14gb', 'GLO Gifting Bundle 14GB', 3900.00, 3783.00, '30 Days', 1),
('9mobile', 'SME', '9mob-500mb', '9MOBILE SME 500MB', 150.00, 145.50, '30 Days', 1),
('9mobile', 'SME', '9mob-1gb', '9MOBILE SME 1GB', 250.00, 242.50, '30 Days', 1),
('9mobile', 'SME', '9mob-1.5gb', '9MOBILE SME 1.5GB', 375.00, 363.75, '30 Days', 1),
('9mobile', 'SME', '9mob-2gb', '9MOBILE SME 2GB', 500.00, 485.00, '30 Days', 1),
('9mobile', 'SME', '9mob-3gb', '9MOBILE SME 3GB', 750.00, 727.50, '30 Days', 1),
('9mobile', 'SME', '9mob-4gb', '9MOBILE SME 4GB', 1000.00, 970.00, '30 Days', 1),
('9mobile', 'SME', '9mob-5gb', '9MOBILE SME 5GB', 1250.00, 1212.50, '30 Days', 1),
('9mobile', 'SME', '9mob-10gb', '9MOBILE SME 10GB', 2500.00, 2425.00, '30 Days', 1),
('9mobile', 'SME', '9mob-15gb', '9MOBILE SME 15GB', 3750.00, 3637.50, '30 Days', 1),
('9mobile', 'SME', '9mob-20gb', '9MOBILE SME 20GB', 500.00, 485.00, '30 Days', 1),
('9mobile', 'SME', '9mob-40gb', '9MOBILE SME 40GB', 9900.00, 9603.00, '30 Days', 1)
ON DUPLICATE KEY UPDATE `selling_price`=VALUES(`selling_price`);

-- Seed Super Admin User (Bashir Abubakar)
INSERT INTO `users` (`id`, `phone`, `username`, `name`, `full_name`, `email`, `password_hash`, `pin`, `balance`, `bonus_balance`, `role`, `status`, `account_tier`) VALUES
(1, '08123456789', 'bashir', 'Bashir Abubakar', 'Bashir Abubakar', 'bashirabubakar650@gmail.com', '$2y$10$QO9i3V1V4r8V5F.4kL6Dde4Zc6mX8F0W7g8Y4R6o2EwR3g3lQdI1f', '$2y$10$7R6A5o2.EwR3g3lQdI1f6bC8vJ2hG8zV2mwE9l1d/bBqSOm2o2jM3', 0.00, 0.00, 'admin', 'active', 'Super Admin')
ON DUPLICATE KEY UPDATE `role`='admin';

-- Seed System Settings (system_settings)
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('maintenance_mode', '0'),
('broadcast_active', '1'),
('broadcast_text', 'Welcome to Al\'amin Jagora Data! Fast, reliable data and utility recharge.'),
('broadcast_type', 'info'),
('airtime_discount_mtn', '2.5'),
('airtime_discount_airtel', '2.0'),
('airtime_discount_glo', '3.0'),
('airtime_discount_9mobile', '3.0')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- Seed Platform Settings (JSON settings)
INSERT INTO `settings` (`key_name`, `value_json`) VALUES
('platform_info', JSON_OBJECT(
  'platformName', 'Al\'amin Jagora Data',
  'tagline', 'Instant Data, Airtime & Automated Bill Payments in Nigeria',
  'supportPhone', '08031234567',
  'supportWhatsapp', '2348031234567',
  'supportEmail', 'support@alaminjagoradata.com.ng',
  'maintenanceMode', false,
  'announcement', 'Welcome to Al\'amin Jagora Data! Enjoy cheap, automated SME data delivery.'
))
ON DUPLICATE KEY UPDATE `key_name`=`key_name`;

-- ----------------------------------------------------------------------------
-- 9. Table: notifications (Broadcast & Personalized In-App Notifications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL COMMENT 'NULL for broadcast to ALL users',
  `user_phone` VARCHAR(20) NULL COMMENT 'NULL for broadcast to ALL users',
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('system', 'promo', 'wallet', 'security', 'data') NOT NULL DEFAULT 'system',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#0047cc',
  `read_users` JSON NULL COMMENT 'Array of user phones who have read this broadcast',
  `created_by` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_phone` (`user_phone`),
  INDEX `idx_notif_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Welcome Broadcast Notification
INSERT INTO `notifications` (`user_phone`, `title`, `message`, `type`, `accent_color`, `read_users`, `created_by`)
VALUES
(NULL, 'Welcome to Al\'amin Jagora Data! 🚀', 'Enjoy instant automated data delivery, cheap airtime discounts, and instant cable & bill payments 24/7.', 'system', '#0047cc', '[]', 'system')
ON DUPLICATE KEY UPDATE `id`=`id`;

COMMIT;
