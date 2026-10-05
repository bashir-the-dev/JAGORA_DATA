<?php
/**
 * ==============================================================================
 * VTU - DISPATCH ELECTRICITY BILL PAYMENT & PREPAID TOKEN RECHARGE
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$disco       = strtolower(trim($body['disco'] ?? $body['provider'] ?? ''));
$meterNumber = preg_replace('/[^0-9]/', '', $body['meter_number'] ?? $body['meterNumber'] ?? $body['recipient'] ?? '');
$meterType   = strtolower(trim($body['meter_type'] ?? $body['meterType'] ?? 'prepaid'));
$amount      = (float)($body['amount'] ?? 0);
$pin         = trim($body['pin'] ?? '');

$allowedDiscos = ['ikedc', 'ekedc', 'aedc', 'ibedc', 'kedco', 'eedc', 'phed', 'jed', 'kaedco', 'bedc', 'yedc'];
if (!in_array($disco, $allowedDiscos, true)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid Electricity Distribution Company (DISCO).'
    ], 400);
}

if (empty($meterNumber) || strlen($meterNumber) < 8 || strlen($meterNumber) > 15) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid Meter Number. Must be between 8 and 15 digits.'
    ], 400);
}

if (!in_array($meterType, ['prepaid', 'postpaid'], true)) {
    $meterType = 'prepaid';
}

// Enforce strictly positive integer financial amount (reject negatives, decimals, zero)
if (!is_numeric($amount) || (int)$amount != $amount || (int)$amount < 500 || (int)$amount > 100000) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Electricity recharge amount must be a strictly positive integer between ₦500 and ₦100,000 (decimals are not permitted).'
    ], 400);
}
$amount = (int)$amount;

// PIN Validation
if (!verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 403);
}

// Electricity Service Switch & System Maintenance Check
if (!isServiceEnabled('electricity', $pdo)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Electricity bill payment service is temporarily paused by administration for scheduled maintenance.'
    ], 503);
}

$maintCheck = $pdo->query('SELECT setting_value FROM system_settings WHERE setting_key = "maintenance_mode"')->fetch();
if ($maintCheck && $maintCheck['setting_value'] === '1' && $user['role'] !== 'admin') {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Electricity recharge service is temporarily paused for scheduled maintenance.'
    ], 503);
}

$reference = generateReference('AJD-ELEC');
$title = sprintf('%s %s (₦%s)', strtoupper($disco), ucfirst($meterType), number_format($amount, 2));

// 1. Atomic Wallet Debit
$pdo->beginTransaction();
try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $amount,
        'electricity',
        $title,
        $meterNumber,
        $reference,
        "Recharge {$disco} meter {$meterNumber} with ₦{$amount}"
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
$discoMap = [
    'ikedc'  => 1,
    'ekedc'  => 2,
    'aedc'   => 3,
    'ibedc'  => 4,
    'kedco'  => 5,
    'eedc'   => 6,
    'phed'   => 7,
    'jed'    => 8,
    'kaedco' => 9,
    'bedc'   => 10,
    'yedc'   => 11
];
$discoId = $discoMap[$disco] ?? 1;

$vtuPayload = [
    'disco_name'   => $discoId,
    'meter_number' => $meterNumber,
    'MeterType'    => ($meterType === 'prepaid') ? 1 : 2,
    'amount'       => (int)$amount
];

$upstreamResponse = dispatchToUpstreamVtu('billpayment/', $vtuPayload);

// 3. Handle Delivery & Token Generation (Handles SUCCESS, PENDING STS Generation, and FAILED refunds)
$outcomeStatus = strtoupper(trim((string)($upstreamResponse['status'] ?? '')));
$isPending = !empty($upstreamResponse['is_pending']) || in_array($outcomeStatus, ['PENDING', 'PROCESSING', 'ORDER_RECEIVED', 'QUEUED'], true);
$isSuccess = ($upstreamResponse['success'] || $outcomeStatus === 'SUCCESS') && !$isPending;

if ($isSuccess) {
    $upstreamRef = $upstreamResponse['data']['id'] ?? ($upstreamResponse['id'] ?? 'ELEC-' . time());
    
    // Extract genuine STS prepaid token from live DISCO switch
    $tokenGenerated = $upstreamResponse['data']['token'] 
        ?? ($upstreamResponse['token'] ?? null);
    
    // Clean token if upstream returned placeholder or contact notice
    if ($tokenGenerated && (stripos($tokenGenerated, 'contact') !== false || stripos($tokenGenerated, 'admin') !== false)) {
        $tokenGenerated = null;
    }

    $units = $upstreamResponse['data']['units'] ?? ($upstreamResponse['units'] ?? null);

    $upStmt = $pdo->prepare('
        UPDATE transactions 
        SET status = "SUCCESS", upstream_ref = ?, token_generated = ?, upstream_response = ? 
        WHERE reference = ?
    ');
    $upStmt->execute([
        $upstreamRef,
        $tokenGenerated,
        json_encode($upstreamResponse),
        $reference
    ]);

    jsonResponse([
        'status'     => 'success',
        'success'    => true,
        'message'    => "Electricity recharged successfully for Meter: {$meterNumber}!",
        'reference'  => $reference,
        'token'      => $tokenGenerated,
        'units'      => $units,
        'newBalance' => $debitResult['new_balance'],
        'data'       => [
            'reference'      => $reference,
            'meterNumber'    => $meterNumber,
            'meterType'      => $meterType,
            'disco'          => strtoupper($disco),
            'amount'         => $amount,
            'token'          => $tokenGenerated,
            'units'          => $units,
            'status'         => 'SUCCESS',
            'newBalance'     => $debitResult['new_balance'],
            'upstreamRef'    => $upstreamRef,
            'date'           => date('Y-m-d H:i:s')
        ]
    ]);
} elseif ($isPending) {
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
        'message'    => "Electricity recharge order submitted to {$disco} switch. Token generation is processing and will display once received from the DISCO grid.",
        'reference'  => $reference,
        'token'      => null,
        'units'      => null,
        'newBalance' => $debitResult['new_balance'],
        'data'       => [
            'reference'      => $reference,
            'meterNumber'    => $meterNumber,
            'meterType'      => $meterType,
            'disco'          => strtoupper($disco),
            'amount'         => $amount,
            'token'          => null,
            'status'         => 'PENDING',
            'newBalance'     => $debitResult['new_balance'],
            'upstreamRef'    => $upstreamRef,
            'date'           => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    // Instant Auto-Refund
    $refundRef = generateReference('REFUND');
    $refundDesc = 'Auto-refund: Electricity recharge failed (' . ($upstreamResponse['message'] ?? 'DISCO Network Error') . ')';

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
            'message' => 'Electricity recharge failed at DISCO gateway. Your wallet has been automatically refunded.',
            'details' => $upstreamResponse['message'] ?? 'DISCO Gateway Timeout',
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
        jsonResponse(['status' => 'error', 'message' => $refErr->getMessage()], 500);
    }
}
