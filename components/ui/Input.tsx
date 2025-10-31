'use client';
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const style: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 8,
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#0f172a',
    outline: 'none'
  };
  return <input {...props} style={{ ...style, ...(props.style || {}) }} />;
}


