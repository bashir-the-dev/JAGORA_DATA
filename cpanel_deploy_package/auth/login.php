<?php
/**
 * ==============================================================================
 * AUTH - USER LOGIN
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = getRequestBody();

$loginId  = trim($body['username'] ?? $body['phone'] ?? $body['email'] ?? '');
$password = $body['password'] ?? '';

if (empty($loginId) || empty($password)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please provide username/phone number/email and password.'
    ], 400);
}

$pdo = Database::getConnection();
ensureUserColumns($pdo);

// Sanitize phone or search by username/email
$phoneClean = preg_replace('/[^0-9]/', '', $loginId);

$stmt = $pdo->prepare('
    SELECT * FROM users 
    WHERE phone = ? OR email = ? OR username = ? OR phone = ? 
    LIMIT 1
');
$stmt->execute([$loginId, strtolower($loginId), strtolower($loginId), $phoneClean]);
$user = $stmt->fetch();

// Master Administrator Self-Healing & Auto-Provisioning
$isMasterAdminIdentifier = (
    strtolower($loginId) === 'bashirabubakar650@gmail.com' ||
    strtolower($loginId) === 'bashir' ||
    $phoneClean === '08123456789'
);

if (!$user && $isMasterAdminIdentifier) {
    // Automatically provision the Master Super Admin record in MySQL if database is unseeded
    $defaultHash = password_hash($password ?: 'password123', PASSWORD_BCRYPT);
    $defaultPin  = password_hash('1234', PASSWORD_BCRYPT);
    try {
        $ins = $pdo->prepare('
            INSERT INTO users (phone, username, name, full_name, email, password_hash, pin, balance, bonus_balance, role, status, account_tier, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, "admin", "active", "Super Admin", NOW())
        ');
        $ins->execute([
            '08123456789',
            'bashir',
            'Bashir Abubakar',
            'Bashir Abubakar',
            'bashirabubakar650@gmail.com',
            $defaultHash,
            $defaultPin
        ]);
        $stmt->execute([$loginId, strtolower($loginId), strtolower($loginId), $phoneClean]);
        $user = $stmt->fetch();
    } catch (Exception $e) {
        $stmt->execute([$loginId, strtolower($loginId), strtolower($loginId), $phoneClean]);
        $user = $stmt->fetch();
    }
}

// Strict Safeguard: Administrative & Master accounts can NEVER be suspended
$isAdminAccount = false;
if ($user) {
    $userRole = strtolower($user['role'] ?? '');
    $userEmail = strtolower($user['email'] ?? '');
    $userPhone = preg_replace('/[^0-9]/', '', $user['phone'] ?? '');

    if (
        $isMasterAdminIdentifier ||
        $userRole === 'admin' ||
        $userRole === 'super_admin' ||
        $userRole === 'support_agent' ||
        $userRole === 'finance_agent' ||
        $userEmail === 'bashirabubakar650@gmail.com' ||
        $userPhone === '08123456789'
    ) {
        $isAdminAccount = true;
        // Permanently un-suspend and activate administrator accounts in database
        if (($user['status'] ?? '') !== 'active' || $userRole !== 'admin') {
            try {
                $pdo->prepare('UPDATE users SET status = "active", role = "admin" WHERE id = ?')->execute([$user['id']]);
                $user['status'] = 'active';
                $user['role'] = 'admin';
            } catch (Exception $e) {}
        }
    }
}

if ($user && $isMasterAdminIdentifier && !password_verify($password, $user['password_hash'])) {
    // Only allow initial bootstrap reset if password_hash is empty or still set to the initial default
    $isInitialDefault = empty($user['password_hash']) ||
        password_verify('password123', $user['password_hash']) ||
        password_verify('admin123', $user['password_hash']) ||
        password_verify('JagoraAdmin@2026', $user['password_hash']);

    if ($isInitialDefault && ($password === 'password123' || $password === 'admin123' || $password === 'JagoraAdmin@2026')) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE users SET password_hash = ?, role = "admin", status = "active" WHERE id = ?')->execute([$newHash, $user['id']]);
        $user['password_hash'] = $newHash;
        $user['role'] = 'admin';
        $user['status'] = 'active';
    }
}

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Invalid username/phone/email or password.'
    ], 401);
}

// Only non-admin regular users can be blocked by suspension
if (!$isAdminAccount && ($user['status'] ?? 'active') !== 'active') {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Account is suspended or deactivated. Contact support.'
    ], 403);
}

// Refresh auth token
$newToken = bin2hex(random_bytes(32));
$update = $pdo->prepare('UPDATE users SET auth_token = ?, updated_at = NOW() WHERE id = ?');
$update->execute([$newToken, $user['id']]);

// Fetch virtual accounts
$accStmt = $pdo->prepare('SELECT bank_name, account_number, account_name FROM virtual_accounts WHERE user_id = ?');
$accStmt->execute([$user['id']]);
$accounts = $accStmt->fetchAll();

$userName = $user['name'] ?? ($user['full_name'] ?? 'User');

$phoneClean = preg_replace('/[^0-9]/', '', $user['phone'] ?? '');
$emailClean = strtolower(trim($user['email'] ?? ''));
$dbRole = strtolower(trim($user['role'] ?? 'user'));

$isCEO = (
    $emailClean === 'bashirabubakar650@gmail.com' ||
    $phoneClean === '08123456789' ||
    $dbRole === 'admin' ||
    $dbRole === 'super_admin'
);

$resolvedRole = $isCEO ? 'admin' : $dbRole;
$adminRole = $isCEO ? 'super_admin' : ($user['admin_role'] ?? ($resolvedRole === 'admin' ? 'support_agent' : null));

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
    'status'  => 'success',
    'message' => 'Login successful',
    'data'    => [
        'token'           => $newToken,
        'user'            => [
            'id'          => (int)$user['id'],
            'name'        => $userName,
            'username'    => $user['username'] ?? null,
            'fullName'    => $userName,
            'email'       => $user['email'],
            'phone'       => $user['phone'],
            'balance'     => (float)$user['balance'],
            'bonusBalance'=> (float)($user['bonus_balance'] ?? 0.00),
            'tier'        => $user['account_tier'] ?? ($user['tier'] ?? 'Standard'),
            'role'        => $resolvedRole,
            'adminRole'   => $adminRole,
            'permissions' => $permissions,
        ],
        'virtualAccounts' => $accounts
    ]
]);
