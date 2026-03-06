import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CountUp } from './CountUp';

interface TrustedUsersProps {
  avatars: string[];
  rating?: number;
  totalUsersText?: number;
  caption?: string;
  className?: string;
  starColorClass?: string;
  ringColors?: string[];
  pricingLabel?: string;
}

export const TrustedUsers: React.FC<TrustedUsersProps> = ({
  avatars,
  rating = 5,
  totalUsersText = 1000,
  caption = 'Aprovado por',
  className = '',
  starColorClass = 'text-yellow-400',
  ringColors = [],
  pricingLabel = 'clientes satisfeitos',
}) => {
  return (
    <div className={cn('flex items-center justify-center gap-6 bg-transparent py-4 px-4', className)}>
      <div className="flex -space-x-3">
        {avatars.map((src, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-transparent ${ringColors[i] || 'ring-purple-500'}`}
            style={{ zIndex: avatars.length - i }}
          >
            <img src={src} alt={`Avatar ${i + 1}`} width={40} height={40} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className={`flex gap-1 ${starColorClass}`}>
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} fill="currentColor" className="w-4 h-4" aria-hidden="true" />
          ))}
        </div>
        <div className="text-sm font-medium flex items-center flex-wrap gap-1" style={{ color: 'var(--text)' }}>
          {caption}
          <CountUp value={totalUsersText} duration={2} separator="," className="text-lg font-bold" suffix="+" colorScheme="gradient" />
          <span className="gradient-text font-semibold">{pricingLabel}</span>
        </div>
      </div>
    </div>
  );
};
