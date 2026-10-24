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

// 1. Total registered users (customers and total accounts)
$userCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

// 2. Total user wallet liabilities (strictly customer balances, excluding admin accounts)
$totalUserWallets = 0.0;
try {
    $totalUserWallets = (float)$pdo->query('SELECT COALESCE(SUM(balance), 0) FROM users WHERE (role IS NULL OR role != "admin") AND (admin_role IS NULL OR admin_role = "")')->fetchColumn();
} catch (\Throwable $e) {
    try {
        $totalUserWallets = (float)$pdo->query('SELECT COALESCE(SUM(balance), 0) FROM users WHERE role != "admin"')->fetchColumn();
    } catch (\Throwable $e2) {
        $totalUserWallets = (float)$pdo->query('SELECT COALESCE(SUM(balance), 0) FROM users')->fetchColumn();
    }
}

// 2B. Check if a recent stats reset occurred today
$lastResetAt = null;
try {
    $rRow = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'stats_last_reset_at' LIMIT 1")->fetch();
    if ($rRow && !empty($rRow['setting_value'])) {
        $lastResetAt = $rRow['setting_value'];
    }
} catch (\Throwable $t) {}

// 3. Total wallet deposits (all-time)
$totalDeposits = (float)$pdo->query('SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ("funding", "WALLET_FUNDING") AND status = "SUCCESS"')->fetchColumn();

// 4. Today's VTU sales volume (excluding deposits, filtered to today / since reset)
$todaySalesSql = '
    SELECT COALESCE(SUM(amount), 0) 
    FROM transactions 
    WHERE type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
      AND status = "SUCCESS" 
      AND DATE(created_at) = CURDATE()
';
if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
    $todaySalesSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
}
$todaySales = (float)$pdo->query($todaySalesSql)->fetchColumn();

// 4B. Calculate today's exact net profit (0.00 if sales are zero)
$todayProfit = 0.0;
if ($todaySales > 0) {
    try {
        $profitSql = '
            SELECT COALESCE(SUM(
                CASE 
                    WHEN fee > 0 THEN fee 
                    WHEN extra_data IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) IS NOT NULL THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) AS DECIMAL(10,2))
                    WHEN amount > charged AND charged > 0 THEN (amount - charged)
                    ELSE amount * 0.03
                END
            ), 0) AS calculated_profit
            FROM transactions 
            WHERE status = "SUCCESS" 
              AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
              AND DATE(created_at) = CURDATE()
        ';
        if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
            $profitSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
        }
        $profitRow = $pdo->query($profitSql)->fetch();
        $todayProfit = (float)($profitRow['calculated_profit'] ?? 0.0);
    } catch (\Throwable $t) {
        $todayProfit = 0.0;
    }
}

// 4C. Active users today (distinct users transacting today)
$activeUsersSql = '
    SELECT COUNT(DISTINCT COALESCE(NULLIF(user_id, 0), user_phone)) 
    FROM transactions 
    WHERE DATE(created_at) = CURDATE()
';
if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
    $activeUsersSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
}
$activeUsersToday = (int)$pdo->query($activeUsersSql)->fetchColumn();

