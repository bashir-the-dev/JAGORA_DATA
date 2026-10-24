<?php
/**
 * ==============================================================================
 * ADMIN - USER ACCOUNTS MANAGEMENT (LIVE MYSQL)
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$admin = requireAdminPermission($pdo, 'manage_users');

$method = $_SERVER['REQUEST_METHOD'];

// Handle Toggle User Status (POST)
if ($method === 'POST') {
    $body = getRequestBody();
    $phone = preg_replace('/[^0-9]/', '', $body['phone'] ?? '');
    $forcedStatus = $body['status'] ?? null;

    if (empty($phone)) {
        jsonResponse(['status' => 'error', 'message' => 'Customer phone number is required.'], 400);
    }

    $uStmt = $pdo->prepare('SELECT id, phone, role, status FROM users WHERE phone = ? LIMIT 1');
    $uStmt->execute([$phone]);
    $user = $uStmt->fetch();

    if (!$user) {
        jsonResponse(['status' => 'error', 'message' => 'Customer account not found with phone: ' . $phone], 404);
    }

    // Safety checks against admin / self suspension
    $targetRole = strtolower($user['role'] ?? 'user');
    $isAdminRole = in_array($targetRole, ['admin', 'super_admin', 'staff', 'support_agent', 'finance_agent']);
    $adminPhone = preg_replace('/[^0-9]/', '', $admin['phone'] ?? '');
    $isSelf = ($user['id'] == $admin['id']) || ($phone === $adminPhone);

    if ($isSelf) {
        jsonResponse([
            'status' => 'error',
            'code' => 'CANNOT_SUSPEND_SELF',
            'message' => 'Security Violation: Administrators cannot suspend their own account.'
        ], 403);
    }

    if ($isAdminRole) {
        jsonResponse([
            'status' => 'error',
            'code' => 'CANNOT_SUSPEND_ADMIN',
            'message' => 'Security Violation: Administrator and staff accounts cannot be suspended.'
        ], 403);
    }

    $newStatus = $forcedStatus ? ($forcedStatus === 'suspended' ? 'suspended' : 'active') : ($user['status'] === 'suspended' ? 'active' : 'suspended');

    $update = $pdo->prepare('UPDATE users SET status = ? WHERE id = ?');
    $update->execute([$newStatus, $user['id']]);

    jsonResponse([
        'status' => 'success',
        'message' => "User status successfully updated to {$newStatus}",
        'newStatus' => $newStatus
    ]);
}

// Ensure all required user columns are in place
ensureUserColumns($pdo);

// Handle GET: Fetch registered customer accounts (excluding admin and staff)
try {
    $stmt = $pdo->query('SELECT * FROM users ORDER BY id DESC');
    $rawUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $rawUsers = [];
}

$users = [];
$adminEmails = ['bashirabubakar650@gmail.com', 'admin@ajdatasub.com.ng', 'admin@ajdatasub.com'];
$adminPhones = ['08123456789', '08001234567'];

foreach ($rawUsers as $u) {
    $role = strtolower(trim($u['role'] ?? 'user'));
    $phone = preg_replace('/[^0-9]/', '', (string)($u['phone'] ?? ''));
    $email = strtolower(trim((string)($u['email'] ?? '')));
    $id = (string)($u['id'] ?? $phone);

    // Skip administrators and staff accounts so customer management remains strictly for customers
    if (in_array($role, ['admin', 'super_admin', 'staff', 'support_agent', 'finance_agent']) ||
        in_array($email, $adminEmails) ||
        in_array($phone, $adminPhones) ||
        !empty($u['admin_role']) ||
        $id === 'usr_admin_01' ||
        $id === '1') {
        continue;
    }

    $ordersCount = 0;
    $totalSpent = 0.0;
    try {
        $normPhone = function_exists('normalizePhone') ? normalizePhone($phone) : $phone;
        $intlPhone = !empty($normPhone) ? ('234' . substr($normPhone, 1)) : '';
        $intlPlus = !empty($normPhone) ? ('+234' . substr($normPhone, 1)) : '';
        $localNoZero = !empty($normPhone) ? substr($normPhone, 1) : '';

        $tStmt = $pdo->prepare('
            SELECT COUNT(*) as cnt, COALESCE(SUM(ABS(COALESCE(NULLIF(charged, 0), amount))), 0) as total 
            FROM transactions 
            WHERE (user_id = ? OR user_id = ? OR user_phone IN (?, ?, ?, ?, ?))
              AND UPPER(status) IN ("SUCCESS", "COMPLETED", "DELIVERED", "PAID")
              AND (refunded IS NULL OR refunded = 0)
              AND UPPER(type) NOT IN ("FUNDING", "WALLET_FUNDING", "BONUS_TRANSFER", "REFUND", "CREDIT", "DEPOSIT")
        ');
        $tStmt->execute([
            (string)$u['id'],
            $normPhone,
            $phone,
            $normPhone,
            $intlPhone,
            $intlPlus,
            $localNoZero
        ]);
        $tRow = $tStmt->fetch();
        if ($tRow) {
            $ordersCount = (int)($tRow['cnt'] ?? 0);
            $totalSpent = round((float)($tRow['total'] ?? 0), 2);
        }
    } catch (Exception $te) {}

    $displayName = !empty($u['name']) ? $u['name'] : (!empty($u['full_name']) ? $u['full_name'] : 'Customer');

    $users[] = [
        'id' => (string)($u['phone'] ?: $u['id']),
        'phone' => (string)($u['phone'] ?? ''),
        'name' => $displayName,
        'email' => (string)($u['email'] ?? ''),
        'balance' => (float)($u['balance'] ?? 0),
        'bonusBalance' => (float)($u['bonus_balance'] ?? 0),
        'role' => $role,
        'status' => ($u['status'] ?? 'active') === 'suspended' ? 'suspended' : 'active',
        'accountTier' => $u['account_tier'] ?? 'Standard',
        'createdAt' => $u['created_at'] ?? date('Y-m-d H:i:s'),
        'totalOrders' => $ordersCount,
        'totalSpent' => $totalSpent
    ];
}

jsonResponse([
    'status' => 'success',
    'success' => true,
    'data' => $users,
    'total' => count($users)
]);
