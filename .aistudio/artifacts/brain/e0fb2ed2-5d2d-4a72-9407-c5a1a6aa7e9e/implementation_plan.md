# AJ DATA — Complete UI/UX Redesign & Fintech Architecture

Comprehensive modernization of the AJ DATA customer-facing experience to match the supplied high-fidelity fintech visual references, featuring a deep navy, electric blue, and warm orange design system, system-preference theme toggle, a unified 4-step Buy Data wizard, in-app support chat, and complete preservation of existing business logic and APIs.

## User Review & Critical Decisions

> [!IMPORTANT]
> All architectural and design decisions are strictly grounded in your confirmed Phase 1 choices and the uploaded design reference sheet:

- **Confirmed Decision 1 (Theme & Appearance)**: Dual-theme engine defaulting to system preference (`prefers-color-scheme`), with an instant one-tap header toggle between Deep Navy Fintech Dark Mode and Crisp High-Contrast Light Mode.
- **Confirmed Decision 2 (Buy Data Flow)**: Full 4-step guided wizard matching the visual reference:
  - **Step 1 (Network)**: Grid of branded carrier tiles (MTN, Airtel, Glo, 9mobile, Smile, Spectranet) with active highlight and network advice note.
  - **Step 2 (Plan)**: Category tabs (Daily, Weekly, Monthly / SME, Gifting, Corporate) with plan radio cards displaying data size, validity, and wholesale price.
  - **Step 3 (Phone)**: Branded network badge, phone input with quick contact picker shortcut and validation helper text.
  - **Step 4 (Pay & Confirm)**: Summary breakdown with 4-digit PIN verification modal, wallet balance impact check, and biometric authentication option.
- **Confirmed Decision 3 (Customer Support)**: Dual-channel support architecture featuring an interactive in-app live chat widget with persistent chat history and auto-responses, alongside direct one-tap WhatsApp Desk and Phone Dispatch buttons.
- **Confirmed Decision 4 (Zero Feature Loss & Real Backend Integrity)**: All existing services (Peyflex data engine, XIXAPAY/PayVessel/Monnify virtual accounts, cable TV, electricity token vending, scratch cards, airtime-to-cash) remain 100% active and connected to real endpoints.

---

## 1. Overview & Core Concept

- **What It Delivers**: Transforms the AJ DATA web app from a standard utility portal into an elite, bank-grade Nigerian VTU fintech application. Every surface reflects clean visual hierarchy, generous touch-friendly padding, tabular financial typography, and responsive micro-interactions.
- **Target Audience**: Nigerian smartphone and web users purchasing daily telecom bundles, resellers funding their business wallets, and households recharging utilities 24/7.
- **Key Value**: Frictionless transaction speed (< 15 seconds to complete a data purchase), instant clarity on wallet balance and fees, and reliable post-transaction feedback with shareable receipts.

---

## 2. User Experience & Visual Design

### Key Screen Redesigns (Mapped to Visual Reference)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Redesigned Screen Architecture                  │
│                                                                        │
│  [1. Dashboard] ──────> [2. Fund Wallet]  ───> Virtual Account Details │
│   │                      │                                             │
│   ├──> [3-6. Buy Data 4-Step Wizard]                                   │
│   │     Step 1: Network Selection                                      │
│   │     Step 2: Plan Selection (Tabs & Radio Cards)                    │
│   │     Step 3: Phone Number & Contact Picker                          │
│   │     Step 4: PIN & Payment Confirmation                             │
│   │                                                                    │
│   ├──> [7. History] ─────── Filter: All | Data | Airtime | Bills       │
│   ├──> [8. Notifications] ─ Filter: All | Transactions | Promos | Sys  │
│   ├──> [9. Help & Support] ── WhatsApp + Call Desk + FAQ + Live Chat   │
│   │     └─> [10. In-App Live Chat] ── Real-time interactive messaging  │
│   ├──> [11. Profile & Security] ─ Biometrics, PIN, Account Tiers       │
│   ├──> [12. All Utilities & Services] ─ Grouped Categorical Hub        │
│   └──> [13. Success & Receipt Modal] ─ Celebration check & receipt     │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme Tokens

- **Brand Primary**: Electric Blue (`#0052CC` / `#2563EB`) — used for primary action buttons, active navigation states, and balance highlights.
- **Brand Accent**: Warm Vivid Orange (`#FF6B00` / `#F97316`) — used for high-intent actions (`+ Fund Wallet`, urgent announcements, promotional badges).
- **Dark Mode Surfaces**: Deep Navy Background (`#070E1E`), Card Surface (`#0D1B2A` / `#112240`), Elevated Modal (`#1A2E4C`), Subtle Borders (`rgba(255,255,255,0.08)`).
- **Light Mode Surfaces**: Crisp Off-White Background (`#F8FAFC`), Clean White Cards (`#FFFFFF`), Border Separators (`#E2E8F0`), Subtle Shadow (`0 4px 20px -2px rgba(0,0,0,0.05)`).
- **Status Semantics**:
  - Success: Emerald Green (`#10B981` / `#059669`) with soft glow.
  - Warning/Pending: Amber Gold (`#F59E0B`).
  - Error: Coral Rose (`#EF4444`).
- **Typography**: `Plus Jakarta Sans` for clean, professional headings and controls; `JetBrains Mono` or `tabular-nums` for wallet balances, transaction amounts, reference tokens, and phone numbers.
- **Mobile First Constraint**: Every interactive element enforces a minimum tap target of $44\text{px} \times 44\text{px}$, explicit zero horizontal overflow (`overflow-x-hidden`), and smooth mobile scrolling.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Screen Component Evolution vs. Rewrite**
  - *Chosen Approach*: Refactor and restyle existing screen components (`DashboardScreen.tsx`, `FundWalletScreen.tsx`, `BuyDataScreen.tsx`, `HistoryScreen.tsx`, `SupportScreen.tsx`, `ProfileScreen.tsx`, `NotificationsScreen.tsx`, `BillsScreen.tsx`) in-place while keeping all state stores, props, and API clients intact.
  - *Why*: Eliminates any risk of breaking existing backend communication, authentication cookies, user profiles, or transaction logs.
