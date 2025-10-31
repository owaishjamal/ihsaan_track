'use client';
import React from 'react';

export default function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const base: React.CSSProperties = {
    background: isDark ? 'linear-gradient(180deg, #0f172a, #0b1220)' : 'white',
    border: `1px solid ${isDark ? '#1e293b' : '#eef2ff'}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 8px 24px rgba(2,6,23,0.06)'
  };
  return <div style={{ ...base, ...style }}>{children}</div>;
}


