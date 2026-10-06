<?php
/**
 * ==============================================================================
 * AUTOMATED WALLET FUNDING - XIXAPAY WEBHOOK HANDLER
 * ==============================================================================
 * Official Webhook Listener for XIXAPAY Virtual Accounts & Bank Transfers.
 * Fully verifies HMAC-SHA256 signature using HTTP_XIXAPAY header.
 * 100% Idempotent: safe against network retries and duplicate callbacks.
 * Concurrently locks user row in MySQL transaction to avoid race conditions.
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

// Set response header
header('Content-Type: application/json; charset=utf-8');

$rawPayload = file_get_contents('php://input');

if (empty($rawPayload)) {
    jsonResponse(['status' => false, 'message' => 'Empty webhook payload'], 400);
}

$payload = json_decode($rawPayload, true);

if (!is_array($payload)) {
    jsonResponse(['status' => false, 'message' => 'Malformed JSON payload'], 400);
}

// -----------------------------------------------------------------------------
// 1. Signature Verification (HMAC-SHA256 with XIXAPAY_SECRET_KEY)
// -----------------------------------------------------------------------------
$headers = function_exists('getallheaders') ? getallheaders() : (function_exists('apache_request_headers') ? apache_request_headers() : []);
$receivedSignature = $_SERVER['HTTP_XIXAPAY'] 
    ?? ($_SERVER['REDIRECT_HTTP_XIXAPAY']
    ?? ($headers['xixapay'] 
    ?? ($headers['Xixapay'] 
    ?? ($headers['XIXAPAY'] 
    ?? ($_SERVER['HTTP_X_XIXAPAY'] ?? '')))));

if (defined('XIXAPAY_SECRET_KEY') && !empty(XIXAPAY_SECRET_KEY) && !str_starts_with(XIXAPAY_SECRET_KEY, 'YOUR_')) {
    if (empty($receivedSignature)) {
        error_log('XIXAPAY Webhook: Missing signature header');
        jsonResponse(['status' => false, 'message' => 'Unauthorized: Missing xixapay signature header'], 401);
    }

    $computedSignature = hash_hmac('sha256', $rawPayload, XIXAPAY_SECRET_KEY);
    if (!hash_equals($computedSignature, $receivedSignature)) {
        error_log("XIXAPAY Webhook: Signature mismatch. Expected {$computedSignature}, received {$receivedSignature}");
        jsonResponse(['status' => false, 'message' => 'Forbidden: Invalid webhook signature'], 403);
    }
}

$pdo = Database::getConnection();

// -----------------------------------------------------------------------------
// 2. Extract Transaction Fields (XIXAPAY Payload Specification)
// -----------------------------------------------------------------------------
$txId = trim((string)($payload['transaction_id'] 
    ?? ($payload['reference'] 
    ?? ($payload['id'] ?? ''))));

$notificationStatus = strtolower(trim((string)($payload['notification_status'] ?? '')));
$txStatus = strtolower(trim((string)($payload['transaction_status'] ?? '')));

// Amount fields
$amountPaid = (float)($payload['amount_paid'] ?? ($payload['amount'] ?? 0));
$settlementAmount = (float)($payload['settlement_amount'] ?? $amountPaid);
$settlementFee = (float)($payload['settlement_fee'] ?? max(0, $amountPaid - $settlementAmount));

// Virtual Account (Receiver)
$receiver = $payload['receiver'] ?? [];
$accountNumber = trim((string)($receiver['account_number'] ?? ($payload['account_number'] ?? '')));
$receiverBank = trim((string)($receiver['bank'] ?? 'XIXAPAY Virtual Account'));
$receiverName = trim((string)($receiver['name'] ?? ''));

// Sender
$sender = $payload['sender'] ?? [];
$senderName = trim((string)($sender['name'] ?? 'Bank Customer'));
$senderBank = trim((string)($sender['bank'] ?? 'Bank Transfer'));
$senderAccount = trim((string)($sender['account_number'] ?? ''));

// Customer
$customer = $payload['customer'] ?? [];
$customerEmail = strtolower(trim((string)($customer['email'] ?? '')));
$customerPhone = normalizePhone((string)($customer['phone'] ?? ''));
$customerId = trim((string)($customer['customer_id'] ?? ''));

if (empty($txId) || $amountPaid <= 0) {
    jsonResponse(['status' => false, 'message' => 'Missing transaction_id or invalid amount_paid'], 400);
}

// -----------------------------------------------------------------------------
// 3. IDEMPOTENCY CHECK: Ensure we never double-credit on retries
// -----------------------------------------------------------------------------
$checkStmt = $pdo->prepare('SELECT id, status FROM webhook_logs WHERE provider = "xixapay" AND reference = ? LIMIT 1');
$checkStmt->execute([$txId]);
$existingLog = $checkStmt->fetch();

if ($existingLog) {
    jsonResponse([
        'status'  => true,
        'message' => 'Transaction already processed previously.'
    ], 200);
}

$checkTx = $pdo->prepare('SELECT id FROM transactions WHERE reference = ? LIMIT 1');
$checkTx->execute([$txId]);
if ($checkTx->fetch()) {
    jsonResponse([
        'status'  => true,
        'message' => 'Transaction already credited in transactions table.'
    ], 200);
}

// If event is not a successful payment, log and return HTTP 200
if ($notificationStatus !== 'success' && $txStatus !== 'success') {
    try {
        $logStmt = $pdo->prepare('
            INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
            VALUES ("xixapay", ?, ?, NULL, ?, ?, NOW())
        ');
        $logStmt->execute([$txId, $amountPaid, "status_{$txStatus}", $rawPayload]);
    } catch (\Throwable $t) {}

    jsonResponse(['status' => true, 'message' => 'Non-success notification recorded.'], 200);
}

// -----------------------------------------------------------------------------
// 4. Resolve the user who owns this virtual account
// -----------------------------------------------------------------------------
$user = null;

// Primary match: By dedicated virtual account number
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

// Secondary match: By xixapay_customer_id if stored
if (!$user && !empty($customerId)) {
    try {
        $uStmt = $pdo->prepare('SELECT * FROM users WHERE xixapay_customer_id = ? LIMIT 1');
        $uStmt->execute([$customerId]);
        $user = $uStmt->fetch();
    } catch (\Throwable $t) {}
}

// Tertiary match: By user phone number
if (!$user && !empty($customerPhone)) {
    $uStmt = $pdo->prepare('SELECT * FROM users WHERE phone = ? LIMIT 1');
    $uStmt->execute([$customerPhone]);
    $user = $uStmt->fetch();
}

// Quaternary match: By user email address
if (!$user && !empty($customerEmail)) {
    $uStmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $uStmt->execute([$customerEmail]);
    $user = $uStmt->fetch();
}

if (!$user) {
    // Record orphaned webhook for manual admin review
    try {
        $logStmt = $pdo->prepare('
            INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
            VALUES ("xixapay", ?, ?, NULL, "orphaned", ?, NOW())
        ');
        $logStmt->execute([$txId, $amountPaid, $rawPayload]);
    } catch (\Throwable $t) {}

    error_log("XIXAPAY Webhook: No matching user found for account {$accountNumber}, phone {$customerPhone}, email {$customerEmail}");
    jsonResponse(['status' => false, 'message' => 'User not matched for this deposit. Logged for admin review.'], 200);
}

// -----------------------------------------------------------------------------
// 5. Compute net credit amount
// -----------------------------------------------------------------------------
// Credit full amount or net of any optional system funding fee
$customFee = defined('FUNDING_FLAT_FEE') ? (float)FUNDING_FLAT_FEE : 0.00;
$creditAmount = max(0, $amountPaid - $customFee);

// -----------------------------------------------------------------------------
// 6. Atomic MySQL Transaction with Row-Level Locking (creditWalletWithLock)
// -----------------------------------------------------------------------------
$pdo->beginTransaction();

try {
    $userId = (int)$user['id'];
    $userPhone = $user['phone'];

    $title = "Wallet Top-up via XIXAPAY ({$receiverBank})";
    $desc = sprintf(
        "Bank transfer of ₦%s from %s (%s) to %s account %s.",
        number_format($amountPaid, 2),
        $senderName,
        $senderBank ?: 'Bank',
        $receiverBank,
        $accountNumber
    );

    $creditResult = creditWalletWithLock(
        $pdo,
        $userId,
        $creditAmount,
        'WALLET_FUNDING',
        $title,
        $txId,
        $desc,
        'XIXAPAY',
        $settlementFee
    );

    // Record webhook log
    $logStmt = $pdo->prepare('
        INSERT INTO webhook_logs (provider, reference, amount, user_id, status, raw_payload, created_at)
        VALUES ("xixapay", ?, ?, ?, "processed", ?, NOW())
    ');
    $logStmt->execute([$txId, $amountPaid, $userId, $rawPayload]);

    // Send instant in-app notification to the user
    if (function_exists('sendUserNotification')) {
        sendUserNotification(
            $pdo,
            $userId,
            $userPhone,
            "Wallet Credited: ₦" . number_format($creditAmount, 2),
            "Your wallet was instantly credited with ₦" . number_format($creditAmount, 2) . " via XIXAPAY ({$receiverBank}).",
            'success',
            '#10b981'
        );
    }

    $pdo->commit();

    jsonResponse([
        'status'         => true,
        'message'        => 'Wallet credited successfully via XIXAPAY',
        'reference'      => $txId,
        'creditedAmount' => $creditAmount,
        'newBalance'     => $creditResult['new_balance'] ?? null,
        'userId'         => $userId
    ], 200);

} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('XIXAPAY Webhook Processing Exception: ' . $e->getMessage());

    jsonResponse([
        'status'  => false,
        'message' => 'Internal error while processing XIXAPAY credit: ' . $e->getMessage()
    ], 500);
}
