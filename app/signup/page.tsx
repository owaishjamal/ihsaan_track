'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        setLoading(false);
        setError(authError.message);
        return;
      }

      // Check if user was created
      if (!authData.user) {
        setLoading(false);
        setError('Failed to create user account. Please try again.');
        return;
      }

      // Step 2: Check if session is available (depends on email confirmation settings)
      // Try to get session - if email confirmation is disabled, session will be available immediately
      let session = authData.session;
      
      if (!session) {
        // Wait a bit and try again (session might be establishing)
        await new Promise(resolve => setTimeout(resolve, 1000));
        session = (await supabase.auth.getSession()).data.session;
      }

      // If still no session, email confirmation might be required
      if (!session) {
        setLoading(false);
        setError('Please check your email to confirm your account. After confirmation, you can log in.');
        return;
      }

      // Step 3: Create profile with the session token
      const token = session.access_token;
      const profileResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: name || (email.split('@')[0]) })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({ error: 'Failed to create profile' }));
        setLoading(false);
        setError(errorData.error || 'Failed to create profile. Please try again.');
        return;
      }

      const newProfile = await profileResponse.json();
      if (!newProfile || !newProfile.id) {
        setLoading(false);
        setError('Profile created but invalid response. Please try logging in.');
        return;
      }

      // Step 4: Success - redirect to home
      setLoading(false);
      window.location.href = '/';
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4, #eef2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: 28, border: '1px solid #eef2ff' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Create your account</div>
          <div style={{ color: '#64748b', marginTop: 4 }}>Start tracking your Deen and personal goals.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>Name</label>
            <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>Email</label>
            <input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6 }}>Password</label>
            <input placeholder="Create a password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' }} />
          </div>
          <button onClick={onSignup} disabled={loading} style={{ padding: '12px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
          {error && <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          Already have an account? <a href="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}


