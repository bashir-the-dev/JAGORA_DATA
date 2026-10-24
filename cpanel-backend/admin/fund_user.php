<?php
/**
 * ==============================================================================
 * ADMIN - MANUAL WALLET CREDIT / DEBIT
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminPermission($pdo, 'manage_finances');

$body = getRequestBody();

$userPhone = normalizePhone($body['phone'] ?? $body['recipient'] ?? '');
$amount    = (float)($body['amount'] ?? 0);
$type      = strtolower(trim($body['type'] ?? 'credit')); // 'credit' or 'debit'
$reason    = trim($body['reason'] ?? 'Admin manual wallet adjustment');

if (empty($userPhone) || $amount <= 0) {
    jsonResponse(['status' => 'error', 'message' => 'Please provide the user phone number and a positive amount.'], 400);
}

$uStmt = $pdo->prepare('SELECT id, balance, COALESCE(full_name, name) AS full_name FROM users WHERE phone = ? LIMIT 1');
$uStmt->execute([$userPhone]);
$targetUser = $uStmt->fetch();

if (!$targetUser) {
    jsonResponse(['status' => 'error', 'message' => 'User account not found with phone number: ' . $userPhone], 404);
}

$ref = generateReference('ADMIN-' . strtoupper($type));

$pdo->beginTransaction();
try {
    if ($type === 'credit') {
        $res = creditWalletWithLock(
            $pdo,
            (int)$targetUser['id'],
            $amount,
            'funding',
            sprintf('Admin Credit: ₦%s', number_format($amount, 2)),
            $ref,
            $reason
        );
    } else {
        $res = debitWalletWithLock(
            $pdo,
            (int)$targetUser['id'],
            $amount,
            'transfer',
            sprintf('Admin Debit: ₦%s', number_format($amount, 2)),
            $userPhone,
            $ref,
            $reason
        );
    }
    $pdo->commit();

    jsonResponse([
        'status'     => 'success',
        'message'    => "Successfully {$type}ed ₦" . number_format($amount, 2) . " for {$targetUser['full_name']}.",
        'newBalance' => $res['new_balance'],
        'reference'  => $ref
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 400);
}
