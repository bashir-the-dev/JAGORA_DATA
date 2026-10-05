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

$network   = strtolower(trim($body['network'] ?? ''));
$planId    = trim($body['plan_id'] ?? $body['planId'] ?? '');
$planName  = trim($body['plan_name'] ?? $body['planName'] ?? 'Data Bundle');
$phone     = normalizePhone($body['phone'] ?? $body['recipient'] ?? '');
$amount    = (float)($body['amount'] ?? 0);
$pin       = trim($body['pin'] ?? '');

// 1. Validations
if (empty($network) || empty($phone) || empty($planId)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Missing network, phone number, or data plan.'
    ], 400);
}

if (!isValidNigerianPhone($phone)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please provide a valid 11-digit Nigerian recipient mobile number (e.g. 08012345678).'
    ], 400);
}

// Check if Data Service is shut down by administration
if (!isServiceEnabled('data', $pdo)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Data bundle fulfillment service is temporarily paused by administration for system maintenance.'
    ], 503);
}

// 2. Server-Side Price & Catalog Verification (Strict Anti-Tampering from Hybrid Cached DB)
$planStmt = $pdo->prepare('SELECT plan_name, COALESCE(custom_retail_price, selling_price) AS selling_price, network, COALESCE(api_plan_id, plan_id) AS api_plan_id FROM vtu_plans WHERE (api_plan_id = ? OR plan_id = ?) LIMIT 1');
$planStmt->execute([$planId, $planId]);
$dbPlan = $planStmt->fetch();
if ($dbPlan) {
    // Overwrite with official server-side price & resolved wholesale plan id
    $amount = (float)$dbPlan['selling_price'];
    $planName = $dbPlan['plan_name'];
    $network = strtolower($dbPlan['network']);
    $planId = $dbPlan['api_plan_id'];
} else {
    // If not in database table, enforce strict boundaries
    if ($amount < 100 || $amount > 100000) {
        jsonResponse([
            'status'  => 'error',
            'message' => 'The selected data plan is currently not available in our catalog.'
        ], 400);
    }
}

// Apply Admin Custom Pricing Override if configured in settings
try {
    $pricingConfRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
    if ($pricingConfRow && !empty($pricingConfRow['value_json'])) {
        $pConf = json_decode($pricingConfRow['value_json'], true);
        if (!empty($pConf['customPricing'][$planId]['sellingPrice'])) {
            $amount = (float)$pConf['customPricing'][$planId]['sellingPrice'];
        }
        if (!empty($pConf['customPricing'][$planId]['status']) && ($pConf['customPricing'][$planId]['status'] === 'paused' || $pConf['customPricing'][$planId]['status'] === 'inactive')) {
            jsonResponse(['status' => 'error', 'message' => 'This data plan is temporarily paused by administration.'], 400);
        }
    }
} catch (\Throwable $e) {}

// 3. PIN Validation
if (!verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 403);
}

// 3. Check System Maintenance
$maintCheck = $pdo->query('SELECT setting_value FROM system_settings WHERE setting_key = "maintenance_mode"')->fetch();
if ($maintCheck && $maintCheck['setting_value'] === '1' && $user['role'] !== 'admin') {
    jsonResponse([
        'status'  => 'error',
        'message' => 'System maintenance is currently in progress. Please try again in a few minutes.'
    ], 503);
}

$reference = generateReference('AJD-DATA');
$title = sprintf('%s %s', strtoupper($network), $planName);

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
        "Purchased {$title} for {$phone}"
    );

    // Commit debit to release row lock before long network call
    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'status'  => 'error',
        'message' => $e->getMessage()
    ], 400);
}

// 5. Dispatch to Upstream VTU Gateway
// Map network name to standard Nigerian VTU IDs: 1=MTN, 2=GLO, 3=9MOBILE, 4=AIRTEL (HusmoData convention)
$networkMap = [
    'mtn'     => 1,
    'glo'     => 2,
    '9mobile' => 3,
    'airtel'  => 4
];

$upstreamNetworkId = $networkMap[$network] ?? 1;

$vtuPayload = [
    'network'        => $network,
    'network_id'     => $upstreamNetworkId,
    'mobile_number'  => $phone,
    'plan'           => $planId,
    'plan_code'      => $planId,
    'plan_name'      => $planName,
    'category'       => $dbPlan['category'] ?? (stripos($planName, 'sme') !== false ? 'SME' : (stripos($planName, 'cg') !== false ? 'Corporate Gifting' : 'Data Share')),
    'Ported_number'  => true
];

$upstreamResponse = dispatchToUpstreamVtu('data/', $vtuPayload);

// 6. Handle Delivery Outcome (Handles Definitive SUCCESS, Asynchronous PENDING delays, and FAILED refunds)
$outcomeStatus = strtoupper(trim((string)($upstreamResponse['status'] ?? '')));
$isPending = !empty($upstreamResponse['is_pending']) || in_array($outcomeStatus, ['PENDING', 'PROCESSING', 'ORDER_RECEIVED', 'QUEUED'], true);
$isSuccess = ($upstreamResponse['success'] || $outcomeStatus === 'SUCCESS') && !$isPending;

if ($isSuccess) {
    // Upstream confirmed delivery! Update transaction to SUCCESS
    $upstreamRef = $upstreamResponse['data']['id'] ?? ($upstreamResponse['id'] ?? 'UPS-' . time());
    
    $upStmt = $pdo->prepare('
        UPDATE transactions 
        SET status = "SUCCESS", upstream_ref = ?, upstream_response = ? 
        WHERE reference = ?
    ');
    $upStmt->execute([
        $upstreamRef,
        json_encode($upstreamResponse),
        $reference
    ]);

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
    $upstreamRef = $upstreamResponse['data']['id'] ?? ($upstreamResponse['id'] ?? 'PENDING-' . time());

    $upStmt = $pdo->prepare('
        UPDATE transactions 
        SET status = "PENDING", upstream_ref = ?, upstream_response = ? 
        WHERE reference = ?
    ');
    $upStmt->execute([
        $upstreamRef,
        json_encode($upstreamResponse),
        $reference
    ]);

    jsonResponse([
        'status'     => 'pending',
        'is_pending' => true,
        'message'    => "{$title} submitted to telecom carrier switch and is currently processing. Your order will update automatically once confirmed by the network.",
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
    $refundDesc = 'Auto-refund: Upstream delivery failed (' . ($upstreamResponse['message'] ?? 'Network Error') . ')';

    $pdo->beginTransaction();
    try {
        // Mark original transaction as FAILED
        $failStmt = $pdo->prepare('
            UPDATE transactions 
            SET status = "FAILED", description = ?, upstream_response = ? 
            WHERE reference = ?
        ');
        $failStmt->execute([$refundDesc, json_encode($upstreamResponse), $reference]);

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

        jsonResponse([
            'status'  => 'error',
            'message' => 'Delivery failed at telco gateway. Your wallet has been automatically refunded.',
            'details' => $upstreamResponse['message'] ?? 'Telco connection failed',
            'data'    => [
                'status'         => 'FAILED',
                'refundedAmount' => $amount,
                'currentBalance' => $refundResult['new_balance']
            ]
        ], 502);
    } catch (Exception $refErr) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse([
            'status'  => 'error',
            'message' => 'Order failed and refund error: ' . $refErr->getMessage()
        ], 500);
    }
}
