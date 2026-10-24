<?php
/**
 * ============================================================================
 * VTU SCRIPT - DASHBOARD SIDEBAR NAVIGATION
 * ============================================================================
 * Included in dashboard/ pages for smooth navigation.
 */

$currentScript = basename($_SERVER['PHP_SELF']);
?>
<aside class="w-full md:w-64 bg-[#0a192f] border-r border-slate-800 p-4 flex flex-col gap-6 shrink-0">
    <!-- User Quick Info Card -->
    <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/20 shadow-md">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-sm">
                <?= strtoupper(substr($currentUser['name'] ?? 'U', 0, 1)) ?>
            </div>
            <div class="overflow-hidden">
                <h3 class="font-bold text-white text-sm truncate"><?= htmlspecialchars($currentUser['name'] ?? 'User') ?></h3>
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <?= htmlspecialchars($currentUser['tier'] ?? 'Smart Earner') ?>
                </span>
            </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800/80">
            <span class="text-[10px] text-slate-400 block uppercase tracking-wider">Main Wallet</span>
            <div class="text-xl font-black text-emerald-400 mt-0.5">
                <?= CURRENCY_SYMBOL ?><?= number_format($currentUser['balance'] ?? 0, 2) ?>
            </div>
        </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="space-y-1">
        <?php
        $navItems = [
            ['title' => 'Overview',     'icon' => '🏠', 'file' => 'index.php',        'href' => BASE_URL . '/dashboard/index.php'],
            ['title' => 'Buy Data',     'icon' => '📶', 'file' => 'buy-data.php',     'href' => BASE_URL . '/dashboard/buy-data.php'],
            ['title' => 'Buy Airtime',  'icon' => '📱', 'file' => 'buy-airtime.php',  'href' => BASE_URL . '/dashboard/buy-airtime.php'],
            ['title' => 'Fund Wallet',  'icon' => '💳', 'file' => 'fund-wallet.php',  'href' => BASE_URL . '/dashboard/fund-wallet.php'],
            ['title' => 'Bills & Cable','icon' => '⚡', 'file' => 'bills.php',        'href' => BASE_URL . '/dashboard/bills.php'],
            ['title' => 'Transactions', 'icon' => '📜', 'file' => 'transactions.php', 'href' => BASE_URL . '/dashboard/transactions.php'],
        ];

        foreach ($navItems as $item):
            $isActive = ($currentScript === $item['file']);
            $activeClass = $isActive 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium';
        ?>
            <a href="<?= $item['href'] ?>" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition <?= $activeClass ?>">
                <span class="text-base"><?= $item['icon'] ?></span>
                <span><?= $item['title'] ?></span>
            </a>
        <?php endforeach; ?>
    </nav>

    <!-- Support Help Card -->
    <div class="mt-auto p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div class="flex items-center gap-2 text-white font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Need Quick Help?
        </div>
        <p class="text-[11px] leading-relaxed">
            Reach our customer care desk on WhatsApp for instant assistance.
        </p>
        <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode(WHATSAPP_MESSAGE) ?>" target="_blank" class="block text-center py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold text-xs transition border border-emerald-500/20">
            Chat on WhatsApp
        </a>
    </div>

    <!-- Logout Link -->
    <a href="<?= BASE_URL ?>/logout.php" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition">
        <span>🚪</span>
        <span>Sign Out</span>
    </a>
</aside>
