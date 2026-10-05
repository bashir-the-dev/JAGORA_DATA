<?php
/**
 * ==============================================================================
 * WALLET - PEER-TO-PEER WALLET TRANSFER (DEADLOCK-SAFE)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$sender = authenticateUser($pdo);
$body = getRequestBody();

$recipientPhone = preg_replace('/[^0-9]/', '', $body['recipient'] ?? $body['phone'] ?? '');
$amount         = (float)($body['amount'] ?? 0);
$pin            = trim($body['pin'] ?? '');

if (empty($recipientPhone) || strlen($recipientPhone) < 10) {
    jsonResponse(['status' => 'error', 'message' => 'Please provide a valid recipient phone number.'], 400);
}

if ($recipientPhone === $sender['phone']) {
    jsonResponse(['status' => 'error', 'message' => 'You cannot transfer funds to your own phone number.'], 400);
}

// Enforce strictly positive integer financial amount (no negatives, decimals, zero)
$rawAmount = $body['amount'] ?? 0;
if (!is_numeric($rawAmount) || (int)$rawAmount != $rawAmount || (int)$rawAmount < 50 || (int)$rawAmount > 500000) {
    jsonResponse(['status' => 'error', 'message' => 'Transfer amount must be a positive integer between ₦50 and ₦500,000 (decimals are not permitted).'], 400);
}
$amount = (float)(int)$rawAmount;

// Verify Sender PIN
if (!verifyTransactionPin($sender, $pin)) {
    jsonResponse(['status' => 'error', 'message' => 'Incorrect 4-digit transaction PIN.'], 403);
}

// Find recipient user
$recStmt = $pdo->prepare('SELECT id, name, COALESCE(full_name, name) AS full_name, phone, status FROM users WHERE phone = ? LIMIT 1');
$recStmt->execute([$recipientPhone]);
$recipient = $recStmt->fetch();

if (!$recipient || ($recipient['status'] ?? 'active') !== 'active') {
    jsonResponse(['status' => 'error', 'message' => 'Recipient account not found or is currently inactive.'], 404);
}

$senderName    = $sender['name'] ?? ($sender['full_name'] ?? 'Sender');
$recipientName = $recipient['full_name'] ?? ($recipient['name'] ?? 'Recipient');
$senderPhone   = $sender['phone'] ?? '';
$recipientPhone = $recipient['phone'] ?? $recipientPhone;

$senderId    = (int)$sender['id'];
$recipientId = (int)$recipient['id'];
$transferRef = generateReference('AJD-TRF');

// DEADLOCK-PREVENTION: Always lock rows in ascending user ID order
$firstId  = min($senderId, $recipientId);
$secondId = max($senderId, $recipientId);

$pdo->beginTransaction();

try {
    // 1. Acquire locks in strict order
    $lockStmt = $pdo->prepare('SELECT id, balance, status FROM users WHERE id IN (?, ?) ORDER BY id ASC FOR UPDATE');
    $lockStmt->execute([$firstId, $secondId]);
    $lockedUsers = [];
    while ($row = $lockStmt->fetch()) {
        $lockedUsers[(int)$row['id']] = $row;
    }

    $currentSender = $lockedUsers[$senderId] ?? null;
    $currentRecipient = $lockedUsers[$recipientId] ?? null;

    if (!$currentSender || ($currentSender['status'] ?? 'active') !== 'active') {
        throw new Exception('Your account is not active.');
    }

    $senderOldBal = (float)$currentSender['balance'];
    if ($senderOldBal < $amount) {
        throw new Exception(sprintf('Insufficient wallet balance. Available: ₦%.2f, Transfer: ₦%.2f', $senderOldBal, $amount));
    }

    $senderNewBal = round($senderOldBal - $amount, 2);
    $recOldBal    = (float)$currentRecipient['balance'];
    $recNewBal    = round($recOldBal + $amount, 2);

    // 2. Debit Sender
    $debStmt = $pdo->prepare('UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?');
    $debStmt->execute([$senderNewBal, $senderId]);

    // 3. Credit Recipient
    $credStmt = $pdo->prepare('UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?');
    $credStmt->execute([$recNewBal, $recipientId]);

    // 4. Ledger entry for Sender (Debit)
    $txSender = $pdo->prepare('
        INSERT INTO transactions (
            user_id, user_phone, reference, type, title, amount, charged, balance_before, balance_after, old_balance, new_balance, recipient, status, description, created_at
        ) VALUES (?, ?, ?, "transfer", ?, ?, ?, ?, ?, ?, ?, ?, "SUCCESS", ?, NOW())
    ');
    $txSender->execute([
        $senderId,
        $senderPhone,
        $transferRef,
        "Transfer to {$recipientName}",
        $amount,
        $amount,
        $senderOldBal,
        $senderNewBal,
        $senderOldBal,
        $senderNewBal,
        $recipientPhone,
        "Transferred ₦{$amount} to {$recipientName} ({$recipientPhone})"
    ]);

    // 5. Ledger entry for Recipient (Credit)
    $recRef = $transferRef . '-REC';
    $txRecipient = $pdo->prepare('
        INSERT INTO transactions (
            user_id, user_phone, reference, type, title, amount, charged, balance_before, balance_after, old_balance, new_balance, recipient, status, description, created_at
        ) VALUES (?, ?, ?, "funding", ?, ?, ?, ?, ?, ?, ?, ?, "SUCCESS", ?, NOW())
    ');
    $txRecipient->execute([
        $recipientId,
        $recipientPhone,
        $recRef,
        "Transfer from {$senderName}",
        $amount,
        $amount,
        $recOldBal,
        $recNewBal,
        $recOldBal,
        $recNewBal,
        $senderPhone,
        "Received ₦{$amount} from {$senderName} ({$senderPhone})"
    ]);

    $pdo->commit();

    jsonResponse([
        'status'     => 'success',
        'message'    => "Successfully transferred ₦" . number_format($amount, 2) . " to {$recipientName}!",
        'data'       => [
            'reference'   => $transferRef,
            'recipient'   => $recipientName,
            'phone'       => $recipientPhone,
            'amount'      => $amount,
            'newBalance'  => $senderNewBal,
            'date'        => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['status' => 'error', 'message' => $e->getMessage()], 400);
}
