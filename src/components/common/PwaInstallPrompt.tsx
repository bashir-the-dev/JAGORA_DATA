import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowUpRight, Share, PlusSquare } from 'lucide-react';

interface PwaInstallPromptProps {
  isLightMode?: boolean;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ isLightMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if dismissed recently (past 3 days)
    const lastDismissed = localStorage.getItem('jagora_pwa_dismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay showing for iOS users so they experience the app first
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    // Capture standard Chromium / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('jagora_pwa_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Sleek Floating Mobile Install Banner */}
      <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm mx-auto sm:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${
            isLightMode
              ? 'bg-white/95 border-blue-200/80 shadow-blue-500/10 text-slate-900'
              : 'bg-slate-900/95 border-blue-900/40 shadow-black/40 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0047cc] flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone size={20} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold tracking-tight truncate">
                  Install Jagora Mobile App
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 rounded-lg"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                Open directly from your phone home screen with zero browser bars & instant loading.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 min-h-[38px] px-3.5 rounded-xl bg-[#0047cc] hover:bg-[#003eb8] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Install App</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="px-3 min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl space-y-4 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0047cc]" />
                <h3 className="font-bold text-sm">Add to iPhone Home Screen</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 text-[#0047cc] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button{' '}
                  <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 text-[#0047cc] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Scroll down and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#0047cc] text-white font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
