<?php
/**
 * ==============================================================================
 * AL'AMIN JAGORA DATA - ADMIN RESET PLATFORM STATISTICS & TRANSACTIONS
 * Fresh Start Utility for Administrator
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminUser($pdo);

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
    $pdo->exec("TRUNCATE TABLE transactions");

    // 2. Wipe auxiliary webhook logs
    try {
        $pdo->exec("TRUNCATE TABLE webhook_logs");
    } catch (\Throwable $e) {
        // Ignore if table does not exist
    }

    // 3. Wipe feedback and temporary brute-force attempts
    try {
        $pdo->exec("TRUNCATE TABLE feedbacks");
    } catch (\Throwable $e) {}

    try {
        $pdo->exec("TRUNCATE TABLE login_attempts");
    } catch (\Throwable $e) {}

    // 4. Optionally reset customer balances to 0.00 if requested (sparing admin account)
    if ($resetBalances) {
        $pdo->exec("UPDATE users SET balance = 0.00, bonus_balance = 0.00 WHERE role != 'admin' AND is_admin != 1");
    }

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
