import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface LoadingScreenProps {
  /** Reassuring message displayed to the user */
  message?: string;
  /** Secondary subtitle or platform tagline */
  subtext?: string;
  /** Whether the current active theme is light mode */
  isLightMode?: boolean;
  /** Whether the loader occupies the full viewport or fills its parent container */
  fullScreen?: boolean;
  /** Visual variant: 'fullscreen' default, 'overlay' with backdrop blur, or 'inline' */
  variant?: 'fullscreen' | 'overlay' | 'inline';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Connecting to Telecom Gateway...',
  subtext = 'Automated VTU & Telecom Switch',
  isLightMode = true,
  fullScreen = true,
  variant = 'fullscreen',
}) => {
  const isOverlay = variant === 'overlay';

  const containerClasses = fullScreen
    ? isOverlay
      ? 'fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md'
      : `fixed inset-0 z-50 flex flex-col items-center justify-center p-6 transition-colors duration-200 ${
          isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'
        }`
    : `w-full h-full min-h-[320px] flex flex-col items-center justify-center p-6 rounded-3xl transition-colors duration-200 ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'
      }`;

  return (
    <AnimatePresence>
      <motion.div
        id="app-loading-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={containerClasses}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-xs"
        >
          {/* Radar Ripple & Orbital Ring Stage */}
          <div className="relative flex items-center justify-center w-28 h-28 mb-5">
            {/* Concentric Radar Waves */}
            <motion.div
              animate={{
                scale: [0.85, 1.4, 1.65],
                opacity: [0.65, 0.2, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className={`absolute w-24 h-24 rounded-full border ${
                isLightMode
                  ? 'border-[#0047cc]/30 bg-[#0047cc]/5'
                  : 'border-[#0047cc]/40 bg-[#0047cc]/10'
              }`}
            />
            <motion.div
              animate={{
                scale: [0.85, 1.4, 1.65],
                opacity: [0.55, 0.15, 0],
              }}
              transition={{
                duration: 2.4,
                delay: 0.8,
                repeat: Infinity,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="absolute w-24 h-24 rounded-full border border-sky-400/30"
            />

            {/* Rotating Orbital SVG Ring */}
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              className="absolute w-24 h-24 pointer-events-none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="react-loader-orbital" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0047cc" stopOpacity="1" />
                  <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
                strokeWidth="2.5"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#react-loader-orbital)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="140 140"
              />
            </motion.svg>

            {/* Centered Brand Avatar with breathing animation */}
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                boxShadow: isLightMode
                  ? [
                      '0 8px 24px rgba(0, 71, 204, 0.15)',
                      '0 12px 30px rgba(0, 71, 204, 0.25)',
                      '0 8px 24px rgba(0, 71, 204, 0.15)',
                    ]
                  : [
                      '0 8px 24px rgba(0, 71, 204, 0.35)',
                      '0 12px 32px rgba(56, 189, 248, 0.45)',
                      '0 8px 24px rgba(0, 71, 204, 0.35)',
                    ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 w-20 h-20 rounded-2xl bg-[#0055ff] p-1 border-2 border-white/30 shadow-2xl overflow-hidden flex items-center justify-center"
            >
              <img
                src="/logo.png"
                alt="AJDATASUB"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>

          {/* Brand Name & Hierarchy */}
          <h2
            className={`text-base font-extrabold uppercase tracking-wide mb-1 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}
          >
            AJDATASUB
          </h2>

          <p
            className={`text-xs font-semibold tracking-normal mb-5 ${
              isLightMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {subtext}
          </p>

          {/* Fintech Micro-Progress Bar */}
          <div
            className={`w-44 h-1 rounded-full overflow-hidden relative mb-3.5 ${
              isLightMode ? 'bg-slate-200/80' : 'bg-slate-800/80'
            }`}
          >
            <motion.div
              animate={{
                x: ['-100%', '220%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute h-full w-2/5 rounded-full bg-gradient-to-r from-[#0047cc] via-sky-400 to-emerald-400"
            />
          </div>

          {/* Dynamic Connection Status Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="truncate max-w-[240px]">{message}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
