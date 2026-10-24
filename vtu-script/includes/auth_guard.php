<?php
/**
 * ============================================================================
 * VTU SCRIPT - AUTH GUARD (SESSION VERIFICATION)
 * ============================================================================
 * Included at the top of protected user dashboard and admin pages.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/app_config.php';
require_once __DIR__ . '/../config/database.php';

if (empty($_SESSION['user_id'])) {
    $currentUrl = $_SERVER['REQUEST_URI'] ?? '/dashboard/index.php';
    header("Location: " . BASE_URL . "/login.php?redirect=" . urlencode($currentUrl));
    exit;
}

$pdo = get_db_connection();
$currentUser = null;

if ($pdo) {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, balance, bonus_balance, tier, status, virtual_bank_name, virtual_account_number, virtual_account_name FROM users WHERE id = :id");
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $currentUser = $stmt->fetch();
}

// Fallback session object if running without live MySQL
if (!$currentUser) {
    $currentUser = [
        'id'                     => $_SESSION['user_id'] ?? 1,
        'name'                   => $_SESSION['user_name'] ?? "AJDATASUB",
        'email'                  => $_SESSION['user_email'] ?? "client@ajdatasub.com.ng",
        'phone'                  => $_SESSION['user_phone'] ?? "07048609646",
        'balance'                => (float)($_SESSION['user_balance'] ?? 5250.00),
        'bonus_balance'          => (float)($_SESSION['user_bonus'] ?? 420.00),
        'tier'                   => $_SESSION['user_tier'] ?? 'smart',
        'status'                 => 'active',
        'virtual_bank_name'      => 'Wema Bank',
        'virtual_account_number' => '701' . sprintf('%07d', $_SESSION['user_id'] ?? 1),
        'virtual_account_name'   => APP_NAME . " / User"
    ];
}

if ($currentUser['status'] === 'suspended') {
    session_destroy();
    header("Location: " . BASE_URL . "/login.php?error=" . urlencode("Your account has been suspended. Please contact support."));
    exit;
}
