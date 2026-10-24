<?php
/**
 * ==============================================================================
 * AUTH - GET LIVE USER PROFILE & BALANCE
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$pdo = Database::getConnection();
$user = authenticateUser($pdo);

// Fetch updated virtual bank accounts
$accStmt = $pdo->prepare('SELECT bank_name, account_number, account_name FROM virtual_accounts WHERE user_id = ?');
$accStmt->execute([$user['id']]);
$accounts = $accStmt->fetchAll();

// Fetch recent 20 transactions strictly belonging to authenticated user
$userId = (int)($user['id'] ?? 0);
$userPhone = normalizePhone($user['phone'] ?? '');

$txStmt = $pdo->prepare('
    SELECT id, reference, type, title, description, amount, COALESCE(fee, 0.00) AS fee, 
           COALESCE(old_balance, balance_before, 0.00) AS old_balance, 
           COALESCE(new_balance, balance_after, 0.00) AS new_balance, 
           recipient, status, token_generated, created_at
    FROM transactions 
    WHERE (user_id = ? AND user_id > 0) 
       OR (user_phone = ? AND user_phone != "")
       OR (type = "funding" AND recipient = ? AND recipient != "")
    ORDER BY id DESC 
    LIMIT 20
');
$txStmt->execute([$userId, $userPhone, $userPhone]);
$rawTransactions = $txStmt->fetchAll();
$transactions = array_map('formatTransactionRecord', $rawTransactions ?: []);

$rawName = trim($user['name'] ?? ($user['full_name'] ?? ''));
if (empty($rawName) || preg_match('/^(valued\s*customer|valued\s*partner|customer|user|null|undefined)$/i', $rawName)) {
    $rawName = !empty($user['username']) ? $user['username'] : (!empty($user['phone']) ? 'Customer' : "AJ User");
}
$userName = $rawName;

$phoneClean = preg_replace('/[^0-9]/', '', $user['phone'] ?? '');
$emailClean = strtolower(trim($user['email'] ?? ''));
$dbRole = strtolower(trim($user['role'] ?? 'user'));

$isCEO = (
    $emailClean === 'bashirabubakar650@gmail.com' ||
    $phoneClean === '08123456789' ||
    $dbRole === 'super_admin' ||
    $dbRole === 'admin' ||
    ($user['admin_role'] ?? '') === 'super_admin'
);


// Explicit administrative or staff role only if designated by admin
$isStaffAssigned = in_array($dbRole, ['admin', 'staff', 'support_agent', 'finance_agent'], true) || !empty($user['admin_role']);

if ($isCEO || $dbRole === 'admin' || $dbRole === 'super_admin') {
    $resolvedRole = 'admin';
    $adminRole = 'super_admin';
} elseif ($isStaffAssigned && !empty($user['admin_role'])) {
    $adminRole = strtolower(trim($user['admin_role']));
    $resolvedRole = ($adminRole === 'super_admin') ? 'admin' : 'user';
} else {
    $resolvedRole = 'user';
    $adminRole = null;
}

$permissions = $isCEO ? [
    'canViewTransactions' => true,
    'canRequeryOrders' => true,
    'canRefundOrders' => true,
    'canFundWallets' => true,
    'canModifyPricing' => true,
    'canManageGateways' => true,
    'canManageStaff' => true,
] : null;

jsonResponse([
    'status' => 'success',
    'data'   => [
        'user' => [
            'id'           => (int)$user['id'],
            'name'         => $userName,
            'username'     => $user['username'] ?? null,
            'fullName'     => $userName,
            'email'        => $user['email'],
            'phone'        => $user['phone'],
            'balance'      => (float)$user['balance'],
            'bonusBalance' => (float)($user['bonus_balance'] ?? 0.00),
            'tier'         => $user['account_tier'] ?? ($user['tier'] ?? 'Standard'),
            'role'         => $resolvedRole,
            'adminRole'    => $adminRole,
            'permissions'  => $permissions,
            'hasPin'       => !empty($user['pin'] ?? $user['transaction_pin'] ?? ''),
            'requirePinForTransactions' => !empty($user['require_pin_for_transactions']),
        ],
        'virtualAccounts' => $accounts,
        'recentTransactions' => $transactions
    ]
]);
