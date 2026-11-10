import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[.98] shadow-sm',
  outline: 'border border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white',
  ghost: 'text-ink-600 hover:bg-ink-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[.98]',
  admin: 'rounded-lg bg-ink-900 px-4 py-2 text-white hover:bg-ink-800 active:scale-[.98]',
  'admin-outline': 'rounded-lg border border-ink-200 bg-white px-4 py-2 text-ink-700 hover:bg-ink-50',
  'admin-danger': 'rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 active:scale-[.98]',
  'admin-success': 'rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 active:scale-[.98]',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-sm',
};

/**
 * Nút bấm dùng chung.
 * - `loading` hiện spinner + disable
 * - `icon` là ReactNode đặt trước text
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, icon, children, className = '', type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`btn ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
});

export default Button;