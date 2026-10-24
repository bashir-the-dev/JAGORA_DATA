<?php
/**
 * ============================================================================
 * VTU SCRIPT - AUTOMATED PAYMENT WEBHOOK CALLBACK (api/callback.php)
 * ============================================================================
 * Handles Monnify and Payvessel automated payment notifications.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/PaymentGateway.php';

$rawPayload = file_get_contents('php://input');
$data = json_decode($rawPayload, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => false, 'message' => 'Empty or invalid JSON payload']);
    exit;
}

$gateway = new PaymentGateway();

// Detect Monnify payload
if (isset($data['eventData'])) {
    $eventData     = $data['eventData'];
    $reference     = $eventData['transactionReference'] ?? ('MON_' . time());
    $amount        = (float)($eventData['amountPaid'] ?? 0);
    $accountNumber = $eventData['destinationAccountInformation']['accountNumber'] ?? ($eventData['customer']['email'] ?? '');

    $result = $gateway->creditWebhookPayment($reference, $accountNumber, $amount, 'MONNIFY', $rawPayload);
    echo json_encode($result);
    exit;
}

// Detect Payvessel payload
if (isset($data['order']) || isset($data['payvessel_reference'])) {
    $reference     = $data['payvessel_reference'] ?? $data['reference'] ?? ('PV_' . time());
    $amount        = (float)($data['order']['amount'] ?? $data['amount'] ?? 0);
    $accountNumber = $data['order']['account_number'] ?? $data['virtual_account_number'] ?? '';

    $result = $gateway->creditWebhookPayment($reference, $accountNumber, $amount, 'PAYVESSEL', $rawPayload);
    echo json_encode($result);
    exit;
}

// Generic fallback
$reference     = $data['reference'] ?? ('TX_' . time());
$amount        = (float)($data['amount'] ?? 0);
$accountNumber = $data['account_number'] ?? $data['phone'] ?? '';

$result = $gateway->creditWebhookPayment($reference, $accountNumber, $amount, 'GENERIC', $rawPayload);
echo json_encode($result);
