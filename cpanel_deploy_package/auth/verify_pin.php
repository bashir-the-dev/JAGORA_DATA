<?php
/**
 * ==============================================================================
 * AUTH - VERIFY 4-DIGIT TRANSACTION PIN (SESSION & APP UNLOCK)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);
$body = getRequestBody();

$pin = trim($body['pin'] ?? $body['transaction_pin'] ?? '');

if (empty($pin) || !preg_match('/^[0-9]{4}$/', $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Transaction PIN must be exactly 4 digits.'
    ], 400);
}

if (!verifyTransactionPin($user, $pin)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Incorrect 4-digit transaction PIN.'
    ], 400);
}

jsonResponse([
    'status'  => 'success',
    'message' => 'PIN verified successfully.'
]);
