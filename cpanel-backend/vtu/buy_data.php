<?php
/**
 * ==============================================================================
 * VTU - DISPATCH DATA ORDER (HusmoData / Alrahuz / Wholesale Gateway)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

// Defensive Router: If serviceType is specified and is NOT data, route to its dedicated service handler
$requestedService = strtolower(trim($body['serviceType'] ?? $body['service'] ?? 'data'));
if ($requestedService !== '' && $requestedService !== 'data') {
    require __DIR__ . '/transaction.php';
    exit;
}

$rawNetwork = strtolower(trim($body['network_key'] ?? $body['networkKey'] ?? $body['network'] ?? ''));
$network    = $rawNetwork;
$planId     = trim($body['plan_id'] ?? $body['planId'] ?? $body['api_plan_id'] ?? $body['plan_code'] ?? $body['planCode'] ?? $body['plan'] ?? '');
$explicitPlanCode = trim($body['plan_code'] ?? $body['planCode'] ?? '');
$planName   = trim($body['plan_name'] ?? $body['planName'] ?? 'Data Bundle');
$planSize   = trim($body['size'] ?? '');
$planValidity = trim($body['validity'] ?? '');
$phone      = normalizePhone($body['phone'] ?? $body['mobile_number'] ?? $body['recipient'] ?? '');
$amount     = (float)($body['amount'] ?? 0);
$pin        = trim($body['pin'] ?? '');

// 1. Validations
if (empty($network) || empty($phone) || (empty($planId) && empty($explicitPlanCode))) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please select a network, data plan, and enter the recipient phone number.'
    ], 400);
}
if (empty($planId)) {
    $planId = $explicitPlanCode;
}

if (!isValidNigerianPhone($phone)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please enter a valid 11-digit phone number (e.g. 08012345678).'
    ], 400);
}

// Check if Data Service is shut down by administration
if (!isServiceEnabled('data', $pdo)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Data purchase is temporarily paused for routine maintenance. Please check back shortly.'
    ], 503);
}

// Determine canonical Peyflex network key
$validPeyflexNets = ['mtn_gifting_data', 'glo_data', '9mobile_data', 'airtel_data', 'mtn_data_share'];
$peyflexNetworkKey = in_array($rawNetwork, $validPeyflexNets, true) ? $rawNetwork : '';
if (empty($peyflexNetworkKey)) {
    foreach ($validPeyflexNets as $pn) {
        if (stripos($planId, $pn . '_') === 0) {
            $peyflexNetworkKey = $pn;
            break;
        }
    }
}
if (empty($peyflexNetworkKey)) {
    $catHint = strtolower(trim($body['category'] ?? $body['type'] ?? $body['dataType'] ?? ''));
    if (str_contains($rawNetwork, 'mtn')) {
        $peyflexNetworkKey = (str_contains($rawNetwork, 'share') || str_contains($catHint, 'share'))
            ? 'mtn_data_share'
            : 'mtn_gifting_data';
    } elseif (str_contains($rawNetwork, 'glo')) {
        $peyflexNetworkKey = 'glo_data';
    } elseif (str_contains($rawNetwork, '9mob') || str_contains($rawNetwork, 'eti')) {
        $peyflexNetworkKey = '9mobile_data';
    } elseif (str_contains($rawNetwork, 'air')) {
        $peyflexNetworkKey = 'airtel_data';
    } else {
        $peyflexNetworkKey = 'mtn_gifting_data';
    }
}

$canonicalLookupId = stripos($planId, $peyflexNetworkKey . '_') === 0
    ? strtolower($planId)
    : $peyflexNetworkKey . '_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $planId));

// 2. Universal Plan Acceptance & Peyflex Gateway Float Verification
$dbPlan = null;
$costPrice = 0.0;
$resolvedProviderCode = $explicitPlanCode;
try {
    $planStmt = $pdo->prepare('SELECT plan_name, custom_retail_price AS selling_price, original_wholesale_price AS cost_price, network, api_plan_id, category, size, validity, status FROM vtu_plans WHERE (api_plan_id = ? OR api_plan_id = ?) LIMIT 1');
    $planStmt->execute([$canonicalLookupId, $planId]);
    $dbPlan = $planStmt->fetch();
} catch (\Throwable $t1) {
    try {
        $planStmt = $pdo->prepare('SELECT plan_name, COALESCE(custom_retail_price, selling_price) AS selling_price, COALESCE(original_wholesale_price, 0) AS cost_price, network, COALESCE(api_plan_id, plan_id) AS api_plan_id, category, size, status FROM vtu_plans WHERE (api_plan_id = ? OR api_plan_id = ? OR plan_id = ? OR plan_id = ?) LIMIT 1');
        $planStmt->execute([$canonicalLookupId, $planId, $canonicalLookupId, $planId]);
        $dbPlan = $planStmt->fetch();
    } catch (\Throwable $t2) {}
}

if (!$dbPlan) {
    try {
        $dpStmt = $pdo->prepare("SELECT CONCAT(UPPER(network), ' ', size, ' (', type, ')') AS plan_name, price AS selling_price, 0 AS cost_price, network, plan_id AS api_plan_id, type AS category, size, validity, provider_code, IF(is_active = 1, 'active', 'inactive') AS status FROM data_plans WHERE (plan_id = ? OR plan_id = ? OR provider_code = ?) LIMIT 1");
        $dpStmt->execute([$canonicalLookupId, $planId, $planId]);
        $dbPlan = $dpStmt->fetch();
    } catch (\Throwable $t) {}
}

if ($dbPlan) {
    if (!empty($dbPlan['status']) && in_array($dbPlan['status'], ['inactive', 'paused'], true)) {
        jsonResponse(['status' => 'error', 'message' => 'This data plan is currently paused by administration.'], 400);
    }
    $amount = (float)$dbPlan['selling_price'];
    $costPrice = (float)($dbPlan['cost_price'] ?? 0);
    $planName = $dbPlan['plan_name'] ?: $planName;
    if (empty($planSize) && !empty($dbPlan['size'])) {
        $planSize = $dbPlan['size'];
    }
    if (empty($planValidity) && !empty($dbPlan['validity'])) {
        $planValidity = $dbPlan['validity'];
    }
    if (empty($resolvedProviderCode) && !empty($dbPlan['provider_code'])) {
        $resolvedProviderCode = trim((string)$dbPlan['provider_code']);
    }
    if (empty($resolvedProviderCode) && !empty($dbPlan['api_plan_id'])) {
        $resolvedProviderCode = trim((string)$dbPlan['api_plan_id']);
    }
} else {
    // Check against fallback catalog
    $fallbackPlans = getPeyflexFallbackPlansByNetwork($peyflexNetworkKey);
    $foundFallback = false;
    foreach ($fallbackPlans as $fp) {
        $fpCode = trim((string)($fp['plan_code'] ?? ''));
        $fpCanon = $peyflexNetworkKey . '_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $fpCode));
        if (strcasecmp($planId, $fpCode) === 0 || strcasecmp($canonicalLookupId, $fpCanon) === 0 || ($explicitPlanCode !== '' && strcasecmp($explicitPlanCode, $fpCode) === 0)) {
            $rawFpAmt = (float)($fp['amount'] ?? 0);
            $costPrice = function_exists('calculatePeyflexWholesaleCost')
                ? calculatePeyflexWholesaleCost($peyflexNetworkKey, $rawFpAmt)
                : round($rawFpAmt, 2);
            $amount = round($costPrice * 1.06, 2);
            $planName = $fp['label'] ?? $planName;
            $resolvedProviderCode = $fpCode;
            $foundFallback = true;
            break;
        }
    }
    if (!$foundFallback) {
        // Universal Acceptance: Any data plan can be bought as long as user has funds
        if ($amount <= 0) {
            $amount = (float)($body['amount'] ?? 500);
        }
        if (empty($planName) || $planName === 'Data Bundle') {
            $planName = $body['plan_name'] ?? ($body['planName'] ?? ($planId . ' Data Bundle'));
        }
    }
    if ($amount < 10 || $amount > 500000) {
        jsonResponse([
            'status'  => 'error',
            'message' => 'Invalid data plan amount specified.'
        ], 400);
    }
}

// Apply Admin Custom Pricing Override if configured in settings
try {
    $pricingConfRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
    if ($pricingConfRow && !empty($pricingConfRow['value_json'])) {
        $pConf = json_decode($pricingConfRow['value_json'], true);
        $matchedPricing = $pConf['customPricing'][$canonicalLookupId]
            ?? ($pConf['customPricing'][$planId] 
            ?? ($pConf['customPricing'][$dbPlan['api_plan_id'] ?? ''] 
            ?? ($pConf['customPricing'][$dbPlan['plan_id'] ?? ''] 
            ?? ($pConf['customPricing'][$dbPlan['id'] ?? ''] ?? null))));

        if ($matchedPricing) {
            if (!empty($matchedPricing['sellingPrice']) && (float)$matchedPricing['sellingPrice'] > 0) {
                $amount = (float)$matchedPricing['sellingPrice'];
            }
            if (!empty($matchedPricing['costPrice']) && (float)$matchedPricing['costPrice'] > 0) {
                $costPrice = (float)$matchedPricing['costPrice'];
            }
            if (!empty($matchedPricing['name'])) {
                $planName = $matchedPricing['name'];
            }
            if (!empty($matchedPricing['size'])) {
                $planSize = $matchedPricing['size'];
            }
            if (!empty($matchedPricing['validity'])) {
                $planValidity = $matchedPricing['validity'];
            }
            if (!empty($matchedPricing['plan_code']) || !empty($matchedPricing['planCode'])) {
                $resolvedProviderCode = trim((string)($matchedPricing['plan_code'] ?? $matchedPricing['planCode']));
            }
            if (!empty($matchedPricing['status']) && ($matchedPricing['status'] === 'paused' || $matchedPricing['status'] === 'inactive')) {
                jsonResponse(['status' => 'error', 'message' => 'This data plan is temporarily paused by administration.'], 400);
            }
        }
    }
} catch (\Throwable $e) {}

if ($costPrice <= 0) {
    $costPrice = round($amount / 1.06, 2);
}
$profitMargin = max(0.0, round($amount - $costPrice, 2));

// Check Peyflex Gateway Wallet Float Balance against wholesale costPrice before proceeding
try {
    $pfBalRes = callPayflex('wallet/balance/', [], 'GET');
    $peyflexFloat = (float)($pfBalRes['wallet_credit'] ?? $pfBalRes['balance'] ?? $pfBalRes['wallet'] ?? -1);
    if ($peyflexFloat >= 0 && $peyflexFloat < $costPrice) {
        jsonResponse([
            'status'  => 'error',
            'message' => "Upstream Peyflex gateway wallet balance is insufficient (₦" . number_format($peyflexFloat, 2) . "). Please fund your Peyflex account to process this order."
        ], 502);
    }
} catch (\Throwable $balErr) {
    // Proceed if float check call experiences transient network issues
}

// 3. PIN Validation (Optional - PIN requirement removed from transaction checkout)
if (!empty($pin) && !verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 403);
}

// 3. Check System Maintenance
try {
    $maintCheck = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'")->fetch();
    if ($maintCheck && $maintCheck['setting_value'] === '1' && ($user['role'] ?? '') !== 'admin') {
        jsonResponse([
            'status'  => 'error',
            'message' => 'System maintenance is currently in progress. Please try again in a few minutes.'
        ], 503);
    }
} catch (\Throwable $maintErr) {}

$carrierLabel = str_starts_with($peyflexNetworkKey, 'mtn') ? 'MTN' : (str_starts_with($peyflexNetworkKey, 'glo') ? 'GLO' : (str_starts_with($peyflexNetworkKey, '9mobile') ? '9MOBILE' : 'AIRTEL'));
$reference = generateReference('AJD-DATA');
$title = sprintf('%s %s', $carrierLabel, $planName);

// Resolve exact case-sensitive Peyflex plan_code (e.g., M1m2GB, M2m5GBS, A1a5GB, G500MB, E1GB)
$peyflexPlanCode = function_exists('resolvePeyflexPlanCode')
    ? resolvePeyflexPlanCode($resolvedProviderCode ?: $planId, $peyflexNetworkKey, [
        'size'      => $planSize,
        'validity'  => $planValidity,
        'plan_name' => $planName,
    ])
    : ($resolvedProviderCode ?: $planId);

// 4. Atomic Wallet Debit
$pdo->beginTransaction();

try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $amount,
        'data',
        $title,
        $phone,
        $reference,
        "Purchased {$title} for {$phone}",
        $profitMargin,
        [
            'planId' => $canonicalLookupId,
            'planCode' => $peyflexPlanCode,
            'networkKey' => $peyflexNetworkKey,
            'sellingPrice' => $amount,
            'costPrice' => $costPrice,
            'profit' => $profitMargin
        ]
    );

    // Commit debit to release row lock before long network call
    $pdo->commit();
} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'status'  => 'error',
        'message' => $e->getMessage()
    ], 400);
}

// 5. Dispatch to Upstream VTU Gateway
$vtuPayload = [
    'network'       => $peyflexNetworkKey,
    'mobile_number' => $phone,
    'plan_code'     => $peyflexPlanCode,
    'plan_name'     => $planName,
    'size'          => $planSize,
    'validity'      => $planValidity,
    'amount'        => $amount
];

$upstreamResponse = dispatchToUpstreamVtu('data/', $vtuPayload);

// 6. Handle Delivery Outcome (Handles Definitive SUCCESS, Asynchronous PENDING delays, and FAILED refunds)
$outcomeStatus = strtoupper(trim((string)($upstreamResponse['status'] ?? '')));
$isPending = !empty($upstreamResponse['is_pending']) || in_array($outcomeStatus, ['PENDING', 'PROCESSING', 'ORDER_RECEIVED', 'QUEUED'], true);
$isSuccess = (!empty($upstreamResponse['success']) || $outcomeStatus === 'SUCCESS') && !$isPending;

if ($isSuccess) {
    // Upstream confirmed delivery! Update transaction to SUCCESS
    $upstreamRef = $upstreamResponse['data']['reference']
        ?? $upstreamResponse['id']
        ?? $upstreamResponse['data']['transaction_id']
        ?? $upstreamResponse['data']['id']
        ?? ('UPS-' . time());
    
    try {
        $upStmt = $pdo->prepare("
            UPDATE transactions 
            SET status = 'SUCCESS', upstream_ref = ?, upstream_response = ? 
            WHERE reference = ?
        ");
        $upStmt->execute([
            $upstreamRef,
            json_encode($upstreamResponse),
            $reference
        ]);
    } catch (\Throwable $upErr) {
        try {
            $upStmt = $pdo->prepare("UPDATE transactions SET status = 'SUCCESS' WHERE reference = ?");
            $upStmt->execute([$reference]);
        } catch (\Throwable $upErr2) {}
    }

    // Check and reward referrer on user's first completed purchase
    checkAndProcessReferralCommissionPhp($pdo, (int)$user['id'], $reference);

    jsonResponse([
        'status'     => 'success',
        'message'    => "{$title} delivered successfully to {$phone}!",
        'data'       => [
            'reference'   => $reference,
            'recipient'   => $phone,
            'amount'      => $amount,
            'status'      => 'SUCCESS',
            'newBalance'  => $debitResult['new_balance'],
            'upstreamRef' => $upstreamRef,
            'date'        => date('Y-m-d H:i:s')
        ]
    ]);
} elseif ($isPending) {
    // Upstream received order into carrier switch queue (deliberately prevent premature refund)
    $upstreamRef = $upstreamResponse['data']['reference']
        ?? $upstreamResponse['id']
        ?? $upstreamResponse['data']['transaction_id']
        ?? $upstreamResponse['data']['id']
        ?? ('PENDING-' . time());

    try {
        $upStmt = $pdo->prepare("
            UPDATE transactions 
            SET status = 'PENDING', upstream_ref = ?, upstream_response = ? 
            WHERE reference = ?
        ");
        $upStmt->execute([
            $upstreamRef,
            json_encode($upstreamResponse),
            $reference
        ]);
    } catch (\Throwable $upErr) {
        try {
            $upStmt = $pdo->prepare("UPDATE transactions SET status = 'PENDING' WHERE reference = ?");
            $upStmt->execute([$reference]);
        } catch (\Throwable $upErr2) {}
    }

    jsonResponse([
        'status'     => 'pending',
        'is_pending' => true,
        'message'    => "{$title} for {$phone} is processing. You will receive an update once confirmed by the network.",
        'data'       => [
            'reference'   => $reference,
            'recipient'   => $phone,
            'amount'      => $amount,
            'status'      => 'PENDING',
            'newBalance'  => $debitResult['new_balance'],
            'upstreamRef' => $upstreamRef,
            'date'        => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    // Upstream definitive failure! AUTOMATIC INSTANT REFUND
    $refundRef = generateReference('REFUND');
    $refundDesc = 'Auto-refund: ' . ($upstreamResponse['message'] ?? 'Network provider issue');

    $pdo->beginTransaction();
    try {
        // Mark original transaction as FAILED
        try {
            $failStmt = $pdo->prepare("
                UPDATE transactions 
                SET status = 'FAILED', description = ?, upstream_response = ? 
                WHERE reference = ?
            ");
            $failStmt->execute([$refundDesc, json_encode($upstreamResponse), $reference]);
        } catch (\Throwable $failUpErr) {
            try {
                $failStmt = $pdo->prepare("UPDATE transactions SET status = 'FAILED', description = ? WHERE reference = ?");
                $failStmt->execute([$refundDesc, $reference]);
            } catch (\Throwable $failUpErr2) {}
        }

        // Credit back user wallet
        $refundResult = creditWalletWithLock(
            $pdo,
            (int)$user['id'],
            $amount,
            'refund',
            'Auto Refund: ' . $title,
            $refundRef,
            $refundDesc
        );
        $pdo->commit();

        $upstreamErrorMsg = !empty($upstreamResponse['message']) ? $upstreamResponse['message'] : 'Unable to complete order with network provider.';
        jsonResponse([
            'status'  => 'error',
            'message' => $upstreamErrorMsg . ' Your wallet was automatically refunded in full.',
            'details' => $upstreamResponse['message'] ?? 'Network provider connection issue',
            'data'    => [
                'status'         => 'FAILED',
                'refundedAmount' => $amount,
                'currentBalance' => $refundResult['new_balance']
            ]
        ], 502);
    } catch (\Throwable $refErr) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse([
            'status'  => 'error',
            'message' => 'Network provider error. Please contact support with reference ' . $reference . ' if your wallet was not refunded.'
        ], 500);
    }
}
