<?php
/**
 * ============================================================================
 * VTU SCRIPT - RESELLER API: AIRTIME VENDING (api/v1/airtime.php)
 * ============================================================================
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/app_config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/AirtimeHandler.php';

$pdo = get_db_connection();
$handler = new AirtimeHandler($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: $_POST;

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$apiKey = preg_replace('/^Bearer\s+/i', '', $authHeader) ?: ($body['api_key'] ?? '');

if (empty($apiKey)) {
    http_response_code(401);
    echo json_encode(['status' => 'fail', 'message' => 'Missing API Authorization']);
    exit;
}

$userId = 1;
if ($pdo) {
    $uStmt = $pdo->prepare("SELECT id FROM users WHERE phone = :t OR id = :tid");
    $uStmt->execute([':t' => $apiKey, ':tid' => (int)$apiKey]);
    $u = $uStmt->fetch();
    if ($u) $userId = (int)$u['id'];
}

$network = strtoupper(trim($body['network'] ?? 'MTN'));
$amount  = (float)($body['amount'] ?? 0);
$phone   = trim($body['phone'] ?? $body['mobile_number'] ?? '');
$pin     = trim($body['pin'] ?? '1234');

$res = $handler->purchaseAirtime($userId, $network, $amount, $phone, $pin);
if ($res['status']) {
    echo json_encode(['status' => 'success', 'data' => $res]);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'fail', 'message' => $res['message']]);
}
