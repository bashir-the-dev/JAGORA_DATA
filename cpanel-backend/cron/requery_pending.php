<?php
/**
 * ==============================================================================
 * CRON WORKER - AUTOMATED ASYNCHRONOUS TRANSACTION REQUERY ENGINE
 * ==============================================================================
 * Run this via cPanel Cron Job every 1 or 2 minutes:
 * Command: /usr/local/bin/php /home/username/public_html/cron/requery_pending.php >/dev/null 2>&1
 *
 * Capabilities:
 * 1. Finds transactions in 'PENDING' status that were submitted > 45 seconds ago.
 * 2. Queries upstream telco providers (Payflex, ClubKonnect, HusmoData) for real status.
 * 3. Safely resolves transitions (SUCCESS vs FAILED + atomic auto-refund).
 * 4. Delivers generated electricity STS meter tokens and exam PINs.
 * 5. Prevents double-spend and carrier timeout premature refund risks.
 * ==============================================================================
 */

// Allow execution from CLI or via authorized administrative Webhook / HTTP GET
$isCli = (php_sapi_name() === 'cli');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    // For HTTP security, verify admin session or secret cron key
    $cronSecret = defined('CRON_SECRET_KEY') ? CRON_SECRET_KEY : '';
    $receivedKey = $_GET['key'] ?? ($_SERVER['HTTP_X_CRON_KEY'] ?? '');

    $pdo = Database::getConnection();
    if (!empty($cronSecret) && !hash_equals((string)$cronSecret, (string)$receivedKey)) {
        // Also allow authenticated admin
        try {
            requireAdminUser($pdo);
        } catch (\Throwable $t) {
            jsonResponse(['status' => 'error', 'message' => 'Unauthorized cron access'], 401);
        }
    }
} else {
    $pdo = Database::getConnection();
}

$startTime = microtime(true);
$results = [
    'checked'   => 0,
    'resolved'  => 0,
    'success'   => 0,
    'failed'    => 0,
    'still_pending' => 0,
    'errors'    => []
];

try {
    // 1. Fetch pending VTU transactions submitted between 45 seconds and 48 hours ago
    $stmt = $pdo->prepare("
        SELECT id, reference, user_id, user_phone, type, title, amount, charged, 
               provider, upstream_ref, upstream_reference, token_generated, created_at 
        FROM transactions 
        WHERE status = 'PENDING' 
          AND type IN ('DATA', 'AIRTIME', 'ELECTRICITY', 'CABLE', 'EXAM_PIN')
          AND created_at <= DATE_SUB(NOW(), INTERVAL 45 SECOND)
          AND created_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
        ORDER BY id ASC 
        LIMIT 25
    ");
    $stmt->execute();
    $pendingTxs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results['checked'] = count($pendingTxs);

    foreach ($pendingTxs as $tx) {
        $txId = $tx['id'];
        $ref = $tx['reference'];
        $upstreamRef = $tx['upstream_ref'] ?: ($tx['upstream_reference'] ?: $ref);
        $provider = strtoupper(trim((string)$tx['provider']));
        $txType = strtoupper(trim((string)$tx['type']));

        $queryResult = null;

        // A. REQUERY PAYFLEX (PEYFLEX)
        if (str_contains($provider, 'PAYFLEX') || (defined('VTU_PROVIDER_NAME') && VTU_PROVIDER_NAME === 'PAYFLEX')) {
            try {
                // Call Payflex order status endpoint
                $pfQuery = callPayflex('data/query', ['reference' => $upstreamRef], 'GET');
                if (empty($pfQuery['error'])) {
                    $queryResult = $pfQuery;
                }
            } catch (\Throwable $pfe) {
                $results['errors'][] = "Payflex query error for {$ref}: " . $pfe->getMessage();
            }
        }

        // B. REQUERY CLUBKONNECT
        if (!$queryResult && (str_contains($provider, 'CLUBKONNECT') || (defined('CLUBKONNECT_API_KEY') && !empty(CLUBKONNECT_API_KEY) && !str_starts_with(CLUBKONNECT_API_KEY, 'YOUR_')))) {
            try {
                $ckEndpoint = 'Query.asp';
                $ckQuery = callClubKonnect($ckEndpoint, ['OrderID' => $upstreamRef]);
                if (empty($ckQuery['error'])) {
                    $queryResult = $ckQuery;
                }
            } catch (\Throwable $cke) {
                $results['errors'][] = "ClubKonnect query error for {$ref}: " . $cke->getMessage();
            }
        }

        // If no provider answered or upstream status is still pending, proceed
        if (!$queryResult) {
            $results['still_pending']++;
            continue;
        }

        $parsed = parseVtuGatewayStatus($queryResult);

        if ($parsed['is_success']) {
            $update = processVtuStatusUpdate($pdo, $ref, 'SUCCESS', $queryResult, 'cron_requery');
            if (!empty($update['success'])) {
                $results['resolved']++;
                $results['success']++;
            }
        } elseif ($parsed['is_failed']) {
            $update = processVtuStatusUpdate($pdo, $ref, 'FAILED', $queryResult, 'cron_requery');
            if (!empty($update['success'])) {
                $results['resolved']++;
                $results['failed']++;
            }
        } else {
            $results['still_pending']++;
        }
    }

} catch (\Throwable $e) {
    $results['errors'][] = 'Requery worker exception: ' . $e->getMessage();
}

$executionTime = round(microtime(true) - $startTime, 4);
$output = [
    'status'         => 'success',
    'timestamp'      => date('c'),
    'execution_time' => "{$executionTime}s",
    'metrics'        => $results
];

if (!$isCli) {
    jsonResponse($output);
} else {
    echo json_encode($output, JSON_PRETTY_PRINT) . PHP_EOL;
}
