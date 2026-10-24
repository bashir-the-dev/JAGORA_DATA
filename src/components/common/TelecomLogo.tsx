import React, { useState } from 'react';
import {
  TelecomNetworkId,
  normalizeNetworkId,
  getTelecomAssetCandidates,
} from '../../utils/telecomIcons';

interface TelecomLogoProps {
  network: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

export const TelecomLogo: React.FC<TelecomLogoProps> = ({
  network,
  size = 'md',
  className = '',
  alt,
}) => {
  const rawNet = String(network || 'mtn').trim();
  const normId = normalizeNetworkId(rawNet) || (rawNet.toLowerCase() as TelecomNetworkId);
  const candidates = getTelecomAssetCandidates(normId);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Size dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px] rounded-lg',
    sm: 'w-8 h-8 text-[11px] rounded-xl',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-14 h-14 text-base rounded-2xl',
    '2xl': 'w-16 h-16 text-lg rounded-2xl',
  }[size];

  const getNetworkInitials = (id: string) => {
    const clean = String(id || '').toLowerCase();
    switch (clean) {
      case 'mtn':
        return 'MTN';
      case 'airtel':
        return 'AIR';
      case 'glo':
        return 'GLO';
      case '9mobile':
        return '9MOB';
      default:
        return clean ? clean.slice(0, 3).toUpperCase() : 'TEL';
    }
  };

  const handleImageError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const currentSrc = candidates[candidateIndex];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${sizeClasses} ${className}`}
      title={`Telecom Provider: ${String(normId || '').toUpperCase()}`}
    >
      {!hasFailedAll ? (
        <div className="w-full h-full p-1 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <img
            src={currentSrc}
            alt={alt || `${normId} logo`}
            className="w-full h-full object-contain"
            onError={handleImageError}
            loading="lazy"
          />
        </div>
      ) : (
        /* Clean Status Quo Typographic Placeholder if image file not inserted */
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold">
          <span className="tracking-tight uppercase font-mono leading-none">
            {getNetworkInitials(normId)}
          </span>
        </div>
      )}
    </div>
  );
};
