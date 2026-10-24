<?php
/**
 * ==============================================================================
 * AJDATASUB - ADMIN RESET PLATFORM STATISTICS & TRANSACTIONS
 * Fresh Start Utility for Administrator
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminPermission($pdo, 'reset_stats');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'status' => 'error',
        'success' => false,
        'message' => 'Method not allowed. POST required.'
    ], 405);
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: [];
$resetBalances = !empty($body['resetBalances']);

try {
    $pdo->beginTransaction();

    // 1. Wipe transaction logs to reset Lifetime Turnover, Today Sales, Orders Count & Profit to 0
    try {
        $pdo->exec("TRUNCATE TABLE transactions");
    } catch (\Throwable $e) {
        $pdo->exec("DELETE FROM transactions");
    }

    // 2. Wipe auxiliary webhook logs
    try {
        $pdo->exec("TRUNCATE TABLE webhook_logs");
    } catch (\Throwable $e) {}

    // 3. Wipe feedback and temporary brute-force attempts
    try {
        $pdo->exec("TRUNCATE TABLE feedbacks");
    } catch (\Throwable $e) {}

    try {
        $pdo->exec("TRUNCATE TABLE login_attempts");
    } catch (\Throwable $e) {}

    // 3b. Wipe notifications
    try {
        $pdo->exec("TRUNCATE TABLE notifications");
    } catch (\Throwable $e) {}

    // 4. Reset customer balances to 0.00 if requested or during fresh start
    if ($resetBalances) {
        try {
            $pdo->exec("UPDATE users SET balance = 0.00, bonus_balance = 0.00 WHERE (role IS NULL OR role != 'admin') AND (admin_role IS NULL OR admin_role = '')");
        } catch (\Throwable $e) {
            try {
                $pdo->exec("UPDATE users SET balance = 0.00, bonus_balance = 0.00 WHERE role != 'admin'");
            } catch (\Throwable $e2) {}
        }
    }

    // 4b. Record stats reset timestamp so profit report tracks from this point onwards
    $nowStr = date('Y-m-d H:i:s');
    try {
        $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES ('stats_last_reset_at', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()")->execute([$nowStr]);
        $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('stats_last_reset_at', ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)")->execute([json_encode($nowStr)]);
    } catch (\Throwable $t) {}

    $pdo->commit();

    // 5. Clear stale cache entries
    Cache::forget('payflex_admin_float');
    Cache::forget('platform_settings');

    jsonResponse([
        'status' => 'success',
        'success' => true,
        'message' => 'Platform statistics and transaction logs have been reset to zeros for a fresh start.',
        'data' => [
            'transactionsCleared' => true,
            'balancesReset' => $resetBalances,
            'resetAt' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'status' => 'error',
        'success' => false,
        'message' => 'Database error while resetting statistics: ' . $e->getMessage()
    ], 500);
}
