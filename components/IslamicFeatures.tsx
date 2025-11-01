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
  const [locationName, setLocationName] = useState<string>('');
  const [isDark, setIsDark] = useState(false);

  // Make theme reactive
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    return () => observer.disconnect();
  }, []);

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
    if (!location) {
      setPrayerTimes(null);
      setSunTimes({});
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/prayer-times?lat=${location.lat}&lng=${location.lng}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer times: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        console.error('Prayer times API error:', data.error);
        setPrayerTimes(null);
        setSunTimes({});
      } else if (data.fajr && data.dhuhr && data.asr && data.maghrib && data.isha) {
        // Only set if we have valid prayer times
        setPrayerTimes(data);
        setSunTimes({ sunrise: data.sunrise, sunset: data.sunset });
      } else {
        console.error('Invalid prayer times data received:', data);
        setPrayerTimes(null);
        setSunTimes({});
      }
    } catch (error) {
      console.error('Error loading prayer times:', error);
      setPrayerTimes(null);
      setSunTimes({});
    } finally {
      setLoading(false);
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

  // Don't request location automatically - only when user clicks "Use My Location"

  // Get location name from coordinates (reverse geocoding) - using multiple sources for accuracy
  const getLocationName = useCallback(async (lat: number, lng: number) => {
    try {
      // Try with higher zoom level and more address details for better accuracy
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'IhsaanTrack/1.0',
            'Accept': 'application/json'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          // Build readable location name with priority order
          const parts: string[] = [];
          
          // For India, prioritize city_district, city, town
          if (addr.city_district || addr.city || addr.town || addr.village || addr.municipality) {
            parts.push(addr.city_district || addr.city || addr.town || addr.village || addr.municipality);
          }
          
          if (addr.state || addr.region) {
            parts.push(addr.state || addr.region);
          }
          
          if (addr.country) {
            parts.push(addr.country);
          }
          
          if (parts.length > 0) {
            setLocationName(parts.join(', '));
          } else if (addr.suburb || addr.neighbourhood || addr.county) {
            setLocationName(`${addr.suburb || addr.neighbourhood || addr.county}, ${addr.state || ''}, ${addr.country || ''}`);
          } else {
            // Fallback: try using display_name
            if (data.display_name) {
              const displayParts = data.display_name.split(',').slice(0, 3);
              setLocationName(displayParts.join(', ').trim());
            } else {
              setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        } else if (data && data.display_name) {
          // Fallback to display_name if address is not available
          const displayParts = data.display_name.split(',').slice(0, 3);
          setLocationName(displayParts.join(', ').trim());
        } else {
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } else {
        setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  // Load prayer times when location is available
  useEffect(() => {
    if (location) {
      getLocationName(location.lat, location.lng);
      loadPrayerTimes();
      loadQibla();
    } else {
      setLocationName('');
    }
  }, [location, loadPrayerTimes, loadQibla, getLocationName]);

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
    <div className="fade-in-up" style={{ 
      marginTop: '20px', 
      background: isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
      borderRadius: '12px', 
      boxShadow: isDark 
        ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' 
        : '0 4px 20px rgba(2,6,23,0.1), inset 0 1px 0 rgba(255,255,255,0.8)', 
      overflow: 'hidden', 
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      position: 'relative'
    }}>
      {/* Tab Navigation */}
      <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0, display: 'block', overflowX: 'scroll', overflowY: 'visible', borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(248,250,252,0.5)' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
                border: 'none',
                background: activeTab === tab.id 
                  ? (isDark 
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)')
                  : 'transparent',
                color: activeTab === tab.id ? (isDark ? '#e2e8f0' : '#1f2937') : (isDark ? '#94a3b8' : '#6b7280'),
                cursor: 'pointer',
                fontSize: 'clamp(12px, 3vw, 14px)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(4px, 1vw, 6px)',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
                position: 'relative',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                  e.currentTarget.style.color = isDark ? '#cbd5e1' : '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isDark ? '#94a3b8' : '#6b7280';
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px', color: isDark ? '#e2e8f0' : '#111827' }}>
        {/* Prayer Times Tab */}
        {activeTab === 'prayer-times' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Prayer Times</h3>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400, display: 'none' }} className="mobile-scroll-hint">← Swipe →</span>
            </div>
            
            {/* Location Name Display */}
            {location && locationName && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px 16px', 
                backgroundColor: isDark ? 'rgba(33,136,80,0.1)' : 'rgba(33,136,80,0.08)', 
                borderRadius: '8px', 
                border: `1px solid ${isDark ? 'rgba(33,136,80,0.3)' : 'rgba(33,136,80,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '2px' }}>Current Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1f2937' }}>{locationName}</div>
                  <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', marginTop: '2px' }}>
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={pinCountry} onChange={e => setPinCountry(e.target.value)} style={{ padding: '8px', border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#e2e8f0' : '#111827' }}>
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
              <input type="text" value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="Pincode" style={{ padding: '8px', border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#e2e8f0' : '#111827' }} />
              <button onClick={async () => {
                const pin = manualLat.trim();
                if (!pin) {
                  alert('Please enter a pincode');
                  return;
                }
                setLoading(true);
                try {
                  // Try Zippopotam first (good for US, CA, etc.)
                  try {
                    const res = await fetch(`https://api.zippopotam.us/${pinCountry}/${encodeURIComponent(pin)}`, {
                      method: 'GET',
                      headers: { 'Accept': 'application/json' }
                    });
                    if (res.ok) {
                      const j = await res.json();
                      const place = j.places?.[0];
                      if (place && place.latitude && place.longitude) {
                        const latNum = parseFloat(place.latitude);
                        const lngNum = parseFloat(place.longitude);
                        if (!isNaN(latNum) && !isNaN(lngNum)) {
                          setLocation({ lat: latNum, lng: lngNum });
                          setLoading(false);
                          return;
                        }
                      }
                    }
                  } catch (zipError) {
                    console.log('Zippopotam API failed, trying Nominatim...', zipError);
                  }

                  // Fallback: Nominatim (works for most countries including IN, PK, BD, etc.)
                  try {
                    // For India, also try searching by postal code with country
                    const searchQuery = pinCountry === 'IN' 
                      ? `postalcode=${encodeURIComponent(pin)}&countrycodes=in`
                      : `postalcode=${encodeURIComponent(pin)}&countrycodes=${pinCountry.toLowerCase()}`;
                    
                    const nomi = await fetch(
                      `https://nominatim.openstreetmap.org/search?${searchQuery}&format=json&limit=5&addressdetails=1`,
                      {
                        headers: {
                          'User-Agent': 'IhsaanTrack/1.0',
                          'Accept': 'application/json'
                        }
                      }
                    );
                    if (nomi.ok) {
                      const arr = await nomi.json();
                      if (Array.isArray(arr) && arr.length > 0) {
                        // Take the first result (most relevant)
                        const result = arr[0];
                        if (result.lat && result.lon) {
                          const latNum = parseFloat(result.lat);
                          const lngNum = parseFloat(result.lon);
                          if (!isNaN(latNum) && !isNaN(lngNum)) {
                            setLocation({ lat: latNum, lng: lngNum });
                            setLoading(false);
                            return;
                          }
                        }
                      }
                    }
                  } catch (nomiError) {
                    console.error('Nominatim API failed:', nomiError);
                  }
                  
                  // Additional fallback: Try searching by pincode as a regular query
                  try {
                    const queryRes = await fetch(
                      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pin)}&countrycodes=${pinCountry.toLowerCase()}&format=json&limit=1&addressdetails=1`,
                      {
                        headers: {
                          'User-Agent': 'IhsaanTrack/1.0',
                          'Accept': 'application/json'
                        }
                      }
                    );
                    if (queryRes.ok) {
                      const arr = await queryRes.json();
                      if (Array.isArray(arr) && arr.length > 0 && arr[0].lat && arr[0].lon) {
                        const latNum = parseFloat(arr[0].lat);
                        const lngNum = parseFloat(arr[0].lon);
                        if (!isNaN(latNum) && !isNaN(lngNum)) {
                          setLocation({ lat: latNum, lng: lngNum });
                          setLoading(false);
                          return;
                        }
                      }
                    }
                  } catch (queryError) {
                    console.error('Nominatim query search failed:', queryError);
                  }

                  // If both fail, show error
                  alert(`Could not find location for pincode "${pin}" in ${pinCountry}. Please try:\n- A different pincode\n- Using manual coordinates\n- Using "Use My Location"`);
                } catch (e) {
                  console.error('Failed to set by pincode', e);
                  alert(`Error: Could not fetch location for pincode "${pin}". Please try manual coordinates or "Use My Location".`);
                } finally {
                  setLoading(false);
                }
              }} style={{ padding: '8px 12px', backgroundColor: isDark ? '#1e293b' : '#f3f4f6', border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, borderRadius: '6px', cursor: 'pointer', opacity: loading ? 0.6 : 1, color: isDark ? '#e2e8f0' : '#111827' }} disabled={loading}>
                {loading ? '⏳ Searching...' : 'Set by Pincode'}
              </button>
              <button onClick={() => {
                if (navigator.geolocation) {
                  setLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      // Use high accuracy for better location precision
                      const location = { 
                        lat: pos.coords.latitude, 
                        lng: pos.coords.longitude 
                      };
                      setLocation(location);
                      // The location name will be fetched automatically via useEffect
                      setLoading(false);
                    },
                    (error) => {
                      console.error('Error getting location:', error);
                      setLoading(false);
                      let errorMsg = 'Could not get your location. ';
                      if (error.code === 1) {
                        errorMsg += 'Location access denied. Please enable location permissions and try again.';
                      } else if (error.code === 2) {
                        errorMsg += 'Location unavailable. Please use pincode or manual entry instead.';
                      } else if (error.code === 3) {
                        errorMsg += 'Location request timeout. Please try again or use pincode/manual entry.';
                      } else {
                        errorMsg += 'Please use pincode or manual entry instead.';
                      }
                      alert(errorMsg);
                    },
                    {
                      enableHighAccuracy: true, // Request high accuracy
                      timeout: 10000, // 10 second timeout
                      maximumAge: 60000 // Accept cached location if less than 1 minute old
                    }
                  );
                } else {
                  alert('Geolocation is not supported by your browser.');
                }
              }} style={{ padding: '8px 12px', backgroundColor: '#e0f2fe', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? '⏳ Getting Location...' : 'Use My Location'}
              </button>
            </div>
            {prayerTimes ? (
              <div className="table-responsive" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0, display: 'block', overflowX: 'scroll', overflowY: 'visible' }}>
                <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content', paddingBottom: '8px' }}>
                  {Object.entries(prayerTimes).filter(([key]) => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(key)).map(([prayer, time]) => (
                    <div key={prayer} style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', minWidth: '120px', flexShrink: 0 }}>
                      <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#6b7280', textTransform: 'capitalize' }}>{prayer}</div>
                      <div style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: '600', color: '#1f2937' }}>{time as string}</div>
                    </div>
                  ))}
                  {(sunTimes.sunrise || sunTimes.sunset) && (
                    <>
                      {sunTimes.sunrise && (
                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', minWidth: '120px', flexShrink: 0 }}>
                          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#9a3412' }}>Sunrise</div>
                          <div style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: '600', color: '#7c2d12' }}>{sunTimes.sunrise}</div>
                        </div>
                      )}
                      {sunTimes.sunset && (
                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', minWidth: '120px', flexShrink: 0 }}>
                          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#991b1b' }}>Sunset</div>
                          <div style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: '600', color: '#7f1d1d' }}>{sunTimes.sunset}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : !location ? (
              <div style={{ textAlign: 'center', padding: '24px', color: isDark ? '#94a3b8' : '#6b7280', backgroundColor: isDark ? '#1e293b' : '#f9fafb', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
                <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#374151' }}>📍 Set Your Location</div>
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>Please set your location using one of the options above to see prayer times</div>
                <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#9ca3af' }}>You can use: Pincode, Manual entry, or &quot;Use My Location&quot;</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: isDark ? '#94a3b8' : '#6b7280', backgroundColor: isDark ? '#1e293b' : '#f9fafb', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
                <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#374151' }}>⏳ Loading prayer times...</div>
                <div style={{ fontSize: '14px', color: isDark ? '#64748b' : '#9ca3af' }}>Fetching prayer times for your location</div>
              </div>
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
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#f0f9ff', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'transparent'}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#60A5FA' : '#0369a1' }}>{quranProgress.pages_read || 0}</div>
                    <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#6b7280' }}>Pages Read</div>
                    <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#9ca3af' }}>Today</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'transparent'}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#86efac' : '#16a34a' }}>{quranProgress.verses_read || 0}</div>
                    <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#6b7280' }}>Verses Read</div>
                    <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#9ca3af' }}>Today</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="number"
                    placeholder="Pages"
                    style={{ flex: 1, padding: '8px', border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#e2e8f0' : '#111827' }}
                    id="pages-input"
                  />
                  <input
                    type="number"
                    placeholder="Verses"
                    style={{ flex: 1, padding: '8px', border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#e2e8f0' : '#111827' }}
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
