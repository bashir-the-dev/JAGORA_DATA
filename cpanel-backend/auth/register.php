<?php
/**
 * ==============================================================================
 * AUTH - USER REGISTRATION
 * ==============================================================================
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$body = getRequestBody();

$fullName = trim($body['name'] ?? $body['full_name'] ?? '');
$rawUsername = trim($body['username'] ?? '');
$username = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $rawUsername));
$email    = strtolower(trim($body['email'] ?? ''));
$phone    = preg_replace('/[^0-9]/', '', $body['phone'] ?? '');
$password = $body['password'] ?? '';
$pin      = $body['pin'] ?? DEFAULT_TRANSACTION_PIN;

if (empty($fullName) || empty($email) || empty($phone) || empty($password)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please provide Full Name, Email, Phone Number, and Password.'
    ], 400);
}

if (!empty($rawUsername) && (strlen($username) < 3)) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Username must be at least 3 characters (letters, numbers, and underscores only).'
    ], 400);
}

if (strlen($phone) < 10) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Please provide a valid 11-digit Nigerian phone number.'
    ], 400);
}

try {
    $pdo = Database::getConnection();
    ensureUserColumns($pdo);

    // Check if email, phone or username exists
    if (!empty($username)) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR phone = ? OR username = ? LIMIT 1');
        $stmt->execute([$email, $phone, $username]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1');
        $stmt->execute([$email, $phone]);
    }
    if ($stmt->fetch()) {
        jsonResponse([
            'status'  => 'error',
            'message' => 'An account with this phone number, email, or username already exists. Please log in.'
        ], 409);
    }

    // Generate token, hashes & referral codes
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $pinHash      = password_hash($pin, PASSWORD_BCRYPT);
    $authToken    = bin2hex(random_bytes(32));
    $rawReferralCode = trim($body['referral_code'] ?? $body['ref'] ?? '');
    $myReferralCode = !empty($username) && strlen($username) <= 8
        ? strtoupper($username)
        : 'AJD' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

    // Read referral program settings (honoring hideFromUsers & enabled switches)
    $rSettings = [];
    try {
        $sRow = $pdo->query("SELECT value_json FROM settings WHERE key_name = 'referral_settings' LIMIT 1")->fetch();
        if ($sRow && !empty($sRow['value_json'])) {
            $rSettings = json_decode($sRow['value_json'], true) ?: [];
        }
    } catch (\Throwable $t) {}

    $isReferralProgramActive = (!isset($rSettings['enabled']) || !empty($rSettings['enabled'])) && empty($rSettings['hideFromUsers']);

    $referredBy = null;
    $referrerRow = null;
    if ($isReferralProgramActive && !empty($rawReferralCode)) {
        try {
            $refStmt = $pdo->prepare('SELECT id, name, email, phone, referral_code, username FROM users WHERE referral_code = ? OR phone = ? OR username = ? LIMIT 1');
            $refStmt->execute([$rawReferralCode, $rawReferralCode, $rawReferralCode]);
            $refRow = $refStmt->fetch();
            if ($refRow && $refRow['phone'] !== $phone) {
                $referredBy = $refRow['referral_code'] ?: $refRow['phone'];
                $referrerRow = $refRow;
            }
        } catch (\Throwable $t) {}
    }

    // Check if welcome bonus is enabled
    $initialBonusBalance = 0.00;
    if ($isReferralProgramActive && !empty($rSettings['welcomeBonusEnabled']) && !empty($rSettings['welcomeBonusAmount'])) {
        $initialBonusBalance = (float)$rSettings['welcomeBonusAmount'];
    }

    $insert = $pdo->prepare('
        INSERT INTO users (name, full_name, username, email, phone, password_hash, pin, transaction_pin, balance, bonus_balance, auth_token, referral_code, referred_by, referral_rewarded, status, account_tier, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, 0, "active", "Standard", NOW())
    ');
    $insert->execute([
        $fullName,
        $fullName,
        !empty($username) ? $username : null,
        $email,
        $phone,
        $passwordHash,
        $pinHash,
        $pinHash,
        $initialBonusBalance,
        $authToken,
        $myReferralCode,
        $referredBy
    ]);
    $userId = (int)$pdo->lastInsertId();

    // Notify referrer immediately so they are never left idle
    if ($referrerRow) {
        try {
            $refUserId = (int)$referrerRow['id'];
            $refUserPhone = $referrerRow['phone'];
            $refUserName = $referrerRow['name'] ?: 'Partner';
            $notifTitle = '🎉 New Referral Joined!';
            $notifMsg = "Great news! Your friend {$fullName} just registered using your referral code ({$rawReferralCode}). You will earn your cash bonus once they complete their first transaction.";
            $insNotif = $pdo->prepare("
                INSERT INTO notifications (user_id, user_phone, title, message, type, accent_color, read_users, created_by, created_at)
                VALUES (?, ?, ?, ?, 'referral', '#059669', '[]', 'system', NOW())
            ");
            $insNotif->execute([$refUserId, $refUserPhone, $notifTitle, $notifMsg]);
        } catch (\Throwable $notifErr) {
            error_log('Referrer sign up notification notice: ' . $notifErr->getMessage());
        }
    }

    // Safely generate or fetch virtual accounts
    $accounts = [];
    try {
        if (!defined('PAYMENT_GATEWAY') || strtoupper(PAYMENT_GATEWAY) === 'XIXAPAY') {
            requestXixapayVirtualAccount($userId, $fullName, $email, $phone, $pdo);
        } else if (strtoupper(PAYMENT_GATEWAY) === 'MONNIFY') {
            requestMonnifyVirtualAccount($userId, $fullName, $email, $phone, $pdo);
        } else {
            requestPayvesselVirtualAccount($userId, $fullName, $email, $phone, $pdo);
        }

        $accStmt = $pdo->prepare('SELECT bank_name, account_number, account_name FROM virtual_accounts WHERE user_id = ?');
        $accStmt->execute([$userId]);
        $accounts = $accStmt->fetchAll() ?: [];
    } catch (\Throwable $vaErr) {
        error_log('Virtual account creation notice: ' . $vaErr->getMessage());
    }

    // Fallback: Generate dedicated multi-bank accounts if table is not used
    if (empty($accounts) && function_exists('generateMultiBankVirtualAccounts')) {
        $accounts = generateMultiBankVirtualAccounts($fullName, $phone, $email);
        try {
            $upUser = $pdo->prepare('UPDATE users SET virtual_accounts = ? WHERE id = ?');
            $upUser->execute([json_encode($accounts), $userId]);
        } catch (\Throwable $t) {}
    }

    // Dispatch Automated Welcome Email to new customer (never blocks registration)
    try {
        $accountsHtml = '';
        if (!empty($accounts)) {
            $accountsHtml .= '<div style="margin:20px 0;background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:16px;">';
            $accountsHtml .= '<div style="font-size:12px;font-weight:700;color:#60a5fa;text-transform:uppercase;margin-bottom:8px;">Your Automated Wallet Funding Accounts:</div>';
            foreach ($accounts as $acc) {
                $accountsHtml .= '<div style="padding:6px 0;border-bottom:1px solid #1e293b;font-size:13px;color:#cbd5e1;">';
                $accountsHtml .= htmlspecialchars($acc['bank_name']) . ': <strong style="color:#34d399;font-family:monospace;font-size:14px;letter-spacing:1px;">' . htmlspecialchars($acc['account_number']) . '</strong>';
                $accountsHtml .= '</div>';
            }
            $accountsHtml .= '<div style="font-size:11px;color:#64748b;margin-top:8px;">Transfer funds from any Nigerian bank app to instantly fund your wallet 24/7.</div>';
            $accountsHtml .= '</div>';
        }

        $welcomeBody = '
            <p>Welcome to <strong>' . htmlspecialchars(APP_NAME) . '</strong>! Your account has been activated and is ready for automated VTU purchases (MTN, Airtel, Glo, 9mobile data & airtime, bill payments, and exam pins).</p>
            <p><strong>Your Account Overview:</strong></p>
            <ul style="padding-left:20px;margin:10px 0;color:#cbd5e1;">
                <li><strong>Full Name:</strong> ' . htmlspecialchars($fullName) . '</li>
                <li><strong>Registered Phone:</strong> ' . htmlspecialchars($phone) . '</li>
                <li><strong>Registered Email:</strong> ' . htmlspecialchars($email) . '</li>
            </ul>
            ' . $accountsHtml . '
            <p style="margin-top:16px;color:#cbd5e1;"><strong>Security Reminder:</strong> Keep your login password and 4-digit Transaction PIN strictly secret. Never share them with anyone, including staff members.</p>
        ';

        sendAppNotificationEmail(
            $email,
            "Welcome to " . APP_NAME . " - Account Activated",
            "Welcome aboard, " . $fullName . "!",
            $welcomeBody,
            "Login to Your Dashboard",
            "https://" . (defined('APP_DOMAIN') ? APP_DOMAIN : "ajdatasub.com.ng") . "/login"
        );
    } catch (\Throwable $mailErr) {
        error_log("Welcome email delivery notice: " . $mailErr->getMessage());
    }

    jsonResponse([
        'status'  => 'success',
        'message' => 'Account created successfully! Welcome to ' . APP_NAME,
        'data'    => [
            'token'           => $authToken,
            'user'            => [
                'id'          => $userId,
                'name'        => $fullName,
                'username'    => !empty($username) ? $username : null,
                'email'       => $email,
                'phone'       => $phone,
                'balance'     => 0.00,
                'bonusBalance'=> 0.00,
                'referralCode'=> $myReferralCode,
                'referredBy'  => $referredBy,
                'role'        => 'user',
            ],
            'virtualAccounts' => $accounts
        ]
    ], 201);
} catch (PDOException $e) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Database error: ' . $e->getMessage(),
        'hint'    => 'Make sure database.sql was imported into your MySQL database in phpMyAdmin.'
    ], 500);
} catch (Exception $e) {
    jsonResponse([
        'status'  => 'error',
        'message' => 'Failed to register account: ' . $e->getMessage()
    ], 500);
}
