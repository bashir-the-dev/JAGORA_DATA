<?php
/**
 * ============================================================================
 * VTU SCRIPT - CUSTOMER SIGN UP (register.php)
 * ============================================================================
 */

require_once __DIR__ . '/config/app_config.php';
require_once __DIR__ . '/config/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['name'] ?? '');
    $phone    = preg_replace('/[^0-9]/', '', $_POST['phone'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $pin      = preg_replace('/[^0-9]/', '', $_POST['pin'] ?? '1234');

    if (strlen($phone) === 10) $phone = '0' . $phone;

    if (empty($name) || empty($phone) || empty($email) || empty($password)) {
        $error = "Please fill in all required fields.";
    } elseif (strlen($phone) !== 11) {
        $error = "Phone number must be exactly 11 digits (e.g. 08012345678).";
    } elseif (strlen($password) < PASSWORD_MIN_LENGTH) {
        $error = "Password must be at least " . PASSWORD_MIN_LENGTH . " characters.";
    } elseif (strlen($pin) !== PIN_LENGTH) {
        $error = "Transaction PIN must be exactly 4 digits.";
    } else {
        $pdo = get_db_connection();
        if ($pdo) {
            try {
                // Check existing phone/email
                $check = $pdo->prepare("SELECT id FROM users WHERE phone = :p OR email = :e");
                $check->execute([':p' => $phone, ':e' => $email]);
                if ($check->fetch()) {
                    $error = "A user already exists with this phone number or email.";
                } else {
                    $hash = password_hash($password, PASSWORD_BCRYPT);
                    $wemaAcc = '7' . substr($phone, -9);

                    $insert = $pdo->prepare("
                        INSERT INTO users (name, email, phone, password_hash, pin, balance, tier, virtual_bank_name, virtual_account_number, virtual_account_name)
                        VALUES (:name, :email, :phone, :hash, :pin, 0.00, 'smart', 'Wema Bank', :acc, :accname)
                    ");
                    $insert->execute([
                        ':name'    => $name,
                        ':email'   => $email,
                        ':phone'   => $phone,
                        ':hash'    => $hash,
                        ':pin'     => $pin,
                        ':acc'     => $wemaAcc,
                        ':accname' => APP_NAME . " - " . $name
                    ]);

                    $newId = $pdo->lastInsertId();

                    // Log in
                    $_SESSION['user_id']      = $newId;
                    $_SESSION['user_name']    = $name;
                    $_SESSION['user_email']   = $email;
                    $_SESSION['user_phone']   = $phone;
                    $_SESSION['user_tier']    = 'smart';
                    $_SESSION['user_balance'] = 0.00;

                    header("Location: " . BASE_URL . "/dashboard/index.php?welcome=1");
                    exit;
                }
            } catch (Exception $e) {
                error_log("Registration error: " . $e->getMessage());
                $error = "An error occurred during registration. Please try again.";
            }
        } else {
            // Local fallback
            $_SESSION['user_id']      = 2;
            $_SESSION['user_name']    = $name;
            $_SESSION['user_email']   = $email;
            $_SESSION['user_phone']   = $phone;
            $_SESSION['user_tier']    = 'smart';
            $_SESSION['user_balance'] = 0.00;

            header("Location: " . BASE_URL . "/dashboard/index.php?welcome=1");
            exit;
        }
    }
}

$pageTitle = "Create an Account";
require_once __DIR__ . '/includes/header.php';
?>

<div class="py-12 sm:py-16 flex items-center justify-center px-4">
    <div class="max-w-md w-full p-8 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-2xl space-y-6">
        <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-white">Join <?= htmlspecialchars(APP_NAME) ?></h2>
            <p class="text-xs text-slate-400">Get discounted data, airtime, and dedicated virtual accounts</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <form action="<?= BASE_URL ?>/register.php" method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                </label>
                <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="e.g. Ibrahim Abubakar"
                    value="<?= htmlspecialchars($_POST['name'] ?? '') ?>"
                    class="w-full px-4 py-3 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-medium"
                >
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Phone Number
                    </label>
                    <input 
                        type="tel" 
                        name="phone" 
                        required 
                        placeholder="08012345678"
                        maxlength="11"
                        value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>"
                        class="w-full px-4 py-3 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-medium"
                    >
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Transaction PIN (4 Digits)
                    </label>
                    <input 
                        type="password" 
                        name="pin" 
                        required 
                        placeholder="1234"
                        maxlength="4"
                        class="w-full px-4 py-3 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-medium text-center tracking-widest"
                    >
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                </label>
                <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="user@example.com"
                    value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                    class="w-full px-4 py-3 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-medium"
                >
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Create Password
                </label>
                <input 
                    type="password" 
                    name="password" 
                    required 
                    placeholder="At least 6 characters"
                    class="w-full px-4 py-3 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-medium"
                >
            </div>

            <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5">
                Register & Open Free Wallet
            </button>
        </form>

        <div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered? 
            <a href="<?= BASE_URL ?>/login.php" class="text-blue-400 font-bold hover:underline">
                Sign in here
            </a>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
