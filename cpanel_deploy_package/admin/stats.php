<?php
/**
 * ==============================================================================
 * ADMIN - PLATFORM MONITORING & METRICS
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminUser($pdo);

// 1. Total registered users
$userCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

// 2. Total user wallet balances (sum of real user funds in system)
$totalUserWallets = (float)$pdo->query('SELECT COALESCE(SUM(balance), 0) FROM users')->fetchColumn();

// 3. Total wallet deposits (all-time)
$totalDeposits = (float)$pdo->query('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ("funding", "WALLET_FUNDING") AND status = "SUCCESS"')->fetchColumn();

// 4. Today\'s VTU sales volume
$todaySales = (float)$pdo->query('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ("data", "airtime", "cable", "electricity", "DATA", "AIRTIME", "CABLE", "ELECTRICITY") AND status = "SUCCESS" AND DATE(created_at) = CURDATE()')->fetchColumn();

// 5. Total transactions count today
$todayCount = (int)$pdo->query('SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()')->fetchColumn();

// 6. Total pending / failed transactions needing attention
$failedCount = (int)$pdo->query('SELECT COUNT(*) FROM transactions WHERE status = "FAILED" AND DATE(created_at) = CURDATE()')->fetchColumn();

// 7. Recent 20 platform transactions
$rawRecentTx = $pdo->query('
    SELECT t.id, t.reference, t.type, t.title, t.description, t.amount, t.status, t.recipient, t.created_at, 
           COALESCE(u.full_name, u.name, "User") AS full_name, 
           COALESCE(u.phone, t.user_phone, "") AS phone
    FROM transactions t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.id DESC 
    LIMIT 20
')->fetchAll();
$recentTx = array_map('formatTransactionRecord', $rawRecentTx ?: []);

// 8. Live Gateway Float (Payflex primary)
$payflexFloat = 0.0;
$payflexKey = defined('PAYFLEX_API_KEY') ? PAYFLEX_API_KEY : '';
if (!empty($payflexKey) && !str_starts_with($payflexKey, 'YOUR_')) {
    $pfRes = Cache::remember('payflex_admin_float', 30, function() {
        return callPayflex('wallet/balance', [], 'GET');
    });
    $payflexFloat = (float)($pfRes['wallet_credit'] ?? $pfRes['balance'] ?? $pfRes['wallet'] ?? 0);
}

$metricsData = [
    'totalUsers'          => $userCount,
    'totalUserWallets'    => $totalUserWallets,
    'total_user_balance'  => $totalUserWallets,
    'totalVendorFloat'    => $payflexFloat,
    'totalDeposits'       => $totalDeposits,
    'todaySalesVolume'    => $todaySales,
    'total_volume'        => $todaySales,
    'todayGrossProfit'    => round($todaySales * 0.05, 2),
    'total_profit'        => round($todaySales * 0.05, 2),
    'todayTxCount'        => $todayCount,
    'todayFailedCount'    => $failedCount,
    'currency'            => 'NGN',
    'vtuGateway'          => defined('VTU_PROVIDER_NAME') ? VTU_PROVIDER_NAME : 'Payflex',
    'serverTime'          => date('Y-m-d H:i:s'),
];

jsonResponse([
    'status' => 'success',
    'success' => true,
    'metrics' => $metricsData,
    'data' => $metricsData,
    'recentTransactions' => $recentTx ?: []
]);