- **Decision 2: 4-Step Buy Data Wizard State Management**
  - *Chosen Approach*: Implement a cohesive multi-step state machine inside `BuyDataScreen.tsx` with forward/backward navigation, retaining selected carrier, plan, and phone number while validating each step before proceeding.
  - *Why*: Direct compliance with the user-selected reference layout without complicating parent routing.
- **Decision 3: In-App Interactive Customer Support Chat**
  - *Chosen Approach*: Build a dedicated responsive `ChatWithUsScreen.tsx` component with message threading, persistent local session storage, auto-agent greetings, attachment button, and direct escalation to WhatsApp.
  - *Why*: Delivers the exact look and feel of Screen 11 from the reference sheet while providing instant self-serve assistance.

---

## 4. Technical Architecture & Implementation Steps

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Data & Component Flow                           │
│                                                                        │
│   [Server Store / SQLite / Firestore] ──> [API Client (apiClient.ts)]  │
│                                                     │                  │
│                                 ┌───────────────────┴───────────────┐  │
│                                 ▼                                   ▼  │
│                       [State / Theme Context]             [User Session]
│                                 │                                   │  │
│                ┌────────────────┼────────────────┬──────────────────┤  │
│                ▼                ▼                ▼                  ▼  │
│           [Dashboard]      [Buy Data]       [Fund Wallet]       [Support]│
│            • Balance Card   • 4-Step Stepper • Virtual Bank     • Live Chat│
│            • Quick Grid     • Plan Filters   • Copy Shortcuts   • WhatsApp │
│            • Recharges      • Telco Logos    • Surcharge Pill   • Hotlines │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Implementation Phases

1. **Phase 1: Design Tokens & Theme Foundation**
   - Refine Tailwind color variables and theme toggle in `src/App.tsx`, `Header.tsx`, and `BottomNav.tsx` to support the Electric Blue + Orange identity and seamless light/dark mode switching.
   - Ensure clean telecom logos and badge styling across all network operators (MTN, Airtel, Glo, 9mobile, Smile, Spectranet).

2. **Phase 2: Dashboard & Fund Wallet Redesign**
   - Update `DashboardScreen.tsx` with the exact header banner, greeting with verified badge, electric blue balance card with eye toggle, orange `+ Fund Wallet` button, quick service card grid, and recent recharge list items.
   - Update `FundWalletScreen.tsx` matching Screen 2: Dedicated Virtual Account card with surcharge pill, clean account details (bank name, account number, name) with one-tap copy shortcuts, and step-by-step funding instructions.

3. **Phase 3: 4-Step Buy Data Wizard**
   - Overhaul `BuyDataScreen.tsx` with the 4-step stepper (Network, Plan, Phone, Pay):
     - Step 1: Responsive network selector tiles with advice callout.
     - Step 2: Tab-filtered plans (Daily, Weekly, Monthly / SME, Gifting, Corporate) with clean radio cards.
     - Step 3: Phone number input with formatted mask and recent number shortcut.
     - Step 4: Review summary, wallet balance check, and 4-digit PIN authentication.

4. **Phase 4: History, Notifications & Utilities Screens**
   - Redesign `HistoryScreen.tsx` with category filter tabs (All, Data, Airtime, Bills) and clean circular telecom badges with tabular amounts and status pills.
   - Redesign `NotificationsScreen.tsx` with category filters (All, Transactions, Promotions, System) and clean icons.
   - Redesign `BillsScreen.tsx` (Utilities & Services) matching Screen 10 with categorized sections: Bill Payments, Education & Exams, Wholesale Printing, Specialized Telecom Utilities.

5. **Phase 5: Support, In-App Live Chat & Profile Screens**
   - Modernize `SupportScreen.tsx` matching Screen 8 (WhatsApp Card, Call Agent Card, More Channels list).
   - Build `ChatWithUsScreen.tsx` matching Screen 11 with message bubbles, avatar, input box, and real-time interaction.
   - Modernize `ProfileScreen.tsx` matching Screen 9 (User avatar circle, verified badge, grouped account settings cards).

6. **Phase 6: Transaction Success & Receipt Modal**
   - Update `GlobalTransactionModal.tsx` and receipt views matching Screen 12 (Purchase Successful banner, glowing green checkmark, detailed transaction receipt card, Back to Home and View Receipt buttons).

7. **Phase 7: Verification, Compilation & cPanel Archive Generation (COMPLETED)**
   - Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors (0 errors).
   - Fixed `ajdatasub_cpanel_file.zip` 0-byte issue:
     - Updated `scripts/build-cpanel-zip.py` to package and atomically flush all target archive filenames (`ajdatasub_cpanel_file.zip`, `ajdatasub_cpanel_files.zip`, `alaminjagora_cpanel_file.zip`, `alaminjagora_cpanel_files.zip`, `archive.zip`, `cpanel_backend.zip`, `vtu_script.zip`).
     - Added physical deployment directly into `cpanel-backend/`, `cpanel_deploy_package/`, `public/`, `dist/`, and project root.
     - Updated `server.ts` download endpoints to serve binary buffers with explicit `Content-Type: application/zip`, `Content-Length`, and cache headers, preventing 0-byte streams or route fallthrough.
     - Verified all 11+ archive files on filesystem and HTTP endpoints (>2.4 MB each).

