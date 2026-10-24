<?php
/**
 * ============================================================================
 * VTU SCRIPT - RESELLER API: USER PROFILE & BALANCE (api/v1/user.php)
 * ============================================================================
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/app_config.php';
require_once __DIR__ . '/../../config/database.php';

$pdo = get_db_connection();
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = preg_replace('/^Bearer\s+/i', '', $authHeader);

if (empty($token) && !empty($_GET['api_key'])) {
    $token = $_GET['api_key'];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['status' => 'fail', 'message' => 'Missing Authorization Bearer token or api_key parameter']);
    exit;
}

if (!$pdo) {
    echo json_encode([
        'status' => 'success',
        'data' => [
            'name' => "AJDATASUB Reseller",
            'phone' => "07048609646",
            'balance' => 5250.00,
            'tier' => 'reseller'
        ]
    ]);
    exit;
}

$stmt = $pdo->prepare("SELECT id, name, email, phone, balance, tier, status FROM users WHERE phone = :t OR id = :tid");
$stmt->execute([':t' => $token, ':tid' => (int)$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'fail', 'message' => 'Invalid API key or user account not found']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'data' => [
        'user_id' => (int)$user['id'],
        'name'    => $user['name'],
        'email'   => $user['email'],
        'phone'   => $user['phone'],
        'balance' => (float)$user['balance'],
        'tier'    => $user['tier'],
        'status'  => $user['status']
    ]
]);
