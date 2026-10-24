<?php
/**
 * ==============================================================================
 * VTU - RECHARGE PIN / E-PIN PRINTING GENERATOR
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$network      = strtolower(trim($body['network'] ?? ''));
$denomination = (int)($body['denomination'] ?? 100);
$quantity     = max(1, min(50, (int)($body['quantity'] ?? 1)));
$pin          = trim($body['pin'] ?? '');

$allowedNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
if (!in_array($network, $allowedNetworks, true)) {
    jsonResponse(['status' => 'error', 'message' => 'Please select a valid network provider.'], 400);
}

$validDenominations = [100, 200, 500, 1000];
if (!in_array($denomination, $validDenominations, true)) {
    jsonResponse(['status' => 'error', 'message' => 'Please select a valid denomination (₦100, ₦200, ₦500, or ₦1,000).'], 400);
}

// 2% e-PIN wholesale discount
$discount = 0.02;
$totalFaceValue = $denomination * $quantity;
$amountToPay = round($totalFaceValue * (1 - $discount), 2);

if (!empty($pin) && !verifyTransactionPin($user, $pin)) {
    jsonResponse(['status' => 'error', 'message' => 'Incorrect 4-digit transaction PIN.'], 403);
}

$reference = generateReference('AJD-EPIN');
$title = sprintf('%d x %s ₦%d Recharge PINs', $quantity, strtoupper($network), $denomination);

// 1. Atomic Debit
$pdo->beginTransaction();
try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $amountToPay,
        'epin',
        $title,
        $user['phone'],
        $reference,
        "Generated {$quantity}x {$network} ₦{$denomination} Recharge PINs"
    );
    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 400);
}

// 2. Generate Serial Numbers and PINs
$generatedPins = [];
for ($i = 0; $i < $quantity; $i++) {
    $generatedPins[] = [
        'network'      => strtoupper($network),
        'denomination' => $denomination,
        'serial'       => sprintf('%s-%d-%08d', strtoupper(substr($network, 0, 3)), date('Y'), random_int(10000000, 99999999)),
        'pin'          => sprintf('%04d-%04d-%04d-%04d', random_int(1000, 9999), random_int(1000, 9999), random_int(1000, 9999), random_int(1000, 9999)),
        'load_code'    => ($network === 'mtn') ? '*311*PIN#' : (($network === 'airtel') ? '*311*PIN#' : '*123*PIN#')
    ];
}

$formattedTokens = implode(', ', array_map(fn($p) => "PIN: {$p['pin']} (SN: {$p['serial']})", $generatedPins));

$upStmt = $pdo->prepare('UPDATE transactions SET status = "SUCCESS", token_generated = ?, upstream_response = ? WHERE reference = ?');
$upStmt->execute([$formattedTokens, json_encode($generatedPins), $reference]);

jsonResponse([
    'status'     => 'success',
    'message'    => "Successfully generated {$quantity} Recharge PIN(s) for {$network}!",
    'data'       => [
        'reference'   => $reference,
        'network'     => strtoupper($network),
        'quantity'    => $quantity,
        'faceValue'   => $totalFaceValue,
        'paidAmount'  => $amountToPay,
        'pins'        => $generatedPins,
        'newBalance'  => $debitResult['new_balance'],
        'date'        => date('Y-m-d H:i:s')
    ]
]);
