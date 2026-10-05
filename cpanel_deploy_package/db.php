<?php
/**
 * ==============================================================================
 * DATABASE CONNECTION - PDO MYSQL WRAPPER
 * ==============================================================================
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'status'  => 'error',
                    'message' => 'Database connection failed. Check cPanel DB credentials.',
                    'details' => $e->getMessage()
                ]);
                exit();
            }
        }

        return self::$instance;
    }
}

/**
 * Functional shorthand helper for Database::getConnection()
 */
if (!function_exists('getDB')) {
    function getDB(): PDO {
        return Database::getConnection();
    }
}

/**
 * Functional alias for getDB / Database::getConnection()
 */
if (!function_exists('getDbConnection')) {
    function getDbConnection(): PDO {
        return Database::getConnection();
    }
}
