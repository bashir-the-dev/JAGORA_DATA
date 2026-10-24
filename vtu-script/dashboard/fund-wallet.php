<?php
/**
 * ============================================================================
 * VTU SCRIPT - FUND WALLET (dashboard/fund-wallet.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';
require_once __DIR__ . '/../core/PaymentGateway.php';

$pageTitle = "Fund Your Wallet";
$gateway = new PaymentGateway($pdo);
$virtualAccounts = $gateway->getUserVirtualAccounts($currentUser['id']);

require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
    <?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-black text-white">Fund Your Account</h1>
                <p class="text-xs text-slate-400 mt-1">Instant automated crediting via dedicated virtual bank accounts</p>
            </div>
            <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase">Current Balance</span>
                <div class="text-lg font-black text-emerald-400">
                    <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'], 2) ?>
                </div>
            </div>
        </div>

        <!-- Method 1: Dedicated Virtual Bank Accounts -->
        <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-blue-500/30 shadow-xl space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h2 class="text-base font-bold text-white uppercase tracking-wider">Method 1: Instant Bank Transfer (Automated)</h2>
                </div>
                <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Zero Delay (3-10 secs)
                </span>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
                Open any Nigerian bank app (OPay, PalmPay, GTBank, Zenith, Access, Kuda, Moniepoint) and transfer any amount directly to your dedicated virtual account numbers below. Your wallet balance will increase automatically.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <?php foreach ($virtualAccounts as $acc): ?>
                    <div class="p-5 rounded-2xl bg-[#071838] border border-slate-700 space-y-3 relative overflow-hidden">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-black text-blue-400 uppercase"><?= htmlspecialchars($acc['bank_name']) ?></span>
                            <span class="text-[10px] text-slate-400">Virtual Dedicated</span>
                        </div>

                        <div>
                            <span class="text-[10px] text-slate-400 uppercase block">Account Number</span>
                            <div class="text-2xl font-black text-white tracking-widest mt-0.5 font-mono">
                                <?= htmlspecialchars($acc['account_number']) ?>
                            </div>
                        </div>

                        <div>
                            <span class="text-[10px] text-slate-400 uppercase block">Account Name</span>
                            <div class="text-xs font-bold text-slate-200">
                                <?= htmlspecialchars($acc['account_name']) ?>
                            </div>
                        </div>

                        <button onclick="copyToClipboard('<?= htmlspecialchars($acc['account_number']) ?>')" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
                            <span>📋</span>
                            <span>Copy Account Number</span>
                        </button>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                <span class="font-bold">⚠️ Note on Automated Funding:</span>
                <p class="text-[11px] text-amber-200/90 leading-relaxed">
                    Standard gateway processing fee (₦15 to ₦50) may apply depending on the payment aggregator. Ensure your account name matches the details provided upon registration.
                </p>
            </div>
        </div>

        <!-- Method 2: Manual Transfer & WhatsApp Proof -->
        <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-4">
            <h2 class="text-base font-bold text-white uppercase tracking-wider">Method 2: Manual Admin Transfer</h2>
            <p class="text-xs text-slate-300 leading-relaxed">
                If you prefer manual bank transfer or are transferring over ₦100,000, transfer to our corporate account and send your payment proof directly to our live support agent in <?= htmlspecialchars(OFFICE_ADDRESS) ?>.
            </p>

            <div class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                    <span class="text-[10px] text-slate-400 block uppercase">Bank Name</span>
                    <span class="font-bold text-white">OPay Microfinance Bank</span>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block uppercase">Account Number</span>
                    <span class="font-bold text-white tracking-widest font-mono"><?= htmlspecialchars(WHATSAPP_NUMBER) ?></span>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block uppercase">Account Name</span>
                    <span class="font-bold text-white"><?= htmlspecialchars(APP_NAME) ?></span>
                </div>
            </div>

            <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode("Hello, I sent a manual wallet funding transfer for user " . $currentUser['phone']) ?>" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition">
                <span>💬</span>
                <span>Send Payment Receipt on WhatsApp</span>
            </a>
        </div>
    </div>
</div>

<script>
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Account number ' + text + ' copied to clipboard!');
    }, function() {
        prompt('Copy account number:', text);
    });
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
