<?php
/**
 * ==============================================================================
 * VTU - DISPATCH CABLE TV SUBSCRIPTION (DSTV, GOTV, STARTIMES, SHOWMAX)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$provider  = strtolower(trim($body['provider'] ?? $body['cable'] ?? ''));
$iucNumber = preg_replace('/[^0-9]/', '', $body['iuc'] ?? $body['smartcard'] ?? $body['smartcardNumber'] ?? $body['recipient'] ?? '');
$planId    = trim($body['plan_id'] ?? $body['planId'] ?? $body['package'] ?? $body['packageTitle'] ?? $body['plan_name'] ?? $body['planName'] ?? '');
$pin       = trim($body['pin'] ?? '');

$allowedProviders = ['dstv', 'gotv', 'startimes', 'showmax'];
if (!in_array($provider, $allowedProviders, true)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid Cable TV provider. Allowed: DSTV, GOtv, StarTimes, Showmax.'
    ], 400);
}

if (empty($iucNumber) || strlen($iucNumber) < 8 || strlen($iucNumber) > 15) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid Smartcard / IUC number. Must be between 8 and 15 digits.'
    ], 400);
}

// Authoritative Server-Driven Pricing (ignores any client-provided price)
$bouquetInfo = getServerCablePrice($provider, $planId);
if (!$bouquetInfo) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid Cable TV bouquet or package selected. Please choose a valid package from the catalog.'
    ], 400);
}

$amount = (float) $bouquetInfo['price'];
$planName = $bouquetInfo['name'];

// Verify PIN (Optional - PIN requirement removed from transaction checkout)
if (!empty($pin) && !verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 403);
}

// Check maintenance mode and cable service switch
if (!isServiceEnabled('cable', $pdo)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Cable TV subscription service is temporarily paused by administration for scheduled maintenance.'
    ], 503);
}

$maintCheck = $pdo->query('SELECT setting_value FROM system_settings WHERE setting_key = "maintenance_mode"')->fetch();
if ($maintCheck && $maintCheck['setting_value'] === '1' && $user['role'] !== 'admin') {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Cable TV subscription is temporarily unavailable due to system maintenance.'
    ], 503);
}

$reference = generateReference('AJD-CAB');
$title = sprintf('%s - %s', strtoupper($provider), $planName);

// 1. Atomic Wallet Debit
$pdo->beginTransaction();
try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $amount,
        'cable',
        $title,
        $iucNumber,
        $reference,
        "Subscribed {$title} for IUC: {$iucNumber}"
    );
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

// 2. Dispatch to Upstream VTU Gateway
$providerMap = [
    'dstv'      => 1,
    'gotv'      => 2,
    'startimes' => 3,
    'showmax'   => 4
];
$cableId = $providerMap[$provider] ?? 1;

$vtuPayload = [
    'cablename'         => $cableId,
    'cableplan'         => $planId ?: 1,
    'smart_card_number' => $iucNumber
];

$upstreamResponse = dispatchToUpstreamVtu('cable/', $vtuPayload);

// 3. Handle Outcome with Auto-Refund Guarantee (Handles SUCCESS, PENDING activation, and FAILED refunds)
$outcomeStatus = strtoupper(trim((string)($upstreamResponse['status'] ?? '')));
$isPending = !empty($upstreamResponse['is_pending']) || in_array($outcomeStatus, ['PENDING', 'PROCESSING', 'ORDER_RECEIVED', 'QUEUED'], true);
$isSuccess = ($upstreamResponse['success'] || $outcomeStatus === 'SUCCESS') && !$isPending;

if ($isSuccess) {
    $upstreamRef = $upstreamResponse['data']['id'] ?? ($upstreamResponse['id'] ?? 'CAB-' . time());
    $upStmt = $pdo->prepare('UPDATE transactions SET status = "SUCCESS", upstream_ref = ?, upstream_response = ? WHERE reference = ?');
    $upStmt->execute([$upstreamRef, json_encode($upstreamResponse), $reference]);

    jsonResponse([
        'status'     => 'success',
        'success'    => true,
        'message'    => "{$title} subscription activated successfully for {$iucNumber}!",
        'reference'  => $reference,
        'newBalance' => $debitResult['new_balance'],
        'data'       => [
            'reference'   => $reference,
            'recipient'   => $iucNumber,
            'provider'    => strtoupper($provider),
            'planName'    => $planName,
            'amount'      => $amount,
            'status'      => 'SUCCESS',
            'newBalance'  => $debitResult['new_balance'],
            'upstreamRef' => $upstreamRef,
            'date'        => date('Y-m-d H:i:s')
        ]
    ]);
} elseif ($isPending) {
    $upstreamRef = $upstreamResponse['data']['id'] ?? ($upstreamResponse['id'] ?? 'PENDING-' . time());
    $upStmt = $pdo->prepare('UPDATE transactions SET status = "PENDING", upstream_ref = ?, upstream_response = ? WHERE reference = ?');
    $upStmt->execute([$upstreamRef, json_encode($upstreamResponse), $reference]);

    jsonResponse([
        'status'     => 'pending',
        'is_pending' => true,
        'message'    => "{$title} subscription order submitted to {$provider} broadcast switch. Activation is processing and will reflect shortly.",
        'reference'  => $reference,
        'newBalance' => $debitResult['new_balance'],
        'data'       => [
            'reference'   => $reference,
            'recipient'   => $iucNumber,
            'provider'    => strtoupper($provider),
            'planName'    => $planName,
            'amount'      => $amount,
            'status'      => 'PENDING',
            'newBalance'  => $debitResult['new_balance'],
            'upstreamRef' => $upstreamRef,
            'date'        => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    // Upstream Failed - Instant Auto-Refund
    $refundRef = generateReference('REFUND');
    $refundDesc = 'Auto-refund: Cable TV activation failed (' . ($upstreamResponse['message'] ?? 'Provider Error') . ')';

    $pdo->beginTransaction();
    try {
        $failStmt = $pdo->prepare('UPDATE transactions SET status = "FAILED", description = ?, upstream_response = ? WHERE reference = ?');
        $failStmt->execute([$refundDesc, json_encode($upstreamResponse), $reference]);

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
            'message' => 'Cable TV activation failed at provider gateway. Your wallet has been automatically refunded.',
            'details' => $upstreamResponse['message'] ?? 'Cable provider unreachable',
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
        jsonResponse(['status' => 'error', 'message' => 'Cable provider error. Please contact support with reference ' . $reference . ' if your wallet was not refunded.'], 500);
    }
}
