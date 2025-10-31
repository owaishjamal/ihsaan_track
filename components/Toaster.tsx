'use client';
import React, { useEffect, useState } from 'react';

type Toast = { id: number; message: string };

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message } }));
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string };
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: detail.message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: '#0ea5e9', color: 'white', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}


