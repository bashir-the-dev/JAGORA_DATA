import React, { useState } from 'react';
import {
  Headphones,
  MessageCircle,
  PhoneCall,
  Users,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { playTapSound, triggerHaptic } from '../../utils/soundEffects';
import { UserProfile } from '../../types';
import { RateUsModal } from '../modals/RateUsModal';

interface SupportScreenProps {
  user: UserProfile;
  isLightMode?: boolean;
  onOpenRateUs?: () => void;
  supportContacts?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    whatsappGroup?: string;
  };
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  user,
  isLightMode,
  onOpenRateUs,
  supportContacts: customContacts,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLocalRateModalOpen, setIsLocalRateModalOpen] = useState(false);

  const phone = customContacts?.phone || '+234 814 838 8844';
  const whatsapp = customContacts?.whatsapp || '+234 814 838 8844';
  const email = customContacts?.email || 'support@alaminjagora.ng';
  const whatsappGroupLink =
    customContacts?.whatsappGroup || 'https://chat.whatsapp.com/JagoraOfficialGroup';

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneRaw = phoneDigits.startsWith('0')
    ? `+234${phoneDigits.slice(1)}`
    : `+${phoneDigits}`;

  const whatsappDigits = whatsapp.replace(/\D/g, '');
  const whatsappRaw = whatsappDigits.startsWith('0')
    ? `234${whatsappDigits.slice(1)}`
    : whatsappDigits;

  const supportContacts = {
    phone,
    phoneRaw,
    email,
    whatsapp,
    whatsappLink: `https://wa.me/${whatsappRaw}?text=${encodeURIComponent(
      `Hello Support, my name is ${user.name || 'Customer'} (${user.phone}). I need assistance with my Al'amin Jagora Data account.`
    )}`,
    whatsappGroupLink,
  };

  const handleCopy = (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    playTapSound();
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenRateUs = () => {
    playTapSound();
    triggerHaptic('light');
    if (onOpenRateUs) {
      onOpenRateUs();
    } else {
      setIsLocalRateModalOpen(true);
    }
  };

  const faqs = [
    {
      q: 'How fast will my data or airtime be delivered?',
      a: 'Deliveries are automated and instant (usually 5 to 30 seconds). If network congestion occurs, our system retries or refunds your wallet automatically.',
    },
    {
      q: 'My bank transfer has not reflected in my wallet?',
      a: 'Bank transfers usually reflect within 60 seconds. If delayed by your bank, tap WhatsApp Support and share your transaction reference for instant manual credit.',
    },
    {
      q: 'How do I check my data balance?',
      a: 'MTN: *323*4# or *310# | Airtel: *323# or *140# | Glo: *323# or *127*0# | 9mobile: *323# or *228#.',
    },
    {
      q: 'What happens if a transaction fails?',
      a: 'If a transaction fails, your funds are 100% safeguarded and refunded back to your wallet balance instantly.',
    },
  ];

  return (
    <div id="screen-support" className="px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 pb-28 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
      {/* 1. Direct Header & Status */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0047cc] text-white flex items-center justify-center shadow-md shadow-[#0047cc]/20 shrink-0">
            <Headphones size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Customer Support
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct help & instant assistance
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Online</span>
        </div>
      </section>

      {/* 2. Primary Action Cards: 1-Tap Fulfillment */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* WhatsApp Chat - 1 Tap Action */}
        <a
          id="support-action-whatsapp"
          href={supportContacts.whatsappLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            playTapSound();
            triggerHaptic('medium');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
            isLightMode
              ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-slate-900'
              : 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-500/40 text-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <MessageCircle size={20} className="stroke-[2.3]" />
            </div>
            <button
              type="button"
              onClick={(e) => handleCopy(e, supportContacts.whatsapp, 'whatsapp')}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
              title="Copy WhatsApp number"
            >
              {copiedKey === 'whatsapp' ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>

          <div className="mt-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Fastest • Under 2m
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              WhatsApp Chat
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium block mt-0.5">
              {supportContacts.whatsapp}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span>Open Chat</span>
            <ExternalLink size={13} />
          </div>
        </a>

        {/* Direct Call - 1 Tap Action */}
        <a
          id="support-action-call"
          href={`tel:${supportContacts.phoneRaw}`}
          onClick={() => {
            playTapSound();
            triggerHaptic('medium');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
            isLightMode
              ? 'bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/30 text-slate-900'
              : 'bg-blue-950/40 hover:bg-blue-950/60 border-blue-500/40 text-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0047cc] text-white flex items-center justify-center shadow-xs">
              <PhoneCall size={20} className="stroke-[2.3]" />
            </div>
            <button
              type="button"
              onClick={(e) => handleCopy(e, supportContacts.phone, 'phone')}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-[#0047cc] dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
              title="Copy phone number"
            >
              {copiedKey === 'phone' ? (
                <Check size={13} className="text-[#0047cc]" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>

          <div className="mt-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0047cc] dark:text-blue-400 block">
              Direct Hotline
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Call Agent
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium block mt-0.5">
              {supportContacts.phone}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold text-[#0047cc] dark:text-blue-300">
            <span>Call Now</span>
            <PhoneCall size={13} />
          </div>
        </a>
      </section>

      {/* 3. Secondary Channels (Clean, Instant List Rows) */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
          More Channels
        </h2>

        {/* WhatsApp Group */}
        <a
          id="support-channel-group"
          href={supportContacts.whatsappGroupLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            playTapSound();
            triggerHaptic('light');
          }}
          className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-2xs ${
            isLightMode
              ? 'bg-white border-slate-200 hover:border-blue-300'
              : 'bg-slate-900 border-slate-800 hover:border-blue-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0047cc] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/50">
              <Users size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Official WhatsApp Community
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Daily price drop alerts & network uptime updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button
              type="button"
              onClick={(e) => handleCopy(e, supportContacts.whatsappGroupLink, 'group')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
              title="Copy group invite link"
            >
              {copiedKey === 'group' ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
            <span className="text-xs font-bold text-[#0047cc] dark:text-blue-400">Join</span>
            <ExternalLink size={13} className="text-[#0047cc] dark:text-blue-400" />
          </div>
        </a>

        {/* Email Support */}
        <a
          id="support-channel-email"
          href={`mailto:${supportContacts.email}?subject=Support Request - ${encodeURIComponent(
            `${user.name} (${user.phone})`
          )}`}
          onClick={() => {
            playTapSound();
            triggerHaptic('light');
          }}
          className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-2xs ${
            isLightMode
              ? 'bg-white border-slate-200 hover:border-slate-300'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              <Mail size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Email Desk
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {supportContacts.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button
              type="button"
              onClick={(e) => handleCopy(e, supportContacts.email, 'email')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
              title="Copy support email"
            >
              {copiedKey === 'email' ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Send</span>
            <Mail size={13} className="text-slate-500" />
          </div>
        </a>
      </section>

      {/* 4. Rate Us Banner - Clean & Straightforward */}
      <section
        className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex items-center justify-between gap-3 ${
          isLightMode
            ? 'bg-amber-50/70 border-amber-200/80 text-slate-900'
            : 'bg-amber-950/20 border-amber-500/30 text-slate-100'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={13} className="fill-current" />
            <Star size={13} className="fill-current" />
            <Star size={13} className="fill-current" />
            <Star size={13} className="fill-current" />
            <Star size={13} className="fill-current" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 ml-1">
              Rate Our Service
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Share suggestions or feedback to help us serve you better
          </p>
        </div>

        <button
          type="button"
          id="support-rate-us-btn"
          onClick={handleOpenRateUs}
          className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Star size={13} className="fill-white" />
          <span>Rate Us</span>
        </button>
      </section>

      {/* 5. Quick Answers (FAQ) - Direct & Clean */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
          Quick Answers
        </h2>

        <div className="space-y-1.5">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setExpandedFaq(isOpen ? null : index);
                  }}
                  className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-slate-100 gap-2 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={15} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={15} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Trust Indicator */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Official Support Desk • Al'amin Jagora Data</span>
      </div>

      {/* Rate Us Modal */}
      <RateUsModal
        isOpen={isLocalRateModalOpen}
        onClose={() => setIsLocalRateModalOpen(false)}
        user={user}
        isLightMode={isLightMode}
      />
    </div>
  );
};

