import React from 'react';

export type BadgeVariant = 'ready' | 'contacted' | 'suppressed' | 'sending' | 'running' | 'scheduled' | 'sent' | 'failed' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const dotColors: Record<BadgeVariant, string> = {
    ready: 'bg-emerald-500',
    contacted: 'bg-sky-500',
    suppressed: 'bg-stone-500',
    sending: 'bg-amber-500 animate-pulse',
    running: 'bg-amber-500 animate-pulse',
    scheduled: 'bg-stone-400',
    sent: 'bg-emerald-600',
    failed: 'bg-rose-600',
    neutral: 'bg-stone-400',
  };

  const badgeStyles: Record<BadgeVariant, string> = {
    ready: 'bg-stone-100/80 text-stone-800 border-stone-200',
    contacted: 'bg-sky-50 text-sky-800 border-sky-200',
    suppressed: 'bg-stone-100 text-stone-700 border-stone-200',
    sending: 'bg-amber-50 text-amber-800 border-amber-200',
    running: 'bg-amber-50 text-amber-800 border-amber-200',
    scheduled: 'bg-stone-100 text-stone-700 border-stone-200',
    sent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    failed: 'bg-rose-50 text-rose-800 border-rose-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeStyles[variant]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  );
};
