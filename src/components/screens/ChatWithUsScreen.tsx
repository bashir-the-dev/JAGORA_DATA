import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Paperclip, Headphones, ShieldCheck, CheckCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { playTapSound, triggerHaptic, playSuccessChime } from '../../utils/soundEffects';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  time: string;
  avatar?: string;
}

interface ChatWithUsScreenProps {
  user: UserProfile;
  onNavigateBack: () => void;
  isLightMode?: boolean;
}

export const ChatWithUsScreen: React.FC<ChatWithUsScreenProps> = ({
  user,
  onNavigateBack,
  isLightMode = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aj_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-1',
        sender: 'agent',
        text: 'Hello! 👋 How can we help you today with your AJDATASUB account?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem('aj_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    playTapSound();
    triggerHaptic('light');

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Contextual Automated Help Agent response
    setTimeout(() => {
      setIsTyping(false);
      let reply = 'Thank you for reaching out! Our dedicated support specialists are reviewing your inquiry. Please ensure you include your Transaction ID or recipient phone number if this relates to a purchase.';
      const lower = cleanText.toLowerCase();

      if (lower.includes('data') || lower.includes('megabyte') || lower.includes('gigabyte')) {
        reply = 'For data delivery inquiries: bundles vend within 5 to 60 seconds. If a recipient did not receive data, dial the carrier balance code (MTN: *323*4#, Airtel: *323#, Glo: *323#, 9mobile: *323#) or share the Transaction ID here.';
      } else if (lower.includes('fund') || lower.includes('wallet') || lower.includes('bank') || lower.includes('deposit')) {
        reply = 'For wallet funding: Automated virtual bank transfers (Monnify / XIXAPAY / PalmPay) credit instantly. If your bank debited you but wallet hasn’t reflected within 5 minutes, please paste the bank session ID or transfer receipt.';
      } else if (lower.includes('airtime')) {
        reply = 'Airtime top-ups are automated. Please confirm the phone number entered is active and capable of receiving VTU recharge.';
      }

      const agentReply: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentReply]);
      playSuccessChime();
    }, 1200);
  };

  const openWhatsApp = () => {
    playTapSound();
    triggerHaptic('medium');
    const waUrl = `https://wa.me/2347048609646?text=${encodeURIComponent(`Hello AJDATASUB support, I need assistance with my account (${user.phone}).`)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className={`min-h-screen flex flex-col ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#070e1e] text-slate-100'}`}>
      {/* Top App Bar */}
      <header className={`sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b ${
        isLightMode ? 'bg-white/95 border-slate-200 shadow-xs' : 'bg-[#0a152d]/95 border-slate-800/80 shadow-md'
      } backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playTapSound();
              onNavigateBack();
            }}
            className={`p-2 rounded-xl transition-colors ${
              isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              AJ
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight">Chat With Us</h1>
              <p className={`text-[11px] flex items-center gap-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                We're here to help you • Instant Support
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
          title="Switch to WhatsApp"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      </header>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full pb-28">
        <div className="text-center my-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium ${
            isLightMode ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-800/80 text-slate-400'
          }`}>
            <ShieldCheck size={12} className="text-emerald-500" />
            End-to-end encrypted official AJDATASUB Support Desk
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                  AJ
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-md px-4 py-3 rounded-2xl shadow-xs text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : isLightMode
                    ? 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    : 'bg-[#122244] text-slate-100 border border-slate-700/60 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                  isUser ? 'text-blue-100' : isLightMode ? 'text-slate-400' : 'text-slate-400'
                }`}>
                  <span>{msg.time}</span>
                  {isUser && <CheckCheck size={12} className="text-blue-200" />}
                </div>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              AJ
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5 ${
              isLightMode ? 'bg-white border border-slate-200' : 'bg-[#122244] border border-slate-700/60'
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className={`fixed bottom-0 left-0 right-0 p-3 sm:p-4 border-t ${
        isLightMode ? 'bg-white/95 border-slate-200' : 'bg-[#0a152d]/95 border-slate-800/80'
      } backdrop-blur-md`}>
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openWhatsApp}
            title="Attach details or chat on WhatsApp"
            className={`p-2.5 rounded-full transition-colors ${
              isLightMode ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition-all ${
              isLightMode
                ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                : 'bg-[#122244] border border-slate-700/70 text-slate-100 focus:bg-[#162a54] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }`}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
