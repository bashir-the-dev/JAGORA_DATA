<?php
/**
 * ==============================================================================
 * AUTH - SET / CHANGE 4-DIGIT TRANSACTION PIN
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$oldPin = trim($body['old_pin'] ?? $body['oldPin'] ?? '');
$newPin = trim($body['new_pin'] ?? $body['newPin'] ?? '');

if (empty($newPin) || !preg_match('/^[0-9]{4}$/', $newPin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'New PIN must be exactly 4 digits.'
    ], 400);
}

// If user already has a PIN, verify old PIN
$hasExistingPin = !empty($user['pin'] ?? $user['transaction_pin'] ?? '');
if ($hasExistingPin) {
    if (!verifyTransactionPin($user, $oldPin)) {
        jsonResponse([
            'status'  => 'error',
            'message' => 'Current transaction PIN is incorrect.'
        ], 403);
    }
}

// Hash new PIN with bcrypt
$hashedPin = password_hash($newPin, PASSWORD_BCRYPT);

$stmt = $pdo->prepare('UPDATE users SET pin = ?, transaction_pin = ?, updated_at = NOW() WHERE id = ?');
$stmt->execute([$hashedPin, $hashedPin, $user['id']]);

jsonResponse([
    'status'  => 'success',
    'message' => 'Your 4-digit transaction PIN has been updated successfully.'
]);
