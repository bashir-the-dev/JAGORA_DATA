-- ============================================================================
-- VTU SCRIPT - COMPLETE MYSQL DATABASE SCHEMA & SEED DATA
-- Import this file into your cPanel phpMyAdmin
-- ============================================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+01:00";

-- ----------------------------------------------------------------------------
-- 1. Table structure for table `users`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `phone` varchar(20) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `pin` varchar(10) DEFAULT '1234',
  `balance` decimal(12,2) DEFAULT 0.00,
  `bonus_balance` decimal(12,2) DEFAULT 0.00,
  `tier` enum('smart','reseller','api') DEFAULT 'smart',
  `status` enum('active','suspended') DEFAULT 'active',
  `virtual_bank_name` varchar(100) DEFAULT 'Wema Bank',
  `virtual_account_number` varchar(30) DEFAULT NULL,
  `virtual_account_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Admin / Default User
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `pin`, `balance`, `bonus_balance`, `tier`, `status`, `virtual_bank_name`, `virtual_account_number`, `virtual_account_name`) 
VALUES (1, 'Bashir Abubakar', 'bashirabubakar650@gmail.com', '07048609646', '$2y$10$wJ2q5Zt8z5R4x6y8w0u8OeE7g.H7W3p6G4v9s2K1m8z9l0q1r2s3t', '1234', 5250.00, 420.00, 'reseller', 'active', 'Wema Bank', '7048609646', 'Al\'amin AJDATASUB - Bashir')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- ----------------------------------------------------------------------------
-- 2. Table structure for table `vtu_plans`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vtu_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `network` varchar(20) NOT NULL,
  `plan_type` varchar(30) NOT NULL,
  `bundle_name` varchar(100) NOT NULL,
  `bundle_size` varchar(50) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `reseller_price` decimal(10,2) NOT NULL,
  `api_code` varchar(50) NOT NULL,
  `validity` varchar(50) DEFAULT '30 Days',
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_net_type` (`network`, `plan_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Active Nigerian Telecom Plans
INSERT INTO `vtu_plans` (`id`, `network`, `plan_type`, `bundle_name`, `bundle_size`, `cost_price`, `selling_price`, `reseller_price`, `api_code`, `validity`, `status`) VALUES
(1, 'MTN', 'SME', 'MTN 1.0GB SME Data', '1.0 GB', 270.00, 290.00, 280.00, '1', '30 Days', 1),
(2, 'MTN', 'SME', 'MTN 2.0GB SME Data', '2.0 GB', 540.00, 580.00, 560.00, '2', '30 Days', 1),
(3, 'MTN', 'SME', 'MTN 3.0GB SME Data', '3.0 GB', 810.00, 870.00, 840.00, '3', '30 Days', 1),
(4, 'MTN', 'SME', 'MTN 5.0GB SME Data', '5.0 GB', 1350.00, 1450.00, 1400.00, '5', '30 Days', 1),
(5, 'MTN', 'SME', 'MTN 10.0GB SME Data', '10.0 GB', 2700.00, 2900.00, 2800.00, '10', '30 Days', 1),
(6, 'AIRTEL', 'CG', 'Airtel 1.0GB Corporate Gifting', '1.0 GB', 280.00, 310.00, 295.00, '101', '30 Days', 1),
(7, 'AIRTEL', 'CG', 'Airtel 2.0GB Corporate Gifting', '2.0 GB', 560.00, 610.00, 585.00, '102', '30 Days', 1),
(8, 'AIRTEL', 'CG', 'Airtel 5.0GB Corporate Gifting', '5.0 GB', 1400.00, 1500.00, 1450.00, '105', '30 Days', 1),
(9, 'GLO', 'CG', 'Glo 1.0GB Corporate Gifting', '1.0 GB', 255.00, 285.00, 270.00, '201', '30 Days', 1),
(10, 'GLO', 'CG', 'Glo 2.0GB Corporate Gifting', '2.0 GB', 510.00, 565.00, 535.00, '202', '30 Days', 1),
(11, 'GLO', 'CG', 'Glo 5.0GB Corporate Gifting', '5.0 GB', 1275.00, 1400.00, 1340.00, '205', '30 Days', 1),
(12, '9MOBILE', 'GIFTING', '9mobile 1.5GB Gifting', '1.5 GB', 320.00, 360.00, 340.00, '301', '30 Days', 1),
(13, '9MOBILE', 'GIFTING', '9mobile 3.0GB Gifting', '3.0 GB', 640.00, 710.00, 675.00, '302', '30 Days', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- ----------------------------------------------------------------------------
-- 3. Table structure for table `transactions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `reference` varchar(80) NOT NULL UNIQUE,
  `service_type` enum('data','airtime','cable','electricity','wallet_fund','bonus_transfer') NOT NULL,
  `network` varchar(20) DEFAULT NULL,
  `recipient` varchar(50) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `balance_before` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `status` enum('SUCCESS','PENDING','FAILED','REFUNDED') DEFAULT 'PENDING',
  `description` text DEFAULT NULL,
  `api_response` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_ref` (`reference`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Sample Transaction
INSERT INTO `transactions` (`id`, `user_id`, `reference`, `service_type`, `network`, `recipient`, `amount`, `discount`, `balance_before`, `balance_after`, `status`, `description`) 
VALUES (1, 1, 'INIT_FUND_2026', 'wallet_fund', NULL, '7013898334', 5000.00, 0.00, 0.00, 5000.00, 'SUCCESS', 'Initial Wallet Setup & Funding')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- ----------------------------------------------------------------------------
-- 4. Table structure for table `system_settings`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` varchar(80) NOT NULL PRIMARY KEY,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('site_name', 'Al\'amin AJDATASUB'),
('support_phone', '+2347048609646'),
('support_email', 'support@ajdatasub.com.ng'),
('office_address', 'Katsina, Nigeria'),
('whatsapp_number', '2347048609646'),
('vtu_gateway', 'PAYFLEX')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

COMMIT;
SET FOREIGN_KEY_CHECKS=1;
