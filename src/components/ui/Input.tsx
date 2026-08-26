import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full text-xs font-normal bg-white text-stone-900 placeholder:text-stone-400 border rounded-[6px] transition-colors focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 disabled:bg-stone-50 disabled:text-stone-400 ${
            leftIcon ? 'pl-8 pr-3' : 'px-3'
          } py-1.5 h-8 ${error ? 'border-rose-400' : 'border-stone-200 hover:border-stone-300'} ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
