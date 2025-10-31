'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: 28, border: '1px solid #eef2ff' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Deen Tracker</div>
          <div style={{ color: '#64748b', marginTop: 4 }}>Welcome back. Please sign in.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>Email</label>
            <input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>Password</label>
            <input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
          </div>
          <button onClick={onLogin} disabled={loading} style={{ padding: '12px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          Don’t have an account? <a href="/signup" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Create one</a>
        </div>
      </div>
    </div>
  );
}


