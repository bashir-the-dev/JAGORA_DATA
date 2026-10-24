<?php
/**
 * ==============================================================================
 * AUTOMATED WALLET FUNDING - MONNIFY WEBHOOK HANDLER
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$rawPayload = file_get_contents('php://input');
if (empty($rawPayload)) {
    jsonResponse(['status' => false, 'message' => 'Empty webhook payload'], 400);
}

$payload = json_decode($rawPayload, true);
if (!is_array($payload)) {
    jsonResponse(['status' => false, 'message' => 'Malformed JSON'], 400);
}

// Monnify HMAC-SHA512 Signature verification
$headers = getallheaders();
$receivedSignature = $headers['monnify-signature'] 
    ?? $headers['Monnify-Signature'] 
    ?? ($_SERVER['HTTP_MONNIFY_SIGNATURE'] ?? '');

if (defined('MONNIFY_SECRET_KEY') && MONNIFY_SECRET_KEY !== 'YOUR_MONNIFY_SECRET_KEY_HERE' && !empty(MONNIFY_SECRET_KEY)) {
    if (empty($receivedSignature)) {
        jsonResponse(['status' => false, 'message' => 'Unauthorized: Missing Monnify signature'], 401);
    }
    $computed = hash_hmac('sha512', $rawPayload, MONNIFY_SECRET_KEY);
    if (!hash_equals($computed, $receivedSignature)) {
        jsonResponse(['status' => false, 'message' => 'Forbidden: Invalid Monnify signature'], 403);
    }
}

$eventData = $payload['eventData'] ?? $payload;
$reference = $eventData['transactionReference'] ?? ($eventData['paymentReference'] ?? null);
$amountPaid = (float)($eventData['amountPaid'] ?? 0);
$customerEmail = strtolower(trim($eventData['customer']['email'] ?? ''));

if (empty($reference) || $amountPaid <= 0) {
    jsonResponse(['status' => false, 'message' => 'Invalid reference or amount'], 400);
}

$pdo = Database::getConnection();

// Idempotency check
$checkStmt = $pdo->prepare('SELECT id FROM webhook_logs WHERE reference = ? LIMIT 1');
$checkStmt->execute([$reference]);
if ($checkStmt->fetch()) {
    jsonResponse(['status' => true, 'message' => 'Monnify payment already processed'], 200);
}

// Find user by customer email, destination account number, or account reference
$destAccount = $eventData['destinationAccountInformation']['accountNumber'] ?? ($eventData['accountNumber'] ?? '');
$accountRef = $eventData['product']['reference'] ?? ($eventData['accountReference'] ?? '');

$user = null;
if (!empty($customerEmail)) {
    $uStmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1');
    $uStmt->execute([$customerEmail]);
    $user = $uStmt->fetch();
}

if (!$user && !empty($destAccount)) {
    $vaStmt = $pdo->prepare('SELECT u.* FROM users u JOIN virtual_accounts va ON u.id = va.user_id WHERE va.account_number = ? LIMIT 1');
    $vaStmt->execute([$destAccount]);
    $user = $vaStmt->fetch();
}

if (!$user && !empty($accountRef)) {
    $vaStmt = $pdo->prepare('SELECT u.* FROM users u JOIN virtual_accounts va ON u.id = va.user_id WHERE va.reference = ? LIMIT 1');
    $vaStmt->execute([$accountRef]);
    $user = $vaStmt->fetch();
}

if (!$user) {
    // Log unmatched payload for administrative resolution
    $unmatchedStmt = $pdo->prepare('
        INSERT INTO webhook_logs (provider, reference, amount, status, raw_payload, created_at)
        VALUES ("monnify", ?, ?, "unmatched_user", ?, NOW())
    ');
    $unmatchedStmt->execute([$reference, $amountPaid, $rawPayload]);

    jsonResponse(['status' => false, 'message' => 'User account not matched with any AJDATASUB profile'], 200);
}

$chargeFee = (defined('FUNDING_FLAT_FEE') && $amountPaid > 100) ? (float)FUNDING_FLAT_FEE : 0.00;
$creditAmount = max(0, $amountPaid - $chargeFee);

$pdo->beginTransaction();
try {
    $res = creditWalletWithLock(
        $pdo,
        (int)$user['id'],
        $creditAmount,
        'funding',
        sprintf('Monnify Bank Transfer (₦%s)', number_format($amountPaid, 2)),
        $reference,
        'Automated Monnify Deposit'
    );

    $logStmt = $pdo->prepare('
        INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
        VALUES ("monnify", ?, ?, ?, "processed", ?, NOW())
    ');
    $logStmt->execute([$reference, $amountPaid, $user['id'], $rawPayload]);

    $pdo->commit();

    jsonResponse([
        'status'         => true,
        'message'        => 'Monnify payment credited successfully',
        'creditedAmount' => $creditAmount,
        'newBalance'     => $res['new_balance']
    ], 200);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['status' => false, 'message' => $e->getMessage()], 500);
}
