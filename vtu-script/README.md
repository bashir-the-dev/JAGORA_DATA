# Standard Nigerian VTU Script (`vtu-script`)
**AJDATASUB - Production cPanel Multi-Page PHP Engine**

---

## 📁 Directory Structure Overview

```
vtu-script/
│
├── admin/                  # Admin Dashboard Panel
│   ├── index.php           # Admin login & operational overview metrics
│   ├── users.php           # Managing registered users & resellers (fund/suspend)
│   ├── transactions.php    # Monitoring success/fail logs of API calls & requery
│   └── settings.php        # API keys, profit margins, and gateway toggles
│
├── api/                    # System API Endpoints (For external developers/resellers)
│   ├── v1/
│   │   ├── user.php        # Balance check & profile query
│   │   ├── data.php        # Data bundle vending & plan list
│   │   └── airtime.php     # Airtime vending
│   └── callback.php        # Webhooks for automated payment notification (Monnify/Payvessel)
│
├── config/                 # Central Configuration
│   ├── database.php        # MySQL PDO connection & table auto-provisioning
│   └── app_config.php      # Base URLs, site names, contact info, and global constants
│
├── core/                   # The engine of the script (Business Logic)
│   ├── AirtimeHandler.php  # Logic for airtime vending, network routing & discount math
│   ├── DataHandler.php     # Logic for data bundle selection, network mapping & fulfillment
│   ├── BillHandler.php     # Logic for NEPA meter & Cable TV validation/payment
│   └── PaymentGateway.php  # Monnify, Payvessel, Paystack payment processing & webhook security
│
├── dashboard/              # User/Reseller Panel
│   ├── index.php           # User main wallet overview, recent orders, quick actions
│   ├── buy-data.php        # Data purchase form with network selection & live plan rates
│   ├── buy-airtime.php     # Airtime purchase form with real-time discount preview
│   ├── fund-wallet.php     # Automated virtual dedicated accounts & bank transfer info
│   ├── bills.php           # Electricity meter recharge & Cable TV subscriptions
│   └── transactions.php    # Transaction history with printable receipt modal
│
├── assets/                 # Static files (CSS, JS, telecom logos)
├── includes/               # Reusable UI elements (Edit once, updates everywhere)
│   ├── header.php          # Global HTML head, Tailwind styling, meta tags & navbar
│   ├── footer.php          # Global footer with Company, Phone, Location & WhatsApp
│   ├── sidebar.php         # Dashboard sidebar navigation with active route highlights
│   └── auth_guard.php      # Session verification (auto-redirect to login if unauthenticated)
│
├── .htaccess               # URL routing, security rules, and direct file protection
├── login.php               # Dedicated login page
├── register.php            # Dedicated registration page with referral tracking
├── logout.php              # Secure session termination
├── database.sql            # MySQL schema & seed plans for phpMyAdmin
└── index.php               # Homepage / Landing page with live pricing preview
```

---

## 🚀 Quick Setup Instructions in cPanel (5 Minutes)

### Step 1: Upload Files
1. Log in to your **cPanel**.
2. Open **File Manager** and enter `public_html/` (or your preferred subdomain folder).
3. Upload and extract `alaminjagora_cpanel_files.zip` (or upload the contents of `vtu-script/` directly).

### Step 2: Create MySQL Database & Import `database.sql`
1. In cPanel, go to **MySQL Databases** and create a new database (e.g. `youruser_vtu`).
2. Create a database user and assign all privileges to the database.
3. Open **phpMyAdmin**, click on your newly created database, select **Import**, and choose `database.sql`.

### Step 3: Configure Database Connection
Open `config/database.php` in cPanel File Manager and enter your database details:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_cpanel_db_user');
define('DB_PASS', 'your_cpanel_db_password');
define('DB_NAME', 'your_cpanel_db_name');
```

### Step 4: Customize Branding & Location (Single Source of Truth)
Open `config/app_config.php` to edit any company details:
```php
define('APP_NAME',          "AJDATASUB");
define('SUPPORT_PHONE',     "+2347048609646");
define('SUPPORT_EMAIL',     "support@ajdatasub.com.ng");
define('OFFICE_ADDRESS',    "Katsina, Nigeria"); // 👈 Change to Katsina or Kano anytime!
define('WHATSAPP_NUMBER',   "2347048609646");
```
*Saving this file immediately updates the homepage, footers, customer dashboard, and receipts across the entire platform.*

### Step 5: Test & Access
- **Public Homepage:** `https://yourdomain.com/index.php`
- **Customer Login:** `https://yourdomain.com/login.php`
- **Customer Dashboard:** `https://yourdomain.com/dashboard/index.php`
- **Admin Panel:** `https://yourdomain.com/admin/index.php`
