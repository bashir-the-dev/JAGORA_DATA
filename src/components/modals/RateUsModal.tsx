import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  X,
  Sparkles,
  Send,
  Heart,
  CheckCircle2,
  MessageSquare,
  Users,
  ShieldCheck,
  ThumbsUp,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { saveUserFeedback } from '../../services/dbService';
import {
  playTapSound,
  playSuccessChime,
  triggerConfetti,
  triggerHaptic,
} from '../../utils/soundEffects';

interface RateUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isLightMode?: boolean;
}

const RATING_FEEDBACK: Record<
  number,
  { label: string; description: string; emoji: string; badgeColor: string }
> = {
  1: {
    label: 'Needs Major Improvement',
    description: 'We are sorry about your experience. Please tell us what went wrong.',
    emoji: '😞',
    badgeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900',
  },
  2: {
    label: 'Below Expectations',
    description: 'We can definitely do better. What could we improve?',
    emoji: '🙁',
    badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  },
  3: {
    label: 'Good & Satisfactory',
    description: 'Thanks! What would make your experience a 5-star one?',
    emoji: '🙂',
    badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  },
  4: {
    label: 'Very Good!',
    description: 'Great to hear! Any suggestions to make us even better?',
    emoji: '😃',
    badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  },
  5: {
    label: 'Exceptional & Super Fast!',
    description: 'Awesome! Thank you for trusting Al\'amin Jagora Data.',
    emoji: '🌟',
    badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
};

const SUGGESTION_TAGS = [
  'Instant VTU Speed',
  'Data Pricing',
  'Wallet Funding',
  'App Reliability',
  'Customer Care',
  'New Features',
];

export const RateUsModal: React.FC<RateUsModalProps> = ({
  isOpen,
  onClose,
  user,
  isLightMode = false,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('Instant VTU Speed');
  const [contactConsent, setContactConsent] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const activeRating = hoverRating || rating;
  const ratingDetails = RATING_FEEDBACK[activeRating] || RATING_FEEDBACK[5];

  const handleSelectStar = (stars: number) => {
    playTapSound();
    triggerHaptic('light');
    setRating(stars);
  };

  const handleTagClick = (tag: string) => {
    playTapSound();
    triggerHaptic('light');
    setSelectedTag((prev) => (prev === tag ? '' : tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await saveUserFeedback({
        phone: user.phone,
        name: user.name,
        rating,
        category: selectedTag || 'General',
        suggestion: suggestion.trim(),
        contactConsent,
      });

      playSuccessChime();
      triggerConfetti();
      triggerHaptic('success');
      setSubmitted(true);
    } catch {
      // Fallback
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    playTapSound();
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setSuggestion('');
      setRating(5);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`relative w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border z-10 overflow-hidden flex flex-col max-h-[92vh] ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          {/* Header Banner */}
          <div className="relative px-5 py-4 bg-gradient-to-r from-[#0047cc] to-[#002f8a] text-white flex items-center justify-between border-b border-blue-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
                <Star size={18} className="fill-amber-300 text-amber-300" />
              </div>
              <div>
                <h3 className="font-sans text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>Rate Your Experience</span>
                  <Sparkles size={14} className="text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 font-medium">
                  Help us make Al'amin Jagora Data even better
                </p>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {submitted ? (
              /* Success / Thank You View */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 px-2 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={36} className="stroke-[2.5]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Your {rating}-star review and suggestions help us deliver the most reliable telecom services across Nigeria.
                  </p>
                </div>

                {/* Rating summary pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span>{ratingDetails.label}</span>
                </div>

                {/* Community or Close buttons */}
                <div className="pt-2 space-y-2">
                  <a
                    href="https://chat.whatsapp.com/JagoraOfficialGroup"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playTapSound();
                      triggerHaptic('light');
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Users size={16} />
                    <span>Join Jagora WhatsApp Community</span>
                  </a>

                  <button
                    onClick={handleResetAndClose}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Rating Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Selection Row */}
                <div className="text-center space-y-2 pt-1 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tap to Rate Our Service
                  </span>

                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= activeRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSelectStar(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 sm:p-1.5 rounded-xl transition-all active:scale-90 hover:scale-110 focus:outline-none cursor-pointer"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={32}
                            className={`transition-colors duration-150 sm:w-9 sm:h-9 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Rating Badge */}
                  <div className="pt-1 flex flex-col items-center gap-1">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all ${ratingDetails.badgeColor}`}
                    >
                      <span>{ratingDetails.emoji}</span>
                      <span>{ratingDetails.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {ratingDetails.description}
                    </p>
                  </div>
                </div>

                {/* Focus Category Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>What stood out most?</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTION_TAGS.map((tag) => {
                      const isSelected = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagClick(tag)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0047cc] text-white border-[#0047cc] shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions Input Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="user-suggestion-input"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <MessageSquare size={13} className="text-[#0047cc] dark:text-blue-400" />
                      <span>Your Suggestions & Feedback</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {suggestion.length}/400
                    </span>
                  </div>

                  <textarea
                    id="user-suggestion-input"
                    rows={3}
                    maxLength={400}
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Tell us what you love or what new data bundles, airtime features, or payment methods you would like us to add..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047cc]/30 transition-all resize-none font-sans"
                  />
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 group">
                  <input
                    type="checkbox"
                    checked={contactConsent}
                    onChange={(e) => {
                      playTapSound();
                      setContactConsent(e.target.checked);
                    }}
                    className="mt-0.5 rounded text-[#0047cc] focus:ring-[#0047cc] border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Allow Jagora support to contact me on WhatsApp ({user.phone}) if my suggestion requires follow-up.
                  </span>
                </label>

                {/* Submission Action */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 bg-[#0047cc] hover:bg-[#003eb8] disabled:opacity-60 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Rating'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default RateUsModal;
