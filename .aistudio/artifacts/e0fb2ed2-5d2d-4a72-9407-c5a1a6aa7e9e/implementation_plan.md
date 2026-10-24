# Standard Multi-Page Nigerian VTU Architecture (`vtu-script/`)

A production-grade, modular multi-page PHP VTU system organized into clean, industry-standard directories (`admin/`, `api/`, `config/`, `core/`, `dashboard/`, `includes/`). Designed specifically for direct, zero-friction editing in cPanel File Manager without requiring build steps, bundlers, or npm.

## User Review & Critical Decisions

> [!IMPORTANT]
> This revised implementation plan adheres strictly to your specified directory structure and requirements. All portal pages (public, user dashboard, and admin) are separated into individual, human-readable PHP files with single-file configuration in `config/app_config.php`.

- **Confirmed Decision 1 (Architecture)**: Replaced monolithic single-page architecture with a traditional multi-page PHP file structure matching standard Nigerian VTU scripts (MSorg, VTpass, Clubkonnect, Topupmate).
- **Confirmed Decision 2 (Zero Build Steps)**: Direct server-side PHP with embedded HTML and modern Tailwind CSS. Any text, price, or layout edit made in cPanel File Manager updates immediately upon saving.
- **Confirmed Decision 3 (Centralized Configuration)**: All brand assets, company names, support phone numbers, WhatsApp lines, and office addresses (e.g., Kano, Katsina) reside in `config/app_config.php` as the single source of truth.
- **Recommended Default (Upstream API)**: Configured with standard Payflex / Peyflex VTU API protocols with fallback simulation mode so the portal works instantly on any shared host before API keys are plugged in.

---

## 1. Overview & Core Concept

### What It Delivers
A complete, turnkey Nigerian VTU portal codebase structured logically for maintenance, speed, and reliability:
1. **Public Storefront (`index.php`, `login.php`, `register.php`)**: Clean responsive landing page with live database pricing, WhatsApp live agent chat, and quick auth.
2. **Customer Dashboard (`dashboard/`)**: Mobile-first portal where retail users and resellers fund wallets, purchase SME/CG/Gifting data, vend discounted airtime, pay utility bills, and print transaction receipts.
3. **Admin Management Panel (`admin/`)**: Complete administrative suite for monitoring orders, adjusting wholesale/retail profit margins, managing customer accounts, and controlling API gateways.
4. **Core Business Engine (`core/`)**: Object-oriented PHP handler classes abstracting telecommunication APIs (MTN, Airtel, Glo, 9mobile) and payment gateways (Monnify, Payvessel, Paystack).

### Target Audience & Persona
- **Nigerian VTU Resellers & Consumers**: Accessing via mobile browsers (Chrome, Safari, Opera Mini) requiring fast loading, minimum 44px tap targets, and crystal-clear transaction receipts.
- **Website Owner & Developer**: Managing the system directly from cPanel File Manager, phpMyAdmin, and the Admin Settings tab without terminal commands or code compilation.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Visitor Landing & Inquiry Flow**:
   - Visitor arrives at `index.php` → views live data bundle rates across MTN, Airtel, Glo, and 9mobile.
   - Visitor taps "Chat with Live Agent" (WhatsApp) or clicks "Create Free Account" (`register.php`).
2. **Authentication & Wallet Onboarding**:
   - User signs up on `register.php` with Name, Phone, Email, and Password.
   - Virtual Dedicated Accounts (Monnify / Payvessel) are immediately provisioned for instant wallet funding.
   - User logs in via `login.php` → auto-redirected to `dashboard/index.php`.
3. **VTU Purchase Flow (Data / Airtime)**:
   - User taps "Buy Data" (`dashboard/buy-data.php`) → selects Network (MTN / Airtel / Glo / 9mobile).
   - Selects Data Type (SME, Corporate Gifting, Direct Gifting) → selects Bundle size.
   - Enters recipient phone number → system displays live price and user balance.
   - Taps "Purchase Now" → PIN/Password confirmation → atomic wallet debit → instant upstream vending.
   - Success modal appears with printable receipt and WhatsApp share button.
4. **Wallet Funding Flow**:
   - User navigates to `dashboard/fund-wallet.php` → displays automated dynamic virtual account numbers (Wema Bank, Moniepoint, Sterling Bank).
   - User transfers funds via their mobile banking app → Webhook hits `api/callback.php` → wallet is credited within seconds.
5. **Admin Operations Flow**:
   - Admin logs in at `admin/index.php` → views total revenue, user count, and gateway balances.
   - Navigates to `admin/settings.php` to adjust plan margins or switch API providers.
   - Manages users and resolves stuck orders in `admin/transactions.php` with 1-click retry or refund.

### Visual Identity & Theme
- **Dominant Palette**:
  - Deep Midnight Navy (`#071838` / `#0a192f`): Professional, secure banking foundation.
  - Electric Royal Blue (`#0052cc` / `#2563eb`): High-trust primary action buttons and headers.
  - Radiant Gold (`#F5B014`): Promotional callouts, SME badge accents, and status warnings.
  - Emerald Green (`#10b981`): Wallet balances, successful transactions, and WhatsApp live indicators.
- **Typography & Ergonomics**:
  - Modern system sans-serif hierarchy (Inter / Plus Jakarta Sans) for high legibility on mobile.
  - Strict minimum 44x44px clickable tap targets across all telecom logos, buttons, and numeric inputs.
  - Zero horizontal overflow (`overflow-x-hidden`) guaranteed across all viewports.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Pure Multi-Page Architecture vs. SPA
