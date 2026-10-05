import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Check, RefreshCw, Sparkles } from 'lucide-react';
import { triggerHaptic, playTapSound } from '../../utils/soundEffects';
import { FintechSpinner } from './ProfessionalLoader';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  isLightMode?: boolean;
  disabled?: boolean;
}

const PULL_THRESHOLD = 65;
const MAX_PULL = 95;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isLightMode = true,
  disabled = false,
}) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Check if element is at top
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop <= 0;
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isRefreshing) return;
    if (!isAtTop()) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    isDraggingRef.current = true;
    setHasTriggeredHaptic(false);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || startYRef.current === null || isRefreshing) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = clientY - startYRef.current;

    // Only pull down if at top
    if (diff > 0 && isAtTop()) {
      // Elastic resistance curve
      const dampened = Math.min(MAX_PULL, Math.pow(diff, 0.82) * 1.5);
      setPullY(dampened);

      // Trigger tactile haptic feedback once threshold is crossed
      if (dampened >= PULL_THRESHOLD && !hasTriggeredHaptic) {
        triggerHaptic('light');
        setHasTriggeredHaptic(true);
      } else if (dampened < PULL_THRESHOLD && hasTriggeredHaptic) {
        setHasTriggeredHaptic(false);
      }
    } else {
      setPullY(0);
    }
  };

  const executeRefresh = async () => {
    setIsRefreshing(true);
    setPullY(PULL_THRESHOLD * 0.85); // hold at neat indicator height
    playTapSound();

    try {
      await Promise.resolve(onRefresh());
      setShowSuccess(true);
      triggerHaptic('success');
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      // ignore
    } finally {
      setShowSuccess(false);
      setIsRefreshing(false);
      setPullY(0);
      startYRef.current = null;
      isDraggingRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || isRefreshing) return;
    isDraggingRef.current = false;

    if (pullY >= PULL_THRESHOLD) {
      executeRefresh();
    } else {
      setPullY(0);
    }
    startYRef.current = null;
  };

  const progress = Math.min(1, pullY / PULL_THRESHOLD);
  const isPastThreshold = pullY >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      className="relative w-full h-full overflow-y-auto overscroll-y-contain select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull Indicator Pill */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex justify-center items-center"
        style={{
          transform: `translateY(${Math.max(0, pullY - 45)}px)`,
          opacity: pullY > 8 || isRefreshing ? 1 : 0,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s',
        }}
      >
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg border text-xs font-semibold backdrop-blur-md transition-all ${
            showSuccess
              ? 'bg-emerald-500 text-white border-emerald-400'
              : isLightMode
              ? 'bg-white/95 text-slate-800 border-slate-200/90 shadow-slate-200/50'
              : 'bg-slate-800/95 text-slate-100 border-slate-700 shadow-black/40'
          }`}
        >
          {showSuccess ? (
            <>
              <Check size={14} className="stroke-[3]" />
              <span className="font-bold">Updated Just Now</span>
            </>
          ) : isRefreshing ? (
            <>
              <FintechSpinner size={14} color="#0047cc" />
              <span className="font-bold text-[#0047cc] dark:text-blue-400">Refreshing Jagora...</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: isPastThreshold ? 180 : progress * 180 }}
                transition={{ duration: 0.15 }}
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isPastThreshold ? 'bg-[#0047cc] text-white' : 'text-slate-500'
                }`}
              >
                <ArrowDown size={12} className="stroke-[2.5]" />
              </motion.div>
              <span>{isPastThreshold ? 'Release to refresh' : 'Pull down to refresh'}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content with spring offset when pulling */}
      <motion.div
        animate={{ y: pullY > 0 ? pullY * 0.75 : 0 }}
        transition={{
          type: isDraggingRef.current ? 'tween' : 'spring',
          damping: 24,
          stiffness: 280,
          duration: isDraggingRef.current ? 0 : 0.25,
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};
