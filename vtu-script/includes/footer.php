<?php
/**
 * ============================================================================
 * VTU SCRIPT - GLOBAL FOOTER
 * ============================================================================
 * Centralized footer referencing config/app_config.php
 */
?>
</main>

<footer class="bg-[#050f24] border-t border-slate-800 text-slate-400 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Brand Info -->
            <div class="md:col-span-1 space-y-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        AJ
                    </div>
                    <span class="font-bold text-white text-base"><?= htmlspecialchars(APP_NAME) ?></span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                    <?= htmlspecialchars(APP_TAGLINE) ?>
                </p>
                <div class="pt-2">
                    <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode(WHATSAPP_MESSAGE) ?>" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Chat with Live Agent
                    </a>
                </div>
            </div>

            <!-- Quick Services -->
            <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-4">VTU Services</h4>
                <ul class="space-y-2 text-xs">
                    <li><a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="hover:text-white transition">MTN SME & CG Data</a></li>
                    <li><a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="hover:text-white transition">Airtel Corporate Data</a></li>
                    <li><a href="<?= BASE_URL ?>/dashboard/buy-airtime.php" class="hover:text-white transition">Discounted Airtime Top-Up</a></li>
                    <li><a href="<?= BASE_URL ?>/dashboard/bills.php" class="hover:text-white transition">Electricity Meter Recharge</a></li>
                    <li><a href="<?= BASE_URL ?>/dashboard/bills.php" class="hover:text-white transition">Cable TV (DSTV, GOTV)</a></li>
                </ul>
            </div>

            <!-- Portal Links -->
            <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-4">Account & Portal</h4>
                <ul class="space-y-2 text-xs">
                    <li><a href="<?= BASE_URL ?>/login.php" class="hover:text-white transition">Customer Login</a></li>
                    <li><a href="<?= BASE_URL ?>/register.php" class="hover:text-white transition">Register Account</a></li>
                    <li><a href="<?= BASE_URL ?>/dashboard/fund-wallet.php" class="hover:text-white transition">Automated Wallet Funding</a></li>
                    <li><a href="<?= BASE_URL ?>/admin/index.php" class="hover:text-white transition">Admin Portal</a></li>
                </ul>
            </div>

            <!-- Company & Contact Details (Easily editable in config/app_config.php) -->
            <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
                <ul class="space-y-2.5 text-xs">
                    <li class="flex items-center gap-2">
                        <span class="text-amber-400">📞</span>
                        <span>Phone: <a href="tel:<?= htmlspecialchars(SUPPORT_PHONE) ?>" class="text-slate-300 hover:text-white"><?= htmlspecialchars(SUPPORT_PHONE) ?></a></span>
                    </li>
                    <li class="flex items-center gap-2">
                        <span class="text-amber-400">✉️</span>
                        <span>Email: <a href="mailto:<?= htmlspecialchars(SUPPORT_EMAIL) ?>" class="text-slate-300 hover:text-white"><?= htmlspecialchars(SUPPORT_EMAIL) ?></a></span>
                    </li>
                    <li class="flex items-center gap-2">
                        <span class="text-amber-400">📍</span>
                        <span>Location: <strong class="text-slate-200"><?= htmlspecialchars(OFFICE_ADDRESS) ?></strong></span>
                    </li>
                    <li class="flex items-center gap-2 pt-1">
                        <span class="text-emerald-400">💬</span>
                        <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode(WHATSAPP_MESSAGE) ?>" target="_blank" class="text-emerald-400 hover:underline font-medium">
                            Chat with Live Agent
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>&copy; <?= date('Y') ?> <?= htmlspecialchars(APP_NAME) ?>. All rights reserved.</p>
            <p class="font-mono text-[10px]">
                cPanel Ready &bull; Native Multi-Page PHP &bull; 
                <span class="text-slate-400">Edit in <code>config/app_config.php</code></span>
            </p>
        </div>
    </div>
</footer>

</body>
</html>
