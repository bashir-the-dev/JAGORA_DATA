<?php
/**
 * ==============================================================================
 * VTU - DYNAMIC UPSTREAM DATA PLANS SYNCHRONIZER (PEYFLEX 5 NETWORKS)
 * ==============================================================================
 * Synchronizes active telecom data bundles from Peyflex across all 5 networks:
 * - mtn_gifting_data
 * - glo_data
 * - 9mobile_data
 * - airtel_data
 * - mtn_data_share
 * directly into the MySQL `vtu_plans` and `data_plans` tables.
 *
 * Can be triggered via:
 * 1. Admin Dashboard button (`POST /api/admin/vtu/sync` or `GET /vtu/sync_plans.php`)
 * 2. Automated cPanel cron job (e.g. Daily / Weekly)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();

// Authenticate: Must be administrator or CLI/cron execution
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $cronSecret = defined('CRON_SECRET_KEY') ? CRON_SECRET_KEY : '';
    $receivedKey = $_GET['key'] ?? ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
    if (empty($cronSecret) || !hash_equals((string)$cronSecret, (string)$receivedKey)) {
        requireAdminUser($pdo);
    }
}

$startTime = microtime(true);
$syncResult = syncVtuPlansFromGatewayPhp($pdo);
$executionTime = round(microtime(true) - $startTime, 4);

jsonResponse([
    'status'         => $syncResult['success'] ? 'success' : 'warning',
    'success'        => $syncResult['success'],
    'message'        => $syncResult['message'],
    'synced_count'   => $syncResult['count'] ?? 0,
    'count'          => $syncResult['count'] ?? 0,
    'provider'       => $syncResult['provider'] ?? 'payflex',
    'execution_time' => "{$executionTime}s",
    'timestamp'      => $syncResult['timestamp'] ?? date('c')
]);

