<?php
/**
 * ==============================================================================
 * VTU - FETCH ACTIVE DATA PLANS
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

$network = strtolower(trim($_GET['network'] ?? ''));
$includeInactive = !empty($_GET['include_inactive']) || !empty($_GET['all']);

// Load Admin Custom Pricing Overrides from settings table
$pricingRow = null;
try {
    $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
} catch (\Throwable $t) {}
$customPricing = [];
if ($pricingRow && !empty($pricingRow['value_json'])) {
    $pData = json_decode($pricingRow['value_json'], true);
    $customPricing = $pData['customPricing'] ?? [];
}

$rawPlans = [];
try {
    $sql = 'SELECT id, provider_id, network, category, api_plan_id, api_plan_id AS plan_id, plan_name, 
                   custom_retail_price, custom_retail_price AS selling_price, 
                   original_wholesale_price, original_wholesale_price AS reseller_price, 
                   size, validity, status, last_synced_at 
            FROM vtu_plans 
            WHERE 1=1';
    $params = [];

    if (!empty($network)) {
        $sql .= ' AND LOWER(network) = LOWER(?)';
        $params[] = $network;
    }

    $sql .= ' ORDER BY custom_retail_price ASC, selling_price ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rawPlans = $stmt->fetchAll();
} catch (Exception $e) {}

if (empty($rawPlans)) {
    try {
        $dpSql = 'SELECT id, network, type AS category, plan_id AS api_plan_id, plan_id, 
                         CONCAT(UPPER(network), " ", size, " (", type, ")") AS plan_name, 
                         price AS selling_price, price AS custom_retail_price, price AS reseller_price, size, validity, "active" AS status 
                  FROM data_plans 
                  WHERE is_active = 1';
        $dpParams = [];
        if (!empty($network)) {
            $dpSql .= ' AND network = ?';
            $dpParams[] = $network;
        }
        $dpSql .= ' ORDER BY price ASC';
        $dpStmt = $pdo->prepare($dpSql);
        $dpStmt->execute($dpParams);
        $rawPlans = $dpStmt->fetchAll();
    } catch (Exception $e2) {}
}

// Normalize and apply admin overrides
$plans = [];
foreach ($rawPlans as $p) {
    $planId = $p['api_plan_id'] ?? $p['plan_id'] ?? (string)$p['id'];
    $planNet = strtolower($p['network']);
    $override = $customPricing[$planId] ?? null;

    $status = $override['status'] ?? ($p['status'] ?? 'active');
    if ($status === 'paused' || $status === 'inactive') {
        if (!$includeInactive) {
            continue; // Skip paused plans for customer app
        }
    }

    $sellingPrice = (float)($override['sellingPrice'] ?? $p['custom_retail_price'] ?? $p['selling_price'] ?? $p['price'] ?? 0);
    $costPrice = (float)($override['costPrice'] ?? $p['original_wholesale_price'] ?? $p['reseller_price'] ?? 0);

    $plans[] = [
        'id'                       => $planId,
        'network'                  => $planNet,
        'size'                     => $p['size'] ?? '1GB',
        'type'                     => $p['category'] ?? 'Data Share',
        'price'                    => $sellingPrice,
        'selling_price'            => $sellingPrice,
        'custom_retail_price'      => $sellingPrice,
        'reseller_price'           => $costPrice,
        'original_wholesale_price' => $costPrice,
        'plan_id'                  => $planId,
        'api_plan_id'              => $planId,
        'plan_name'                => $p['plan_name'] ?? "{$p['network']} {$p['size']}",
        'validity'                 => $p['validity'] ?? '30 Days',
        'status'                   => $status,
        'is_active'                => ($status === 'active') ? 1 : 0
    ];
}

$payload = [
    'status' => 'success',
    'count'  => count($plans),
    'data'   => $plans
];

// Compute deterministic ETag to support HTTP 304 Not Modified
$etag = md5(json_encode($payload));
Cache::sendConditionalResponse($etag, $payload, 300);

