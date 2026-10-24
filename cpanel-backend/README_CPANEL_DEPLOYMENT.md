# 🚀 Deploying AJDATASUB to QServers cPanel (PHP + MySQL)

This step-by-step guide walks you through deploying your VTU Web App onto your **QServers cPanel** hosting plan.

---

## 📁 What We Built For You

Your codebase now includes the complete PHP & MySQL backend inside the `cpanel-backend/` folder:

| File | Purpose |
| :--- | :--- |
| `database.sql` | Complete MySQL schema with tables for users, transactions, data plans, and settings. |
| `config.php` | Database connection (PDO) and wholesale API gateway credentials (ClubKonnect, PayVessel). |
| `cache.php` | High-performance multi-driver caching (APCu + Atomic File POSIX) and HTTP 304 ETag optimizer. |
| `helpers.php` | Security sanitization, atomic balance locking, and upstream telecom dispatchers. |
| `api/index.php` | The master REST API router that handles all requests from your React frontend. |
| `.htaccess` | Apache configuration that routes `/api/*` to PHP and handles React page refreshes. |

---

## Step 1: Create your MySQL Database in cPanel

1. Log into your **QServers cPanel**.
2. Under the **Databases** section, click **MySQL® Databases**.
3. **Create New Database:**
   * Enter a name like `vtu` (e.g. `youruser_vtu`).
   * Click **Create Database**.
4. **Create New User:**
   * Scroll down to **Add New User**.
   * Username: `vtuuser` (e.g. `youruser_vtuuser`).
   * Generate a strong Password and copy it down safely.
   * Click **Create User**.
5. **Link User to Database:**
   * Scroll down to **Add User To Database**.
   * Select your user and your database.
   * Click **Add**.
   * Check the box for **ALL PRIVILEGES**, then click **Make Changes**.

---

## Step 2: Import the Database Schema

1. Go back to cPanel home, and click **phpMyAdmin**.
2. In the left sidebar, click on the database you just created (e.g. `youruser_vtu`).
3. Click the **Import** tab at the top.
4. Click **Choose File** and select `cpanel-backend/database.sql`.
5. Scroll to the bottom and click **Import** (or **Go**).
6. *All tables (`users`, `transactions`, `data_plans`, `settings`, `feedbacks`) and default plans will be created instantly!*

---

## Step 3: Configure `config.php`

Open `cpanel-backend/config.php` in a code or text editor:
1. Update lines 16–19 with your database details:
   ```php
   define('DB_NAME', 'youruser_vtu');
   define('DB_USER', 'youruser_vtuuser');
   define('DB_PASS', 'your_copied_password');
   ```
2. *(Optional)* If you already have your wholesale telecom credentials, add them to `CLUBKONNECT_USER_ID`, `CLUBKONNECT_API_KEY`, `PAYVESSEL_API_KEY`, etc. If you leave them as defaults, the app runs in safe simulation mode for testing.

---

## Step 4: Build the React Frontend

On your computer terminal:
```bash
npm run build
```
This produces a `dist/` folder containing the compiled `index.html`, JavaScript, and CSS.

---

## Step 5: Upload Files to cPanel `public_html`

You can deploy using either of these two easy methods:

### Method A (Fastest - 1-Click ZIP Upload):
1. Download **`ajdatasub_cpanel_files.zip`** (or `alaminjagora_cpanel_files.zip`) from the project root.
2. In cPanel ➔ **File Manager**, enter **`public_html`**.
3. Click **Upload** and upload `ajdatasub_cpanel_files.zip` (or `alaminjagora_cpanel_files.zip`).
4. Right-click the uploaded zip file and click **Extract**.
5. *(Optional)* Delete the zip file after extraction. Done!

### Method B (Manual Folder Upload):
Upload all contents of the `cpanel_deploy_package/` folder into `public_html/` so that your directory looks like:
```
public_html/
├── api/                 <-- master API router
│   └── index.php
├── admin/               <-- admin controllers
├── auth/                <-- auth controllers
├── vtu/                 <-- VTU billing controllers
├── webhook/             <-- payment gateway webhooks
├── assets/              <-- compiled React JS & CSS bundles
│   ├── index-*.js
│   └── index-*.css
├── telecom/             <-- carrier logos (MTN, Airtel, Glo, 9mobile, etc.)
├── storage/             <-- cache folder
├── .htaccess            <-- Apache routing, DirectoryIndex & Cache-Control
├── config.php           <-- Database & gateway credentials
├── db.php               <-- PDO connection
├── cache.php            <-- high-performance cache
├── helpers.php          <-- utility functions & row locking
├── index.html           <-- latest compiled React entry point
└── logo.png / logo.svg  <-- branding assets
```

> **Important Note on Browser Cache:**
> When you update your files in cPanel, always perform a **Hard Refresh** in your browser (`Ctrl + F5` or `Ctrl + Shift + R` on Windows, `Cmd + Shift + R` on Mac, or clear cache in mobile Safari/Chrome) to force your browser to fetch the latest application bundle. Our `.htaccess` now also sets `Cache-Control: no-cache, no-store, must-revalidate` for `index.html` to guarantee you always see the latest version automatically.

---

## Step 6: Test Your Live App

1. Test the API: Visit `https://yourdomain.com.ng/api/health` in your browser.
   * You will see:
     ```json
     {
       "status": "online",
       "service": "AJDATASUB VTU Engine (PHP Edition)",
       "environment": "cPanel / MySQL"
     }
     ```
2. Test the Web App: Visit `https://yourdomain.com.ng/`.
   * The full application will load smoothly!
3. Default Test Login:
   * **Phone:** `08001234567`
   * **PIN:** `1234`
   * (Has ₦50,000 pre-seeded balance for testing).

---

## Need Support?
All routes, wallets, transactions, and security checks are now 100% compatible with native Apache, PHP, and MySQL on QServers!

---
## 🌐 Hosting the Landing Page on a Subdomain (for Existing Customers)
To prevent existing customers from seeing the marketing landing page every time they visit your main app domain/subdomain, you can separate your marketing landing page onto a dedicated subdomain (e.g., `landing.ajdata.ng` or `www.ajdata.ng`) while keeping your main portal (`app.ajdata.ng` or root domain) pointing straight to the VTU dashboard & login:

1. **Create Subdomain in cPanel:**
   * Go to **Subdomains** in cPanel.
   * Create `landing` (pointing to document root `/public_html/landing` or a dedicated folder).
2. **Move Landing Files:**
   * Copy `landing.php` into your new landing folder and rename it to `index.php`.
   * Ensure `config.php` and assets (`/logo.png`, CSS, etc.) are accessible or correctly linked.
3. **Configure Main Domain / App Domain:**
   * On your main domain (e.g., `ajdata.ng` or `app.ajdata.ng`), users go directly to the app portal (`index.php` / React SPA / login), while existing customers who return are automatically recognized with our smart session detector or can bookmark the direct app portal.
