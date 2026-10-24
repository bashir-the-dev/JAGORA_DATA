<?php
/**
 * ============================================================================
 * VTU SCRIPT - BUY DATA BUNDLES (dashboard/buy-data.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';
require_once __DIR__ . '/../core/DataHandler.php';

$pageTitle = "Buy Mobile Data Bundles";
$dataHandler = new DataHandler($pdo);

$selectedNetwork = strtoupper($_GET['network'] ?? 'MTN');
$selectedPlanId  = (int)($_GET['plan_id'] ?? 0);
$allPlans = $dataHandler->getActivePlans();

$successResult = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $planId    = (int)($_POST['plan_id'] ?? 0);
    $phone     = trim($_POST['phone'] ?? '');
    $pin       = trim($_POST['pin'] ?? '');

    $result = $dataHandler->purchaseData($currentUser['id'], $planId, $phone, $pin);
    if ($result['status']) {
        $successResult = $result;
        // Refresh balance
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
                <h1 class="text-2xl font-black text-white">Purchase Data Bundle</h1>
                <p class="text-xs text-slate-400 mt-1">Instant delivery for MTN SME, Airtel Corporate, Glo & 9mobile</p>
            </div>
            <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase">Wallet Balance</span>
                <div class="text-lg font-black text-emerald-400">
                    <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'], 2) ?>
                </div>
            </div>
        </div>

        <?php if ($successResult): ?>
            <!-- Receipt Modal -->
            <div class="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xl">
                        ✓
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white">Data Vending Successful!</h2>
                        <p class="text-xs text-emerald-400">Order Reference: <?= htmlspecialchars($successResult['reference']) ?></p>
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071838]/80 p-4 rounded-2xl border border-emerald-500/20 text-xs">
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Network</span>
                        <span class="font-bold text-white"><?= htmlspecialchars($successResult['network']) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Bundle Size</span>
                        <span class="font-bold text-white"><?= htmlspecialchars($successResult['bundle']) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Recipient</span>
                        <span class="font-bold text-white"><?= htmlspecialchars($successResult['recipient']) ?></span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block uppercase">Amount Paid</span>
                        <span class="font-black text-emerald-400"><?= CURRENCY_SYMBOL ?><?= number_format($successResult['amount'], 2) ?></span>
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
                        Vend Another Bundle
                    </a>
                    <a href="<?= BASE_URL ?>/dashboard/transactions.php" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition">
                        View Receipt
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
            <form action="<?= BASE_URL ?>/dashboard/buy-data.php" method="POST" id="dataForm" class="space-y-6">
                <!-- Step 1: Select Network -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        1. Select Telecom Network
                    </label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <?php
                        $networks = [
                            'MTN'     => ['color' => 'peer-checked:border-amber-400 peer-checked:bg-amber-400/10 peer-checked:text-amber-300', 'badge' => 'SME / CG'],
                            'AIRTEL'  => ['color' => 'peer-checked:border-rose-400 peer-checked:bg-rose-400/10 peer-checked:text-rose-300', 'badge' => 'Corporate'],
                            'GLO'     => ['color' => 'peer-checked:border-emerald-400 peer-checked:bg-emerald-400/10 peer-checked:text-emerald-300', 'badge' => 'Corporate'],
                            '9MOBILE' => ['color' => 'peer-checked:border-lime-400 peer-checked:bg-lime-400/10 peer-checked:text-lime-300', 'badge' => 'Gifting'],
                        ];
                        foreach ($networks as $net => $meta):
                            $checked = ($selectedNetwork === $net) ? 'checked' : '';
                        ?>
                            <label class="relative cursor-pointer">
                                <input type="radio" name="network_radio" value="<?= $net ?>" <?= $checked ?> onchange="filterPlans('<?= $net ?>')" class="peer sr-only">
                                <div class="p-4 rounded-2xl bg-[#071838] border border-slate-700/80 hover:border-slate-500 transition text-center flex flex-col items-center gap-1.5 <?= $meta['color'] ?>">
                                    <span class="text-sm font-black"><?= $net ?></span>
                                    <span class="text-[10px] text-slate-400"><?= $meta['badge'] ?></span>
                                </div>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Step 2: Select Bundle -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        2. Choose Data Plan
                    </label>
                    <select name="plan_id" id="planSelect" required class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-blue-500">
                        <option value="">-- Select Data Bundle --</option>
                        <?php foreach ($allPlans as $p): 
                            $price = ($currentUser['tier'] === 'reseller' || $currentUser['tier'] === 'api') ? $p['reseller_price'] : $p['selling_price'];
                            $selected = ($selectedPlanId === (int)$p['id']) ? 'selected' : '';
                        ?>
                            <option value="<?= $p['id'] ?>" data-network="<?= $p['network'] ?>" data-price="<?= $price ?>" <?= $selected ?>>
                                [<?= $p['network'] ?>] <?= $p['bundle_size'] ?> <?= $p['plan_type'] ?> - <?= CURRENCY_SYMBOL ?><?= number_format($price, 2) ?> (<?= $p['validity'] ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- Step 3: Recipient Phone -->
                <div>
                    <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        3. Recipient Phone Number
                    </label>
                    <input 
                        type="tel" 
                        name="phone" 
                        id="phoneInput" 
                        required 
                        placeholder="08012345678" 
                        maxlength="11"
                        class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white placeholder-slate-500 font-bold text-base tracking-wider focus:outline-none focus:border-blue-500"
                    >
                    <span class="text-[11px] text-slate-400 mt-1 block">Must be an 11-digit active Nigerian line.</span>
                </div>

                <!-- Step 4: Transaction PIN -->
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

                <!-- Submit Button -->
                <button type="submit" class="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5">
                    Vend Data Bundle Now 🚀
                </button>
            </form>
        </div>
    </div>
</div>

<script>
function filterPlans(network) {
    const select = document.getElementById('planSelect');
    const options = select.querySelectorAll('option');
    let firstMatch = null;

    options.forEach(opt => {
        if (!opt.value) return; // Keep default placeholder
        const planNet = opt.getAttribute('data-network');
        if (planNet === network) {
            opt.style.display = '';
            if (!firstMatch) firstMatch = opt;
        } else {
            opt.style.display = 'none';
        }
    });

    if (firstMatch) {
        select.value = firstMatch.value;
    } else {
        select.value = "";
    }
}

// Initial filter
document.addEventListener('DOMContentLoaded', () => {
    const checkedRadio = document.querySelector('input[name="network_radio"]:checked');
    if (checkedRadio) {
        filterPlans(checkedRadio.value);
    }
});
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
