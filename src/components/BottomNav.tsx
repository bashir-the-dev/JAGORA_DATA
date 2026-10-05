import React from 'react';
import { ScreenType } from '../types';
import { Home, History, Headphones, User } from 'lucide-react';
import { playTapSound, triggerHaptic } from '../utils/soundEffects';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isLightMode?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  isLightMode,
}) => {
  const tabs = [
    { id: 'home' as ScreenType, label: 'Home', icon: Home },
    { id: 'history' as ScreenType, label: 'History', icon: History },
    { id: 'support' as ScreenType, label: 'Support', icon: Headphones },
    { id: 'profile' as ScreenType, label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className={`md:hidden fixed bottom-0 z-40 left-1/2 -translate-x-1/2 w-full max-w-lg flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] pt-1 px-2 border-t transition-all duration-200 ${
        isLightMode
          ? 'bg-white/95 backdrop-blur-md border-slate-200/90 text-slate-600 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]'
          : 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-slate-400 shadow-[0_-4px_25px_rgba(0,0,0,0.4)]'
      }`}
    >
      <div className="flex justify-around items-center w-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                if (!isActive) {
                  playTapSound();
                  triggerHaptic('light');
                  onNavigate(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center transition-all duration-200 active:scale-95 py-0.5 px-3 min-w-[56px] min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-[#0047cc] dark:text-blue-400'
                  : isLightMode
                  ? 'text-slate-500 hover:text-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? isLightMode
                      ? 'bg-blue-50 text-[#0047cc]'
                      : 'bg-blue-950/70 text-blue-300'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-150 ${
                    isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[10.5px] font-heading mt-0.5 tracking-tight transition-all whitespace-nowrap ${
                  isActive
                    ? 'font-bold text-[#0047cc] dark:text-blue-400'
                    : isLightMode
                    ? 'font-medium text-slate-500'
                    : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
