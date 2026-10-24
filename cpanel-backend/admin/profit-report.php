<?php
/**
 * ==============================================================================
 * AJDATASUB - ADMIN DAILY PROFIT & HISTORICAL AUDIT REPORT
 * Provides detailed breakdown of how Daily Profit is calculated,
 * per-service margins, automatic 12:00 AM daily reset logic,
 * and daily profit history since the last statistics reset.
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$pdo = Database::getConnection();
$admin = requireAdminUser($pdo);

// 1. Fetch timestamp of last statistics reset (from system_settings)
$lastResetAt = null;
try {
    $resetRow = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'stats_last_reset_at' LIMIT 1")->fetch();
    if ($resetRow && !empty($resetRow['setting_value'])) {
        $lastResetAt = $resetRow['setting_value'];
    }
} catch (\Throwable $t) {}

// Fallback: check settings table
if (!$lastResetAt) {
    try {
        $resetRow2 = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'stats_last_reset_at' LIMIT 1")->fetch();
        if ($resetRow2 && !empty($resetRow2['value_json'])) {
            $lastResetAt = trim($resetRow2['value_json'], '"');
        }
    } catch (\Throwable $t2) {}
}

// 2. Today's Profit Calculation (Resets strictly at 12:00 AM / CURDATE() WAT)
$todaySales = 0.0;
$todayProfit = 0.0;
$todayOrders = 0;

$todayStatsSql = '
    SELECT 
        COUNT(DISTINCT reference) as total_orders,
        COALESCE(SUM(amount), 0) as total_sales,
        COALESCE(SUM(
            CASE 
                WHEN fee > 0 THEN fee 
                WHEN extra_data IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) IS NOT NULL THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) AS DECIMAL(10,2))
                WHEN amount > charged AND charged > 0 THEN amount - charged
                ELSE amount * 0.03
            END
        ), 0) as calculated_profit
    FROM transactions
    WHERE status = "SUCCESS"
      AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
      AND DATE(created_at) = CURDATE()
';
if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
    $todayStatsSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
}

$todayStats = $pdo->query($todayStatsSql)->fetch(PDO::FETCH_ASSOC);

if ($todayStats) {
    $todayOrders = (int)$todayStats['total_orders'];
    $todaySales = (float)$todayStats['total_sales'];
    $todayProfit = $todaySales > 0 ? (float)$todayStats['calculated_profit'] : 0.0;
}

// 3. Today's Breakdown by Service Category
$serviceBreakdown = [
    'data' => [
        'name'        => 'Data Bundles',
        'orders'      => 0,
        'salesVolume' => 0.0,
        'costVolume'  => 0.0,
        'profit'      => 0.0,
        'marginPct'   => 0.0,
        'formula'     => 'Retail Price - Wholesale API Cost (e.g. ₦290 - ₦281.30 = +₦8.70/GB)'
    ],
    'airtime' => [
        'name'        => 'Airtime VTU',
        'orders'      => 0,
        'salesVolume' => 0.0,
        'costVolume'  => 0.0,
        'profit'      => 0.0,
        'marginPct'   => 0.0,
        'formula'     => 'Customer Paid - Telecom Wholesale Cost (2.5% to 4.0% discount)'
    ],
    'cable' => [
        'name'        => 'Cable TV (DSTV, GOTV, Startimes)',
        'orders'      => 0,
        'salesVolume' => 0.0,
        'costVolume'  => 0.0,
        'profit'      => 0.0,
        'marginPct'   => 0.0,
        'formula'     => 'Convenience Fee (₦50 - ₦100 per successful validation)'
    ],
    'electricity' => [
        'name'        => 'Electricity Bills (Discos)',
        'orders'      => 0,
        'salesVolume' => 0.0,
        'costVolume'  => 0.0,
        'profit'      => 0.0,
        'marginPct'   => 0.0,
        'formula'     => 'Convenience Processing Fee (₦100 flat fee per token)'
    ],
    'exam' => [
        'name'        => 'Exam PINs (WAEC, NECO, JAMB)',
        'orders'      => 0,
        'salesVolume' => 0.0,
        'costVolume'  => 0.0,
        'profit'      => 0.0,
        'marginPct'   => 0.0,
        'formula'     => 'Retail Selling Price - Wholesale Pin Price (+₦200 to ₦400 margin)'
    ]
];

try {
    $catRowsSql = '
        SELECT 
            CASE 
                WHEN type IN ("data", "DATA") THEN "data"
                WHEN type IN ("airtime", "AIRTIME") THEN "airtime"
                WHEN type IN ("cable", "CABLE") THEN "cable"
                WHEN type IN ("electricity", "ELECTRICITY") THEN "electricity"
                WHEN type IN ("exam_pin", "EXAM_PIN", "exam", "EXAM") THEN "exam"
                ELSE "other"
            END AS category_key,
            COUNT(DISTINCT reference) as orders_count,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(SUM(
                CASE 
                    WHEN fee > 0 THEN fee 
                    WHEN extra_data IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) IS NOT NULL THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) AS DECIMAL(10,2))
                    WHEN amount > charged AND charged > 0 THEN amount - charged
                    ELSE amount * 0.03
                END
            ), 0) as total_profit
        FROM transactions
        WHERE status = "SUCCESS"
          AND DATE(created_at) = CURDATE()
    ';
    if (!empty($lastResetAt) && date('Y-m-d', strtotime($lastResetAt)) === date('Y-m-d')) {
        $catRowsSql .= ' AND created_at >= ' . $pdo->quote($lastResetAt);
    }
    $catRowsSql .= ' GROUP BY category_key';
    $catRows = $pdo->query($catRowsSql)->fetchAll(PDO::FETCH_ASSOC);

    foreach ($catRows as $cr) {
        $key = $cr['category_key'] ?? '';
        if (isset($serviceBreakdown[$key])) {
            $amt = (float)$cr['total_amount'];
            $prf = (float)$cr['total_profit'];
            $serviceBreakdown[$key]['orders'] = (int)$cr['orders_count'];
            $serviceBreakdown[$key]['salesVolume'] = $amt;
            $serviceBreakdown[$key]['costVolume'] = max(0, $amt - $prf);
            $serviceBreakdown[$key]['profit'] = $prf;
            $serviceBreakdown[$key]['marginPct'] = $amt > 0 ? round(($prf / $amt) * 100, 1) : 0;
        }
    }
} catch (\Throwable $t) {}

// 4. Daily Profit History (each day since last statistics reset)
$historyQuery = '
    SELECT 
        DATE(created_at) AS report_date,
        DAYNAME(created_at) AS day_name,
        COUNT(DISTINCT reference) AS orders_count,
        COALESCE(SUM(amount), 0) AS total_sales,
        COALESCE(SUM(
            CASE 
                WHEN fee > 0 THEN fee 
                WHEN extra_data IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) IS NOT NULL THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(extra_data, "$.profit")) AS DECIMAL(10,2))
                WHEN amount > charged AND charged > 0 THEN amount - charged
                ELSE amount * 0.03
            END
        ), 0) AS daily_profit
    FROM transactions
    WHERE status = "SUCCESS"
      AND type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
';

$params = [];
if (!empty($lastResetAt)) {
    $historyQuery .= ' AND created_at >= ?';
    $params[] = $lastResetAt;
}

$historyQuery .= '
    GROUP BY DATE(created_at)
    ORDER BY report_date DESC
    LIMIT 60
';

$historyStmt = $pdo->prepare($historyQuery);
$historyStmt->execute($params);
$rawHistory = $historyStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$historyList = [];
foreach ($rawHistory as $h) {
    $sales = (float)$h['total_sales'];
    $profit = (float)$h['daily_profit'];
    $margin = $sales > 0 ? round(($profit / $sales) * 100, 1) : 0.0;

    $historyList[] = [
        'date'        => $h['report_date'],
        'dayName'     => $h['day_name'],
        'ordersCount' => (int)$h['orders_count'],
        'totalSales'  => $sales,
        'dailyProfit' => round($profit, 2),
        'marginPct'   => $margin
    ];
}

// If no historical rows yet (fresh database or zero transactions), provide today's real entry
if (empty($historyList)) {
    $historyList = [
        [
            'date'        => date('Y-m-d'),
            'dayName'     => date('l'),
            'ordersCount' => $todayOrders,
            'totalSales'  => $todaySales,
            'dailyProfit' => $todayProfit,
            'marginPct'   => $todaySales > 0 ? round(($todayProfit / $todaySales) * 100, 1) : 0.0
        ]
    ];
}

// 5. Itemized Recent Profit Log (last 10 transactions with itemized profit math)
$recentProfitTx = [];
try {
    $ptStmt = $pdo->query('
        SELECT 
            t.id, t.reference, t.type, t.title, t.description, t.amount, t.fee, t.status, t.created_at,
            COALESCE(u.full_name, u.name, "Customer") as customer_name,
            COALESCE(u.phone, t.user_phone, "") as customer_phone,
            CASE 
                WHEN t.fee > 0 THEN t.fee
                WHEN t.extra_data IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(t.extra_data, "$.profit")) IS NOT NULL THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(t.extra_data, "$.profit")) AS DECIMAL(10,2))
                WHEN t.amount > t.charged AND t.charged > 0 THEN t.amount - t.charged
                ELSE t.amount * 0.03
            END as calculated_profit
        FROM transactions t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.status = "SUCCESS"
          AND t.type IN ("data", "airtime", "cable", "electricity", "exam", "exam_pin", "recharge_pin", "data_card", "DATA", "AIRTIME", "CABLE", "ELECTRICITY", "EXAM", "EXAM_PIN", "RECHARGE_PIN", "DATA_CARD")
        ORDER BY t.id DESC
        LIMIT 10
    ');
    $rawTx = $ptStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($rawTx as $rt) {
        $amt = (float)$rt['amount'];
        $prf = round((float)$rt['calculated_profit'], 2);
        $cost = max(0, $amt - $prf);
        $recentProfitTx[] = [
            'reference'     => $rt['reference'] ?: ('TX-' . $rt['id']),
            'type'          => strtoupper($rt['type']),
            'title'         => $rt['title'] ?: ($rt['type'] . ' purchase'),
            'customer'      => $rt['customer_name'] . ' (' . $rt['customer_phone'] . ')',
            'sellingPrice'  => $amt,
            'costPrice'     => $cost,
            'profit'        => $prf,
            'marginPercent' => $amt > 0 ? round(($prf / $amt) * 100, 1) : 0,
            'createdAt'     => $rt['created_at']
        ];
    }
} catch (\Throwable $t) {}

jsonResponse([
    'status'   => 'success',
    'success'  => true,
    'data'     => [
        'today' => [
            'date'         => date('Y-m-d'),
            'dayName'      => date('l'),
            'profit'       => round($todayProfit, 2),
            'sales'        => round($todaySales, 2),
            'orders'       => $todayOrders,
            'marginPct'    => $todaySales > 0 ? round(($todayProfit / $todaySales) * 100, 1) : 0.0,
            'resetRule'    => 'Resets automatically to ₦0.00 daily at 12:00 AM WAT midnight.',
            'formula'      => 'Daily Profit = Total Customer Selling Price - Upstream Gateway Cost Price (Wholesale API Rate)',
        ],
        'serviceBreakdown' => $serviceBreakdown,
        'history'          => $historyList,
        'lastResetAt'      => $lastResetAt ?: 'Platform Initial Launch',
        'recentItems'      => $recentProfitTx,
        'serverTime'       => date('Y-m-d H:i:s'),
    ]
]);
