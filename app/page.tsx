'use client';
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/Toaster';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Lazy load heavy components
const IslamicFeatures = lazy(() => import('@/components/IslamicFeatures').then(m => ({ default: m.IslamicFeatures })));
const Analytics = lazy(() => import('@/components/Analytics').then(m => ({ default: m.Analytics })));

export default function Page() {
  const [profiles, setProfiles] = useState<Array<{id: string, name: string, user_id?: string}>>([]);
  const [entries, setEntries] = useState<Record<string, Record<string, any>>>({});
  const [newPersonName, setNewPersonName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && (localStorage.getItem('theme') as 'light' | 'dark')) || 'light');
  const [badgesByProfile, setBadgesByProfile] = useState<Record<string, { label: string; achieved: boolean; remaining: number }>>({});

  // Memoize quotes to prevent recreation on every render
  const quotes = useMemo(() => [
    'Indeed, in the remembrance of Allah do hearts find rest. (Qur\'an 13:28)',
    'The most beloved deeds to Allah are those done consistently, even if small.',
    'Whoever comes to Me walking, I go to him at speed. (Hadith Qudsi)',
    'Be mindful of Allah, and He will protect you. (Tirmidhi)',
    'And whoever relies upon Allah – then He is sufficient for him. (Qur\'an 65:3)',
    'Verily with hardship comes ease. (Qur\'an 94:6)'
  ], []);
  
  const headerQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], [quotes]);
  
  const flowingQuotes = useMemo(() => [
    '"Indeed, with hardship comes ease." (Qur\'an 94:6)',
    '"So remember Me; I will remember you." (Qur\'an 2:152)',
    '"The most beloved deeds to Allah are those done regularly." (Bukhari)',
    '"Whoever relies upon Allah, He is sufficient for him." (Qur\'an 65:3)',
    '"Prayer is the light of the believer."',
    '"The best among you are those who learn the Qur\'an and teach it." (Bukhari)',
    '"Keep your tongue moist with the remembrance of Allah." (Tirmidhi)'
  ], []);

  // Load profiles from API
  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('Loaded profiles from API:', data);
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Load entries from API
  const loadEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('Loaded entries from API:', data);
      
      // Transform array to object with keys like `${profileId}-${date}`
      const entriesObj: Record<string, any> = {};
      if (Array.isArray(data)) {
        data.forEach(entry => {
          const key = `${entry.profile_id}-${entry.day}`;
          entriesObj[key] = entry;
        });
      }
      
      setEntries(entriesObj);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadProfiles(), loadEntries()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Track auth state for showing login/logout
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setUserEmail(data.session?.user?.email || null);
      setUserId(data.session?.user?.id || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      setUserId(session?.user?.id || null);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

// Select current user's profile if available
useEffect(() => {
  if (!selectedProfileId && userId) {
    const mine = profiles.find(p => p.user_id === userId);
    if (mine) setSelectedProfileId(mine.id);
    }
}, [profiles, selectedProfileId, userId]);

  const toggleField = async (profileId: string, field: string) => {
    // Guard: only allow toggles on own profile
    if (!userId) return;
    const mine = profiles.find(p => p.user_id === userId);
    if (!mine || mine.id !== profileId) return;
    if (process.env.NODE_ENV === 'development') console.log('Toggling field:', profileId, field);
    const currentEntry = entries[`${profileId}-${currentDate}`] || {};
    const newValue = !currentEntry[field];
    
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const response = await authFetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          day: currentDate,
          [field]: newValue
        }),
      });
      
      if (response.ok) {
        const updatedEntry = await response.json();
        setEntries(prev => ({
          ...prev,
          [`${profileId}-${currentDate}`]: updatedEntry
        }));
        if (process.env.NODE_ENV === 'development') console.log('Field updated successfully');
        toast('Updated');
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const updateCount = async (profileId: string, delta: number) => {
    // Guard: only allow updates on own profile
    if (!userId) return;
    const mine = profiles.find(p => p.user_id === userId);
    if (!mine || mine.id !== profileId) return;
    const currentEntry = entries[`${profileId}-${currentDate}`] || {};
    const newValue = (currentEntry.istighfar_count || 0) + delta;
    
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const response = await authFetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          day: currentDate,
          istighfar_count: newValue
        }),
      });
      
      if (response.ok) {
        const updatedEntry = await response.json();
        setEntries(prev => ({
          ...prev,
          [`${profileId}-${currentDate}`]: updatedEntry
        }));
        if (process.env.NODE_ENV === 'development') console.log('Count updated successfully');
        toast('Saved');
        loadBadges();
      }
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) return;
    
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const response = await authFetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPersonName.trim()
        }),
      });
      
      if (response.ok) {
        const newProfile = await response.json();
        if (process.env.NODE_ENV === 'development') console.log('New profile created:', newProfile);
        setProfiles(prev => [...prev, newProfile]);
        setNewPersonName('');
      } else {
        const error = await response.json();
        console.error('Error creating profile:', error);
        alert('Failed to add person: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to add person');
    }
  };

  // Calculate progress for selected profile - memoized
  const calculateProgress = useMemo(() => {
    return (profileId?: string) => {
      const targetProfileId = profileId || selectedProfileId;
      if (!targetProfileId) return { completion: 0, onTime: 0, istighfar: 0 };

      const totalFields = 11; // fajr, dhuhr, asr, maghrib, isha, morning_dhikr, evening_dhikr, tahajjud, yaseen_after_fajr, mulk_before_sleep, before_sleep_dhikr
      let totalCompleted = 0;
      let totalIstighfar = 0;

      // Get last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      // Calculate for each day in the last 7 days
      last7Days.forEach(day => {
        const entry = entries[`${targetProfileId}-${day}`] || {};
        
        // Count completed fields for this day
        const fields = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'morning_dhikr', 'evening_dhikr', 'tahajjud', 'yaseen_after_fajr', 'mulk_before_sleep', 'before_sleep_dhikr'];
        fields.forEach(field => {
          if (entry[field]) totalCompleted++;
        });
        
        // Add Istighfar count for this day
        totalIstighfar += entry.istighfar_count || 0;
      });

      const totalPossible = totalFields * 7; // 11 fields × 7 days
      const completionPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
      const onTimePercentage = Math.round(completionPercentage * 0.8); // Simplified calculation

      return {
        completion: completionPercentage,
        onTime: onTimePercentage,
        istighfar: totalIstighfar
      };
    };
  }, [selectedProfileId, currentDate, entries]);

  const progress = useMemo(() => calculateProgress(), [calculateProgress]);
  const [tasks, setTasks] = useState<Array<{id: string, title: string, is_done: boolean, user_id?: string}>>([]);
  const [newTask, setNewTask] = useState('');

  const loadTasks = React.useCallback(async () => {
    try {
      const date = currentDate;
      const { authFetch } = await import('@/lib/authFetch');
      const res = await authFetch(`/api/tasks?date=${date}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to load tasks', e); }
  }, [currentDate]);

  useEffect(() => { if (userId) loadTasks(); }, [currentDate, userId, loadTasks]);

  // Badges (daily dhikr progress -> badge)
  const computeBadge = React.useCallback((counts: any) => {
    const istighfar = typeof counts === 'number' ? counts : (counts?.istighfar_count || 0);
    const defs = [
      { label: 'Istighfar Novice', threshold: 33 },
      { label: 'Istighfar Seeker', threshold: 100 },
      { label: 'Istighfar Devoted', threshold: 500 },
      { label: 'Istighfar Champion', threshold: 1000 }
    ];
    const withProgress = defs.map(d => {
      const cur = istighfar;
      return { ...d, current: cur, achieved: cur >= d.threshold, remaining: Math.max(0, d.threshold - cur) };
    });
    const achieved = withProgress.filter(b => b.achieved).sort((a,b)=>a.threshold-b.threshold);
    if (achieved.length > 0) {
      const top = achieved[achieved.length - 1];
      return { label: top.label, achieved: true, remaining: 0 };
    }
    const next = withProgress.filter(b => !b.achieved).sort((a,b)=>a.threshold-b.threshold)[0];
    return next ? { label: next.label, achieved: false, remaining: next.remaining } : { label: 'Keep going', achieved: false, remaining: 0 };
  }, []);

  const loadBadges = React.useCallback(() => {
    try {
      const results: Record<string, { label: string; achieved: boolean; remaining: number }> = {};
      profiles.forEach(p => {
        const entry = entries[`${p.id}-${currentDate}`] || {};
        results[p.id] = computeBadge(entry.istighfar_count || 0);
      });
      setBadgesByProfile(results);
    } catch (e) { console.error('Failed to compute badges', e); }
  }, [profiles, currentDate, entries, computeBadge]);

  useEffect(() => { if (profiles.length) loadBadges(); }, [profiles, currentDate, entries, loadBadges]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const res = await authFetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTask.trim(), date: currentDate }) });
      if (res.ok) {
        setNewTask('');
        loadTasks();
        toast('Task added');
      }
    } catch (e) { console.error('Failed to add task', e); }
  };

  const toggleTask = async (id: string, is_done: boolean) => {
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const res = await authFetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_done }) });
      if (res.ok) {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done } : t));
      }
    } catch (e) { console.error('Failed to update task', e); }
  };

  const exportData = () => {
    const data = {
      profiles,
      entries,
      exportDate: new Date().toISOString(),
      currentDate,
      progress
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ihsaan-track-export-${currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading profiles and data from database</div>
        </div>
      </div>
    );
  }

  // Resolve my profile and others
  const myProfile = userId ? profiles.find(p => p.user_id === userId) : undefined;
  const otherProfiles = userId ? profiles.filter(p => p.user_id !== userId) : profiles;

  // Helper to create my tracker profile if missing
  const createMyTracker = async () => {
    const defaultName = userEmail ? userEmail.split('@')[0] : 'Me';
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const res = await authFetch('/api/profiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: defaultName })
      });
      if (res.ok) {
        const p = await res.json();
        setProfiles(prev => [...prev, p]);
        setSelectedProfileId(p.id);
      }
    } catch (e) { console.error('Failed to create my tracker', e); }
  };

  const isDark = theme === 'dark';
  const pageBg = isDark ? '#0b1220' : '#f8fafc';
  const cardBgGrad = isDark ? 'linear-gradient(180deg, #0f172a, #0b1220)' : 'linear-gradient(180deg, #ffffff, #eef2ff)';
  const cardBorder = isDark ? '#1e293b' : '#eef2ff';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const textPrimary = isDark ? '#e2e8f0' : '#0f172a';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: pageBg, padding: 'clamp(12px, 4vw, 20px)' }}>
      {/* Header */}
      <div className="card-hover" style={{ position: 'sticky', top: 0, zIndex: 30, background: cardBgGrad, padding: 'clamp(12px, 3vw, 20px)', marginBottom: 'clamp(12px, 3vw, 20px)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(2,6,23,0.12)', border: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Logo and Title Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ position: 'relative', width: 'clamp(32px, 8vw, 36px)', height: 'clamp(32px, 8vw, 36px)', borderRadius: 8, overflow: 'hidden', flex: '0 0 auto' }}>
                {/* Fallback SVG (always present) */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: '100%' }}>
                  <rect width="36" height="36" rx="8" fill={`url(#logoGradient${theme})`}/>
                  <path d="M18 10L20.5 14.5L26 17L20.5 19.5L18 24L15.5 19.5L10 17L15.5 14.5L18 10Z" fill="white" opacity="0.95"/>
                  <defs>
                    <linearGradient id={`logoGradient${theme}`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor={isDark ? '#2563EB' : '#2563EB'}/>
                      <stop offset="1" stopColor={isDark ? '#1D4ED8' : '#1D4ED8'}/>
                    </linearGradient>
                  </defs>
                </svg>
                {/* Provided PNG overlaid (auto-hides if missing) */}
                <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <Image src="/logo_ihsaantrack.png" alt="IhsaanTrack logo" width={36} height={36} className="object-cover" priority onError={(e) => { try { (e.currentTarget as HTMLImageElement).style.display = 'none'; } catch {} }} />
                </div>
              </div>
              <h1 className="heading-accent" style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, margin: 0, color: textPrimary }}>IhsaanTrack</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', color: textMuted, fontSize: 'clamp(12px, 3vw, 14px)' }}>{headerQuote}</p>
          </div>

          {/* Navigation and Controls - Responsive */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Mobile Navigation - Compact */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href="#rewards" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 8, textDecoration: 'none', color: textPrimary, background: isDark ? '#0f172a' : '#f8fafc' }} aria-label="Rewards">Rewards</a>
              <a href="#my-tracker" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 8, textDecoration: 'none', color: textPrimary, background: isDark ? '#0f172a' : '#f8fafc' }} aria-label="My Tracker">My Tracker</a>
              <a href="#tasks" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 8, textDecoration: 'none', color: textPrimary, background: isDark ? '#0f172a' : '#f8fafc' }} aria-label="Tasks">Tasks</a>
              <a href="#others" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 8, textDecoration: 'none', color: textPrimary, background: isDark ? '#0f172a' : '#f8fafc' }} aria-label="Others">Others</a>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                title="Toggle theme"
                style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', background: isDark ? '#0f172a' : '#f8fafc', color: textPrimary, border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', minHeight: '36px' }}>
                {isDark ? '🌙' : '☀️'}
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                style={{ padding: '8px', fontSize: 'clamp(12px, 3vw, 14px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, background: isDark ? '#0f172a' : '#ffffff', color: textPrimary, borderRadius: '8px', minHeight: '36px', flex: '1 1 140px' }}
              />
              <button 
                onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
                style={{ padding: '8px 12px', fontSize: 'clamp(11px, 2.5vw, 13px)', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', color: textPrimary, border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', minHeight: '36px' }}
              >
                Today
              </button>
              <button
                onClick={exportData}
                style={{ padding: '8px 12px', fontSize: 'clamp(11px, 2.5vw, 13px)', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', color: textPrimary, border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', minHeight: '36px' }}
              >
                Export
              </button>
              {!userEmail ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <a href="/login" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: '8px', textDecoration: 'none', color: textPrimary, background: isDark ? '#0f172a' : '#f8fafc', minHeight: '36px', display: 'flex', alignItems: 'center' }}>Login</a>
                  <a href="/signup" style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: '1px solid var(--primary)', borderRadius: '8px', textDecoration: 'none', color: 'white', background: 'var(--primary)', minHeight: '36px', display: 'flex', alignItems: 'center' }}>Sign up</a>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                  <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{userEmail}</span>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                    style={{ padding: '8px 10px', fontSize: 'clamp(11px, 2.5vw, 13px)', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', background: isDark ? '#0f172a' : '#f8fafc', color: textPrimary, minHeight: '36px' }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sliding Quotes */}
        <div className="quote-marquee" style={{ marginTop: 12, borderTop: `1px solid ${cardBorder}`, paddingTop: 12 }}>
          <div className="quote-track">
            {[...flowingQuotes, ...flowingQuotes].map((q, i) => (
              <span key={i} className="quote-item">
                <span>📿</span>
                <span style={{ fontSize: 13 }}>{q}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* My Rewards Today - moved up */}
      {myProfile && (
        <div id="rewards" className="card-hover" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Your badge for today</span>
            <span>🏅</span>
          </div>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>{badgesByProfile[myProfile.id]?.label || '—'}</div>
            {badgesByProfile[myProfile.id] && !badgesByProfile[myProfile.id].achieved && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>Do {badgesByProfile[myProfile.id].remaining} more today</div>
            )}
          </div>
        </div>
      )}

      {/* My Tracker (editable) or create prompt */}
      {userId && (
        myProfile ? (
          <div id="my-tracker" className="card-hover" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>My Tracker</div>
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: 'clamp(10px, 3vw, 16px)', textAlign: 'left', fontWeight: '600', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>Person</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Fajr</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Dhuhr</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Asr</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Maghrib</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Isha</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Morning Dhikr</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Evening Dhikr</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Tahajjud</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Yā-Sīn</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Mulk</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Before sleep</th>
                  <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Istighfar</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const profile = myProfile;
                  const entry = entries[`${profile.id}-${currentDate}`] || {};
                  const fields = ['fajr','dhuhr','asr','maghrib','isha','morning_dhikr','evening_dhikr','tahajjud','yaseen_after_fajr','mulk_before_sleep','before_sleep_dhikr'];
                  return (
                    <tr key={profile.id} style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff' }}>
                      <td style={{ padding: 'clamp(10px, 3vw, 16px)', fontWeight: '500', fontSize: 'clamp(12px, 3vw, 14px)' }}>{profile.name}</td>
                      {fields.map((f) => (
                        <td key={f} role="cell-hover" style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                          <button aria-label={`Toggle ${f}`} onClick={() => toggleField(profile.id, f)} style={{ padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)', fontSize: 'clamp(11px, 2.5vw, 13px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry[f] ? '#dcfce7' : '#f9fafb', color: entry[f] ? '#166534' : '#374151', cursor: 'pointer', minHeight: '32px', minWidth: '32px' }}>{entry[f] ? '✓' : '—'}</button>
                        </td>
                      ))}
                      <td role="cell-hover" style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 1vw, 4px)', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button onClick={() => updateCount(profile.id, -10)} style={{ padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 8px)', fontSize: 'clamp(10px, 2.5vw, 12px)', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', minHeight: '32px' }}>−10</button>
                          <button onClick={() => updateCount(profile.id, -1)} style={{ padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 8px)', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', minHeight: '32px', minWidth: '32px' }}>−</button>
                          <input type="number" value={entry.istighfar_count || 0} onChange={(e) => { const v = parseInt(e.target.value) || 0; updateCount(profile.id, v - (entry.istighfar_count || 0)); }} style={{ width: 'clamp(50px, 12vw, 60px)', padding: 'clamp(4px, 1vw, 6px)', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: 'clamp(11px, 2.5vw, 13px)', minHeight: '32px' }} />
                          <button onClick={() => updateCount(profile.id, 1)} style={{ padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 8px)', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', minHeight: '32px', minWidth: '32px' }}>+</button>
                          <button onClick={() => updateCount(profile.id, 10)} style={{ padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 8px)', fontSize: 'clamp(10px, 2.5vw, 12px)', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', minHeight: '32px' }}>+10</button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="card-hover" style={{ backgroundColor: 'white', padding: 'clamp(12px, 4vw, 16px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Create your tracker</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>You don’t have a personal tracker yet. Create one to start tracking your progress.</div>
            <button onClick={createMyTracker} style={{ padding: '8px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create my tracker</button>
          </div>
        )
      )}


      {/* Others' Progress (read-only) */}
      <div id="others" className="card-hover" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Others&apos; Progress</div>
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: 'clamp(10px, 3vw, 16px)', textAlign: 'left', fontWeight: '600', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>Person</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Badge</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Fajr</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Dhuhr</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Asr</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Maghrib</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Isha</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Morning Dhikr</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Evening Dhikr</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Tahajjud</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Yā-Sīn</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Mulk</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Before sleep</th>
              <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center', fontWeight: '500', fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Istighfar</th>
            </tr>
          </thead>
          <tbody>
            {(otherProfiles).map((profile, idx) => {
              const entry = entries[`${profile.id}-${currentDate}`] || {};
              return (
                <tr key={profile.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: 'clamp(10px, 3vw, 16px)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'clamp(12px, 3vw, 14px)' }}>
                    <span aria-hidden style={{ width: 'clamp(24px, 6vw, 28px)', height: 'clamp(24px, 6vw, 28px)', borderRadius: '50%', background: '#e5e7eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                      {profile.name?.[0]?.toUpperCase() || 'P'}
                    </span>
                    {profile.name}
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <span style={{ padding: 'clamp(3px, 1vw, 4px) clamp(6px, 1.5vw, 8px)', borderRadius: 999, border: '1px solid #e5e7eb', fontSize: 'clamp(10px, 2.5vw, 12px)', background: '#f8fafc' }}>
                      {badgesByProfile[profile.id]?.label || '—'}
                    </span>
                  </td>
                  <td role="cell-hover" style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}><div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.fajr ? '#dcfce7' : '#f9fafb', color: entry.fajr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.fajr ? '✓' : '—'}</div></td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.dhuhr ? '#dcfce7' : '#f9fafb', color: entry.dhuhr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.dhuhr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.asr ? '#dcfce7' : '#f9fafb', color: entry.asr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.asr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.maghrib ? '#dcfce7' : '#f9fafb', color: entry.maghrib ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.maghrib ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.isha ? '#dcfce7' : '#f9fafb', color: entry.isha ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.isha ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.morning_dhikr ? '#dcfce7' : '#f9fafb', color: entry.morning_dhikr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.morning_dhikr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.evening_dhikr ? '#dcfce7' : '#f9fafb', color: entry.evening_dhikr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.evening_dhikr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.tahajjud ? '#dcfce7' : '#f9fafb', color: entry.tahajjud ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.tahajjud ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.yaseen_after_fajr ? '#dcfce7' : '#f9fafb', color: entry.yaseen_after_fajr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.yaseen_after_fajr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.mulk_before_sleep ? '#dcfce7' : '#f9fafb', color: entry.mulk_before_sleep ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.mulk_before_sleep ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: entry.before_sleep_dhikr ? '#dcfce7' : '#f9fafb', color: entry.before_sleep_dhikr ? '#166534' : '#374151', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>{entry.before_sleep_dhikr ? '✓' : '—'}</div>
                  </td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: 'clamp(12px, 3vw, 14px)' }}>{entry.istighfar_count || 0}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Dhikr & Dua Reference */}
      <div className="card-hover" style={{ margin: 'clamp(12px, 4vw, 20px) 0', backgroundColor: 'white', padding: 'clamp(12px, 4vw, 20px)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 'clamp(16px, 4vw, 18px)' }}>Dhikr & Dua Reference</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)' }}>
          <a href="https://lifewithallah.com/dhikr-dua/morning-adhkar/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>🌅 Morning Adhkar</a>
          <a href="https://lifewithallah.com/dhikr-dua/evening-adhkar/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>🌇 Evening Adhkar</a>
          <a href="https://lifewithallah.com/dhikr-dua/before-sleep/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>😴 Before Sleep</a>
          <a href="https://lifewithallah.com/dhikr-dua/after-salah/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>🕌 After Salah</a>
          <a href="https://lifewithallah.com/dhikr-dua/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>📖 All Adhkar & Duas</a>
          <a href="https://lifewithallah.com/dhikr-dua/quranic-duas/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>🌿 Qur'anic Duas</a>
          <a href="https://lifewithallah.com/dhikr-dua/sunnah-duas/" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', color: '#0b3c3c', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>🌱 Sunnah Duas</a>
          <a href="https://ia902908.us.archive.org/2/items/surahalmulkpdf/Surah_Al-Mulk_pdf.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, textDecoration: 'none', color: '#9a3412', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>📄 Surah Al-Mulk</a>
          <a href="https://www.darsaal.com/islam/quran-pdf/arabic/32-Surah-Sajdah-in-Arabic.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, textDecoration: 'none', color: '#9a3412', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>📄 Surah As-Sajdah</a>
          <a href="https://ia902903.us.archive.org/33/items/Surah-al-waqiah/mafiadoc.com_surah-al-waqiah-pdf-alkalampk_59fd6cec1723dd41187607ee.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, textDecoration: 'none', color: '#9a3412', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>📄 Surah Al-Waqi&apos;ah</a>
          <a href="https://masjideraza.com/wp-content/uploads/2019/04/Yaseen-Sharif.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)', fontSize: 'clamp(12px, 3vw, 14px)', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, textDecoration: 'none', color: '#9a3412', fontWeight: 500, minHeight: '36px', display: 'flex', alignItems: 'center' }}>📄 Surah Ya-Sin</a>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="card-hover" style={{ marginTop: 'clamp(12px, 4vw, 20px)', backgroundColor: 'white', padding: 'clamp(12px, 4vw, 20px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', margin: 0, marginBottom: '4px' }}>Weekly Summary</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 'clamp(12px, 3vw, 14px)' }}>Individual progress over the last 7 days</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '500', color: '#374151' }}>Select Person:</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ 
                padding: 'clamp(8px, 2vw, 10px) clamp(10px, 3vw, 12px)', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px', 
                backgroundColor: 'white',
                fontSize: 'clamp(12px, 3vw, 14px)',
                minHeight: '36px',
                width: '100%'
              }}
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedProfileId && (
          <>
            <div style={{ marginBottom: '16px', padding: 'clamp(10px, 3vw, 12px)', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: '600', color: '#1e293b' }}>
                {profiles.find(p => p.id === selectedProfileId)?.name}&apos;s Progress
              </div>
              <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#64748b', marginTop: '2px' }}>
                Last 7 days from {new Date(new Date(currentDate).getTime() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString()} to {new Date(currentDate).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(12px, 4vw, 24px)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold' }}>{progress.completion}%</div>
                <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#6b7280' }}>Completion</div>
                <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#9ca3af', marginTop: '2px' }}>
                  {Math.round((progress.completion / 100) * 77)}/77 activities
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold' }}>{progress.onTime}%</div>
                <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#6b7280' }}>On Time</div>
                <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#9ca3af', marginTop: '2px' }}>
                  Estimated based on completion
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 'bold', color: '#16a34a' }}>{progress.istighfar}</div>
                <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#6b7280' }}>Istighfar (7d)</div>
                <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#9ca3af', marginTop: '2px' }}>
                  {Math.round(progress.istighfar / 7)} avg/day
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tasks of the Day - visible only when logged in */}
      {userId && (
      <div id="tasks" className="card-hover" style={{ marginTop: 'clamp(12px, 4vw, 20px)', backgroundColor: 'white', padding: 'clamp(12px, 4vw, 20px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', margin: 0, marginBottom: '16px' }}>Tasks of the Day</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input value={newTask} onChange={e => setNewTask((e.target as HTMLInputElement).value)} placeholder="Add any task or goal" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addTask()} aria-label="New task" />
          <Button onClick={addTask} variant="primary" aria-label="Add task">Add</Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(t => {
            const mine = t.user_id && userId ? t.user_id === userId : true;
            return (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, opacity: mine ? 1 : 0.7 }}>
                <input type="checkbox" checked={t.is_done} disabled={!mine} onChange={e => mine && toggleTask(t.id, e.target.checked)} />
                <span style={{ textDecoration: t.is_done ? 'line-through' : 'none', color: t.is_done ? '#6b7280' : '#111827' }}>{t.title}</span>
                {!mine && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>read-only</span>}
              </label>
            );
          })}
          {tasks.length === 0 && <div style={{ color: '#6b7280', fontSize: 14 }}>No tasks yet for {currentDate}. Add one above.</div>}
        </div>
      </div>
      )}

      {/* Islamic Features - Lazy Loaded */}
      <Suspense fallback={<div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>Loading Islamic Features...</div>}>
        <IslamicFeatures selectedProfileId={selectedProfileId} profiles={profiles} />
      </Suspense>

      {/* Advanced Analytics - Lazy Loaded */}
      <Suspense fallback={<div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>Loading Analytics...</div>}>
        <Analytics selectedProfileId={selectedProfileId} profiles={profiles} />
      </Suspense>

      {/* Footer */}
      <div style={{ marginTop: 'clamp(24px, 6vw, 40px)', borderTop: '1px solid #e5e7eb', backgroundColor: 'rgba(255,255,255,0.5)', padding: 'clamp(12px, 4vw, 16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, fontSize: 'clamp(12px, 3vw, 14px)', color: '#6b7280', flexWrap: 'wrap', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 24, height: 24, borderRadius: 6, overflow: 'hidden', flex: '0 0 24px' }}>
            {/* Fallback */}
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <rect width="36" height="36" rx="6" fill={`url(#footerLogoGradient${theme})`}/>
              <path d="M18 10L20.5 14.5L26 17L20.5 19.5L18 24L15.5 19.5L10 17L15.5 14.5L18 10Z" fill="white" opacity="0.95"/>
              <defs>
                <linearGradient id={`footerLogoGradient${theme}`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor={isDark ? '#2563EB' : '#2563EB'}/>
                  <stop offset="1" stopColor={isDark ? '#1D4ED8' : '#1D4ED8'}/>
                </linearGradient>
              </defs>
            </svg>
            {/* Provided PNG */}
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <Image src="/logo_ihsaantrack.png" alt="IhsaanTrack logo" width={24} height={24} className="object-cover" onError={(e) => { try { (e.currentTarget as HTMLImageElement).style.display = 'none'; } catch {} }} />
            </div>
          </div>
          <p style={{ margin: 0 }}>Data stored permanently in database — {new Date().toDateString()}</p>
        </div>
        <div style={{ marginTop: 8, fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 12, textAlign: 'center' }}>
          <span>Developed by <strong>oja673</strong> by the grace of Almighty Allah</span>
        </div>
      </div>
    </div>
  );
}

