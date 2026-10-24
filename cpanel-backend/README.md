# AJDATASUB - Professional cPanel VTU Backend Guide

This folder (`cpanel-backend/`) contains the complete, production-ready, industry-standard backend built specifically for **cPanel hosting** (Namecheap, Whogohost, QServers, Hostinger, Truehost, etc.).

It utilizes standard **PHP 8.0+ with PDO MySQL**, prepared statements, atomic row-level locks (`SELECT ... FOR UPDATE`), and idempotent webhook handlers to guarantee:
1. Zero double-credits on bank deposits.
2. Zero double-debits on rapid user clicks.
3. Automatic instant wallet refunds if telco upstream gateways timeout or fail.

---

## 📁 File Structure Overview

```
public_html/
└── api/                       <-- Place all contents of cpanel-backend here
    ├── .htaccess              <-- Apache routing, CORS & Authorization header fix
    ├── config.php             <-- Database & API keys configuration
    ├── db.php                 <-- High-performance PDO connection
    ├── helpers.php            <-- Atomic wallet ledger & upstream cURL client
    ├── database.sql           <-- MySQL database schema (Import in phpMyAdmin)
    │
    ├── auth/
    │   ├── register.php       <-- User registration + Auto Payvessel account hook
    │   ├── login.php          <-- User login + session token
    │   └── profile.php        <-- Live balance, accounts & transaction history
    │
    ├── vtu/
    │   ├── plans.php          <-- Active data packages by network
    │   ├── buy_data.php       <-- Atomic debit + HusmoData/Alrahuz dispatcher + auto-refund
    │   ├── buy_airtime.php    <-- Airtime with network discount
    │   └── verify_biller.php  <-- Resolves NEPA meter names & Cable IUC
    │
    ├── webhook/
    │   ├── payvessel.php      <-- Automated virtual account funding listener
    │   └── monnify.php        <-- Monnify automated funding alternative
    │
    └── admin/
        ├── stats.php          <-- Today's sales volume & user counts
        ├── fund_user.php      <-- Manual credit/debit with audit trail
        ├── feedbacks.php      <-- Customer star ratings & feedback moderation
        └── settings.php       <-- Maintenance mode & broadcast notice
```

---

## 🚀 Step-by-Step cPanel Deployment

### Step 1: Create MySQL Database in cPanel
1. Log into your **cPanel**.
2. Under the **Databases** section, click **MySQL Databases** (or **MySQL Database Wizard**).
3. Create a new database: e.g. `cpaneluser_ajdatasub`.
4. Create a new user: e.g. `cpaneluser_dbuser` and choose a strong password.
5. Under **Add User To Database**, select both, click **Add**, and tick **ALL PRIVILEGES**. Click **Make Changes**.

---

### Step 2: Import `database.sql` in phpMyAdmin
1. In cPanel, open **phpMyAdmin**.
2. Click your newly created database on the left sidebar.
3. Click the **Import** tab at the top.
4. Choose the `database.sql` file provided in this folder.
5. Scroll to the bottom and click **Import** (or **Go**).
   - This creates the 6 core tables: `users`, `virtual_accounts`, `transactions`, `vtu_plans`, `webhook_logs`, and `system_settings` with initial data plans and an admin account.

---

### Step 3: Upload Backend Files to cPanel
1. In cPanel, open **File Manager**.
2. Navigate to `public_html/`.
3. Create a folder named `api` (so your backend URLs will be `https://yourdomain.com/api/...`).
4. Upload all files from `cpanel-backend/` into `public_html/api/`.

---

### Step 4: Configure `config.php`
Open `public_html/api/config.php` in the cPanel code editor and fill in:

```php
// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_ajdatasub');
define('DB_USER', 'cpaneluser_dbuser');
define('DB_PASS', 'YourStrongPassword123#');

// Upstream VTU Gateway (HusmoData / Alrahuz / ClubKonnect)
define('VTU_PROVIDER_NAME', 'HUSMODATA');
define('VTU_API_TOKEN', 'YOUR_WHOLESALE_API_TOKEN_HERE');
define('VTU_BASE_URL', 'https://husmodata.com/api');

// Automated Virtual Account Funding (XIXAPAY - PRIMARY GATEWAY)
define('XIXAPAY_API_KEY', 'xixa_live_xxxxxxxx');
define('XIXAPAY_SECRET_KEY', 'xixa_sec_xxxxxxxx');
define('XIXAPAY_BUSINESS_ID', 'xixa_biz_xxxxxxxx');
// Partner Bank Codes: 20867 = PalmPay, 20987 = Kolomoni MFB, 29007 = Safehaven MFB
define('XIXAPAY_BANK_CODES', ['20867', '20987', '29007']);

// Optional Secondary/Backup Gateways (Payvessel, Monnify)
define('PAYMENT_GATEWAY', 'XIXAPAY'); // 'XIXAPAY' (Default), 'PAYVESSEL', or 'MONNIFY'
define('PAYVESSEL_API_KEY', 'pv_live_xxxxxxxx');
define('PAYVESSEL_SECRET_KEY', 'pv_sec_xxxxxxxx');
define('PAYVESSEL_BUSINESS_ID', 'pv_biz_xxxxxxxx');
```

---

### Step 5: Configure XIXAPAY Webhook
1. Log into your merchant dashboard at [xixapay.com](https://xixapay.com).
2. Navigate to **Settings** -> **Developer / Webhooks**.
3. Set your Webhook URL to:
   ```
   https://yourdomain.com/api/webhook/xixapay.php
   ```
   *(Or if using direct API route: `https://yourdomain.com/api/webhooks/xixapay`)*
4. Ensure your **XIXAPAY Secret Key** matches `XIXAPAY_SECRET_KEY` in `config.php`.
5. Save changes. When any customer makes a bank transfer to their PalmPay, Kolomoni, or Safehaven dedicated account, XIXAPAY sends a real-time notification with HMAC-SHA256 signature verification to this webhook, and their wallet balance is instantly credited 24/7 without manual intervention.

---

### Step 6: Testing with cURL / Postman

#### 1. Register a Test User:
```bash
curl -X POST https://yourdomain.com/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bashir Abubakar",
    "email": "bashir@example.com",
    "phone": "08123456789",
    "password": "Password123#",
    "pin": "1234"
  }'
```

#### 2. Buy Data:
```bash
curl -X POST https://yourdomain.com/api/vtu/buy_data.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "network": "mtn",
    "plan_id": "8",
    "plan_name": "1.0GB SME",
    "phone": "08123456789",
    "amount": 260,
    "pin": "1234"
  }'
```

---

## 🔒 Security & Reliability Built-In
- **FastCGI Authorization Fix:** The `.htaccess` file prevents Apache FastCGI from stripping `Authorization: Bearer` headers.
- **Race Condition Protection:** All balance changes use database transactions with `FOR UPDATE` row locks.
- **Idempotent Webhooks:** Webhook reference hashing prevents double-crediting even if the payment gateway retries.
- **Auto-Refund Fallback:** If upstream wholesale API fails, users never lose money; the system credits the wallet instantly.