// 4D. Calculate breakdown by service: Airtime, Data, Electricity, Cable TV
$categoryMap = [
    'airtime'     => ['name' => 'Airtime', 'volume' => 0.0, 'count' => 0, 'percentage' => 0.0],
    'data'        => ['name' => 'Data', 'volume' => 0.0, 'count' => 0, 'percentage' => 0.0],
    'electricity' => ['name' => 'Electricity', 'volume' => 0.0, 'count' => 0, 'percentage' => 0.0],
    'cable'       => ['name' => 'Cable TV', 'volume' => 0.0, 'count' => 0, 'percentage' => 0.0],
];
try {
    $serviceBreakdownSql = '
        SELECT 
            CASE 
                WHEN LOWER(type) LIKE "%airtime%" THEN "airtime"
                WHEN LOWER(type) LIKE "%data%" THEN "data"
                WHEN LOWER(type) LIKE "%electric%" THEN "electricity"
                WHEN LOWER(type) LIKE "%cable%" OR LOWER(type) LIKE "%tv%" THEN "cable"
                ELSE "other"
            END AS category,
            COALESCE(SUM(amount), 0) AS total_volume,
            COUNT(DISTINCT reference) AS total_count
        FROM transactions
        WHERE status = "SUCCESS" 
          AND (
            LOWER(type) LIKE "%airtime%" OR 
            LOWER(type) LIKE "%data%" OR 
            LOWER(type) LIKE "%electric%" OR 
            LOWER(type) LIKE "%cable%" OR 
            LOWER(type) LIKE "%tv%"
          )
    ';
    if (!empty($lastResetAt)) {
        $serviceBreakdownSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
    }
    $serviceBreakdownSql .= ' GROUP BY category';
    $serviceStatsRaw = $pdo->query($serviceBreakdownSql)->fetchAll();

    $totalCategoryVolume = 0.0;
    foreach ($serviceStatsRaw as $row) {
        $cat = $row['category'] ?? '';
        if (isset($categoryMap[$cat])) {
            $vol = (float)$row['total_volume'];
            $categoryMap[$cat]['volume'] = $vol;
            $categoryMap[$cat]['count'] = (int)$row['total_count'];
            $totalCategoryVolume += $vol;
        }
    }
    if ($totalCategoryVolume > 0) {
        foreach ($categoryMap as $k => $v) {
            $categoryMap[$k]['percentage'] = round(($v['volume'] / $totalCategoryVolume) * 100, 1);
        }
    }
} catch (\Throwable $e) {}

// 5. Total VTU orders count today (strictly deduplicated by reference, excluding wallet deposits)
$todayCountSql = '
    SELECT COUNT(DISTINCT reference) 
    FROM transactions 
    WHERE DATE(created_at) = CURDATE()
      AND status = "SUCCESS"
      AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
';
if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
    $todayCountSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
}
$todayCount = (int)$pdo->query($todayCountSql)->fetchColumn();

