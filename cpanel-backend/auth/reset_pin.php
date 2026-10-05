<?php
/**
 * ==============================================================================
 * AUTH - RESET FORGOTTEN 4-DIGIT TRANSACTION PIN USING ACCOUNT LOGIN PASSWORD
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$newPin   = preg_replace('/[^0-9]/', '', $body['new_pin'] ?? $body['newPin'] ?? $body['pin'] ?? '');
$password = trim($body['password'] ?? $body['login_password'] ?? '');

if (empty($newPin) || strlen($newPin) !== 4) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'New transaction PIN must be exactly 4 numeric digits.'
    ], 400);
}

if (empty($password)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please enter your account login password to verify your identity.'
    ], 400);
}

// Verify login password against user's password hash in database
$stmt = $pdo->prepare('SELECT id, phone, email, password FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$user['id']]);
$userRecord = $stmt->fetch();

if (!$userRecord || empty($userRecord['password']) || !password_verify($password, $userRecord['password'])) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect account login password. Please check your password and try again.'
    ], 403);
}

// Hash new PIN with bcrypt and update both pin and transaction_pin
$hashedPin = password_hash($newPin, PASSWORD_BCRYPT);

try {
    $upStmt = $pdo->prepare('UPDATE users SET pin = ?, transaction_pin = ?, updated_at = NOW() WHERE id = ?');
    $upStmt->execute([$hashedPin, $hashedPin, $user['id']]);
} catch (PDOException $e) {
    $upStmt = $pdo->prepare('UPDATE users SET pin = ?, updated_at = NOW() WHERE id = ?');
    $upStmt->execute([$hashedPin, $user['id']]);
}

jsonResponse([
    'status'  => 'success',
    'success' => true,
    'message' => 'Your transaction PIN has been successfully reset!'
]);
