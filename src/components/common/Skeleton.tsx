import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'light' | 'dark' | 'blue' | 'glass';
}

/**
 * Base shimmering skeleton block with a smooth gradient wave effect.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'light',
  ...props
}) => {
  const getVariantBg = () => {
    switch (variant) {
      case 'blue':
        return 'bg-white/20';
      case 'glass':
        return 'bg-white/10 dark:bg-slate-800/60';
      case 'dark':
        return 'bg-slate-700/60';
      case 'light':
      default:
        return 'bg-slate-200/80 dark:bg-slate-800/80';
    }
  };

  const getShimmerGradient = () => {
    if (variant === 'blue') {
      return 'via-white/35';
    }
    return 'via-white/50 dark:via-slate-600/40';
  };

  return (
    <div
      className={`relative overflow-hidden ${getVariantBg()} ${className}`}
      {...props}
    >
      <div
        className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent ${getShimmerGradient()} to-transparent pointer-events-none`}
      />
    </div>
  );
};

/**
 * Shimmering skeleton for the Wallet Balance card on the Dashboard.
 */
export const BalanceCardSkeleton: React.FC<{ isLightMode?: boolean }> = () => {
  return (
    <section
      id="dashboard-wallet-card-skeleton"
      className="rounded-[22px] p-5 sm:p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-[#003da5] via-[#0047cc] to-[#0052e0] border border-white/15"
      aria-label="Loading wallet balance"
    >
      <div className="relative z-10 space-y-3.5">
        {/* Balance Header & Bonus */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="blue" className="w-24 h-3.5 rounded-md" />
            <Skeleton variant="blue" className="w-5 h-5 rounded-md" />
          </div>
          <Skeleton variant="blue" className="w-28 h-6 rounded-full" />
        </div>

        {/* Big Amount Placeholder */}
        <div className="py-1">
          <Skeleton variant="blue" className="w-48 sm:w-56 h-9 sm:h-10 rounded-xl" />
        </div>

        {/* Dedicated Virtual Account Box */}
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="blue" className="w-36 h-2.5 rounded-sm" />
              <Skeleton variant="blue" className="w-32 sm:w-40 h-5 rounded-md" />
              <Skeleton variant="blue" className="w-28 h-2.5 rounded-sm" />
            </div>
            <Skeleton variant="blue" className="w-16 h-7 rounded-lg shrink-0" />
          </div>
        </div>

        {/* Quick Fund & Airtime Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Skeleton variant="blue" className="h-10 rounded-xl" />
          <Skeleton variant="blue" className="h-10 rounded-xl" />
        </div>
      </div>
    </section>
  );
};

/**
 * Single shimmering row for transaction lists.
 */
export const TransactionItemSkeleton: React.FC<{ isLightMode?: boolean }> = ({ isLightMode }) => {
  return (
    <div
      className={`p-3.5 flex items-center justify-between gap-3 ${
        isLightMode ? 'bg-white' : 'bg-slate-800/90'
      }`}
    >
      {/* Icon & Details */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton
          className={`w-10 h-10 rounded-xl shrink-0 ${
            isLightMode ? 'bg-slate-200' : 'bg-slate-700/70'
          }`}
        />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton
            className={`h-3.5 rounded-md w-32 sm:w-40 ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700/70'
            }`}
          />
          <Skeleton
            className={`h-2.5 rounded-md w-24 sm:w-32 ${
              isLightMode ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          />
        </div>
      </div>

      {/* Amount & Status Badge */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Skeleton
          className={`h-3.5 rounded-md w-16 sm:w-20 ${
            isLightMode ? 'bg-slate-200' : 'bg-slate-700/70'
          }`}
        />
        <Skeleton
          className={`h-4 rounded-full w-14 ${
            isLightMode ? 'bg-emerald-100/60' : 'bg-emerald-950/40'
          }`}
        />
      </div>
    </div>
  );
};

/**
 * Shimmering skeleton for the Recent Activity section.
 */
export const RecentTransactionsSkeleton: React.FC<{
  count?: number;
  isLightMode?: boolean;
}> = ({ count = 4, isLightMode = true }) => {
  return (
    <section className="space-y-3 pt-1" aria-label="Loading recent activity">
      <div className="flex justify-between items-center">
        <Skeleton
          className={`h-4 w-28 rounded-md ${
            isLightMode ? 'bg-slate-200' : 'bg-slate-700'
          }`}
        />
        <Skeleton
          className={`h-3 w-16 rounded-md ${
            isLightMode ? 'bg-slate-200' : 'bg-slate-700'
          }`}
        />
      </div>

      <div
        className={`rounded-2xl border shadow-xs divide-y overflow-hidden ${
          isLightMode
            ? 'bg-white border-slate-200/80 divide-slate-100'
            : 'bg-slate-800/90 border-slate-700/60 divide-slate-700/50'
        }`}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <TransactionItemSkeleton key={idx} isLightMode={isLightMode} />
        ))}
      </div>
    </section>
  );
};

/**
 * Full Dashboard Skeleton screen for cold boots or full-page data fetches.
 */
export const FullDashboardSkeleton: React.FC<{ isLightMode?: boolean }> = ({
  isLightMode = true,
}) => {
  return (
    <div
      id="dashboard-full-skeleton"
      className="px-4 sm:px-5 py-4 space-y-4 pb-28 max-w-lg mx-auto animate-in fade-in duration-300"
      aria-label="Loading dashboard data"
    >
      {/* 1. Greeting Skeleton */}
      <section className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton
            className={`h-3 w-32 rounded-md ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
            }`}
          />
          <Skeleton
            className={`h-5 w-48 sm:w-56 rounded-md ${
              isLightMode ? 'bg-slate-300' : 'bg-slate-600'
            }`}
          />
        </div>
        <Skeleton
          className={`h-7 w-20 rounded-full ${
            isLightMode ? 'bg-slate-200' : 'bg-slate-700'
          }`}
        />
      </section>

      {/* 2. Wallet Balance Card Skeleton */}
      <BalanceCardSkeleton isLightMode={isLightMode} />

      {/* 3. Quick Telecom Services Skeleton */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <Skeleton
            className={`h-3.5 w-32 rounded-md ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
            }`}
          />
          <Skeleton
            className={`h-3 w-20 rounded-md ${
              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
            }`}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square w-full rounded-2xl border flex flex-col items-center justify-center p-1.5 sm:p-2.5 ${
                isLightMode
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <Skeleton
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl mb-1 sm:mb-1.5 ${
                  isLightMode ? 'bg-slate-200' : 'bg-slate-700'
                }`}
              />
              <Skeleton
                className={`h-2.5 sm:h-3 w-10 sm:w-12 rounded-md ${
                  isLightMode ? 'bg-slate-200' : 'bg-slate-700'
                }`}
              />
              <Skeleton
                className={`h-2 w-7 sm:w-8 rounded-md mt-0.5 ${
                  isLightMode ? 'bg-slate-100' : 'bg-slate-700/60'
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent Activity Skeleton */}
      <RecentTransactionsSkeleton count={4} isLightMode={isLightMode} />
    </div>
  );
};
