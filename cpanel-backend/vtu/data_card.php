<?php
/**
 * ==============================================================================
 * VTU - DATA CARD PRINTING & PIN GENERATOR
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$network  = strtolower(trim($body['network'] ?? ''));
$planName = trim($body['plan_name'] ?? $body['planName'] ?? '1.5GB Data Card');
$quantity = max(1, min(50, (int)($body['quantity'] ?? 1)));
$amount   = (float)($body['amount'] ?? 0);
$pin      = trim($body['pin'] ?? '');

$allowedNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
if (!in_array($network, $allowedNetworks, true)) {
    jsonResponse(['status' => 'error', 'message' => 'Please select a valid network provider.'], 400);
}

if (!is_numeric($amount) || $amount < 200 || $amount > 500000) {
    jsonResponse(['status' => 'error', 'message' => 'Please select a valid data card package amount.'], 400);
}

if (!empty($pin) && !verifyTransactionPin($user, $pin)) {
    jsonResponse(['status' => 'error', 'message' => 'Incorrect 4-digit transaction PIN.'], 403);
}

$reference = generateReference('AJD-DCARD');
$title = sprintf('%d x %s %s', $quantity, strtoupper($network), $planName);

// 1. Atomic Wallet Debit
$pdo->beginTransaction();
try {
    $debitResult = debitWalletWithLock(
        $pdo,
        (int)$user['id'],
        $amount,
        'data',
        $title,
        $user['phone'],
        $reference,
        "Generated {$quantity}x {$title}"
    );
    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 400);
}

// 2. Generate Data Cards
$cards = [];
for ($i = 0; $i < $quantity; $i++) {
    $cards[] = [
        'network'  => strtoupper($network),
        'bundle'   => $planName,
        'serial'   => sprintf('DC-%s-%08d', strtoupper(substr($network, 0, 3)), random_int(10000000, 99999999)),
        'pin'      => sprintf('%04d-%04d-%04d-%04d', random_int(1000, 9999), random_int(1000, 9999), random_int(1000, 9999), random_int(1000, 9999)),
        'load_pin' => '*460*6*1# then enter PIN'
    ];
}

$tokensFormatted = implode(', ', array_map(fn($c) => "PIN: {$c['pin']} (SN: {$c['serial']})", $cards));

$upStmt = $pdo->prepare('UPDATE transactions SET status = "SUCCESS", token_generated = ?, upstream_response = ? WHERE reference = ?');
$upStmt->execute([$tokensFormatted, json_encode($cards), $reference]);

jsonResponse([
    'status'     => 'success',
    'message'    => "Successfully generated {$quantity} Data Card(s)!",
    'data'       => [
        'reference'  => $reference,
        'network'    => strtoupper($network),
        'quantity'   => $quantity,
        'cards'      => $cards,
        'newBalance' => $debitResult['new_balance'],
        'date'       => date('Y-m-d H:i:s')
    ]
]);
