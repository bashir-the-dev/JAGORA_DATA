<?php
/**
 * ==============================================================================
 * UNIVERSAL VTU GATEWAY ASYNCHRONOUS CALLBACK & WEBHOOK RECEIVER
 * ==============================================================================
 * Handles delayed async notifications from Peyflex, ClubKonnect, HusmoData, etc.
 * Resolves PENDING orders, delivers electricity STS tokens & exam PINs, and
 * prevents duplicate refunds and race conditions.
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

// Capture raw payload (supports JSON body, multipart form-data, and GET query parameters)
$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    if (!empty($_POST)) {
        $payload = $_POST;
    } elseif (!empty($_GET)) {
        $payload = $_GET;
    } else {
        $payload = [];
    }
}

// Extract primary transaction reference and status
$ref = $payload['reference'] 
    ?? $payload['order_id'] 
    ?? $payload['orderid'] 
    ?? $payload['ident'] 
    ?? $payload['requestId'] 
    ?? ($payload['id'] ?? ($_GET['reference'] ?? ($_GET['order_id'] ?? null)));

$rawStatus = (string)($payload['status'] ?? $payload['Status'] ?? $payload['statuscode'] ?? ($_GET['status'] ?? ''));

if (empty($ref)) {
    // If provider sent an empty heartbeat ping, acknowledge gracefully
    jsonResponse([
        'status'  => 'success',
        'message' => 'VTU Webhook endpoint alive and listening. No transaction reference provided in request.'
    ], 200);
}

// Process state transition via central authoritative updater
$updateResult = processVtuStatusUpdate($pdo, (string)$ref, $rawStatus, $payload, 'webhook_vtu');

// Log incoming webhook event for auditing
try {
    $logStmt = $pdo->prepare("
        INSERT INTO webhook_logs (provider, reference, amount, status, raw_payload, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $logStmt->execute([
        'vtu_gateway',
        (string)$ref,
        (float)($payload['amount'] ?? 0),
        $updateResult['status'] ?? 'received',
        $rawInput ?: json_encode($payload)
    ]);
} catch (\Throwable $t) {}

jsonResponse([
    'status'  => 'success',
    'success' => true,
    'message' => 'Asynchronous carrier callback processed successfully',
    'data'    => $updateResult
], 200);
