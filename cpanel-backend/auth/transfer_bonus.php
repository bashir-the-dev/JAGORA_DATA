<?php
/**
 * ==============================================================================
 * AUTH - TRANSFER BONUS BALANCE TO MAIN WALLET
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
ensureUserColumns($pdo);

$body = getRequestBody();
$amount = (float)($body['amount'] ?? 0);

if ($amount <= 0) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please enter a valid transfer amount greater than ₦0.00.'
    ], 400);
}

$userId = (int)$user['id'];
$bonusBalance = (float)($user['bonus_balance'] ?? 0);

if ($amount > $bonusBalance) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Insufficient bonus balance. Available: ₦' . number_format($bonusBalance, 2)
    ], 400);
}

try {
    $pdo->beginTransaction();

    $newBonus = $bonusBalance - $amount;
    $newBalance = ((float)$user['balance']) + $amount;

    $up = $pdo->prepare("UPDATE users SET bonus_balance = ?, balance = ? WHERE id = ?");
    $up->execute([$newBonus, $newBalance, $userId]);

    $insTx = $pdo->prepare("
        INSERT INTO transactions (user_id, reference, type, service_type, title, description, recipient, amount, balance_before, balance_after, status, created_at)
        VALUES (?, ?, 'TRANSFER', 'bonus_transfer', 'Referral Bonus Transfer', ?, ?, ?, ?, ?, 'SUCCESS', NOW())
    ");
    $ref = 'BONUS_XFER_' . strtoupper(bin2hex(random_bytes(4)));
    $insTx->execute([
        $userId,
        $ref,
        'Converted ₦' . number_format($amount, 2) . ' from referral bonus to main spending wallet',
        $user['phone'],
        $amount,
        $user['balance'],
        $newBalance
    ]);

    $pdo->commit();

    jsonResponse([
        'status'  => 'success',
        'message' => '₦' . number_format($amount, 2) . ' transferred from Bonus to Main Wallet!',
        'data'    => [
            'balance'      => $newBalance,
            'bonusBalance' => $newBonus
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'status'  => 'error',
        'message' => 'Failed to transfer bonus: ' . $e->getMessage()
    ], 500);
}
