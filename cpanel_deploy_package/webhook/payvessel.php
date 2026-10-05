<?php
/**
 * ==============================================================================
 * AUTOMATED WALLET FUNDING - PAYVESSEL WEBHOOK HANDLER
 * ==============================================================================
 * Listens for automated bank transfers into customer virtual accounts.
 * Idempotent: guaranteed to never double-credit even if bank retries webhook.
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

// Log incoming raw webhook for auditing and debugging
$headers = getallheaders();
$receivedSignature = $headers['Payvessel-Http-Signature'] 
    ?? $headers['payvessel-http-signature'] 
    ?? ($_SERVER['HTTP_PAYVESSEL_HTTP_SIGNATURE'] ?? '');

// Verify HMAC-SHA512 Signature if secret key is configured
if (PAYVESSEL_SECRET_KEY !== 'pv_sec_xxxxxxxxxxxxxxxxxxxxxx' && !empty(PAYVESSEL_SECRET_KEY)) {
    if (empty($receivedSignature)) {
        jsonResponse(['status' => false, 'message' => 'Unauthorized: Missing Payvessel signature header'], 401);
    }
    $computedSignature = hash_hmac('sha512', $rawPayload, PAYVESSEL_SECRET_KEY);
    if (!hash_equals($computedSignature, $receivedSignature)) {
        jsonResponse(['status' => false, 'message' => 'Forbidden: Invalid webhook signature'], 403);
    }
}

$pdo = Database::getConnection();

// Extract transaction fields (Payvessel payload specification)
$order = $payload['order'] ?? $payload['transaction'] ?? $payload;
$reference = $order['reference'] ?? ($order['transaction_reference'] ?? ($payload['reference'] ?? null));
$amountPaid = (float)($order['amount'] ?? ($order['amount_paid'] ?? 0));
$accountNumber = $order['virtual_account_number'] ?? ($order['account_number'] ?? '');
$customerPhone = preg_replace('/[^0-9]/', '', $order['customer']['phone'] ?? ($order['customer_phone'] ?? ''));
$customerEmail = strtolower(trim($order['customer']['email'] ?? ''));

if (empty($reference) || $amountPaid <= 0) {
    jsonResponse(['status' => false, 'message' => 'Missing reference or invalid amount'], 400);
}

// 1. IDEMPOTENCY CHECK: Have we already processed this reference?
$checkStmt = $pdo->prepare('SELECT id FROM webhook_logs WHERE reference = ? LIMIT 1');
$checkStmt->execute([$reference]);
if ($checkStmt->fetch()) {
    // Already processed! Return HTTP 200 so Payvessel stops retrying
    jsonResponse([
        'status'  => true,
        'message' => 'Transaction already processed previously.'
    ], 200);
}

// 2. Identify the user who owns this account
$user = null;

// Find by assigned virtual account number first
if (!empty($accountNumber)) {
    $uStmt = $pdo->prepare('
        SELECT u.* FROM users u 
        INNER JOIN virtual_accounts va ON va.user_id = u.id 
        WHERE va.account_number = ? 
        LIMIT 1
    ');
    $uStmt->execute([$accountNumber]);
    $user = $uStmt->fetch();
}

// If not found, try phone number
if (!$user && !empty($customerPhone)) {
    $uStmt = $pdo->prepare('SELECT * FROM users WHERE phone = ? LIMIT 1');
    $uStmt->execute([$customerPhone]);
    $user = $uStmt->fetch();
}

// If not found, try email
if (!$user && !empty($customerEmail)) {
    $uStmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $uStmt->execute([$customerEmail]);
    $user = $uStmt->fetch();
}

if (!$user) {
    // Record orphaned webhook for manual admin review
    $logStmt = $pdo->prepare('
        INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
        VALUES ("payvessel", ?, ?, NULL, "ignored", ?, NOW())
    ');
    $logStmt->execute([$reference, $amountPaid, $rawPayload]);

    jsonResponse(['status' => false, 'message' => 'User not matched for this deposit'], 200);
}

// 3. Compute net amount credited (deduct minor transfer charge if applicable)
$chargeFee = (defined('FUNDING_FLAT_FEE') && $amountPaid > 100) ? (float)FUNDING_FLAT_FEE : 0.00;
$creditAmount = max(0, $amountPaid - $chargeFee);

// 4. Atomic Credit within MySQL Transaction
$pdo->beginTransaction();

try {
    // Lock user row and credit balance
    $creditResult = creditWalletWithLock(
        $pdo,
        (int)$user['id'],
        $creditAmount,
        'funding',
        sprintf('Wallet Top-up via Bank Transfer (₦%s)', number_format($amountPaid, 2)),
        $reference,
        sprintf('Automated Virtual Account Funding: ₦%s paid, ₦%s fee, ₦%s credited.', number_format($amountPaid, 2), number_format($chargeFee, 2), number_format($creditAmount, 2))
    );

    // Record webhook log
    $logStmt = $pdo->prepare('
        INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
        VALUES ("payvessel", ?, ?, ?, "processed", ?, NOW())
    ');
    $logStmt->execute([$reference, $amountPaid, $user['id'], $rawPayload]);

    $pdo->commit();

    jsonResponse([
        'status'         => true,
        'message'        => 'Wallet credited successfully',
        'creditedAmount' => $creditAmount,
        'newBalance'     => $creditResult['new_balance'],
        'reference'      => $reference
    ], 200);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'status'  => false,
        'message' => 'Database error processing webhook: ' . $e->getMessage()
    ], 500);
}
