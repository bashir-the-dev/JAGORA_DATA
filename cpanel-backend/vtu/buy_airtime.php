<?php
/**
 * ==============================================================================
 * VTU - DISPATCH AIRTIME ORDER
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$network = strtolower(trim($body['network'] ?? ''));
$phone   = normalizePhone($body['phone'] ?? $body['recipient'] ?? '');
$amount  = (float)($body['amount'] ?? 0);
$pin     = trim($body['pin'] ?? '');

$allowedNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
if (!in_array($network, $allowedNetworks, true)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid network provider selected.'
    ], 400);
}

if (!isValidNigerianPhone($phone)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please enter a valid 11-digit phone number (e.g. 08012345678).'
    ], 400);
}

// Check if Airtime Service is shut down by administration
if (!isServiceEnabled('airtime', $pdo)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Airtime purchase is temporarily paused for routine maintenance. Please check back shortly.'
    ], 503);
}

// Enforce strictly positive integer financial amount (no negatives, no decimals, no empty/zero)
if (!is_numeric($amount) || (int)$amount != $amount || (int)$amount < 50 || (int)$amount > 50000) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Airtime amount must be between ₦50 and ₦50,000.'
    ], 400);
}
$amount = (int)$amount;

if (!empty($pin) && !verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 403);
}

// Calculate discount from settings (supports admin custom airtime discounts)
$discountPercent = 2.5;
$foundDiscount = false;
try {
    $pricingRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'pricing_settings' LIMIT 1")->fetch();
    if ($pricingRow && !empty($pricingRow['value_json'])) {
        $pData = json_decode($pricingRow['value_json'], true);
        if (isset($pData['airtimeDiscounts'][$network])) {
            $discountPercent = (float)$pData['airtimeDiscounts'][$network];
            $foundDiscount = true;
        }
    }
} catch (\Throwable $t) {}

if (!$foundDiscount) {
    try {
        $discountKey = "airtime_discount_{$network}";
        $discStmt = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
        $discStmt->execute([$discountKey]);
        $discRow = $discStmt->fetch();
        if ($discRow && isset($discRow['setting_value'])) {
            $discountPercent = (float)$discRow['setting_value'];
        }
    } catch (\Throwable $t) {}
}

// User pays discounted price; wholesale airtime cost is ~96.5% face value
$chargeAmount = max(1.0, round($amount * (1 - ($discountPercent / 100)), 2));
$wholesaleAirtimeCost = round($amount * 0.965, 2);
$airtimeProfit = max(0.0, round($chargeAmount - $wholesaleAirtimeCost, 2));

$reference = generateReference('AJD-AIR');
$title = sprintf('%s ₦%s Airtime', strtoupper($network), number_format($amount));

$pdo->beginTransaction();
try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $chargeAmount,
        'airtime',
        $title,
        $phone,
        $reference,
        "Recharge {$phone} with ₦{$amount} airtime (Paid ₦{$chargeAmount})",
        $airtimeProfit,
        [
            'faceValue' => $amount,
            'paidAmount' => $chargeAmount,
            'discountPercent' => $discountPercent,
            'profit' => $airtimeProfit
        ]
    );
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

$vtuPayload = [
    'network'        => $network,
    'amount'         => (int)$amount,
    'mobile_number'  => $phone,
    'airtime_type'   => 'VTU',
    'Ported_number'  => true
];

$upstreamResponse = dispatchToUpstreamVtu('topup/', $vtuPayload);

// 3. Handle Delivery Outcome (Handles Definitive SUCCESS, Asynchronous PENDING delays, and FAILED refunds)
$outcomeStatus = strtoupper(trim((string)($upstreamResponse['status'] ?? '')));
$isPending = !empty($upstreamResponse['is_pending']) || in_array($outcomeStatus, ['PENDING', 'PROCESSING', 'ORDER_RECEIVED', 'QUEUED'], true);
$isSuccess = (!empty($upstreamResponse['success']) || $outcomeStatus === 'SUCCESS') && !$isPending;

if ($isSuccess) {
    $upstreamRef = $upstreamResponse['data']['reference'] ?? $upstreamResponse['id'] ?? $upstreamResponse['data']['id'] ?? ('AIR-' . time());
    try {
        $upStmt = $pdo->prepare("UPDATE transactions SET status = 'SUCCESS', upstream_ref = ?, upstream_response = ? WHERE reference = ?");
        $upStmt->execute([$upstreamRef, json_encode($upstreamResponse), $reference]);
    } catch (\Throwable $upErr) {
        try {
            $upStmt = $pdo->prepare("UPDATE transactions SET status = 'SUCCESS' WHERE reference = ?");
            $upStmt->execute([$reference]);
        } catch (\Throwable $upErr2) {}
    }

    // Check and reward referrer on user's first completed purchase
    checkAndProcessReferralCommissionPhp($pdo, (int)$user['id'], $reference);

    jsonResponse([
        'status'  => 'success',
        'message' => "₦{$amount} {$network} airtime successfully sent to {$phone}!",
        'data'    => [
            'reference'   => $reference,
            'recipient'   => $phone,
            'faceValue'   => $amount,
            'paidAmount'  => $chargeAmount,
            'discount'    => "{$discountPercent}%",
            'status'      => 'SUCCESS',
            'newBalance'  => $debitResult['new_balance']
        ]
    ]);
} elseif ($isPending) {
    // Upstream received order into carrier switch queue (deliberately prevent premature refund)
    $upstreamRef = $upstreamResponse['data']['reference'] ?? $upstreamResponse['id'] ?? $upstreamResponse['data']['id'] ?? ('PENDING-' . time());
    try {
        $upStmt = $pdo->prepare("UPDATE transactions SET status = 'PENDING', upstream_ref = ?, upstream_response = ? WHERE reference = ?");
        $upStmt->execute([$upstreamRef, json_encode($upstreamResponse), $reference]);
    } catch (\Throwable $upErr) {
        try {
            $upStmt = $pdo->prepare("UPDATE transactions SET status = 'PENDING' WHERE reference = ?");
            $upStmt->execute([$reference]);
        } catch (\Throwable $upErr2) {}
    }

    jsonResponse([
        'status'     => 'pending',
        'is_pending' => true,
        'message'    => "₦{$amount} {$network} airtime order submitted to network carrier switch and is processing. Status will update automatically once confirmed by carrier.",
        'data'       => [
            'reference'   => $reference,
            'recipient'   => $phone,
            'faceValue'   => $amount,
            'paidAmount'  => $chargeAmount,
            'discount'    => "{$discountPercent}%",
            'status'      => 'PENDING',
            'newBalance'  => $debitResult['new_balance'],
            'upstreamRef' => $upstreamRef
        ]
    ]);
} else {
    // Definitive failure - instant auto-refund
    $refundRef = generateReference('REFUND');
    $refundDesc = 'Auto-refund: Airtime dispatch failed';

    $pdo->beginTransaction();
    try {
        try {
            $failStmt = $pdo->prepare("UPDATE transactions SET status = 'FAILED', description = ?, upstream_response = ? WHERE reference = ?");
            $failStmt->execute([$refundDesc, json_encode($upstreamResponse), $reference]);
        } catch (\Throwable $failErr) {
            try {
                $failStmt = $pdo->prepare("UPDATE transactions SET status = 'FAILED', description = ? WHERE reference = ?");
                $failStmt->execute([$refundDesc, $reference]);
            } catch (\Throwable $failErr2) {}
        }

        $refundResult = creditWalletWithLock(
            $pdo,
            (int)$user['id'],
            $chargeAmount,
            'refund',
            'Auto Refund: ' . $title,
            $refundRef,
            $refundDesc
        );
        $pdo->commit();

        $upstreamErrorMsg = !empty($upstreamResponse['message']) ? $upstreamResponse['message'] : 'Airtime dispatch failed at network provider.';
        jsonResponse([
            'status'  => 'error',
            'message' => $upstreamErrorMsg . ' Your wallet has been automatically refunded.',
            'details' => $upstreamResponse['message'] ?? 'Network timed out',
            'data'    => [
                'status'         => 'FAILED',
                'refundedAmount' => $chargeAmount,
                'currentBalance' => $refundResult['new_balance']
            ]
        ], 502);
    } catch (Exception $refErr) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['status' => 'error', 'message' => 'Network provider error. Please contact support with reference ' . $reference . ' if your wallet was not refunded.'], 500);
    }
}
