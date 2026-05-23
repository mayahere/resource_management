import React from 'react';
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  className?: string;
}
export function Badge({
  children,
  variant = 'neutral',
  className = ''
}: BadgeProps) {
  const baseClasses =
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-slate-100 text-slate-800',
    primary: 'bg-indigo-100 text-indigo-800'
  };
  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>);

}