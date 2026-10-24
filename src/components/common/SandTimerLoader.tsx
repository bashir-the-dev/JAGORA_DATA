import React from 'react';

export interface SandTimerLoaderProps {
  /** Size in pixels or preset variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Primary theme color for the hourglass frame */
  color?: string;
  /** Sand color */
  sandColor?: string;
  /** Optional status text label */
  text?: string;
  /** Optional secondary subtitle */
  subtext?: string;
  /** Extra CSS classes */
  className?: string;
}

export const SandTimerLoader: React.FC<SandTimerLoaderProps> = ({
  size = 'md',
  color = '#0047cc',
  sandColor = '#f59e0b',
  text,
  subtext,
  className = '',
}) => {
  // Resolve numeric pixel size
  const pxSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 16
      : size === 'sm'
      ? 20
      : size === 'md'
      ? 36
      : size === 'lg'
      ? 56
      : 76;

  return (
    <div className={`inline-flex flex-col items-center justify-center text-center ${className}`}>
      {/* Animated Sand Timer SVG */}
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: pxSize, height: pxSize }}
      >
        <svg
          width={pxSize}
          height={pxSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-[spin_4s_cubic-bezier(0.77,0,0.175,1)_infinite] drop-shadow-xs"
        >
          {/* Top / Bottom Glass Caps */}
          <rect x="8" y="4" width="32" height="3" rx="1.5" fill={color} />
          <rect x="8" y="41" width="32" height="3" rx="1.5" fill={color} />

          {/* Glass Outer Contour */}
          <path
            d="M12 7H36V13C36 18.5 29 22 24 24C19 22 12 18.5 12 13V7Z"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="opacity-70"
          />
          <path
            d="M12 41H36V35C36 29.5 29 26 24 24C19 26 12 29.5 12 35V41Z"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="opacity-70"
          />

          {/* Upper Sand Bulb (emptying) */}
          <path
            d="M15 11H33C33 15 28 19 24 21C20 19 15 15 15 11Z"
            fill={sandColor}
            className="animate-pulse"
          />

          {/* Falling Sand Trickle Line */}
          <line
            x1="24"
            y1="21"
            x2="24"
            y2="37"
            stroke={sandColor}
            strokeWidth="2"
            strokeDasharray="2 2"
            strokeLinecap="round"
            className="animate-[pulse_0.6s_ease-in-out_infinite]"
          />

          {/* Lower Sand Pyramid (accumulating) */}
          <path
            d="M15 39H33C33 36 28 33 24 33C20 33 15 36 15 39Z"
            fill={sandColor}
          />
        </svg>

        {/* Ambient subtle glow pulse */}
        <span
          className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping pointer-events-none"
          style={{ animationDuration: '2.5s' }}
        />
      </div>

      {/* Label and Subtext */}
      {text && (
        <span className="mt-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight block">
          {text}
        </span>
      )}
      {subtext && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">
          {subtext}
        </span>
      )}
    </div>
  );
};

export default SandTimerLoader;