- **Chosen Approach**: Traditional Multi-Page PHP application (`.php` files for each route) with modular `includes/`.
- **Why**: Allows direct file editing in cPanel File Manager. If you want to change "Kano" to "Katsina" or modify support details, you simply edit `config/app_config.php` or `includes/footer.php` and save.
- **Alternatives Considered**: React SPA — Rejected because modifying text requires npm build scripts and terminal access, making rapid manual cPanel edits difficult.

### Decision 2: Centralized Config vs. Distributed Constants
- **Chosen Approach**: All business details (Site Name, WhatsApp Number, Support Phone, Email, Office Address, Currency, Base URL) are declared once in `config/app_config.php`.
- **Why**: Eliminates hunting across multiple files for phone numbers, addresses, or brand names. Changing the address in `config/app_config.php` updates the homepage, login page, dashboard, and receipts instantly.

### Decision 3: Modular Core Business Logic Handlers
- **Chosen Approach**: Distinct handler classes (`AirtimeHandler.php`, `DataHandler.php`, `BillHandler.php`, `PaymentGateway.php`) placed in `core/`.
- **Why**: Keeps UI files (`dashboard/buy-data.php`) clean and focused on presentation, while API communications, error logging, and wallet debit queries remain safely isolated in tested backend classes.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Request Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HTTP Request / Client                           │
│  (Mobile Browser, Reseller App, or Automated Payment Webhook Callback) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             .htaccess                                  │
│       (Security Rules, HTTPS Enforcement, Directory Guard)             │
└───────────┬───────────────────────┬───────────────────────┬────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
   │ Public Portal   │     │ User Dashboard  │     │ Admin Panel     │
   │ - index.php     │     │ dashboard/      │     │ admin/          │
   │ - login.php     │     │ - buy-data.php  │     │ - users.php     │
   │ - register.php  │     │ - buy-airtime   │     │ - settings.php  │
   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         config/app_config.php                          │
│          (Single Source of Truth: Names, Phones, Kano/Katsina)         │
├────────────────────────────────────────────────────────────────────────┤
│                          config/database.php                           │
│                 (MySQL PDO Persistent Connection Pool)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         core/ Business Logic                           │
│  ┌───────────────────────┐               ┌──────────────────────────┐  │
│  │   DataHandler.php     │               │    AirtimeHandler.php    │  │
│  └───────────┬───────────┘               └────────────┬─────────────┘  │
│  ┌───────────┴───────────┐               ┌────────────┴─────────────┐  │
│  │    BillHandler.php    │               │    PaymentGateway.php    │  │
│  └───────────────────────┘               └──────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    External Telecom & Bank APIs                        │
│   (Payflex / Peyflex Vending Gateway, Monnify / Payvessel Accounts)    │
└────────────────────────────────────────────────────────────────────────┘
```

### Complete Directory Layout

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
└── index.php               # Homepage / Landing page with live pricing preview
```

### Data Model & Table Architecture

1. **`users`**:
   - `id`, `name`, `email`, `phone`, `password_hash`, `balance`, `tier` (`smart`, `reseller`, `api`), `virtual_accounts_json`, `created_at`.
2. **`vtu_plans`**:
   - `id`, `network` (`MTN`, `AIRTEL`, `GLO`, `9MOBILE`), `plan_type` (`SME`, `CG`, `GIFTING`), `bundle_name`, `bundle_size`, `cost_price`, `selling_price`, `reseller_price`, `api_code`, `status` (`1`=active, `0`=hidden).
3. **`transactions`**:
   - `id`, `user_id`, `reference`, `service_type` (`data`, `airtime`, `cable`, `electricity`, `wallet_fund`), `details`, `amount`, `balance_before`, `balance_after`, `status` (`SUCCESS`, `PENDING`, `FAILED`), `api_response`, `created_at`.
4. **`settings`**:
   - `setting_key`, `setting_value`, `updated_at`.

---

## 5. Phased Execution Roadmap

### Phase 1: Configuration & Handlers Setup
- Create `config/app_config.php` with centralized company data (Name, Phone, WhatsApp, Katsina/Kano address, Email).
- Create `config/database.php` with robust PDO connection handling MySQL databases.
- Implement `core/DataHandler.php`, `core/AirtimeHandler.php`, `core/BillHandler.php`, and `core/PaymentGateway.php`.

### Phase 2: Reusable Includes & Global Layouts
- Implement `includes/header.php` and `includes/footer.php` incorporating the centralized configuration.
- Implement `includes/sidebar.php` and `includes/auth_guard.php`.

### Phase 3: Public Presentation Pages
- Build `index.php` (Landing page with live pricing, hero banner, feature grid, and live agent chat).
- Build `login.php` and `register.php`.

### Phase 4: User & Reseller Dashboard
- Build `dashboard/index.php`, `dashboard/buy-data.php`, `dashboard/buy-airtime.php`, `dashboard/fund-wallet.php`, `dashboard/bills.php`, and `dashboard/transactions.php`.

### Phase 5: Admin Panel & API Endpoints
- Build `admin/index.php`, `admin/users.php`, `admin/transactions.php`, and `admin/settings.php`.
- Build `api/callback.php` for webhooks and `api/v1/` endpoints.

### Phase 6: Packaging & Deployment Verification
- Package all files cleanly into `vtu-script/` and synchronize `alaminjagora_cpanel_files.zip`.
- Provide straightforward cPanel upload, unzip, and database setup instructions.
