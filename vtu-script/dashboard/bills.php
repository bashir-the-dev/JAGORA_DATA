<?php
/**
 * ============================================================================
 * VTU SCRIPT - BILLS PAYMENT & CABLE TV (dashboard/bills.php)
 * ============================================================================
 */

require_once __DIR__ . '/../includes/auth_guard.php';
require_once __DIR__ . '/../core/BillHandler.php';

$pageTitle = "Pay Utility Bills & Cable TV";
$billHandler = new BillHandler($pdo);

$activeTab = $_GET['tab'] ?? 'electricity';
$discos = $billHandler->getDiscos();
$cablePackages = $billHandler->getCablePackages();

$tokenResult = null;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $service = $_POST['service'] ?? 'electricity';

    if ($service === 'electricity') {
        $disco       = trim($_POST['disco'] ?? 'KEDCO');
        $meterNumber = trim($_POST['meter_number'] ?? '');
        $meterType   = trim($_POST['meter_type'] ?? 'PREPAID');
        $amount      = (float)($_POST['amount'] ?? 0);
        $phone       = trim($_POST['phone'] ?? $currentUser['phone']);
        $pin         = trim($_POST['pin'] ?? '');

        $res = $billHandler->payElectricity($currentUser['id'], $disco, $meterNumber, $meterType, $amount, $phone, $pin);
        if ($res['status']) {
            $tokenResult = $res;
            $currentUser['balance'] = $res['balance'];
            $_SESSION['user_balance'] = $res['balance'];
        } else {
            $error = $res['message'];
        }
    }
}

require_once __DIR__ . '/../includes/header.php';
?>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
    <?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-black text-white">Utility Bills & Cable Subscriptions</h1>
                <p class="text-xs text-slate-400 mt-1">Instant NEPA electricity tokens and Cable TV activations</p>
            </div>
            <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase">Balance</span>
                <div class="text-lg font-black text-emerald-400">
                    <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'], 2) ?>
                </div>
            </div>
        </div>

        <?php if ($tokenResult): ?>
            <!-- Electricity Token Receipt -->
            <div class="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xl">
                        ⚡
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white">Electricity Token Generated!</h2>
                        <p class="text-xs text-amber-300">Reference: <?= htmlspecialchars($tokenResult['reference']) ?></p>
                    </div>
                </div>

                <div class="p-5 rounded-2xl bg-[#071838] border border-amber-500/30 text-center space-y-2">
                    <span class="text-xs text-slate-400 uppercase tracking-widest block">20-Digit Prepaid Token</span>
                    <div class="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest text-amber-300 select-all">
                        <?= htmlspecialchars($tokenResult['token']) ?>
                    </div>
                    <span class="text-xs text-slate-400 block">Meter: <?= htmlspecialchars($tokenResult['meter']) ?> &bull; Units: <?= htmlspecialchars($tokenResult['units']) ?></span>
                </div>

                <div class="flex gap-3">
                    <button onclick="copyToClipboard('<?= htmlspecialchars($tokenResult['token']) ?>')" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs transition">
                        Copy Token
                    </button>
                    <a href="<?= BASE_URL ?>/dashboard/bills.php" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition">
                        Done
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

        <!-- Service Tabs -->
        <div class="flex border-b border-slate-800 gap-4">
            <a href="?tab=electricity" class="pb-3 text-sm font-bold border-b-2 <?= $activeTab === 'electricity' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white' ?>">
                ⚡ Electricity (NEPA Meter)
            </a>
            <a href="?tab=cable" class="pb-3 text-sm font-bold border-b-2 <?= $activeTab === 'cable' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400 hover:text-white' ?>">
                📺 Cable TV (DSTV / GOTV)
            </a>
        </div>

        <?php if ($activeTab === 'electricity'): ?>
            <!-- Electricity Form -->
            <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-6">
                <form action="<?= BASE_URL ?>/dashboard/bills.php?tab=electricity" method="POST" class="space-y-5">
                    <input type="hidden" name="service" value="electricity">

                    <div>
                        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Select Electricity Company (DISCO)
                        </label>
                        <select name="disco" required class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-amber-400">
                            <?php foreach ($discos as $d): ?>
                                <option value="<?= $d['code'] ?>"><?= $d['name'] ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Meter Type
                            </label>
                            <select name="meter_type" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-medium text-sm">
                                <option value="PREPAID">Prepaid (Token Generator)</option>
                                <option value="POSTPAID">Postpaid (Bill Payment)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Meter Number
                            </label>
                            <input type="text" name="meter_number" required placeholder="e.g. 01234567890" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-bold tracking-wider">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Amount (₦500 - ₦50,000)
                            </label>
                            <input type="number" name="amount" min="500" max="50000" step="100" required placeholder="1000" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-bold">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                4-Digit Transaction PIN
                            </label>
                            <input type="password" name="pin" maxlength="4" required placeholder="••••" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-black text-center tracking-widest text-lg">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm shadow-xl shadow-amber-500/20 transition transform hover:-translate-y-0.5">
                        Generate Electricity Token ⚡
                    </button>
                </form>
            </div>
        <?php else: ?>
            <!-- Cable TV Form -->
            <div class="p-6 sm:p-8 rounded-3xl bg-[#0a192f] border border-slate-800 shadow-xl space-y-6">
                <form action="<?= BASE_URL ?>/dashboard/bills.php?tab=cable" method="POST" class="space-y-5">
                    <input type="hidden" name="service" value="cable">

                    <div>
                        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Select Cable TV Provider
                        </label>
                        <select name="cable_provider" required class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-medium text-sm">
                            <option value="GOTV">GOtv Nigeria</option>
                            <option value="DSTV">DStv Nigeria</option>
                            <option value="STARTIMES">Startimes Nigeria</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                IUC / Smartcard Number
                            </label>
                            <input type="text" name="iuc_number" required placeholder="e.g. 2012345678" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-bold tracking-wider">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                4-Digit Transaction PIN
                            </label>
                            <input type="password" name="pin" maxlength="4" required placeholder="••••" class="w-full px-4 py-3.5 rounded-xl bg-[#071838] border border-slate-700 text-white font-black text-center tracking-widest text-lg">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5">
                        Renew Cable Subscription 📺
                    </button>
                </form>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Copied: ' + text);
    }, function() {
        prompt('Copy:', text);
    });
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
