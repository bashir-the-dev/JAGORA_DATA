import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  ChevronRight,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { ScreenType } from '../../types';

interface LegalScreenProps {
  initialTab?: 'terms' | 'privacy';
  onNavigateBack: () => void;
  onNavigate?: (screen: ScreenType) => void;
  isLightMode?: boolean;
}

export const LegalScreen: React.FC<LegalScreenProps> = ({
  initialTab = 'terms',
  onNavigateBack,
  onNavigate,
  isLightMode = true,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}#${activeTab}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="screen-legal"
      className={`min-h-screen selection:bg-[#F5B014] selection:text-slate-950 font-sans transition-colors ${
        isLightMode ? 'bg-[#edf2f7] text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Royal Navy with Gold accents) */}
      {/* ========================================================================= */}
      <header className="relative bg-gradient-to-b from-[#061838] via-[#081a3e] to-[#0a214d] text-white pt-8 pb-14 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute top-0 left-0 w-44 h-44 opacity-15 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full text-amber-300">
            <polygon points="50,5 63,38 95,38 69,57 79,90 50,70 21,90 31,57 5,38 37,38" strokeWidth="1" />
            <polygon points="50,15 60,40 85,40 65,55 72,80 50,65 28,80 35,55 15,40 40,40" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="35" strokeWidth="0.7" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              type="button"
              id="legal-back-btn"
              onClick={onNavigateBack}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm min-h-[40px]"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                title="Print document"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer backdrop-blur-sm min-h-[40px] min-w-[40px] justify-center"
              >
                <Printer size={15} />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy shareable link"
                className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm min-h-[40px]"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>

          {/* Title and Metadata */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-sky-300 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck size={14} className="text-[#F5B014]" />
              <span>LEGAL & COMPLIANCE DOSSIER</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-heading text-white">
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              Al'amin Jagora Data • Registered Business Enterprise (RC: 8153406)
            </p>
            <p className="text-[11px] text-amber-300/90 mt-1 font-mono">
              Effective Date: September 2026 • Governed by the Laws of the Federal Republic of Nigeria
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center justify-center mt-6">
            <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shadow-lg">
              <button
                type="button"
                id="tab-terms-btn"
                onClick={() => setActiveTab('terms')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] ${
                  activeTab === 'terms'
                    ? 'bg-[#F5B014] text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText size={16} />
                <span>Terms of Service</span>
              </button>

              <button
                type="button"
                id="tab-privacy-btn"
                onClick={() => setActiveTab('privacy')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[40px] ${
                  activeTab === 'privacy'
                    ? 'bg-[#F5B014] text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock size={16} />
                <span>Privacy Policy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Swooping Gold Curved Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 sm:h-10">
            <path d="M0,0 C300,80 900,80 1200,0 L1200,120 L0,120 Z" fill="#F5B014" opacity="0.95" />
            <path d="M0,10 C300,85 900,85 1200,10 L1200,120 L0,120 Z" fill={isLightMode ? '#edf2f7' : '#020617'} />
          </svg>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-2 pb-20 relative z-10">
        {/* Search / Filter bar */}
        <div className="mb-6">
          <div
            className={`rounded-2xl p-2 sm:p-2.5 border shadow-sm flex items-center gap-3 ${
              isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <Search size={18} className="text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search legal clauses (e.g. refunds, wallet, virtual accounts, security, data usage)..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Legal Paper Card */}
        <article
          className={`rounded-3xl p-6 sm:p-10 border shadow-xl ${
            isLightMode ? 'bg-white border-slate-200/90 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          {/* Document Header Seal */}
          <div className="border-b pb-6 mb-8 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0055ff] border border-white/20 shadow-md flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="Al'amin Jagora Data Seal"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Al'amin Jagora Data Enterprise
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Federal Republic of Nigeria • CAC Registered Entity RC: 8153406
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>NDPA 2023 & CBN Compliant</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: TERMS OF SERVICE */}
          {/* ========================================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-8 text-sm leading-relaxed">
              {/* Introduction */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>Introduction & Acceptance of Terms</span>
                </h3>
                <p>
                  Welcome to <strong>Al'amin Jagora Data</strong> ("we", "us", "our", or the "Platform"), a technology-driven Virtual Top-Up (VTU) and bill settlement platform registered under the Corporate Affairs Commission (CAC) of the Federal Republic of Nigeria with Registration Number <strong>RC: 8153406</strong>, headquartered in Kano State, Nigeria.
                </p>
                <p>
                  By accessing, creating an account, or transacting on the Al'amin Jagora Data mobile application, web portal, or developer API, you ("User", "Customer", or "Merchant") acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service. If you do not accept these terms in full, you must immediately discontinue use of our platform.
                </p>
              </section>

              {/* Eligibility & Account Security */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>User Eligibility & Account Security</span>
                </h3>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Age Requirement:</strong> You must be at least 18 years old or possess legal parental/guardian consent in Nigeria to register and maintain a wallet.
                  </li>
                  <li>
                    <strong>Identity & Information:</strong> You agree to provide accurate, current, and verifiable information during registration, including your full legal name, phone number, and email address.
                  </li>
                  <li>
                    <strong>PIN & Credentials Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your account login password and 4-digit Transaction Security PIN. Any transaction authenticated with your correct security PIN will be treated as authorized by you.
                  </li>
                  <li>
                    <strong>Single Account Policy:</strong> Users are permitted one active primary wallet. Creating duplicate accounts for fraudulent activity or abuse of promotional vouchers is strictly prohibited.
                  </li>
                </ul>
              </section>

              {/* Wallet Funding & Dedicated Virtual Accounts */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>Wallet Funding & Dedicated Virtual Accounts</span>
                </h3>
                <p>
                  To facilitate instant transactions, Al'amin Jagora Data provisions personalized, dedicated automated virtual bank accounts (in partnership with licensed CBN-approved payment partners such as Monnify, Wema Bank, Sterling Bank, and Fidelity Bank).
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Automated Reconciliation:</strong> Transfers made to your dedicated virtual account number are credited to your Al'amin Jagora Data wallet automatically within 5 to 60 seconds.
                  </li>
                  <li>
                    <strong>Processing Fees:</strong> Bank transfer gateway processing fees charged by our upstream banking partners (typically ₦20 to ₦50 or 1.5% capped at statutory limits) are displayed transparently before completion.
                  </li>
                  <li>
                    <strong>Deposit Accuracy:</strong> You must ensure you transfer to your own assigned virtual account number. Al'amin Jagora Data is not liable for funds sent to bank accounts belonging to unrelated third parties.
                  </li>
                </ul>
              </section>

              {/* VTU Services & Digital Delivery Standards */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </span>
                  <span>VTU Services, Data Bundles & Digital Delivery</span>
                </h3>
                <p>
                  We provide automated connectivity with major telecommunication operators (MTN Nigeria, Airtel Nigeria, Globacom, 9mobile) and utility distribution companies (PHCN DisCos, DStv, GOtv, Startimes, WAEC, NECO).
                </p>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>Recipient Number & Meter Verification (Critical)</span>
                  </div>
                  <p>
                    Digital items (data bundles, airtime, electricity recharge tokens, and examination scratch pins) are delivered immediately via telecommunication switches. <strong>Please double-check the recipient phone number, meter number, or IUC number before confirming with your PIN.</strong> Completed delivery to an incorrectly provided phone number or meter cannot be reversed or refunded by any telecommunication operator.
                  </p>
                </div>
              </section>

              {/* Refunds & Failed Transactions */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    5
                  </span>
                  <span>Automated Refund Policy for Failed Orders</span>
                </h3>
                <p>
                  In the event that an upstream telecommunication server experiences downtime or fails to acknowledge delivery of your data or airtime:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Instant Wallet Reversal:</strong> Our system executes automated reconciliation. If an order fails, the deducted sum is immediately credited back to your wallet balance.
                  </li>
                  <li>
                    <strong>Pending Transactions:</strong> If an operator places a query in a pending queue, our automated webhook monitor waits for final telecom switch resolution (typically within 15 minutes) before releasing tokens or refunding the wallet.
                  </li>
                  <li>
                    <strong>Manual Support Queries:</strong> Users can copy the unique Transaction Reference ID using our Tap-to-Copy feature in the Receipt modal and submit it to 24/7 WhatsApp or Telegram customer support for prompt investigation.
                  </li>
                </ul>
              </section>

              {/* Anti-Fraud & Prohibited Activities */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    6
                  </span>
                  <span>Anti-Fraud Compliance & Prohibited Uses</span>
                </h3>
                <p>
                  Users shall not use Al'amin Jagora Data for:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Airtime/data laundering or conversion of proceeds of financial fraud.</li>
                  <li>Unauthorized automated scraping, reverse engineering, or denial-of-service (DoS) attacks on our servers.</li>
                  <li>Attempting fraudulent bank chargebacks on legitimate virtual account fundings.</li>
                  <li>Operating accounts under assumed identities to bypass Nigerian KYC/AML regulations.</li>
                </ul>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2">
                  Violation of anti-fraud policies will result in immediate permanent account suspension, wallet freezing, and referral to law enforcement authorities (EFCC / NPF Cybercrime Unit).
                </p>
              </section>

              {/* Governing Law */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    7
                  </span>
                  <span>Governing Law & Jurisdiction</span>
                </h3>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the state and federal courts sitting in Kano State, Nigeria.
                </p>
              </section>

              {/* Contact */}
              <section className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 size={16} className="text-[#F5B014]" />
                  <span>Legal & Support Inquiries</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  For formal inquiries regarding our Terms of Service, please contact our Legal Compliance Desk:
                </p>
                <div className="text-xs font-mono space-y-1 pt-1 text-slate-700 dark:text-slate-200">
                  <p>• <strong>Entity:</strong> Al'amin Jagora Data (RC: 8153406)</p>
                  <p>• <strong>Email:</strong> support@alaminjagoradata.com.ng</p>
                  <p>• <strong>Phone / WhatsApp:</strong> +234 803 898 3334</p>
                  <p>• <strong>Headquarters:</strong> Kano State, Nigeria</p>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PRIVACY POLICY */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 text-sm leading-relaxed">
              {/* Privacy Intro */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>Privacy Commitment & NDPA 2023 Compliance</span>
                </h3>
                <p>
                  At <strong>Al'amin Jagora Data</strong> (RC: 8153406), your personal privacy and financial security are our foundational priorities. This Privacy Policy outlines how we collect, process, store, and safeguard your personal information in strict compliance with the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and guidelines issued by the <strong>Nigeria Data Protection Commission (NDPC)</strong>.
                </p>
                <p>
                  By using our application, you consent to the data collection and processing practices described in this document.
                </p>
              </section>

              {/* Data We Collect */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>Information We Collect</span>
                </h3>
                <p>
                  We collect information necessary to provide seamless VTU vending and secure wallet management:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Personal Identifiers:</strong> Your full name, mobile telephone number, email address, and home/business location (where submitted).
                  </li>
                  <li>
                    <strong>Authentication Credentials:</strong> Password (cryptographically salted and hashed using standard bcrypt algorithms) and 4-digit Transaction Security PIN. <em>We never store your plaintext passwords or PINs.</em>
                  </li>
                  <li>
                    <strong>Financial & Transactional Records:</strong> Wallet balance, transaction references, amounts credited/debited, recipient telephone lines, electricity meter numbers, and TV smartcard numbers.
                  </li>
                  <li>
                    <strong>Technical & Device Data:</strong> IP address, browser user-agent, operating system, and session timestamps to detect suspicious multi-device account takeover attempts.
                  </li>
                </ul>
              </section>

              {/* Purpose of Processing */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>How We Use Your Personal Data</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>To process instant airtime, data top-ups, and utility bill settlements.</li>
                  <li>To generate your unique automated virtual bank accounts with partner banks for wallet funding.</li>
                  <li>To send real-time transaction SMS/email receipts, security OTP codes, and critical service notifications.</li>
                  <li>To detect and prevent financial fraud, money laundering, and account intrusions.</li>
                  <li>To provide prompt 24/7 customer support and resolve transaction reconciliation tickets.</li>
                </ul>
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 font-medium">
                  <strong>Zero Data Selling Guarantee:</strong> Al'amin Jagora Data does <em>never</em> sell, rent, or trade your personal information or contact details to third-party advertisers or marketing data brokers.
                </div>
              </section>

              {/* Third-Party Service Providers */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </span>
                  <span>Data Sharing with Authorized Infrastructure Partners</span>
                </h3>
                <p>
                  To execute your requested services, data is securely routed via encrypted API connections to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Licensed Telecom Operators:</strong> MTN, Airtel, Globacom, and 9mobile for data bundle and airtime crediting.</li>
                  <li><strong>Electricity DisCos & Cable TV Switches:</strong> For meter validation and instant token generation.</li>
                  <li><strong>CBN-Licensed Payment Partners:</strong> Monnify, Wema Bank, Sterling Bank, Fidelity Bank for virtual account provisioning.</li>
                </ul>
              </section>

              {/* Data Security Safeguards */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    5
                  </span>
                  <span>Security & Cryptographic Safeguards</span>
                </h3>
                <p>
                  We deploy multi-layered, bank-grade technical and organizational safeguards:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>256-bit Transport Layer Security (TLS/SSL) encryption on all network transit data.</li>
                  <li>Role-Based Access Controls (RBAC) preventing unauthorized administrative visibility of user balances and PINs.</li>
                  <li>Automated intrusion detection, rate-limiting on brute-force attempts, and 2FA authentication for high-privilege staff.</li>
                </ul>
              </section>

              {/* User Rights Under NDPA */}
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-heading font-black text-[#061838] dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#061838] text-[#F5B014] flex items-center justify-center text-xs font-bold shrink-0">
                    6
                  </span>
                  <span>Your Legal Rights Under the NDPA 2023</span>
                </h3>
                <p>
                  As a data subject in Nigeria, you enjoy the following enforceable rights:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Right to Access:</strong> Request a copy of all personal and transaction data we hold concerning your account.</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate information (e.g., corrected email or name).</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request closure and deletion of your profile, subject to statutory Nigerian financial retention requirements (e.g. anti-money laundering transaction retention laws).</li>
                  <li><strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your data has been handled improperly.</li>
                </ul>
              </section>

              {/* DPO Contact */}
              <section className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={16} className="text-[#F5B014]" />
                  <span>Data Protection Officer (DPO) Contact</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  To exercise your data privacy rights or submit a privacy inquiry:
                </p>
                <div className="text-xs font-mono space-y-1 pt-1 text-slate-700 dark:text-slate-200">
                  <p>• <strong>Office:</strong> Data Protection & Security Office</p>
                  <p>• <strong>Email:</strong> privacy@alaminjagoradata.com.ng</p>
                  <p>• <strong>Direct Hotline:</strong> +234 803 898 3334</p>
                  <p>• <strong>Location:</strong> Kano State, Nigeria</p>
                </div>
              </section>
            </div>
          )}

          {/* Document Footer Action */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Al'amin Jagora Data (RC: 8153406). All rights reserved.</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'terms' ? 'privacy' : 'terms');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[#0052cc] dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Switch to {activeTab === 'terms' ? 'Privacy Policy' : 'Terms of Service'} →
              </button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};
