<?php
/**
 * ============================================================================
 * VTU SCRIPT - DATABASE CONFIGURATION & PDO CONNECTION POOL
 * ============================================================================
 * Enter your cPanel MySQL Database credentials below.
 */

// 1. CPANEL MYSQL DATABASE CREDENTIALS
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'alaminjagoradata_db_user'); // Replace with your cPanel DB username
define('DB_PASS', 'alaminjagoradata_pass_2026'); // Replace with your cPanel DB password
define('DB_NAME', 'alaminjagoradata_db');      // Replace with your cPanel DB name

/**
 * Returns a PDO database instance (Singleton pattern)
 * @return PDO
 */
function get_db_connection() {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If running in development without live MySQL, handle gracefully or report connection error
        error_log("Database connection error: " . $e->getMessage());
        return null;
    }
}

/**
 * Auto-initializes base tables if they don't exist
 */
function ensure_database_schema(PDO $pdo) {
    // 1. Users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            pin VARCHAR(10) DEFAULT '1234',
            balance DECIMAL(12, 2) DEFAULT 0.00,
            bonus_balance DECIMAL(12, 2) DEFAULT 0.00,
            tier ENUM('smart', 'reseller', 'api') DEFAULT 'smart',
            status ENUM('active', 'suspended') DEFAULT 'active',
            virtual_bank_name VARCHAR(100) DEFAULT NULL,
            virtual_account_number VARCHAR(30) DEFAULT NULL,
            virtual_account_name VARCHAR(150) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 2. VTU Plans table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS vtu_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            network VARCHAR(20) NOT NULL,
            plan_type VARCHAR(30) NOT NULL,
            bundle_name VARCHAR(100) NOT NULL,
            bundle_size VARCHAR(50) NOT NULL,
            cost_price DECIMAL(10,2) NOT NULL,
            selling_price DECIMAL(10,2) NOT NULL,
            reseller_price DECIMAL(10,2) NOT NULL,
            api_code VARCHAR(50) NOT NULL,
            validity VARCHAR(50) DEFAULT '30 Days',
            status TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 3. Transactions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            reference VARCHAR(80) NOT NULL UNIQUE,
            service_type ENUM('data', 'airtime', 'cable', 'electricity', 'wallet_fund', 'bonus_transfer') NOT NULL,
            network VARCHAR(20) DEFAULT NULL,
            recipient VARCHAR(50) DEFAULT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            discount DECIMAL(10, 2) DEFAULT 0.00,
            balance_before DECIMAL(12, 2) NOT NULL,
            balance_after DECIMAL(12, 2) NOT NULL,
            status ENUM('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
            description TEXT,
            api_response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_ref (reference),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 4. Admin Settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(80) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}
