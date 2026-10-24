import React, { useState } from 'react';
import {
  X,
  FileText,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Printer,
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
  isLightMode?: boolean;
  onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  isLightMode = true,
  onAccept,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#061838] flex items-center justify-center text-[#F5B014] shrink-0 shadow-sm">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base leading-tight">
                {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                AJDATASUB • RC: 8153406
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch pills inside modal */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'terms'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Privacy
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed flex-1">
          {activeTab === 'terms' ? (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>Agreement & CAC Registration</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  By registering or transacting with AJDATASUB (CAC RC: 8153406), you agree to comply with all operational guidelines governing automated VTU transactions and wallet maintenance under the laws of the Federal Republic of Nigeria.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span>Account & PIN Security</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  You are solely responsible for keeping your 4-digit Transaction Security PIN confidential. Never disclose your PIN or login password to any third party, including individuals claiming to represent our customer support.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    3
                  </span>
                  <span>Dedicated Virtual Accounts & Wallet Funding</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Dedicated virtual accounts (Monnify, Wema Bank, Sterling Bank, Fidelity Bank) are automatically assigned to your profile. Direct deposits are credited instantly within 5–60 seconds.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    4
                  </span>
                  <span>Instant Delivery & Non-Reversibility Notice</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Data bundles, airtime, and meter tokens are transmitted via telecom switch APIs instantly. Because delivery is completed automatically, transactions sent to wrong phone numbers or meters provided by you cannot be reversed or refunded by operators. Always verify recipient details before sending.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    5
                  </span>
                  <span>Failed Transaction Automated Refunds</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  If an upstream network experiences downtime and rejects an order, our system executes an instant automatic reversal to your wallet balance.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>NDPA 2023 Compliance Commitment</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  AJDATASUB complies strictly with the Nigeria Data Protection Act (NDPA 2023). We handle personal identity and transaction data under strict confidentiality and bank-grade cryptographic protocols.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span>Data Collected & Purpose</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  We collect your name, phone number, email, and transaction records solely to process VTU orders, provision automated virtual accounts, detect fraud, and provide 24/7 customer service. Passwords and PINs are cryptographically salted and hashed.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    3
                  </span>
                  <span>Zero Third-Party Marketing Guarantee</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  We never sell, rent, or trade your personal details to third-party advertisers. Data is shared strictly with authorized telecom networks (MTN, Airtel, Glo, 9mobile) and CBN-approved banking gateways to complete your transactions.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#061838] text-[#F5B014] text-[10px] font-black flex items-center justify-center">
                    4
                  </span>
                  <span>Your Data Subject Rights</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  You retain full rights under the NDPA to access, rectify, or request deletion of your information, subject to statutory Nigerian financial transaction record retention mandates.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Kano State, Nigeria • support@ajdatasub.com.ng
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[38px]"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0052cc] hover:bg-[#0047b3] text-white transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} />
                <span>I Understand & Accept</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
