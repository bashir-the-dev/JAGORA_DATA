<?php
/**
 * ============================================================================
 * VTU SCRIPT - GLOBAL HTML HEADER & TOPBAR
 * ============================================================================
 * Reusable header for all pages.
 */

if (!defined('APP_NAME')) {
    require_once __DIR__ . '/../config/app_config.php';
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$isLoggedIn = !empty($_SESSION['user_id']);
$userName   = $_SESSION['user_name'] ?? 'Account';
$pageTitle  = isset($pageTitle) ? $pageTitle . " | " . APP_NAME : APP_NAME . " - " . APP_TAGLINE;
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#071838] text-slate-100 antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <meta name="description" content="<?= htmlspecialchars(APP_DESCRIPTION) ?>">
    <!-- Tailwind CSS (Zero Build Steps / Works on any cPanel Server) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            navy: '#071838',
                            dark: '#0a192f',
                            card: '#0e2348',
                            blue: '#0052cc',
                            gold: '#F5B014',
                            emerald: '#10b981'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        /* Mobile ergonomics: touch targets minimum 44px */
        button, a, select, input {
            min-height: 44px;
        }
        body {
            overflow-x: hidden;
            -webkit-tap-highlight-color: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>
<body class="min-h-full flex flex-col bg-[#071838] text-slate-200">

<!-- Top Navigation Bar -->
<header class="sticky top-0 z-50 bg-[#071838]/95 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <!-- Brand Logo / Name -->
            <a href="<?= BASE_URL ?>/index.php" class="flex items-center gap-2.5 focus:outline-none">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
                    AJ
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-white text-base tracking-tight leading-tight"><?= htmlspecialchars(APP_NAME) ?></span>
                    <span class="text-[10px] text-amber-400 font-medium tracking-wide uppercase">VTU & Data Portal</span>
                </div>
            </a>

            <!-- Public Desktop Links -->
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="<?= BASE_URL ?>/index.php" class="text-slate-300 hover:text-white transition">Home</a>
                <a href="<?= BASE_URL ?>/index.php#pricing" class="text-slate-300 hover:text-white transition">Live Pricing</a>
                <a href="<?= BASE_URL ?>/dashboard/buy-data.php" class="text-slate-300 hover:text-white transition">Buy Data</a>
                <a href="<?= BASE_URL ?>/dashboard/buy-airtime.php" class="text-slate-300 hover:text-white transition">Buy Airtime</a>
                <a href="https://wa.me/<?= WHATSAPP_NUMBER ?>?text=<?= urlencode(WHATSAPP_MESSAGE) ?>" target="_blank" class="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Support
                </a>
            </nav>

            <!-- Auth Buttons / User Profile -->
            <div class="flex items-center gap-3">
                <?php if ($isLoggedIn): ?>
                    <a href="<?= BASE_URL ?>/dashboard/index.php" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition">
                        <span>Dashboard</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
                <?php else: ?>
                    <a href="<?= BASE_URL ?>/login.php" class="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition">
                        Sign In
                    </a>
                    <a href="<?= BASE_URL ?>/register.php" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition">
                        Create Account
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</header>
<main class="flex-1">