// 6. Total pending / failed transactions needing attention
$failedCount = (int)$pdo->query('
    SELECT COUNT(DISTINCT reference) 
    FROM transactions 
    WHERE status = "FAILED" AND DATE(created_at) = CURDATE()
')->fetchColumn();

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

// 9. Lifetime Platform Turnover
$lifetimeSql = 'SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = "SUCCESS" AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")';
if (!empty($lastResetAt)) {
    $lifetimeSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
}
$lifetimeTurnover = (float)$pdo->query($lifetimeSql)->fetchColumn();
$reserveRatio = $totalUserWallets > 0 ? round($payflexFloat / $totalUserWallets, 4) : 1.0;

// Day-over-day real turnover growth
$yesterdaySales = (float)$pdo->query('
    SELECT COALESCE(SUM(amount), 0) 
    FROM transactions 
    WHERE status = "SUCCESS" 
      AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
')->fetchColumn();
$turnoverGrowth = $yesterdaySales > 0 ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100, 1) : 0.0;

$adminRole = getAdminRole($admin);
$customPermissions = null;
if (!empty($admin['permissions'])) {
    $customPermissions = is_string($admin['permissions']) ? json_decode($admin['permissions'], true) : $admin['permissions'];
}
$dashboardConfig = getRoleDashboardConfig($adminRole, is_array($customPermissions) ? $customPermissions : null);

// Masked recent transactions according to role permissions
$processedRecentTx = array_map(function($tx) use ($adminRole) {
    if ($adminRole === 'support_agent') {
        unset($tx['costPrice'], $tx['profit']);
        $tx['profit'] = 0;
    } elseif ($adminRole === 'finance_agent') {
        unset($tx['profit']);
        $tx['profit'] = 0;
    }
    return $tx;
}, $recentTx ?: []);

// Customized Dashboard Metrics per Admin Staff Role
if ($adminRole === 'support_agent') {
    // Support Agent: Focus on customer support, ticket resolution, order volumes & failures
    $metricsData = array_merge($dashboardConfig, [
        'adminRole'                => 'support_agent',
        'roleLabel'                => $dashboardConfig['roleLabel'],
        'roleDescription'          => $dashboardConfig['roleDescription'],
        'totalUsers'               => $userCount,
        'todayTxCount'             => $todayCount,
        'todayFailedCount'         => $failedCount,
        'todaySalesVolume'         => $todaySales,
        'total_volume'             => $todaySales,
        'currency'                 => 'NGN',
        'vtuGateway'               => defined('VTU_PROVIDER_NAME') ? VTU_PROVIDER_NAME : 'Payflex',
        'serverTime'               => date('Y-m-d H:i:s'),
        // Masked confidential financial data for support staff
        'totalUserWallets'         => 0,
        'totalCustomerLiabilities' => 0,
        'total_user_balance'       => 0,
        'totalVendorFloat'         => 0,
        'lifetimeTurnover'         => 0,
        'reserveRatio'             => 1.0,
        'totalDeposits'            => 0,
        'todayProfit'              => 0,
        'todayGrossProfit'         => 0,
        'total_profit'             => 0,
    ]);
} elseif ($adminRole === 'finance_agent') {
    // Finance Agent: Full ledger, wallet balances, float reserves, customer liabilities
    $metricsData = array_merge($dashboardConfig, [
        'adminRole'                => 'finance_agent',
        'roleLabel'                => $dashboardConfig['roleLabel'],
        'roleDescription'          => $dashboardConfig['roleDescription'],
        'totalUsers'               => $userCount,
        'totalUserWallets'         => $totalUserWallets,
        'totalCustomerLiabilities' => $totalUserWallets,
        'total_user_balance'       => $totalUserWallets,
        'totalVendorFloat'         => $payflexFloat,
        'lifetimeTurnover'         => $lifetimeTurnover,
        'reserveRatio'             => $reserveRatio,
        'totalDeposits'            => $totalDeposits,
        'todaySalesVolume'         => $todaySales,
        'total_volume'             => $todaySales,
        'todayTxCount'             => $todayCount,
        'todayFailedCount'         => $failedCount,
        'currency'                 => 'NGN',
        'vtuGateway'               => defined('VTU_PROVIDER_NAME') ? VTU_PROVIDER_NAME : 'Payflex',
        'serverTime'               => date('Y-m-d H:i:s'),
        'todayProfit'              => 0, // Proprietary net margin withheld from finance agents
        'todayGrossProfit'         => 0,
        'total_profit'             => 0,
    ]);
} else {
    // Super Administrator / CEO: Complete executive suite with profit margins & full governance
    $metricsData = array_merge($dashboardConfig, [
        'adminRole'                => 'super_admin',
        'roleLabel'                => $dashboardConfig['roleLabel'],
        'roleDescription'          => $dashboardConfig['roleDescription'],
        'totalUsers'               => $userCount,
        'totalUserWallets'         => $totalUserWallets,
        'totalCustomerLiabilities' => $totalUserWallets,
        'total_user_balance'       => $totalUserWallets,
        'totalVendorFloat'         => $payflexFloat,
        'lifetimeTurnover'         => $lifetimeTurnover,
        'reserveRatio'             => $reserveRatio,
        'totalDeposits'            => $totalDeposits,
        'todaySalesVolume'         => $todaySales,
        'total_volume'             => $todaySales,
        'todayProfit'              => round($todayProfit, 2),
        'todayGrossProfit'         => round($todayProfit, 2),
        'total_profit'             => round($todayProfit, 2),
        'todayTxCount'             => $todayCount,
        'activeUsersToday'         => $activeUsersToday,
        'serviceBreakdown'         => $categoryMap,
        'profitGrowthPercent'      => $turnoverGrowth,
        'liabilitiesGrowthPercent' => 0.0,
        'turnoverGrowthPercent'    => $turnoverGrowth,
        'floatsGrowthPercent'      => 0.0,
        'currency'                 => 'NGN',
        'vtuGateway'               => defined('VTU_PROVIDER_NAME') ? VTU_PROVIDER_NAME : 'Payflex',
        'serverTime'               => date('Y-m-d H:i:s'),
    ]);
}

jsonResponse([
    'status'             => 'success',
    'success'            => true,
    'adminRole'          => $adminRole,
    'roleLabel'          => $dashboardConfig['roleLabel'],
    'roleDescription'    => $dashboardConfig['roleDescription'],
    'permissions'        => $dashboardConfig['permissions'],
    'allowedTabs'        => $dashboardConfig['allowedTabs'],
    'allowedWidgets'     => $dashboardConfig['allowedWidgets'],
    'quickActions'       => $dashboardConfig['quickActions'],
    'maskedFields'       => $dashboardConfig['maskedFields'],
    'activeUsersToday'   => $activeUsersToday,
    'serviceBreakdown'   => $categoryMap,
    'metrics'            => $metricsData,
    'data'               => $metricsData,
    'recentTransactions' => $processedRecentTx ?: []
]);
