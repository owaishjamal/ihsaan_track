'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface IslamicFeaturesProps {
  selectedProfileId: string;
  profiles: Array<{id: string, name: string}>;
}

export function IslamicFeatures({ selectedProfileId, profiles }: IslamicFeaturesProps) {
  const [activeTab, setActiveTab] = useState('prayer-times');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [sunTimes, setSunTimes] = useState<{sunrise?: string, sunset?: string}>({});
  const [qibla, setQibla] = useState<any>(null);
  const [quranProgress, setQuranProgress] = useState<any>(null);
  const [dhikrProgress, setDhikrProgress] = useState<any>(null);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [islamicDate, setIslamicDate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [pinCountry, setPinCountry] = useState<string>('IN');
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  // Dhikr types configuration
  const dhikrTypes = useMemo(() => [
    { key: 'tasbih_count', label: 'Subhan Allah (Tasbih)', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
    { key: 'tahmid_count', label: 'Alhamdulillah (Tahmid)', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
    { key: 'takbir_count', label: 'Allahu Akbar (Takbir)', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
    { key: 'istighfar_count', label: 'Astaghfirullah (Istighfar)', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ' },
    { key: 'salawat_count', label: 'Salawat', arabic: 'صَلَّى ٱللَّٰهُ عَلَيْهِ وَآلِهِ وَسَلَّمَ' },
    { key: 'lailaha_count', label: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ' },
  ], []);

  const loadPrayerTimes = useCallback(async () => {
    if (!location) return;
    try {
      const response = await fetch(`/api/prayer-times?lat=${location.lat}&lng=${location.lng}`);
      const data = await response.json();
      setPrayerTimes(data);
      setSunTimes({ sunrise: data.sunrise, sunset: data.sunset });
    } catch (error) {
      console.error('Error loading prayer times:', error);
    }
  }, [location]);

  const loadQibla = useCallback(async () => {
    if (!location) return;
    try {
      const response = await fetch(`/api/qibla?lat=${location.lat}&lng=${location.lng}`);
      const data = await response.json();
      setQibla(data);
    } catch (error) {
      console.error('Error loading Qibla:', error);
    }
  }, [location]);

  const loadQuranProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/quran?profileId=${selectedProfileId}`);
      const data = await response.json();
      setQuranProgress(data);
    } catch (error) {
      console.error('Error loading Quran progress:', error);
    }
  }, [selectedProfileId]);

  const loadDhikrProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/dhikr?profileId=${selectedProfileId}`);
      const data = await response.json();
      setDhikrProgress(data);
      
      // Extract individual dhikr counts
      const counts: Record<string, number> = {};
      dhikrTypes.forEach(dhikr => {
        counts[dhikr.key] = data[dhikr.key] || 0;
      });
      setDhikrCounts(counts);
    } catch (error) {
      console.error('Error loading Dhikr progress:', error);
    }
  }, [selectedProfileId, dhikrTypes]);

  const loadIslamicDate = async () => {
    try {
      const response = await fetch('/api/islamic-calendar');
      const data = await response.json();
      setIslamicDate(data);
    } catch (error) {
      console.error('Error loading Islamic date:', error);
    }
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Makkah coordinates
          setLocation({ lat: 21.4225, lng: 39.8262 });
        }
      );
    }
  }, []);

  // Load prayer times when location is available
  useEffect(() => {
    if (location) {
      loadPrayerTimes();
      loadQibla();
    }
  }, [location, loadPrayerTimes, loadQibla]);

  // Load Islamic date
  useEffect(() => {
    loadIslamicDate();
  }, []);

  // Load Quran and Dhikr progress when profile is selected
  useEffect(() => {
    if (selectedProfileId) {
      loadQuranProgress();
      loadDhikrProgress();
    }
  }, [selectedProfileId, loadQuranProgress, loadDhikrProgress]);

  const updateQuranProgress = async (pagesRead: number, versesRead: number) => {
    try {
      const response = await fetch('/api/quran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          date: new Date().toISOString().split('T')[0],
          pages: pagesRead,
          verses: versesRead
        })
      });
      if (response.ok) {
        loadQuranProgress();
      }
    } catch (error) {
      console.error('Error updating Quran progress:', error);
    }
  };


  const updateDhikrCount = async (type: string, count: number) => {
    try {
      const { authFetch } = await import('@/lib/authFetch');
      const response = await authFetch('/api/dhikr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          date: new Date().toISOString().split('T')[0],
          dhikrType: type,
          count: count
        })
      });
      if (response.ok) {
        // Reload from backend to ensure totals and generated columns are correct
        loadDhikrProgress();
      }
    } catch (error) {
      console.error('Error updating Dhikr count:', error);
    }
  };

  const tabs = [
    { id: 'prayer-times', name: 'Prayer Times', icon: '🕌' },
    { id: 'qibla', name: 'Qibla', icon: '🧭' },
    { id: 'quran', name: 'Quran', icon: '📖' },
    { id: 'dhikr', name: 'Dhikr', icon: '📿' },
    { id: 'calendar', name: 'Islamic Calendar', icon: '📅' },
    { id: 'rewards', name: 'Rewards', icon: '🏅' }
  ];

  return (
    <div style={{ marginTop: '20px', background: isDark ? '#0f172a' : 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}` }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? (isDark ? '#0b1220' : '#f3f4f6') : (isDark ? '#0f172a' : 'white'),
              color: activeTab === tab.id ? (isDark ? '#e2e8f0' : '#1f2937') : (isDark ? '#94a3b8' : '#6b7280'),
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px', color: isDark ? '#e2e8f0' : '#111827' }}>
        {/* Prayer Times Tab */}
        {activeTab === 'prayer-times' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Prayer Times</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={pinCountry} onChange={e => setPinCountry(e.target.value)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="IN">IN</option>
                <option value="US">US</option>
                <option value="GB">GB</option>
                <option value="CA">CA</option>
                <option value="AU">AU</option>
                <option value="PK">PK</option>
                <option value="BD">BD</option>
                <option value="SA">SA</option>
                <option value="AE">AE</option>
              </select>
              <input type="text" value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="Pincode" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <button onClick={async () => {
                try {
                  const pin = manualLat.trim();
                  if (!pin) return;
                  // Try Zippopotam first
                  const res = await fetch(`https://api.zippopotam.us/${pinCountry}/${encodeURIComponent(pin)}`);
                  if (res.ok) {
                    const j = await res.json();
                    const place = j.places?.[0];
                    if (place) {
                      const latNum = parseFloat(place.latitude);
                      const lngNum = parseFloat(place.longitude);
                      if (!isNaN(latNum) && !isNaN(lngNum)) { setLocation({ lat: latNum, lng: lngNum }); return; }
                    }
                  }
                  // Fallback: Nominatim
                  const nomi = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&countrycodes=${pinCountry.toLowerCase()}&format=json&limit=1`);
                  if (nomi.ok) {
                    const arr = await nomi.json();
                    if (Array.isArray(arr) && arr.length > 0) {
                      const latNum = parseFloat(arr[0].lat);
                      const lngNum = parseFloat(arr[0].lon);
                      if (!isNaN(latNum) && !isNaN(lngNum)) { setLocation({ lat: latNum, lng: lngNum }); return; }
                    }
                  }
                } catch (e) { console.error('Failed to set by pincode', e); }
              }} style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>Set by Pincode</button>
              <button onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
                }
              }} style={{ padding: '8px 12px', backgroundColor: '#e0f2fe', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}>Use My Location</button>
            </div>
            {prayerTimes ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                {Object.entries(prayerTimes).filter(([key]) => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(key)).map(([prayer, time]) => (
                  <div key={prayer} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{prayer}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{time as string}</div>
                  </div>
                ))}
                {(sunTimes.sunrise || sunTimes.sunset) && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {sunTimes.sunrise && (
                      <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', minWidth: 120 }}>
                        <div style={{ fontSize: '12px', color: '#9a3412' }}>Sunrise</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#7c2d12' }}>{sunTimes.sunrise}</div>
                      </div>
                    )}
                    {sunTimes.sunset && (
                      <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', minWidth: 120 }}>
                        <div style={{ fontSize: '12px', color: '#991b1b' }}>Sunset</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#7f1d1d' }}>{sunTimes.sunset}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading prayer times...</div>
            )}
          </div>
        )}

        {/* Qibla Tab */}
        {activeTab === 'qibla' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Qibla Direction</h3>
            {qibla ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧭</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {qibla.direction}°
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Distance to Kaaba: {qibla.distance} km
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Point your compass towards {qibla.direction}° to face the Qibla
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading Qibla direction...</div>
            )}
          </div>
        )}

        {/* Quran Tab */}
        {activeTab === 'quran' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Quran Reading Tracker</h3>
            {quranProgress ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#0369a1' }}>{quranProgress.pages_read || 0}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Pages Read</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Today</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>{quranProgress.verses_read || 0}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Verses Read</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Today</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="number"
                    placeholder="Pages"
                    style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    id="pages-input"
                  />
                  <input
                    type="number"
                    placeholder="Verses"
                    style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    id="verses-input"
                  />
                  <button
                    onClick={() => {
                      const pages = parseInt((document.getElementById('pages-input') as HTMLInputElement)?.value || '0');
                      const verses = parseInt((document.getElementById('verses-input') as HTMLInputElement)?.value || '0');
                      if (pages > 0 || verses > 0) {
                        updateQuranProgress(pages, verses);
                        (document.getElementById('pages-input') as HTMLInputElement).value = '';
                        (document.getElementById('verses-input') as HTMLInputElement).value = '';
                      }
                    }}
                    style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading Quran progress...</div>
            )}
          </div>
        )}

        {/* Dhikr Tab */}
        {activeTab === 'dhikr' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Dhikr Counter</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {dhikrTypes.map((dhikr) => (
                <div key={dhikr.key} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{dhikr.label}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{dhikr.arabic}</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                    {dhikrCounts[dhikr.key] || 0}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => updateDhikrCount(dhikr.key, (dhikrCounts[dhikr.key] || 0) + 1)}
                      style={{ flex: 1, padding: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateDhikrCount(dhikr.key, (dhikrCounts[dhikr.key] || 0) + 10)}
                      style={{ flex: 1, padding: '6px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      +10
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                Total Today: {Object.values(dhikrCounts).reduce((sum: number, count: number) => sum + count, 0)}
              </div>
            </div>
          </div>
        )}

        {/* Islamic Calendar Tab */}
        {activeTab === 'calendar' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Islamic Calendar</h3>
            {islamicDate ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Gregorian</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</div>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Hijri</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{islamicDate.islamicMonth}</div>
                    <div style={{ fontSize: '14px', color: '#1f2937' }}>
                      {islamicDate.hijriDate} AH
                    </div>
                  </div>
                </div>
                {Array.isArray(islamicDate.importantDates) && islamicDate.importantDates.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>Important Dates</div>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {islamicDate.importantDates.map((evt: any, idx: number) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{evt.event}</span> — <span style={{ color: '#374151' }}>{evt.date}</span> ({evt.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading Islamic calendar...</div>
            )}
          </div>
        )}

        {/* Rewards / Gamification Tab */}
        {activeTab === 'rewards' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Rewards & Badges</h3>
            {(() => {
              const istighfar = dhikrCounts['istighfar_count'] || 0;
              const totalDhikr = Object.values(dhikrCounts).reduce((sum, n) => sum + (n || 0), 0);
              const badges = [
                { id: 'dhikr-33', label: 'Dhikr Novice', desc: '33 dhikr today', threshold: 33, uses: 'total' as const },
                { id: 'istighfar-100', label: 'Istighfar Seeker', desc: '100 istighfar today', threshold: 100, uses: 'istighfar' as const },
                { id: 'dhikr-500', label: 'Dhikr Devoted', desc: '500 dhikr today', threshold: 500, uses: 'total' as const },
                { id: 'istighfar-1000', label: 'Istighfar Champion', desc: '1000 istighfar today', threshold: 1000, uses: 'istighfar' as const }
              ];
              const withProgress = badges.map(b => {
                const current = b.uses === 'istighfar' ? istighfar : totalDhikr;
                return { ...b, current, achieved: current >= b.threshold, remaining: Math.max(0, b.threshold - current) };
              });
              const achieved = withProgress.filter(b => b.achieved).sort((a,b)=>a.threshold-b.threshold);
              const next = withProgress.filter(b => !b.achieved).sort((a,b)=>a.threshold-b.threshold)[0];
              const todayBadge = achieved.length > 0 ? achieved[achieved.length-1] : undefined;
              return (
                <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: todayBadge ? '#f0fdf4' : '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{todayBadge ? 'Your badge for today' : 'Next badge target'}</div>
                    <div style={{ fontSize: 20 }}>{todayBadge ? '🏆' : '🎯'}</div>
                  </div>
                  <div style={{ marginTop: 6, color: '#374151' }}>
                    {todayBadge ? (
                      <>
                        <strong>{todayBadge.label}</strong> — {todayBadge.desc}
                      </>
                    ) : next ? (
                      <>
                        Aim for <strong>{next.label}</strong> — {next.desc}. Do <strong>{next.remaining}</strong> more today.
                      </>
                    ) : 'Keep going today for more rewards, in shā’ Allāh.'}
                  </div>
                </div>
              );
            })()}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {(() => {
                const istighfar = dhikrCounts['istighfar_count'] || 0;
                const badges = [
                  { id: 'istighfar-33', label: 'Istighfar Novice', desc: '33 istighfar today', threshold: 33 },
                  { id: 'istighfar-100', label: 'Istighfar Seeker', desc: '100 istighfar today', threshold: 100 },
                  { id: 'istighfar-500', label: 'Istighfar Devoted', desc: '500 istighfar today', threshold: 500 },
                  { id: 'istighfar-1000', label: 'Istighfar Champion', desc: '1000 istighfar today', threshold: 1000 }
                ];
                return badges.map(b => {
                  const current = istighfar as number;
                  const achieved = current >= (b.threshold as number);
                  const remaining = Math.max(0, (b.threshold as number) - current);
                  return (
                    <div key={b.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, background: achieved ? '#f0fdf4' : '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: achieved ? '#166534' : '#111827' }}>{b.label}</div>
                        <div>
                          {achieved ? '🏆' : '🔓'}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{b.desc}</div>
                      {!achieved && (
                        <div style={{ fontSize: 13, color: '#374151' }}>
                          Do <strong>{remaining}</strong> more to unlock
                        </div>
                      )}
                      {achieved && (
                        <div style={{ fontSize: 13, color: '#166534' }}>
                          Unlocked — May Allah accept and increase you.
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#eef2ff', border: '1px solid #e0e7ff', color: '#1e293b' }}>
              Tip: Consistency (istiqāmah) is beloved. Small daily deeds, sustained, bring great reward.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
