'use client';
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
};

export default function Button({ variant = 'outline', style, ...rest }: Props) {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const base: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    background: isDark ? '#0f172a' : '#f8fafc',
    color: isDark ? '#e2e8f0' : '#0f172a',
    boxShadow: '0 4px 10px rgba(2,6,23,0.04)'
  };
  if (variant === 'primary') {
    base.background = 'var(--primary)';
    base.border = '1px solid var(--primary)';
    base.color = 'white';
  } else if (variant === 'ghost') {
    base.border = '1px solid transparent';
    base.background = 'transparent';
  }
  return <button data-ui="btn" data-variant={variant} {...rest} style={{ ...base, ...style }} />;
}


