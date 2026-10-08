<?php
/**
 * ============================================================================
 * Al'amin Jagora Data - Main Configuration File (cPanel / PHP)
 * ============================================================================
 * Edit the database credentials below to match your cPanel MySQL Database.
 */

// Prevent direct file access if called outside PHP
if (!defined('AJD_ROOT')) {
    define('AJD_ROOT', __DIR__);
}

// ----------------------------------------------------------------------------
// 1. MySQL Database Settings (From cPanel -> MySQL Databases)
// ----------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'YOUR_CPANEL_DATABASE_NAME'); // e.g. cpaneluser_jagoravtu
define('DB_USER', 'YOUR_CPANEL_DATABASE_USER'); // e.g. cpaneluser_vtuuser
define('DB_PASS', 'YOUR_CPANEL_DATABASE_PASSWORD');
define('DB_CHARSET', 'utf8mb4');

// ----------------------------------------------------------------------------
// 2. Telecom & Wholesale Gateway API Keys
// ----------------------------------------------------------------------------
// Payflex (Peyflex) Gateway (PRIMARY WHOLESALE VTU GATEWAY)
define('PAYFLEX_API_KEY', getenv('PAYFLEX_API_KEY') ?: '42e5cd304b2a6f1b3de3e52a20eb0d812f8d5b31');
define('PAYFLEX_BASE_URL', getenv('PAYFLEX_BASE_URL') ?: 'https://client.peyflex.com.ng/api');

// ClubKonnect Gateway (Data & Airtime - Secondary / Backup Gateway)
define('CLUBKONNECT_USER_ID', getenv('CLUBKONNECT_USER_ID') ?: 'YOUR_CLUBKONNECT_USER_ID');
define('CLUBKONNECT_API_KEY', getenv('CLUBKONNECT_API_KEY') ?: 'YOUR_CLUBKONNECT_API_KEY');
define('CLUBKONNECT_BASE_URL', 'https://www.clubkonnect.com/API');

// XIXAPAY Virtual Accounts & Automated Wallet Funding Gateway (PRIMARY PROVIDER)
define('XIXAPAY_API_KEY', getenv('XIXAPAY_API_KEY') ?: 'YOUR_XIXAPAY_API_KEY');
define('XIXAPAY_SECRET_KEY', getenv('XIXAPAY_SECRET_KEY') ?: 'YOUR_XIXAPAY_SECRET_KEY');
define('XIXAPAY_BUSINESS_ID', getenv('XIXAPAY_BUSINESS_ID') ?: 'YOUR_XIXAPAY_BUSINESS_ID');
define('XIXAPAY_BASE_URL', getenv('XIXAPAY_BASE_URL') ?: 'https://api.xixapay.com');
// Partner Banks: 20867 = PalmPay, 20987 = Kolomoni MFB (No BVN/NIN required for account number generation)
define('XIXAPAY_BANK_CODES', ['20867', '20987']);

// Primary Payment Gateway: 'XIXAPAY' (Default), 'PAYVESSEL', or 'MONNIFY'
define('PAYMENT_GATEWAY', getenv('PAYMENT_GATEWAY') ?: 'XIXAPAY');

// PayVessel Virtual Accounts Gateway (Automated Wallet Funding - Secondary/Backup)
define('PAYVESSEL_API_KEY', getenv('PAYVESSEL_API_KEY') ?: 'YOUR_PAYVESSEL_API_KEY');
define('PAYVESSEL_SECRET', getenv('PAYVESSEL_SECRET') ?: 'YOUR_PAYVESSEL_SECRET_KEY');
define('PAYVESSEL_SECRET_KEY', PAYVESSEL_SECRET); // Alias for backwards compatibility
define('PAYVESSEL_BUSINESS_ID', getenv('PAYVESSEL_BUSINESS_ID') ?: 'YOUR_PAYVESSEL_BUSINESS_ID');
define('PAYVESSEL_BASE_URL', 'https://api.payvessel.com/api/v1');

// Monnify Gateway (Optional Backup Gateway)
define('MONNIFY_API_KEY', getenv('MONNIFY_API_KEY') ?: '');
define('MONNIFY_SECRET_KEY', getenv('MONNIFY_SECRET_KEY') ?: '');
define('MONNIFY_CONTRACT_CODE', getenv('MONNIFY_CONTRACT_CODE') ?: '');
define('MONNIFY_BASE_URL', 'https://api.monnify.com');

// Telecom Provider & Gateway Aliases - Payflex is Primary Gateway
define('VTU_PROVIDER_NAME', getenv('VTU_PROVIDER_NAME') ?: 'PAYFLEX');
define('VTU_API_TOKEN', getenv('VTU_API_TOKEN') ?: (defined('PAYFLEX_API_KEY') ? PAYFLEX_API_KEY : ''));
define('APP_NAME', getenv('APP_NAME') ?: "Al'amin Jagora Data");
define('APP_DOMAIN', getenv('APP_DOMAIN') ?: 'alaminjagoradata.com.ng');
define('APP_SYSTEM_EMAIL', getenv('APP_SYSTEM_EMAIL') ?: 'support@alaminjagoradata.com.ng');
define('APP_EMAIL_FROM_NAME', getenv('APP_EMAIL_FROM_NAME') ?: "Al'amin Jagora Data");

// Optional SMTP Server Credentials (Set SMTP_PASS to your cPanel email password for 100% authenticated delivery)
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'localhost');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USER', getenv('SMTP_USER') ?: 'support@alaminjagoradata.com.ng');
define('SMTP_PASS', getenv('SMTP_PASS') ?: ''); // Set cPanel webmail password here to send via authenticated SMTP
define('SMTP_SECURE', getenv('SMTP_SECURE') ?: ''); // 'tls', 'ssl', or ''

// ----------------------------------------------------------------------------
// 3. Security & Application Secrets
// ----------------------------------------------------------------------------
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'jagora_super_secure_jwt_token_key_982347293847');
define('ADMIN_SECRET_PIN', getenv('ADMIN_SECRET_PIN') ?: '1234'); // 4-digit master admin PIN
define('DEFAULT_ADMIN_PHONE', getenv('DEFAULT_ADMIN_PHONE') ?: '08001234567');

// Set Timezone to Lagos (WAT)
date_default_timezone_set('Africa/Lagos');

// Error reporting (Set to 0 in production)
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

/**
 * Singleton PDO Database Connection Helper
 */
if (!function_exists('getDbConnection')) {
    function getDbConnection(): PDO {
        static $pdo = null;
        if ($pdo !== null) {
            return $pdo;
        }

        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            return $pdo;
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Database connection failed. Please check config.php credentials in cPanel.',
                'debug' => (defined('WP_DEBUG') && WP_DEBUG) ? $e->getMessage() : null
            ]);
            exit;
        }
    }
}
