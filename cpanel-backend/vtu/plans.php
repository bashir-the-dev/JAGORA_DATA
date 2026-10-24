<?php
/**
 * ==============================================================================
 * VTU - FETCH ACTIVE DATA PLANS (AUTHORITATIVE MASTER CATALOG)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

$network = strtolower(trim($_GET['network'] ?? ''));
$includeInactive = !empty($_GET['include_inactive']) || !empty($_GET['all']);

// ==============================================================================
// ADMIN PLAN MUTATIONS: ADD, HIDE/SHOW, EDIT, DELETE
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $admin = requireAdminUser($pdo);

    $rawInput = @file_get_contents('php://input');
    $body = !empty($rawInput) ? @json_decode($rawInput, true) : [];
    if (!is_array($body)) {
        $body = $_POST;
    }

    $action = strtolower(trim($body['action'] ?? $_GET['action'] ?? ''));
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $action = 'delete';
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $action = 'edit';
    }

    // 1. ADD / CREATE NEW PLAN (Strictly tied to the 5 Peyflex data networks)
    if ($action === 'add' || $action === 'create') {
        $rawNet = strtolower(trim($body['network'] ?? 'mtn_gifting_data'));
        if ($rawNet === 'mtn_data_share') {
            $netKey = 'mtn_data_share';
            $planNet = 'MTN';
            $carrierLower = 'mtn';
        } elseif (strpos($rawNet, 'mtn') === 0) {
            $netKey = 'mtn_gifting_data';
            $planNet = 'MTN';
            $carrierLower = 'mtn';
        } elseif (strpos($rawNet, 'glo') === 0) {
            $netKey = 'glo_data';
            $planNet = 'GLO';
            $carrierLower = 'glo';
        } elseif (strpos($rawNet, '9mobile') === 0) {
            $netKey = '9mobile_data';
            $planNet = '9MOBILE';
            $carrierLower = '9mobile';
        } else {
            $netKey = 'airtel_data';
            $planNet = 'AIRTEL';
            $carrierLower = 'airtel';
        }

        $planName = trim($body['name'] ?? $body['plan_name'] ?? '');
        $category = trim($body['category'] ?? $body['type'] ?? 'Gifting Data');
        $size = trim($body['size'] ?? '1GB');
        $validity = trim($body['validity'] ?? '30 Days');
        $sellingPrice = (float)($body['sellingPrice'] ?? $body['selling_price'] ?? $body['price'] ?? 0);
        $costPrice = (float)($body['costPrice'] ?? $body['cost_price'] ?? $body['wholesale'] ?? 0);
        $status = strtolower(trim($body['status'] ?? 'active'));
        if (!in_array($status, ['active', 'paused', 'inactive', 'hidden'], true)) {
            $status = 'active';
        }
        $dbStatus = ($status === 'active') ? 'active' : 'inactive';
        $dpActive = ($status === 'active') ? 1 : 0;

        if (empty($planName)) {
            $planName = "{$size} - {$validity}";
        }

        $apiPlanId = trim($body['id'] ?? $body['plan_id'] ?? $body['api_plan_id'] ?? '');
        if (empty($apiPlanId)) {
            $slugSize = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $size));
            $apiPlanId = $netKey . '_custom_' . $slugSize . '_' . time();
        }

        if ($sellingPrice <= 0) {
            jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Selling price must be greater than ₦0.'], 400);
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO vtu_plans (provider_id, network, plan_name, original_wholesale_price, custom_retail_price, api_plan_id, status, category, size, validity)
                VALUES ('payflex', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    plan_name = VALUES(plan_name),
                    original_wholesale_price = VALUES(original_wholesale_price),
                    custom_retail_price = VALUES(custom_retail_price),
                    status = VALUES(status),
                    category = VALUES(category),
                    size = VALUES(size),
                    validity = VALUES(validity),
                    updated_at = NOW()
            ");
            $stmt->execute([
                $planNet,
                $planName,
                $costPrice,
                $sellingPrice,
                $apiPlanId,
                $dbStatus,
                $category,
                $size,
                $validity
            ]);
        } catch (Exception $e) {}

        try {
            $stmtDp = $pdo->prepare("
                INSERT INTO data_plans (plan_id, network, type, size, price, validity, provider_code, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    price = VALUES(price),
                    type = VALUES(type),
                    size = VALUES(size),
                    validity = VALUES(validity),
                    is_active = VALUES(is_active)
            ");
            $stmtDp->execute([
                $apiPlanId,
                $carrierLower,
                $category,
                $size,
                $sellingPrice,
                $validity,
                $apiPlanId,
                $dpActive
            ]);
        } catch (Exception $e2) {}

        try {
            $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
            $pricingData = ($pricingRow && !empty($pricingRow['value_json'])) ? json_decode($pricingRow['value_json'], true) : [];
            if (!isset($pricingData['customPricing'])) $pricingData['customPricing'] = [];
            $pricingData['customPricing'][$apiPlanId] = [
                'name' => $planName,
                'network' => $netKey,
                'network_key' => $netKey,
                'category' => $category,
                'size' => $size,
                'validity' => $validity,
                'sellingPrice' => $sellingPrice,
                'costPrice' => $costPrice,
                'status' => $status
            ];
            $jsonVal = json_encode($pricingData);
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('pricing_settings', ?) ON DUPLICATE KEY UPDATE value_json = ?");
            $stmt->execute([$jsonVal, $jsonVal]);
        } catch (Exception $e) {}

        Cache::forget('pricing_settings');
        Cache::forget('vtu_plans_all');
        Cache::flush('vtu_plans');

        jsonResponse([
            'status' => 'success',
            'success' => true,
            'message' => "Plan '{$planName}' created successfully and is now active.",
            'data' => [
                'id' => $apiPlanId,
                'plan_id' => $apiPlanId,
                'name' => $planName,
                'network' => $netKey,
                'network_key' => $netKey,
                'category' => $category,
                'size' => $size,
                'validity' => $validity,
                'sellingPrice' => $sellingPrice,
                'costPrice' => $costPrice,
                'status' => $status
            ]
        ]);
        exit;
    }

    // 2. TOGGLE / HIDE / SHOW PLAN
    if ($action === 'toggle' || $action === 'toggle_status' || $action === 'hide' || $action === 'show') {
        $planId = trim($body['id'] ?? $body['planId'] ?? $body['plan_id'] ?? '');
        if (empty($planId)) {
            jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Missing plan identifier.'], 400);
        }

        $targetStatus = $body['status'] ?? null;
        if (empty($targetStatus)) {
            if ($action === 'hide') {
                $targetStatus = 'paused';
            } elseif ($action === 'show') {
                $targetStatus = 'active';
            }
        }

        if (empty($targetStatus)) {
            $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
            $pData = ($pricingRow && !empty($pricingRow['value_json'])) ? json_decode($pricingRow['value_json'], true) : [];
            $cur = $pData['customPricing'][$planId]['status'] ?? 'active';
            $targetStatus = ($cur === 'active') ? 'paused' : 'active';
        }

        $dbStatus = ($targetStatus === 'active') ? 'active' : 'inactive';
        $dpActive = ($targetStatus === 'active') ? 1 : 0;

        try {
            $stmt = $pdo->prepare("UPDATE vtu_plans SET status = ?, updated_at = NOW() WHERE api_plan_id = ? OR id = ?");
            $stmt->execute([$dbStatus, $planId, $planId]);
        } catch (Exception $e) {}

        try {
            $stmtDp = $pdo->prepare("UPDATE data_plans SET is_active = ? WHERE plan_id = ? OR provider_code = ?");
            $stmtDp->execute([$dpActive, $planId, $planId]);
        } catch (Exception $e2) {}

        try {
            $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
            $pricingData = ($pricingRow && !empty($pricingRow['value_json'])) ? json_decode($pricingRow['value_json'], true) : [];
            if (!isset($pricingData['customPricing'])) $pricingData['customPricing'] = [];
            if (!isset($pricingData['customPricing'][$planId]) || !is_array($pricingData['customPricing'][$planId])) {
                $pricingData['customPricing'][$planId] = [];
            }
            $pricingData['customPricing'][$planId]['status'] = $targetStatus;

            $jsonVal = json_encode($pricingData);
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('pricing_settings', ?) ON DUPLICATE KEY UPDATE value_json = ?");
            $stmt->execute([$jsonVal, $jsonVal]);
        } catch (Exception $e) {}

        Cache::forget('pricing_settings');
        Cache::forget('vtu_plans_all');
        Cache::flush('vtu_plans');

        $label = ($targetStatus === 'active') ? 'visible to customers' : 'hidden from mobile app';
        jsonResponse([
            'status' => 'success',
            'success' => true,
            'message' => "Plan '{$planId}' is now {$targetStatus} ({$label}).",
            'data' => [
                'planId' => $planId,
                'status' => $targetStatus
            ]
        ]);
        exit;
    }

    // 3. EDIT / UPDATE PLAN
    if ($action === 'edit' || $action === 'update' || empty($action)) {
        $planId = trim($body['id'] ?? $body['planId'] ?? $body['plan_id'] ?? '');
        if (empty($planId)) {
            jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Missing plan identifier to update.'], 400);
        }

        $sellingPrice = isset($body['sellingPrice']) ? (float)$body['sellingPrice'] : (isset($body['selling_price']) ? (float)$body['selling_price'] : (isset($body['custom_retail_price']) ? (float)$body['custom_retail_price'] : null));
        $costPrice = isset($body['costPrice']) ? (float)$body['costPrice'] : (isset($body['cost_price']) ? (float)$body['cost_price'] : (isset($body['original_wholesale_price']) ? (float)$body['original_wholesale_price'] : null));
        $status = $body['status'] ?? null;
        $planName = $body['name'] ?? $body['plan_name'] ?? null;
        $size = $body['size'] ?? null;
        $validity = $body['validity'] ?? null;
        $category = $body['category'] ?? $body['type'] ?? null;

        try {
            $updates = [];
            $params = [];
            if ($sellingPrice !== null && $sellingPrice > 0) {
                $updates[] = 'custom_retail_price = ?';
                $params[] = $sellingPrice;
            }
            if ($costPrice !== null && $costPrice >= 0) {
                $updates[] = 'original_wholesale_price = ?';
                $params[] = $costPrice;
            }
            if (!empty($status)) {
                $updates[] = 'status = ?';
                $params[] = ($status === 'active') ? 'active' : 'inactive';
            }
            if (!empty($planName)) {
                $updates[] = 'plan_name = ?';
                $params[] = $planName;
            }
            if (!empty($size)) {
                $updates[] = 'size = ?';
                $params[] = $size;
            }
            if (!empty($validity)) {
                $updates[] = 'validity = ?';
                $params[] = $validity;
            }
            if (!empty($category)) {
                $updates[] = 'category = ?';
                $params[] = $category;
            }

            if (!empty($updates)) {
                $updates[] = 'updated_at = NOW()';
                $sql = "UPDATE vtu_plans SET " . implode(', ', $updates) . " WHERE api_plan_id = ? OR id = ?";
                $params[] = $planId;
                $params[] = $planId;
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                // If row did not exist in vtu_plans yet, insert it so it persists in MySQL
                if ($stmt->rowCount() === 0 && !is_numeric($planId)) {
                    $chk = $pdo->prepare("SELECT id FROM vtu_plans WHERE api_plan_id = ? LIMIT 1");
                    $chk->execute([$planId]);
                    if (!$chk->fetch()) {
                        $inferredNet = str_starts_with($planId, 'mtn') ? 'MTN' : (str_starts_with($planId, 'glo') ? 'GLO' : (str_starts_with($planId, '9mobile') ? '9MOBILE' : 'AIRTEL'));
                        $inferredCat = $category ?: (str_starts_with($planId, 'mtn_data_share') ? 'Data Share' : ((str_starts_with($planId, 'glo') || str_starts_with($planId, '9mobile')) ? 'Corporate Gifting' : 'Gifting Data'));
                        $insVtu = $pdo->prepare("
                            INSERT INTO vtu_plans (provider_id, network, plan_name, original_wholesale_price, custom_retail_price, api_plan_id, status, category, size, validity, last_synced_at)
                            VALUES ('payflex', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ");
                        $insVtu->execute([
                            $inferredNet,
                            $planName ?: ($inferredNet . ' ' . ($size ?: '1GB')),
                            $costPrice ?? 0,
                            $sellingPrice ?? 0,
                            $planId,
                            ($status === 'paused' || $status === 'inactive') ? 'inactive' : 'active',
                            $inferredCat,
                            $size ?: '1GB',
                            $validity ?: '30 Days'
                        ]);
                    }
                }
            }
        } catch (Exception $e) {}

        // Also update data_plans table so buy_data.php and transaction.php read the updated retail price and status directly
        try {
            $dpUpdates = [];
            $dpParams = [];
            if ($sellingPrice !== null && $sellingPrice > 0) {
                $dpUpdates[] = 'price = ?';
                $dpParams[] = $sellingPrice;
            }
            if (!empty($status)) {
                $dpUpdates[] = 'is_active = ?';
                $dpParams[] = ($status === 'active') ? 1 : 0;
            }
            if (!empty($size)) {
                $dpUpdates[] = 'size = ?';
                $dpParams[] = $size;
            }
            if (!empty($validity)) {
                $dpUpdates[] = 'validity = ?';
                $dpParams[] = $validity;
            }
            if (!empty($category)) {
                $dpUpdates[] = 'type = ?';
                $dpParams[] = $category;
            }
            if (!empty($dpUpdates)) {
                $dpSql = "UPDATE data_plans SET " . implode(', ', $dpUpdates) . " WHERE plan_id = ? OR provider_code = ?";
                $dpParams[] = $planId;
                $dpParams[] = $planId;
                $stmtDp = $pdo->prepare($dpSql);
                $stmtDp->execute($dpParams);
            }
        } catch (Exception $e2) {}

        try {
            $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
            $pricingData = ($pricingRow && !empty($pricingRow['value_json'])) ? json_decode($pricingRow['value_json'], true) : [];
            if (!isset($pricingData['customPricing'])) $pricingData['customPricing'] = [];
            if (!isset($pricingData['customPricing'][$planId]) || !is_array($pricingData['customPricing'][$planId])) {
                $pricingData['customPricing'][$planId] = [];
            }

            if ($sellingPrice !== null) $pricingData['customPricing'][$planId]['sellingPrice'] = $sellingPrice;
            if ($costPrice !== null) $pricingData['customPricing'][$planId]['costPrice'] = $costPrice;
            if (!empty($status)) $pricingData['customPricing'][$planId]['status'] = $status;
            if (!empty($planName)) $pricingData['customPricing'][$planId]['name'] = $planName;
            if (!empty($size)) $pricingData['customPricing'][$planId]['size'] = $size;
            if (!empty($validity)) $pricingData['customPricing'][$planId]['validity'] = $validity;
            if (!empty($category)) $pricingData['customPricing'][$planId]['category'] = $category;

            $jsonVal = json_encode($pricingData);
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('pricing_settings', ?) ON DUPLICATE KEY UPDATE value_json = ?");
            $stmt->execute([$jsonVal, $jsonVal]);
        } catch (Exception $e) {}

        Cache::forget('pricing_settings');
        Cache::forget('vtu_plans_all');
        Cache::flush('vtu_plans');

        jsonResponse([
            'status' => 'success',
            'success' => true,
            'message' => "Plan '{$planId}' updated successfully.",
            'data' => [
                'planId' => $planId,
                'sellingPrice' => $sellingPrice,
                'costPrice' => $costPrice,
                'status' => $status
            ]
        ]);
        exit;
    }

    // 4. DELETE / DEACTIVATE PLAN
    if ($action === 'delete') {
        $planId = trim($body['id'] ?? $body['planId'] ?? $body['plan_id'] ?? '');
        if (empty($planId)) {
            jsonResponse(['status' => 'error', 'success' => false, 'message' => 'Missing plan identifier to delete.'], 400);
        }

        try {
            $stmt = $pdo->prepare("UPDATE vtu_plans SET status = 'inactive', updated_at = NOW() WHERE api_plan_id = ? OR id = ?");
            $stmt->execute([$planId, $planId]);
        } catch (Exception $e) {}

        try {
            $stmtDp = $pdo->prepare("UPDATE data_plans SET is_active = 0 WHERE plan_id = ? OR provider_code = ?");
            $stmtDp->execute([$planId, $planId]);
        } catch (Exception $e2) {}

        try {
            $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
            $pricingData = ($pricingRow && !empty($pricingRow['value_json'])) ? json_decode($pricingRow['value_json'], true) : [];
            if (!isset($pricingData['customPricing'])) $pricingData['customPricing'] = [];
            if (!isset($pricingData['customPricing'][$planId])) $pricingData['customPricing'][$planId] = [];
            $pricingData['customPricing'][$planId]['status'] = 'inactive';
            $jsonVal = json_encode($pricingData);
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value_json) VALUES ('pricing_settings', ?) ON DUPLICATE KEY UPDATE value_json = ?");
            $stmt->execute([$jsonVal, $jsonVal]);
        } catch (Exception $e) {}

        Cache::forget('pricing_settings');
        Cache::forget('vtu_plans_all');
        Cache::flush('vtu_plans');

        jsonResponse([
            'status' => 'success',
            'success' => true,
            'message' => "Plan '{$planId}' deactivated successfully."
        ]);
        exit;
    }
}

// 1. Load Admin Custom Pricing Overrides from settings table
$pricingRow = null;
try {
    $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
} catch (\Throwable $t) {}
$customPricing = [];
if ($pricingRow && !empty($pricingRow['value_json'])) {
    $pData = json_decode($pricingRow['value_json'], true);
    $customPricing = $pData['customPricing'] ?? [];
}

// 2. Query plans from vtu_plans table
$rawPlans = [];
try {
    $sql = 'SELECT id, provider_id, network, category, api_plan_id, api_plan_id AS plan_id, plan_name, 
                   custom_retail_price, custom_retail_price AS selling_price, 
                   original_wholesale_price, original_wholesale_price AS reseller_price, 
                   size, validity, status, last_synced_at 
            FROM vtu_plans 
            WHERE 1=1
            ORDER BY custom_retail_price ASC, selling_price ASC';

    $stmt = $pdo->query($sql);
    $rawPlans = $stmt ? ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
} catch (Exception $e) {}

// Fallback to data_plans table if vtu_plans had zero rows
if (empty($rawPlans)) {
    try {
        $dpSql = 'SELECT id, network, type AS category, plan_id AS api_plan_id, plan_id, provider_code,
                         CONCAT(UPPER(network), " ", size, " (", type, ")") AS plan_name, 
                         price AS selling_price, price AS custom_retail_price, price AS reseller_price, size, validity, "active" AS status 
                  FROM data_plans 
                  WHERE is_active = 1
                  ORDER BY price ASC';
        $dpStmt = $pdo->query($dpSql);
        $rawPlans = $dpStmt ? ($dpStmt->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
    } catch (Exception $e2) {}
}

// 3. Authoritative Peyflex Master Catalog built from canonical getPeyflexFallbackPlansByNetwork() (86 Plans across 5 Peyflex Networks)
$validPeyflexNets = ['mtn_gifting_data', 'glo_data', '9mobile_data', 'airtel_data', 'mtn_data_share'];
$masterCatalog = [];
foreach ($validPeyflexNets as $pfNetKey) {
    $carrierName = str_starts_with($pfNetKey, 'mtn') ? 'mtn' : (str_starts_with($pfNetKey, 'glo') ? 'glo' : (str_starts_with($pfNetKey, '9mobile') ? '9mobile' : 'airtel'));
    $catName = ($pfNetKey === 'mtn_data_share') ? 'Data Share' : (($pfNetKey === 'glo_data' || $pfNetKey === '9mobile_data') ? 'Corporate Gifting' : 'Gifting Data');
    $fallbackRows = function_exists('getPeyflexFallbackPlansByNetwork') ? getPeyflexFallbackPlansByNetwork($pfNetKey) : [];
    $seenNetCodes = [];
    foreach ($fallbackRows as $fb) {
        $code = trim((string)($fb['plan_code'] ?? ''));
        $rawAmt = (float)($fb['amount'] ?? 0);
        $label = trim((string)($fb['label'] ?? ''));
        if ($code === '' || $rawAmt <= 0) continue;
        $cost = function_exists('calculatePeyflexWholesaleCost')
            ? calculatePeyflexWholesaleCost($pfNetKey, $rawAmt)
            : round($rawAmt, 2);
        $cleanSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $code));
        if (isset($seenNetCodes[$cleanSlug])) {
            $cleanSlug .= '_alt';
        }
        $seenNetCodes[$cleanSlug] = true;
        $cId = $pfNetKey . '_' . $cleanSlug;
        $retail = round($cost * 1.06, 2);

        $sizeStr = '1GB';
        if (preg_match('/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i', $label, $sm)) {
            $sizeStr = strtoupper(str_replace(' ', '', $sm[1]));
        } elseif (preg_match('/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i', $code, $sm2)) {
            $sizeStr = strtoupper(str_replace(' ', '', $sm2[1]));
        }

        $valStr = '30 Days';
        if (preg_match('/(\d+\s*(?:Days?|Weeks?|Months?|Year))/i', $label, $vm)) {
            $valStr = ucwords(strtolower(trim($vm[1])));
        } elseif (stripos($label, 'weekly') !== false) {
            $valStr = '7 Days';
        } elseif (stripos($label, 'daily') !== false || stripos($label, '1 day') !== false) {
            $valStr = '1 Day';
        } elseif (stripos($label, 'night') !== false) {
            $valStr = '14 Days';
        }

        $masterCatalog[] = [
            'id' => $cId,
            'api_plan_id' => $code,
            'plan_code' => $code,
            'network' => $carrierName,
            'network_key' => $pfNetKey,
            'network_identifier' => $pfNetKey,
            'size' => $sizeStr,
            'validity' => $valStr,
            'type' => $catName,
            'category' => $catName,
            'price' => $retail,
            'cost_price' => $cost,
            'gateway_price' => $cost,
            'wholesale' => $cost,
            'plan_name' => $label ?: "{$sizeStr} - {$valStr}",
        ];
    }
}

// Optional live Peyflex fetch if ?live=1 is requested for one of the 5 Peyflex networks
if (!empty($_GET['live']) && in_array($network, $validPeyflexNets, true) && function_exists('fetchPeyflexPlansByNetwork')) {
    $liveRows = fetchPeyflexPlansByNetwork($network);
    if (!empty($liveRows)) {
        $liveCatalog = [];
        $carrierName = str_starts_with($network, 'mtn') ? 'mtn' : (str_starts_with($network, 'glo') ? 'glo' : (str_starts_with($network, '9mobile') ? '9mobile' : 'airtel'));
        $catName = ($network === 'mtn_data_share') ? 'Data Share' : (($network === 'glo_data' || $network === '9mobile_data') ? 'Corporate Gifting' : 'Gifting Data');
        $seenLiveCodes = [];
        foreach ($liveRows as $lp) {
            $code = trim((string)($lp['plan_code'] ?? $lp['id'] ?? ''));
            $label = trim((string)($lp['label'] ?? $lp['plan_name'] ?? ''));
            $amt = (float)($lp['amount'] ?? $lp['price'] ?? 0);
            if ($code === '' || $amt <= 0) continue;
            $cleanSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $code));
            if (isset($seenLiveCodes[$cleanSlug])) {
                $cleanSlug .= '_alt';
            }
            $seenLiveCodes[$cleanSlug] = true;
            $cId = $network . '_' . $cleanSlug;
            $cost = function_exists('calculatePeyflexWholesaleCost')
                ? calculatePeyflexWholesaleCost($network, $amt)
                : round($amt, 2);
            $retail = round($cost * 1.06, 2);
            preg_match('/(\d+(?:\.\d+)?\s*(?:MB|GB|TB)(?:\s*\+\s*[\d.]+\s*Mins?)?)/i', $label, $sm);
            preg_match('/(\d+\s*(?:Days?|Months?|Years?|Weeks?))/i', $label, $vm);
            $liveCatalog[] = [
                'id' => $cId,
                'api_plan_id' => $code,
                'plan_code' => $code,
                'network' => $carrierName,
                'network_key' => $network,
                'network_identifier' => $network,
                'size' => isset($sm[1]) ? trim($sm[1]) : '1GB',
                'validity' => isset($vm[1]) ? trim($vm[1]) : '30 Days',
                'type' => $catName,
                'category' => $catName,
                'price' => $retail,
                'cost_price' => $cost,
                'gateway_price' => $cost,
                'wholesale' => $cost,
                'plan_name' => $label ?: "{$code} ({$network})",
            ];
        }
        if (!empty($liveCatalog)) {
            $masterCatalog = $liveCatalog;
        }
    }
}

$isSpecificPeyflexNet = in_array($network, $validPeyflexNets, true);

// Build lookup map of masterCatalog by canonical ID so DB rows inherit accurate plan_code and network_key
$masterById = [];
foreach ($masterCatalog as $mc) {
    $masterById[$mc['id']] = $mc;
}

$seenIds = [];
$plans = [];

foreach ($rawPlans as $p) {
    $rawId = trim((string)($p['api_plan_id'] ?? $p['plan_id'] ?? $p['id'] ?? ''));
    $planNet = strtolower(trim((string)($p['network'] ?? '')));

    $netKey = strtolower(trim((string)($p['network_key'] ?? '')));
    foreach ($validPeyflexNets as $vn) {
        if (stripos($rawId, $vn . '_') === 0) {
            $netKey = $vn;
            break;
        }
    }
    if (empty($netKey)) {
        if ($planNet === 'mtn') {
            $netKey = (stripos($p['category'] ?? $p['type'] ?? '', 'share') !== false) ? 'mtn_data_share' : 'mtn_gifting_data';
        } elseif ($planNet === 'airtel') {
            $netKey = 'airtel_data';
        } elseif ($planNet === 'glo') {
            $netKey = 'glo_data';
        } elseif ($planNet === '9mobile') {
            $netKey = '9mobile_data';
        }
    }

    // Normalize canonical ID: e.g. mtn_gifting_data_m110mbs
    $canonicalId = (stripos($rawId, $netKey . '_') === 0)
        ? strtolower($rawId)
        : ($netKey . '_' . strtolower($rawId));

    // Only include plans belonging to the 5 Peyflex data networks
    if (!in_array($netKey, $validPeyflexNets, true)) {
        continue;
    }

    // Filter out discontinued legacy DB rows that are neither in the 86-plan Peyflex catalog nor custom-configured by admin
    $mcFallback = $masterById[$canonicalId] ?? null;
    $override = $customPricing[$canonicalId] ?? ($customPricing[$rawId] ?? null);
    if (!$mcFallback && !$override && stripos($canonicalId, '_custom_') === false) {
        continue;
    }

    // Strict filtering: if $network is one of the 5 Peyflex network identifiers, require exact $netKey match
    if (!empty($network)) {
        if ($isSpecificPeyflexNet) {
            if ($netKey !== $network) continue;
        } else {
            if ($planNet !== $network && $netKey !== $network) continue;
        }
    }

    if (isset($seenIds[$canonicalId])) {
        continue;
    }

    $status = $override['status'] ?? ($p['status'] ?? 'active');
    if (($status === 'paused' || $status === 'inactive') && !$includeInactive) {
        continue;
    }

    $sellingPrice = (float)($override['sellingPrice'] ?? $p['custom_retail_price'] ?? $p['selling_price'] ?? $p['price'] ?? ($mcFallback['price'] ?? 0));
    $costPrice = (float)($override['costPrice'] ?? $p['original_wholesale_price'] ?? $p['reseller_price'] ?? ($mcFallback['wholesale'] ?? 0));
    $rawPlanCode = $mcFallback['plan_code'] ?? ($p['provider_code'] ?? $rawId);
    $planCode = function_exists('resolvePeyflexPlanCode')
        ? resolvePeyflexPlanCode($rawPlanCode, $netKey, [
            'size'      => $override['size'] ?? $p['size'] ?? ($mcFallback['size'] ?? '1GB'),
            'validity'  => $override['validity'] ?? $p['validity'] ?? ($mcFallback['validity'] ?? '30 Days'),
            'plan_name' => $override['name'] ?? $p['plan_name'] ?? ($mcFallback['plan_name'] ?? ''),
        ])
        : $rawPlanCode;

    $seenIds[$canonicalId] = true;
    $plans[] = [
        'id'                       => $canonicalId,
        'network'                  => $planNet ?: ($mcFallback['network'] ?? 'mtn'),
        'network_key'              => $netKey,
        'network_identifier'       => $netKey,
        'size'                     => $override['size'] ?? $p['size'] ?? ($mcFallback['size'] ?? '1GB'),
        'type'                     => $override['category'] ?? $p['category'] ?? $p['type'] ?? ($mcFallback['type'] ?? 'Gifting Data'),
        'category'                 => $override['category'] ?? $p['category'] ?? $p['type'] ?? ($mcFallback['category'] ?? 'Gifting Data'),
        'price'                    => $sellingPrice,
        'selling_price'            => $sellingPrice,
        'custom_retail_price'      => $sellingPrice,
        'reseller_price'           => $costPrice,
        'original_wholesale_price' => $costPrice,
        'gateway_price'            => $costPrice,
        'cost_price'               => $costPrice,
        'plan_code'                => $planCode,
        'plan_id'                  => $canonicalId,
        'api_plan_id'              => $canonicalId,
        'plan_name'                => $override['name'] ?? $p['plan_name'] ?? ($mcFallback['plan_name'] ?? (strtoupper($planNet) . ' ' . ($p['size'] ?? '1GB'))),
        'validity'                 => $override['validity'] ?? $p['validity'] ?? ($mcFallback['validity'] ?? '30 Days'),
        'status'                   => $status,
        'is_active'                => ($status === 'active') ? 1 : 0
    ];
}

// Add any missing plans from master catalog (86 Peyflex plans)
foreach ($masterCatalog as $m) {
    $mId = $m['id'];
    $mNet = strtolower($m['network']);
    $mNetKey = $m['network_key'] ?? $m['network_identifier'] ?? '';

    if (!empty($network)) {
        if ($isSpecificPeyflexNet) {
            if ($mNetKey !== $network) continue;
        } else {
            if ($mNet !== $network && $mNetKey !== $network) continue;
        }
    }
    if (isset($seenIds[$mId])) {
        continue;
    }

    $override = $customPricing[$mId] ?? null;
    $status = $override['status'] ?? 'active';
    if (($status === 'paused' || $status === 'inactive') && !$includeInactive) {
        continue;
    }

    $sellingPrice = (float)($override['sellingPrice'] ?? $m['price']);
    $costPrice = (float)($override['costPrice'] ?? $m['wholesale']);

    $seenIds[$mId] = true;
    $plans[] = [
        'id'                       => $mId,
        'network'                  => $mNet,
        'network_key'              => $mNetKey,
        'network_identifier'       => $mNetKey,
        'size'                     => $override['size'] ?? $m['size'],
        'type'                     => $override['category'] ?? $m['type'],
        'category'                 => $override['category'] ?? $m['category'],
        'price'                    => $sellingPrice,
        'selling_price'            => $sellingPrice,
        'custom_retail_price'      => $sellingPrice,
        'reseller_price'           => $costPrice,
        'original_wholesale_price' => $costPrice,
        'gateway_price'            => $costPrice,
        'cost_price'               => $costPrice,
        'plan_code'                => $m['plan_code'],
        'plan_id'                  => $mId,
        'api_plan_id'              => $mId,
        'plan_name'                => $override['name'] ?? $m['plan_name'],
        'validity'                 => $override['validity'] ?? $m['validity'],
        'status'                   => $status,
        'is_active'                => ($status === 'active') ? 1 : 0
    ];
}

// Also include any custom plans defined in customPricing that belong to the 5 Peyflex networks
foreach ($customPricing as $cId => $cDetails) {
    if (isset($seenIds[$cId])) {
        continue;
    }
    $cNetKey = strtolower($cDetails['network_key'] ?? $cDetails['network'] ?? '');
    foreach ($validPeyflexNets as $vn) {
        if (stripos($cId, $vn . '_') === 0) {
            $cNetKey = $vn;
            break;
        }
    }
    if (!in_array($cNetKey, $validPeyflexNets, true)) {
        continue;
    }
    if (!empty($network)) {
        if ($isSpecificPeyflexNet && $cNetKey !== $network) {
            continue;
        }
    }
    $status = $cDetails['status'] ?? 'active';
    if (($status === 'paused' || $status === 'inactive' || $status === 'hidden') && !$includeInactive) {
        continue;
    }
    $sellingPrice = (float)($cDetails['sellingPrice'] ?? $cDetails['price'] ?? 0);
    $costPrice = (float)($cDetails['costPrice'] ?? $cDetails['wholesale'] ?? 0);
    $cCarrier = str_starts_with($cNetKey, 'mtn') ? 'mtn' : (str_starts_with($cNetKey, 'glo') ? 'glo' : (str_starts_with($cNetKey, '9mobile') ? '9mobile' : 'airtel'));
    $resolvedCustomCode = function_exists('resolvePeyflexPlanCode')
        ? resolvePeyflexPlanCode($cDetails['plan_code'] ?? $cDetails['planCode'] ?? $cId, $cNetKey, [
            'size'      => $cDetails['size'] ?? '1GB',
            'validity'  => $cDetails['validity'] ?? '30 Days',
            'plan_name' => $cDetails['name'] ?? $cDetails['plan_name'] ?? '',
        ])
        : ($cDetails['plan_code'] ?? $cId);
    $seenIds[$cId] = true;
    $plans[] = [
        'id'                       => $cId,
        'network'                  => $cCarrier,
        'network_key'              => $cNetKey,
        'network_identifier'       => $cNetKey,
        'size'                     => $cDetails['size'] ?? '1GB',
        'type'                     => $cDetails['category'] ?? $cDetails['type'] ?? 'Custom Plan',
        'category'                 => $cDetails['category'] ?? $cDetails['type'] ?? 'Custom Plan',
        'price'                    => $sellingPrice,
        'selling_price'            => $sellingPrice,
        'custom_retail_price'      => $sellingPrice,
        'reseller_price'           => $costPrice,
        'original_wholesale_price' => $costPrice,
        'plan_id'                  => $cId,
        'api_plan_id'              => $cId,
        'plan_code'                => $resolvedCustomCode,
        'plan_name'                => $cDetails['name'] ?? $cDetails['plan_name'] ?? (strtoupper($cCarrier) . ' ' . ($cDetails['size'] ?? '1GB')),
        'validity'                 => $cDetails['validity'] ?? '30 Days',
        'status'                   => $status,
        'is_active'                => ($status === 'active') ? 1 : 0
    ];
}

// Sort all returned plans in ascending order of data size downward (e.g. 75MB -> 110MB -> 500MB -> 1GB -> 2GB...)
$parseSizeToMb = function (string $sizeStr): float {
    $s = strtoupper(trim($sizeStr));
    if ($s === '') return 0.0;
    $num = (float)preg_replace('/[^0-9.]/', '', $s);
    if (str_contains($s, 'TB')) return $num * 1024 * 1024;
    if (str_contains($s, 'GB')) return $num * 1024;
    if (str_contains($s, 'MB')) return $num;
    return $num;
};

usort($plans, function (array $a, array $b) use ($parseSizeToMb): int {
    $sizeA = $parseSizeToMb((string)($a['size'] ?? ''));
    $sizeB = $parseSizeToMb((string)($b['size'] ?? ''));
    if (abs($sizeA - $sizeB) > 0.001) {
        return $sizeA <=> $sizeB;
    }
    return ((float)($a['price'] ?? 0)) <=> ((float)($b['price'] ?? 0));
});

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$payload = [
    'status'  => 'success',
    'success' => true,
    'count'   => count($plans),
    'data'    => $plans
];

jsonResponse($payload);
