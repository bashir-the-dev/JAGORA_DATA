-- ============================================================================
-- ALAMIN JAGORA DATA (AJDATA) VTU & Telecom Platform
-- MySQL Database Schema for cPanel Hosting
-- 100% Safe to Drop and Re-import cleanly into phpMyAdmin
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+01:00"; -- West Africa Time (Lagos)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables cleanly to guarantee flawless drop-and-import
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `feedbacks`;
DROP TABLE IF EXISTS `webhook_logs`;
DROP TABLE IF EXISTS `virtual_accounts`;
DROP TABLE IF EXISTS `vtu_plans`;
DROP TABLE IF EXISTS `data_plans`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;
START TRANSACTION;

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
  `require_pin_for_transactions` TINYINT(1) NOT NULL DEFAULT 0,
  `auth_token` VARCHAR(255) NULL,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `bonus_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `referral_code` VARCHAR(32) NULL UNIQUE,
  `referred_by` VARCHAR(32) NULL,
  `referral_rewarded` TINYINT(1) NOT NULL DEFAULT 0,
  `role` ENUM('user', 'agent', 'admin') NOT NULL DEFAULT 'user',
  `admin_role` VARCHAR(50) NULL DEFAULT NULL COMMENT 'super_admin, finance_agent, support_agent',
  `permissions` JSON NULL COMMENT 'Custom delegated staff capability permissions',
  `status` ENUM('active', 'suspended', 'deactivated') NOT NULL DEFAULT 'active',
  `account_tier` VARCHAR(30) NOT NULL DEFAULT 'Standard',
  `bvn_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `nin_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `bvn` VARCHAR(20) NULL,
  `nin` VARCHAR(20) NULL,
  `xixapay_customer_id` VARCHAR(100) NULL,
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

-- Seed Default Super Admin User (Bashir Abubakar)
-- Credentials: Username: admin | Email: bashirabubakar650@gmail.com | Phone: 08123456789
-- Passwords accepted: admin123, JagoraAdmin@2026, password123 | Master PIN: 9988, 1234
INSERT INTO `users` (`id`, `phone`, `username`, `name`, `full_name`, `email`, `password_hash`, `pin`, `require_pin_for_transactions`, `balance`, `bonus_balance`, `role`, `admin_role`, `status`, `account_tier`)
VALUES
(1, '08123456789', 'admin', 'Bashir Abubakar', 'Bashir Abubakar', 'bashirabubakar650@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 0.00, 0.00, 'admin', 'super_admin', 'active', 'Super Admin')
ON DUPLICATE KEY UPDATE `username`='admin', `role`='admin', `admin_role`='super_admin', `require_pin_for_transactions`=0;

-- -- Seed All 86 Live Peyflex Data Plans (data_plans) across mtn_gifting_data, glo_data, 9mobile_data, airtel_data, and mtn_data_share
INSERT INTO `data_plans` (`plan_id`, `network`, `type`, `size`, `price`, `validity`, `provider_code`, `is_active`) VALUES
('mtn_gifting_data_m110mbs', 'mtn', 'Gifting Data', '110MB', 104.42, '1 Day', 'M110MBS', 1),
('mtn_gifting_data_m1m2gb', 'mtn', 'Gifting Data', '1.2GB', 522.08, '1 Day', 'M1m2GB', 1),
('mtn_gifting_data_m2m5gbs', 'mtn', 'Gifting Data', '2.5GB', 941.85, '2 Days', 'M2m5GBS', 1),
('mtn_gifting_data_m2gbs', 'mtn', 'Gifting Data', '2GB', 785.75, '2 Days', 'M2GBS', 1),
('mtn_gifting_data_m3m2gbs', 'mtn', 'Gifting Data', '3.2GB', 1044.15, '2 Days', 'M3m2GBS', 1),
('mtn_gifting_data_m1gbs', 'mtn', 'Gifting Data', '1GB', 839.54, '7 Days', 'M1GBS', 1),
('mtn_gifting_data_m2m5gbs1', 'mtn', 'Gifting Data', '2.5GB', 2615.66, '30 Days', 'M2m5GBS1', 1),
('mtn_gifting_data_m2m7gbs', 'mtn', 'Gifting Data', '2.7GB', 2098.85, '30 Days', 'M2m7GBS', 1),
('mtn_gifting_data_m3m5gbs', 'mtn', 'Gifting Data', '3.5GB', 2615.66, '30 Days', 'M3m5GBS', 1),
('mtn_gifting_data_m6gbs', 'mtn', 'Gifting Data', '6GB', 2615.66, '7 Days', 'M6GBS', 1),
('mtn_gifting_data_m7gbs', 'mtn', 'Gifting Data', '7GB', 3638.72, '30 Days', 'M7GBS', 1),
('mtn_gifting_data_m11gbs', 'mtn', 'Gifting Data', '11GB', 3691.45, '7 Days', 'M11GBS', 1),
('mtn_gifting_data_m12m5gbs', 'mtn', 'Gifting Data', '12.5GB', 5732.38, '30 Days', 'M12m5GBS', 1),
('mtn_gifting_data_m14m5gbs', 'mtn', 'Gifting Data', '14.5GB', 5220.77, '30 Days', 'M14m5GBS', 1),
('mtn_gifting_data_m20gbs', 'mtn', 'Gifting Data', '20GB', 7783.70, '30 Days', 'M20GBS', 1),
('mtn_gifting_data_m25gbs', 'mtn', 'Gifting Data', '25GB', 9334.09, '30 Days', 'M25GBS', 1),
('mtn_gifting_data_m36gbs', 'mtn', 'Gifting Data', '36GB', 11443.50, '30 Days', 'M36GBS', 1),
('mtn_gifting_data_m65gbs', 'mtn', 'Gifting Data', '65GB', 16664.26, '30 Days', 'M65GBS', 1),
('mtn_gifting_data_m75gbs', 'mtn', 'Gifting Data', '75GB', 18773.66, '30 Days', 'M75GBS', 1),
('mtn_gifting_data_m90gbs', 'mtn', 'Gifting Data', '90GB', 25998.35, '60 Days', 'M90GBS', 1),
('mtn_gifting_data_m150gbs', 'mtn', 'Gifting Data', '150GB', 41660.65, '60 Days', 'M150GBS', 1),
('mtn_gifting_data_m165gbs', 'mtn', 'Gifting Data', '165GB', 36387.15, '30 Days', 'M165GBS', 1),
('mtn_gifting_data_m200gbs', 'mtn', 'Gifting Data', '200GB', 51891.24, '60 Days', 'M200GBS', 1),
('mtn_gifting_data_m250gbs', 'mtn', 'Gifting Data', '250GB', 57481.15, '30 Days', 'M250GBS', 1),
('mtn_gifting_data_m800gbs', 'mtn', 'Gifting Data', '800GB', 130255.45, '365 Days', 'M800GBS', 1),
('glo_data_g500mb', 'glo', 'Corporate Gifting', '500MB', 257.10, '30 Days', 'G500MB', 1),
('glo_data_g1gb1', 'glo', 'Corporate Gifting', '1GB', 351.55, '3 Days', 'G1GB1', 1),
('glo_data_g3gb1', 'glo', 'Corporate Gifting', '3GB', 891.99, '3 Days', 'G3GB1', 1),
('glo_data_g5gb1', 'glo', 'Corporate Gifting', '5GB', 1448.17, '3 Days', 'G5GB1', 1),
('glo_data_g1gb2', 'glo', 'Corporate Gifting', '1GB', 377.78, '7 Days', 'G1GB2', 1),
('glo_data_g3gb2', 'glo', 'Corporate Gifting', '3GB', 1038.91, '7 Days', 'G3GB2', 1),
('glo_data_g5gb2', 'glo', 'Corporate Gifting', '5GB', 1658.05, '7 Days', 'G5GB2', 1),
('glo_data_g1gb3', 'glo', 'Corporate Gifting', '1GB', 377.78, '14 Days', 'G1GB3', 1),
('glo_data_g3gb3', 'glo', 'Corporate Gifting', '3GB', 1038.91, '14 Days', 'G3GB3', 1),
('glo_data_g5gb3', 'glo', 'Corporate Gifting', '5GB', 1721.02, '14 Days', 'G5GB3', 1),
('glo_data_g10gb1', 'glo', 'Corporate Gifting', '10GB', 3463.02, '14 Days', 'G10GB1', 1),
('glo_data_g1gb4', 'glo', 'Corporate Gifting', '1GB', 472.23, '30 Days', 'G1GB4', 1),
('glo_data_g2gb4', 'glo', 'Corporate Gifting', '2GB', 944.46, '30 Days', 'G2GB4', 1),
('glo_data_g3gb4', 'glo', 'Corporate Gifting', '3GB', 1416.69, '30 Days', 'G3GB4', 1),
('glo_data_g5gb4', 'glo', 'Corporate Gifting', '5GB', 2308.68, '30 Days', 'G5GB4', 1),
('glo_data_g10gb2', 'glo', 'Corporate Gifting', '10GB', 4459.95, '30 Days', 'G10GB2', 1),
('9mobile_data_e300mb', '9mobile', 'Corporate Gifting', '300MB', 209.88, '30 Days', 'E300MB', 1),
('9mobile_data_e500mb', '9mobile', 'Corporate Gifting', '500MB', 314.82, '30 Days', 'E500MB', 1),
('9mobile_data_e1gb', '9mobile', 'Corporate Gifting', '1GB', 524.70, '30 Days', 'E1GB', 1),
('9mobile_data_e2gb', '9mobile', 'Corporate Gifting', '2GB', 1028.41, '30 Days', 'E2GB', 1),
('9mobile_data_e3gb', '9mobile', 'Corporate Gifting', '3GB', 1574.10, '30 Days', 'E3GB', 1),
('9mobile_data_e5gb', '9mobile', 'Corporate Gifting', '5GB', 2623.50, '30 Days', 'E5GB', 1),
('9mobile_data_e10gb', '9mobile', 'Corporate Gifting', '10GB', 5247.00, '30 Days', 'E10GB', 1),
('9mobile_data_e15gb', '9mobile', 'Corporate Gifting', '15GB', 7293.33, '30 Days', 'E15GB', 1),
('9mobile_data_e20gb', '9mobile', 'Corporate Gifting', '20GB', 9969.30, '30 Days', 'E20GB', 1),
('9mobile_data_e40gb', '9mobile', 'Corporate Gifting', '40GB', 19728.72, '30 Days', 'E40GB', 1),
('airtel_data_a200mb', 'airtel', 'Gifting Data', '200MB', 208.83, '1 Day', 'A200MB', 1),
('airtel_data_a300mb', 'airtel', 'Gifting Data', '300MB', 312.72, '2 Days', 'A300MB', 1),
('airtel_data_a1gbs', 'airtel', 'Gifting Data', '1GB', 354.70, '3 Days', 'A1GBS', 1),
('airtel_data_a2gbs', 'airtel', 'Gifting Data', '2GB', 781.80, '2 Days', 'A2GBS', 1),
('airtel_data_a4gbs', 'airtel', 'Gifting Data', '3.2GB', 1038.91, '2 Days', 'A4GBS', 1),
('airtel_data_a6gbs', 'airtel', 'Gifting Data', '5GB', 1558.36, '2 Days', 'A6GBS', 1),
('airtel_data_a1gb', 'airtel', 'Gifting Data', '1GB', 834.27, '7 Days', 'A1GB', 1),
('airtel_data_a1a5gb', 'airtel', 'Gifting Data', '1.5GB', 556.18, '1 Day', 'A1a5GB', 1),
('airtel_data_a1a5gbs', 'airtel', 'Gifting Data', '1.5GB', 1044.15, '7 Days', 'A1a5GBS', 1),
('airtel_data_a3a5gb', 'airtel', 'Gifting Data', '3.5GB', 1561.50, '7 Days', 'A3a5GB', 1),
('airtel_data_a6gb', 'airtel', 'Gifting Data', '5GB', 2067.32, '30 Days', 'A6GB', 1),
('airtel_data_a8gbs', 'airtel', 'Gifting Data', '6GB', 2609.86, '7 Days', 'A8GBS', 1),
('airtel_data_a10gbs', 'airtel', 'Gifting Data', '10GB', 3121.97, '7 Days', 'A10GBS', 1),
('airtel_data_a20gb', 'airtel', 'Gifting Data', '18GB', 5194.53, '7 Days', 'A20GB', 1),
('airtel_data_a35gb', 'airtel', 'Gifting Data', '35GB', 10389.06, '30 Days', 'A35GB', 1),
('airtel_data_a2gb2', 'airtel', 'Gifting Data', '2GB', 1551.01, '30 Days', 'A2GB2', 1),
('airtel_data_a3gb', 'airtel', 'Gifting Data', '3GB', 2077.81, '30 Days', 'A3GB', 1),
('airtel_data_a4gb', 'airtel', 'Gifting Data', '4GB', 2599.37, '30 Days', 'A4GB', 1),
('airtel_data_a8gb', 'airtel', 'Gifting Data', '8GB', 3121.97, '30 Days', 'A8GB', 1),
('airtel_data_a10gb', 'airtel', 'Gifting Data', '10GB', 4145.13, '30 Days', 'A10GB', 1),
('airtel_data_a13gb', 'airtel', 'Gifting Data', '13GB', 5199.78, '30 Days', 'A13GB', 1),
('airtel_data_a18gb', 'airtel', 'Gifting Data', '18GB', 6233.44, '30 Days', 'A18GB', 1),
('airtel_data_a25gb', 'airtel', 'Gifting Data', '25GB', 8290.26, '30 Days', 'A25GB', 1),
('airtel_data_a60gb', 'airtel', 'Gifting Data', '60GB', 15636.06, '30 Days', 'A60GB', 1),
('airtel_data_a75gb', 'airtel', 'Gifting Data', '75GB', 15720.01, '30 Days', 'A75GB', 1),
('airtel_data_a100gb', 'airtel', 'Gifting Data', '100GB', 20778.12, '30 Days', 'A100GB', 1),
('airtel_data_a160gb', 'airtel', 'Gifting Data', '160GB', 31219.65, '30 Days', 'A160GB', 1),
('mtn_data_share_m500mbs', 'mtn', 'Data Share', '500MB', 359.87, '7 Days', 'M500MBS', 1),
('mtn_data_share_m1gbs', 'mtn', 'Data Share', '1GB', 462.69, '7 Days', 'M1GBS', 1),
('mtn_data_share_m2gbs', 'mtn', 'Data Share', '2GB', 873.97, '7 Days', 'M2GBS', 1),
('mtn_data_share_m3gbs', 'mtn', 'Data Share', '3GB', 1233.84, '7 Days', 'M3GBS', 1),
('mtn_data_share_m1gbs2', 'mtn', 'Data Share', '1GB', 596.36, '30 Days', 'M1GBS2', 1),
('mtn_data_share_m2gbs2', 'mtn', 'Data Share', '2GB', 976.79, '30 Days', 'M2GBS2', 1),
('mtn_data_share_m3gbs2', 'mtn', 'Data Share', '3GB', 1285.25, '30 Days', 'M3GBS2', 1),
('mtn_data_share_m5gbs', 'mtn', 'Data Share', '5GB', 1850.76, '30 Days', 'M5GBS', 1)
ON DUPLICATE KEY UPDATE `price`=VALUES(`price`), `provider_code`=VALUES(`provider_code`), `size`=VALUES(`size`), `validity`=VALUES(`validity`);

-- Seed All 86 Live Peyflex VTU Plans (vtu_plans) with canonical api_plan_id across the 5 Peyflex networks
INSERT INTO `vtu_plans` (`provider_id`, `network`, `plan_name`, `original_wholesale_price`, `custom_retail_price`, `api_plan_id`, `status`, `category`, `size`, `validity`) VALUES
('payflex', 'MTN', '110MB = N99 (1 Day)', 98.51, 104.42, 'mtn_gifting_data_m110mbs', 'active', 'Gifting Data', '110MB', '1 Day'),
('payflex', 'MTN', '1.2GB = N495 (1 Day) + 1.5Mins', 492.53, 522.08, 'mtn_gifting_data_m1m2gb', 'active', 'Gifting Data', '1.2GB', '1 Day'),
('payflex', 'MTN', '2.5GB = N893 (2 Days)', 888.54, 941.85, 'mtn_gifting_data_m2m5gbs', 'active', 'Gifting Data', '2.5GB', '2 Days'),
('payflex', 'MTN', '2GB = N745 (2 Days)', 741.28, 785.75, 'mtn_gifting_data_m2gbs', 'active', 'Gifting Data', '2GB', '2 Days'),
('payflex', 'MTN', '3.2GB =N990 (2 Days)', 985.05, 1044.15, 'mtn_gifting_data_m3m2gbs', 'active', 'Gifting Data', '3.2GB', '2 Days'),
('payflex', 'MTN', '1GB = N796 (7Days)', 792.02, 839.54, 'mtn_gifting_data_m1gbs', 'active', 'Gifting Data', '1GB', '7 Days'),
('payflex', 'MTN', '2.5GB = N2480 (30 Days)', 2467.60, 2615.66, 'mtn_gifting_data_m2m5gbs1', 'active', 'Gifting Data', '2.5GB', '30 Days'),
('payflex', 'MTN', '2.7GB = N1990 (1 Month) + 2GB All Night Streaming + 2Min', 1980.05, 2098.85, 'mtn_gifting_data_m2m7gbs', 'active', 'Gifting Data', '2.7GB', '30 Days'),
('payflex', 'MTN', '3.5GB = N2480 (1 Month) + 2GB All Night Streaming + 5Min', 2467.60, 2615.66, 'mtn_gifting_data_m3m5gbs', 'active', 'Gifting Data', '3.5GB', '30 Days'),
('payflex', 'MTN', '6GB = N2480 (Weekly)', 2467.60, 2615.66, 'mtn_gifting_data_m6gbs', 'active', 'Gifting Data', '6GB', '7 Days'),
('payflex', 'MTN', '7GB = N3450 (1 Month) +2GB All Night Streaming', 3432.75, 3638.72, 'mtn_gifting_data_m7gbs', 'active', 'Gifting Data', '7GB', '30 Days'),
('payflex', 'MTN', '11GB = N3500 (Weekly)', 3482.50, 3691.45, 'mtn_gifting_data_m11gbs', 'active', 'Gifting Data', '11GB', '7 Days'),
('payflex', 'MTN', '12.5GB = N5435(1 Month)', 5407.83, 5732.38, 'mtn_gifting_data_m12m5gbs', 'active', 'Gifting Data', '12.5GB', '30 Days'),
('payflex', 'MTN', '14.5GB = N4950 (30 Days)', 4925.25, 5220.77, 'mtn_gifting_data_m14m5gbs', 'active', 'Gifting Data', '14.5GB', '30 Days'),
('payflex', 'MTN', '20GB = N7380 (1MONTH) + 4GB All Night Streaming', 7343.10, 7783.70, 'mtn_gifting_data_m20gbs', 'active', 'Gifting Data', '20GB', '30 Days'),
('payflex', 'MTN', '25GB = N8850 (1 Month)', 8805.75, 9334.09, 'mtn_gifting_data_m25gbs', 'active', 'Gifting Data', '25GB', '30 Days'),
('payflex', 'MTN', '36GB = N10850 (1 Month)', 10795.75, 11443.50, 'mtn_gifting_data_m36gbs', 'active', 'Gifting Data', '36GB', '30 Days'),
('payflex', 'MTN', '65GB = N15800 (1 Month)', 15721.00, 16664.26, 'mtn_gifting_data_m65gbs', 'active', 'Gifting Data', '65GB', '30 Days'),
('payflex', 'MTN', '75GB = N17800 (1 Month)', 17711.00, 18773.66, 'mtn_gifting_data_m75gbs', 'active', 'Gifting Data', '75GB', '30 Days'),
('payflex', 'MTN', '90GB = N24650 (60 Days)', 24526.75, 25998.35, 'mtn_gifting_data_m90gbs', 'active', 'Gifting Data', '90GB', '60 Days'),
('payflex', 'MTN', '150GB = N39500 (2 Months)', 39302.50, 41660.65, 'mtn_gifting_data_m150gbs', 'active', 'Gifting Data', '150GB', '60 Days'),
('payflex', 'MTN', '165GB = N34500 (1 Month)', 34327.50, 36387.15, 'mtn_gifting_data_m165gbs', 'active', 'Gifting Data', '165GB', '30 Days'),
('payflex', 'MTN', '200GB = N49200 (2 Months)', 48954.00, 51891.24, 'mtn_gifting_data_m200gbs', 'active', 'Gifting Data', '200GB', '60 Days'),
('payflex', 'MTN', '250GB = N54500 (30 Days)', 54227.50, 57481.15, 'mtn_gifting_data_m250gbs', 'active', 'Gifting Data', '250GB', '30 Days'),
('payflex', 'MTN', '800GB = N123500 (1 YEAR)', 122882.50, 130255.45, 'mtn_gifting_data_m800gbs', 'active', 'Gifting Data', '800GB', '365 Days'),
('payflex', 'GLO', '500MB = N245 ( 30 Days)', 242.55, 257.10, 'glo_data_g500mb', 'active', 'Corporate Gifting', '500MB', '30 Days'),
('payflex', 'GLO', '1GB = N335 ( 3 DAYS)', 331.65, 351.55, 'glo_data_g1gb1', 'active', 'Corporate Gifting', '1GB', '3 Days'),
('payflex', 'GLO', '3GB = N850 ( 3 DAYS)', 841.50, 891.99, 'glo_data_g3gb1', 'active', 'Corporate Gifting', '3GB', '3 Days'),
('payflex', 'GLO', '5GB = N1380 (3 DAYS)', 1366.20, 1448.17, 'glo_data_g5gb1', 'active', 'Corporate Gifting', '5GB', '3 Days'),
('payflex', 'GLO', '1GB = N360 (7 DAYS)', 356.40, 377.78, 'glo_data_g1gb2', 'active', 'Corporate Gifting', '1GB', '7 Days'),
('payflex', 'GLO', '3GB = N990 (7 DAYS)', 980.10, 1038.91, 'glo_data_g3gb2', 'active', 'Corporate Gifting', '3GB', '7 Days'),
('payflex', 'GLO', '5GB = N1580 (7DAYS)', 1564.20, 1658.05, 'glo_data_g5gb2', 'active', 'Corporate Gifting', '5GB', '7 Days'),
('payflex', 'GLO', '1GB = N360 (14 DAYS) Night Plan', 356.40, 377.78, 'glo_data_g1gb3', 'active', 'Corporate Gifting', '1GB', '14 Days'),
('payflex', 'GLO', '3GB = N990 (14 DAYS) Night Plan', 980.10, 1038.91, 'glo_data_g3gb3', 'active', 'Corporate Gifting', '3GB', '14 Days'),
('payflex', 'GLO', '5GB = N1640 (14 DAYS)Night Plan', 1623.60, 1721.02, 'glo_data_g5gb3', 'active', 'Corporate Gifting', '5GB', '14 Days'),
('payflex', 'GLO', '10GB = N3300 (14 DAYS)Night Plan', 3267.00, 3463.02, 'glo_data_g10gb1', 'active', 'Corporate Gifting', '10GB', '14 Days'),
('payflex', 'GLO', '1GB = N450 (1 Month)', 445.50, 472.23, 'glo_data_g1gb4', 'active', 'Corporate Gifting', '1GB', '30 Days'),
('payflex', 'GLO', '2GB = N900 (1 Month)', 891.00, 944.46, 'glo_data_g2gb4', 'active', 'Corporate Gifting', '2GB', '30 Days'),
('payflex', 'GLO', '3GB = N1350 (1 Month)', 1336.50, 1416.69, 'glo_data_g3gb4', 'active', 'Corporate Gifting', '3GB', '30 Days'),
('payflex', 'GLO', '5GB = N2200 (1 Month)', 2178.00, 2308.68, 'glo_data_g5gb4', 'active', 'Corporate Gifting', '5GB', '30 Days'),
('payflex', 'GLO', '10GB = N4250 (1 Month)', 4207.50, 4459.95, 'glo_data_g10gb2', 'active', 'Corporate Gifting', '10GB', '30 Days'),
('payflex', '9MOBILE', '300MB = N200 (1 Month)', 198.00, 209.88, '9mobile_data_e300mb', 'active', 'Corporate Gifting', '300MB', '30 Days'),
('payflex', '9MOBILE', '500MB = N300 (1 Month)', 297.00, 314.82, '9mobile_data_e500mb', 'active', 'Corporate Gifting', '500MB', '30 Days'),
('payflex', '9MOBILE', '1GB = N500 (1 Month)', 495.00, 524.70, '9mobile_data_e1gb', 'active', 'Corporate Gifting', '1GB', '30 Days'),
('payflex', '9MOBILE', '2GB = N980 (1 Month)', 970.20, 1028.41, '9mobile_data_e2gb', 'active', 'Corporate Gifting', '2GB', '30 Days'),
('payflex', '9MOBILE', '3GB = N1500 (1 Month)', 1485.00, 1574.10, '9mobile_data_e3gb', 'active', 'Corporate Gifting', '3GB', '30 Days'),
('payflex', '9MOBILE', '5GB = N2500 (1 Month)', 2475.00, 2623.50, '9mobile_data_e5gb', 'active', 'Corporate Gifting', '5GB', '30 Days'),
('payflex', '9MOBILE', '10GB = N5000 (1 Month)', 4950.00, 5247.00, '9mobile_data_e10gb', 'active', 'Corporate Gifting', '10GB', '30 Days'),
('payflex', '9MOBILE', '15GB = N6950 (1 Month)', 6880.50, 7293.33, '9mobile_data_e15gb', 'active', 'Corporate Gifting', '15GB', '30 Days'),
('payflex', '9MOBILE', '20GB = N9500 (1 Month)', 9405.00, 9969.30, '9mobile_data_e20gb', 'active', 'Corporate Gifting', '20GB', '30 Days'),
('payflex', '9MOBILE', '40GB = N18800 (1 Month)', 18612.00, 19728.72, '9mobile_data_e40gb', 'active', 'Corporate Gifting', '40GB', '30 Days'),
('payflex', 'AIRTEL', '200MB = N199 (1 Day)', 197.01, 208.83, 'airtel_data_a200mb', 'active', 'Gifting Data', '200MB', '1 Day'),
('payflex', 'AIRTEL', '300MB = N298 (2 Days)', 295.02, 312.72, 'airtel_data_a300mb', 'active', 'Gifting Data', '300MB', '2 Days'),
('payflex', 'AIRTEL', '1GB = N338 (3 Days Social Plan)', 334.62, 354.70, 'airtel_data_a1gbs', 'active', 'Gifting Data', '1GB', '3 Days'),
('payflex', 'AIRTEL', '2GB = N745 (2 Days)', 737.55, 781.80, 'airtel_data_a2gbs', 'active', 'Gifting Data', '2GB', '2 Days'),
('payflex', 'AIRTEL', '3.2GB = N990 (2 Days)', 980.10, 1038.91, 'airtel_data_a4gbs', 'active', 'Gifting Data', '3.2GB', '2 Days'),
('payflex', 'AIRTEL', '5GB = N1485 (2 Days)', 1470.15, 1558.36, 'airtel_data_a6gbs', 'active', 'Gifting Data', '5GB', '2 Days'),
('payflex', 'AIRTEL', '1GB = N795 (7 Days)', 787.05, 834.27, 'airtel_data_a1gb', 'active', 'Gifting Data', '1GB', '7 Days'),
('payflex', 'AIRTEL', '1.5GB = N530 (1 Day)', 524.70, 556.18, 'airtel_data_a1a5gb', 'active', 'Gifting Data', '1.5GB', '1 Day'),
('payflex', 'AIRTEL', '1.5GB = N995 (7 Days)', 985.05, 1044.15, 'airtel_data_a1a5gbs', 'active', 'Gifting Data', '1.5GB', '7 Days'),
('payflex', 'AIRTEL', '3.5GB = N1488 (7 Days)', 1473.12, 1561.50, 'airtel_data_a3a5gb', 'active', 'Gifting Data', '3.5GB', '7 Days'),
('payflex', 'AIRTEL', '5GB = N1970 (30 Days)', 1950.30, 2067.32, 'airtel_data_a6gb', 'active', 'Gifting Data', '5GB', '30 Days'),
('payflex', 'AIRTEL', '6GB = N2487 (7 Days)', 2462.13, 2609.86, 'airtel_data_a8gbs', 'active', 'Gifting Data', '6GB', '7 Days'),
('payflex', 'AIRTEL', '10GB = N2975 (7 Days)', 2945.25, 3121.97, 'airtel_data_a10gbs', 'active', 'Gifting Data', '10GB', '7 Days'),
('payflex', 'AIRTEL', '18GB = N4950 (7 Days)', 4900.50, 5194.53, 'airtel_data_a20gb', 'active', 'Gifting Data', '18GB', '7 Days'),
('payflex', 'AIRTEL', '35GB = N9900 (30 Days)', 9801.00, 10389.06, 'airtel_data_a35gb', 'active', 'Gifting Data', '35GB', '30 Days'),
('payflex', 'AIRTEL', '2GB = N1478 (30 Days)', 1463.22, 1551.01, 'airtel_data_a2gb2', 'active', 'Gifting Data', '2GB', '30 Days'),
('payflex', 'AIRTEL', '3GB = N1980 (30 Days)', 1960.20, 2077.81, 'airtel_data_a3gb', 'active', 'Gifting Data', '3GB', '30 Days'),
('payflex', 'AIRTEL', '4GB = N2477 (30 Days)', 2452.23, 2599.37, 'airtel_data_a4gb', 'active', 'Gifting Data', '4GB', '30 Days'),
('payflex', 'AIRTEL', '8GB = N2975 (30 Days)', 2945.25, 3121.97, 'airtel_data_a8gb', 'active', 'Gifting Data', '8GB', '30 Days'),
('payflex', 'AIRTEL', '10GB = N3950 (30 Days)', 3910.50, 4145.13, 'airtel_data_a10gb', 'active', 'Gifting Data', '10GB', '30 Days'),
('payflex', 'AIRTEL', '13GB = N4955 (30 Days)', 4905.45, 5199.78, 'airtel_data_a13gb', 'active', 'Gifting Data', '13GB', '30 Days'),
('payflex', 'AIRTEL', '18GB = N5940 (30 Days)', 5880.60, 6233.44, 'airtel_data_a18gb', 'active', 'Gifting Data', '18GB', '30 Days'),
('payflex', 'AIRTEL', '25GB = N7900 (30 Days)', 7821.00, 8290.26, 'airtel_data_a25gb', 'active', 'Gifting Data', '25GB', '30 Days'),
('payflex', 'AIRTEL', '60GB = N14900 (30 Days)', 14751.00, 15636.06, 'airtel_data_a60gb', 'active', 'Gifting Data', '60GB', '30 Days'),
('payflex', 'AIRTEL', '75GB = N14980 (30 Days)', 14830.20, 15720.01, 'airtel_data_a75gb', 'active', 'Gifting Data', '75GB', '30 Days'),
('payflex', 'AIRTEL', '100GB = N19800 (30 Days)', 19602.00, 20778.12, 'airtel_data_a100gb', 'active', 'Gifting Data', '100GB', '30 Days'),
('payflex', 'AIRTEL', '160GB = N29750 (30 Days)', 29452.50, 31219.65, 'airtel_data_a160gb', 'active', 'Gifting Data', '160GB', '30 Days'),
('payflex', 'MTN', '500MB = N350 (7 Days)', 339.50, 359.87, 'mtn_data_share_m500mbs', 'active', 'Data Share', '500MB', '7 Days'),
('payflex', 'MTN', '1GB = N450 (7 Days)', 436.50, 462.69, 'mtn_data_share_m1gbs', 'active', 'Data Share', '1GB', '7 Days'),
('payflex', 'MTN', '2GB = N850 (7 Days)', 824.50, 873.97, 'mtn_data_share_m2gbs', 'active', 'Data Share', '2GB', '7 Days'),
('payflex', 'MTN', '3GB = N1200 (7 Days)', 1164.00, 1233.84, 'mtn_data_share_m3gbs', 'active', 'Data Share', '3GB', '7 Days'),
('payflex', 'MTN', '1GB = N580 (30 Days)', 562.60, 596.36, 'mtn_data_share_m1gbs2', 'active', 'Data Share', '1GB', '30 Days'),
('payflex', 'MTN', '2GB = N950 (30 Days)', 921.50, 976.79, 'mtn_data_share_m2gbs2', 'active', 'Data Share', '2GB', '30 Days'),
('payflex', 'MTN', '3GB = N1250 (30 Days)', 1212.50, 1285.25, 'mtn_data_share_m3gbs2', 'active', 'Data Share', '3GB', '30 Days'),
('payflex', 'MTN', '5GB = N1800 (30 Days)', 1746.00, 1850.76, 'mtn_data_share_m5gbs', 'active', 'Data Share', '5GB', '30 Days')
ON DUPLICATE KEY UPDATE `original_wholesale_price`=VALUES(`original_wholesale_price`), `custom_retail_price`=VALUES(`custom_retail_price`), `plan_name`=VALUES(`plan_name`), `size`=VALUES(`size`), `validity`=VALUES(`validity`);

-- Seed System Settings (system_settings)
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('maintenance_mode', '0'),
('broadcast_active', '1'),
('broadcast_text', 'Welcome to ALAMIN JAGORA DATA (AJDATA)! Fast, reliable data bundles and instant telecom recharge.'),
('broadcast_type', 'info'),
('airtime_discount_mtn', '2.5'),
('airtime_discount_airtel', '2.0'),
('airtime_discount_glo', '3.0'),
('airtime_discount_9mobile', '3.0'),
('gateway_xixapay_active', '1'),
('primary_virtual_account_gateway', 'xixapay')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- Seed Platform Settings (JSON settings)
INSERT INTO `settings` (`key_name`, `value_json`) VALUES
('platform_info', JSON_OBJECT(
  'platformName', 'ALAMIN JAGORA DATA (AJDATA)',
  'tagline', 'Instant Telecom Data, Airtime & Automated Bill Payments in Nigeria',
  'supportPhone', '+234 814 838 8844',
  'supportWhatsapp', '2348148388844',
  'supportEmail', 'support@ajdatasub.com.ng',
  'maintenanceMode', false,
  'announcement', 'Welcome to ALAMIN JAGORA DATA (AJDATA)! Enjoy fast, automated data delivery across all networks.'
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
(NULL, 'Welcome to ALAMIN JAGORA DATA (AJDATA)! 🚀', 'Enjoy instant automated data delivery, cheap airtime discounts, and instant cable & bill payments 24/7.', 'system', '#0047cc', '[]', 'system')
ON DUPLICATE KEY UPDATE `id`=`id`;

COMMIT;
