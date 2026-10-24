<?php
/**
 * ============================================================================
 * VTU SCRIPT - BUY DISCOUNTED AIRTIME (dashboard/buy-airtime.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';
require_once __DIR__ . '/../core/AirtimeHandler.php';

$pageTitle = "Buy Discounted Airtime";
$airtimeHandler = new AirtimeHandler($pdo);

$successResult = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $network   = trim($_POST['network'] ?? 'MTN');
    $amount    = (float)($_POST['amount'] ?? 0);
    $phone     = trim($_POST['phone'] ?? '');
    $pin       = trim($_POST['pin'] ?? '');

    $result = $airtimeHandler->purchaseAirtime($currentUser['id'], $network, $amount, $phone, $pin);
    if ($result['status']) {
        $successResult = $result;
        $currentUser['balance'] = $result['balance'];
        $_SESSION['user_balance'] = $result['balance'];
    } else {
        $error = $result['message'];
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
    <?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-black text-white">Purchase Discounted Airtime</h1>
                <p class="text-xs text-slate-400 mt-1">Instant VTU top-up with up to 4.5% instant cashback</p>
            </div>
            <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase">Wallet Balance</span>
                <div class="text-lg font-black text-emerald-400">
                    <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'], 2) ?>
                </div>
            </div>
        </div>

        <?php if ($successResult): ?>
            <div class="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xl">
                        ✓
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white">Airtime Vended Successfully!</h2>
                        <p class="text-xs text-emerald-400">Reference: <?= htmlspecialchars($successResult['reference']) ?></p>
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071838]/80 p-4 rounded-2xl border border-emerald-500/20 text-xs">
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Network</span>
                        <span class="font-bold text-white"><?= htmlspecialchars($successResult['network']) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Airtime Face Value</span>
                        <span class="font-bold text-white"><?= CURRENCY_SYMBOL ?><?= number_format($successResult['amount'], 2) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Amount Debited</span>
                        <span class="font-black text-emerald-400"><?= CURRENCY_SYMBOL ?><?= number_format($successResult['paid'], 2) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">You Saved</span>
                        <span class="font-bold text-amber-400"><?= CURRENCY_SYMBOL ?><?= number_format($successResult['discount'], 2) ?></span>
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <a href="<?= BASE_URL ?>/dashboard/buy-airtime.php" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
                        Recharge Another Line
                    </a>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-6">
            <form action="<?= BASE_URL ?>/dashboard/buy-airtime.php" method="POST" class="space-y-6">
                <!-- Network Choice -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        1. Select Network (With Active Discounts)
                    </label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <?php
                        $discounts = [
                            'MTN'     => 2.5,
                            'AIRTEL'  => 3.0,
                            'GLO'     => 4.0,
                            '9MOBILE' => 4.5
                        ];
                        $first = true;
                        foreach ($discounts as $net => $disc):
                            $checked = $first ? 'checked' : '';
                            $first = false;
                        ?>
                            <label class="relative cursor-pointer">
                                <input type="radio" name="network" value="<?= $net ?>" <?= $checked ?> onchange="calculatePayable()" class="peer sr-only">
                                <div class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-slate-500 transition text-center flex flex-col items-center gap-1 peer-checked:border-blue-500 peer-checked:bg-blue-600/10 peer-checked:text-blue-300">
                                    <span class="text-sm font-black"><?= $net ?></span>
                                    <span class="text-[10px] font-bold text-emerald-400"><?= $disc ?>% Discount</span>
                                </div>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Airtime Amount & Live Calculator -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        2. Airtime Face Value Amount (₦50 - ₦50,000)
                    </label>
                    <input 
                        type="number" 
                        name="amount" 
                        id="amountInput" 
                        required 
                        min="50" 
                        max="50000" 
                        step="10" 
                        placeholder="e.g. 1000"
                        oninput="calculatePayable()"
                        class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                    >
                    <div id="discountPreview" class="mt-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                        <span>You Pay: <strong id="payableText" class="text-white font-black text-sm">₦0.00</strong></span>
                        <span class="text-emerald-400 font-bold" id="savedText">Saved: ₦0.00</span>
                    </div>
                </div>

                <!-- Recipient Phone -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        3. Recipient Phone Number
                    </label>
                    <input 
                        type="tel" 
                        name="phone" 
                        required 
                        placeholder="08012345678" 
                        maxlength="11"
                        class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 font-bold text-base tracking-wider focus:outline-none focus:border-blue-500"
                    >
                </div>

                <!-- PIN -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        4. 4-Digit Transaction PIN
                    </label>
                    <input 
                        type="password" 
                        name="pin" 
                        required 
                        placeholder="••••" 
                        maxlength="4"
                        class="w-full sm:w-48 px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-black text-center tracking-widest text-lg focus:outline-none focus:border-blue-500"
                    >
                </div>

                <button type="submit" class="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5">
                    Vend Airtime Instantly 📱
                </button>
            </form>
        </div>
    </div>
</div>

<script>
const rates = {
    'MTN': 2.5,
    'AIRTEL': 3.0,
    'GLO': 4.0,
    '9MOBILE': 4.5
};

function calculatePayable() {
    const network = document.querySelector('input[name="network"]:checked')?.value || 'MTN';
    const amount = parseFloat(document.getElementById('amountInput').value) || 0;
    const rate = rates[network] || 2.5;

    const discount = (amount * rate) / 100;
    const payable = amount - discount;

    document.getElementById('payableText').innerText = '₦' + payable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('savedText').innerText = 'Saved: ₦' + discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' (' + rate + '%)';
}

document.addEventListener('DOMContentLoaded', calculatePayable);
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
