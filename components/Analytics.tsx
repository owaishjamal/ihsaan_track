'use client';
import React, { useState, useEffect, useCallback } from 'react';

interface AnalyticsProps {
  selectedProfileId: string;
  profiles: Array<{id: string, name: string}>;
}

export function Analytics({ selectedProfileId, profiles }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('30');
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

  const textPrimary = isDark ? '#e2e8f0' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, heatmapRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics?profileId=${selectedProfileId}&period=${period}&type=overview`),
        fetch(`/api/analytics?profileId=${selectedProfileId}&period=${period}&type=heatmap`),
        fetch(`/api/analytics?profileId=${selectedProfileId}&period=${period}&type=trends`)
      ]);
      
      const [overview, heatmap, trends] = await Promise.all([
        overviewRes.json(),
        heatmapRes.json(),
        trendsRes.json()
      ]);
      
      setAnalyticsData(overview);
      setHeatmapData(heatmap);
      setTrendsData(trends);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  }, [selectedProfileId, period]);

  useEffect(() => {
    if (selectedProfileId) {
      loadAnalyticsData();
    }
  }, [selectedProfileId, period, loadAnalyticsData]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'heatmap', name: 'Activity Heatmap', icon: '🗓️' },
    { id: 'trends', name: 'Progress Trends', icon: '📈' },
    { id: 'streaks', name: 'Streaks', icon: '🔥' },
    { id: 'achievements', name: 'Achievements', icon: '🏆' },
    { id: 'comparison', name: 'Family Comparison', icon: '👨‍👩‍👧‍👦' }
  ];

  const achievementBadges = {
    perfect_day: { name: 'Perfect Day', icon: '⭐', description: 'Completed all 5 prayers' },
    dhikr_master: { name: 'Dhikr Master', icon: '📿', description: '100+ dhikr in a day' },
    quran_reader: { name: 'Quran Reader', icon: '📖', description: 'Read 3+ pages of Quran' },
    consistent_worshipper: { name: 'Consistent Worshipper', icon: '🕌', description: 'Balanced worship day' },
    week_warrior: { name: 'Week Warrior', icon: '⚔️', description: '7-day prayer streak' },
    month_master: { name: 'Month Master', icon: '👑', description: '30-day consistent streak' }
  };

  const renderHeatmap = () => {
    if (!heatmapData?.heatmapData) return <div style={{ color: textPrimary }}>Loading heatmap...</div>;
    
    const data = heatmapData.heatmapData;
    const maxValue = Math.max(...data.map((d: any) => d.value));
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: textPrimary }}>Activity Heatmap</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: textMuted }}>Less</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: isDark 
                      ? (level === 0 ? '#1e293b' : 
                         level === 1 ? '#334155' :
                         level === 2 ? '#475569' :
                         level === 3 ? '#64748b' : '#94a3b8')
                      : (level === 0 ? '#f1f5f9' : 
                         level === 1 ? '#cbd5e1' :
                         level === 2 ? '#94a3b8' :
                         level === 3 ? '#64748b' : '#1e293b'),
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: textMuted }}>More</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '16px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '12px', color: textMuted, padding: '4px' }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {data.map((day: any, index: number) => {
            const intensity = Math.round((day.value / maxValue) * 4);
            return (
              <div
                key={index}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundColor: isDark 
                    ? (intensity === 0 ? '#1e293b' : 
                       intensity === 1 ? '#334155' :
                       intensity === 2 ? '#475569' :
                       intensity === 3 ? '#64748b' : '#94a3b8')
                    : (intensity === 0 ? '#f1f5f9' : 
                       intensity === 1 ? '#cbd5e1' :
                       intensity === 2 ? '#94a3b8' :
                       intensity === 3 ? '#64748b' : '#1e293b'),
                  borderRadius: '2px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={`${day.date}: ${day.prayers} prayers, ${day.dhikr} dhikr, ${day.quran} pages`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    if (!trendsData?.trends) return <div style={{ color: textPrimary }}>Loading trends...</div>;
    
    const trends = trendsData.trends;
    const maxPrayers = Math.max(...trends.map((t: any) => t.prayers));
    const maxDhikr = Math.max(...trends.map((t: any) => t.dhikr));
    const maxQuran = Math.max(...trends.map((t: any) => t.quran));
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: textPrimary }}>Weekly Progress Trends</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {trends.map((week: any, index: number) => (
            <div key={index} style={{ padding: '16px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: textPrimary }}>Week {week.week}</div>
              <div style={{ fontSize: '12px', color: textMuted, marginBottom: '12px' }}>
                {week.startDate} - {week.endDate}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', color: textPrimary }}>
                  <span>Prayers</span>
                  <span>{week.prayers}/35</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? '#334155' : '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ 
                    width: `${(week.prayers / 35) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '2px' 
                  }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', color: textPrimary }}>
                  <span>Dhikr</span>
                  <span>{week.dhikr}</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? '#334155' : '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ 
                    width: `${Math.min((week.dhikr / maxDhikr) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: '#16a34a', 
                    borderRadius: '2px' 
                  }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', color: textPrimary }}>
                  <span>Quran</span>
                  <span>{week.quran} pages</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? '#334155' : '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ 
                    width: `${Math.min((week.quran / maxQuran) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: '#f59e0b', 
                    borderRadius: '2px' 
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStreaks = () => {
    if (!analyticsData?.overview?.currentStreaks) return <div style={{ color: textPrimary }}>Loading streaks...</div>;
    
    const streaks = analyticsData.overview.currentStreaks;
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: textPrimary }}>Current Streaks</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#f59e0b'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#fbbf24' : '#92400e', marginBottom: '4px' }}>
              {streaks.prayer} days
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#fbbf24' : '#92400e' }}>Prayer Streak</div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#16a34a'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📿</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#86efac' : '#166534', marginBottom: '4px' }}>
              {streaks.dhikr} days
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#86efac' : '#166534' }}>Dhikr Streak</div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#f0f9ff', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#3b82f6'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#93c5fd' : '#1e40af', marginBottom: '4px' }}>
              {streaks.quran} days
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#93c5fd' : '#1e40af' }}>Quran Streak</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    if (!analyticsData?.overview?.achievements) return <div style={{ color: textPrimary }}>Loading achievements...</div>;
    
    const achievements = analyticsData.overview.achievements;
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: textPrimary }}>Achievement Badges</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {achievements.map((achievement: string) => {
            const badge = achievementBadges[achievement as keyof typeof achievementBadges];
            if (!badge) return null;
            
            return (
              <div key={achievement} style={{ 
                padding: '16px', 
                backgroundColor: isDark ? '#1e293b' : '#f8fafc', 
                borderRadius: '8px', 
                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '24px' }}>{badge.icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px', color: textPrimary }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '12px', color: textMuted }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFamilyComparison = () => {
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: textPrimary }}>Family Comparison</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: textMuted }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
          <div>Family comparison feature coming soon!</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Compare progress between family members
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    if (!analyticsData?.overview) return <div style={{ color: textPrimary }}>Loading overview...</div>;
    
    const overview = analyticsData.overview;
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: textPrimary }}>Analytics Overview</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`, 
              borderRadius: '8px',
              backgroundColor: isDark ? '#1e293b' : 'white',
              color: textPrimary
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#f0f9ff', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#3b82f6'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🕌</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#93c5fd' : '#1e40af', marginBottom: '4px' }}>
              {overview.prayerCompletion}%
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#93c5fd' : '#1e40af' }}>Prayer Completion</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
              {overview.totals.prayers} prayers
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#16a34a'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📿</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#86efac' : '#166534', marginBottom: '4px' }}>
              {overview.dhikrAverage}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#86efac' : '#166534' }}>Daily Dhikr Avg</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
              {overview.totals.dhikr} total
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#f59e0b'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#fbbf24' : '#92400e', marginBottom: '4px' }}>
              {overview.quranAverage}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#fbbf24' : '#92400e' }}>Daily Quran Avg</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
              {overview.totals.quranPages} pages
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff', borderRadius: '12px', border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#8b5cf6'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: isDark ? '#c4b5fd' : '#7c3aed', marginBottom: '4px' }}>
              {overview.achievements.length}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#c4b5fd' : '#7c3aed' }}>Achievements</div>
            <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
              Earned badges
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: textPrimary }}>Current Streaks</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Prayer Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.currentStreaks.prayer} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Dhikr Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.currentStreaks.dhikr} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Quran Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.currentStreaks.quran} days</span>
            </div>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}` }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: textPrimary }}>Period Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Total Days</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.totalDays}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Total Prayers</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.totals.prayers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: textPrimary }}>Total Dhikr</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>{overview.totals.dhikr}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        marginTop: '20px', 
        background: isDark 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: isDark 
          ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' 
          : '0 4px 20px rgba(2,6,23,0.1), inset 0 1px 0 rgba(255,255,255,0.8)', 
        textAlign: 'center',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px', color: textPrimary }}>Loading Analytics...</div>
        <div style={{ fontSize: '14px', color: textMuted }}>Processing your spiritual journey data</div>
      </div>
    );
  }

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
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
    }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, overflowX: 'auto', background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(248,250,252,0.5)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              border: 'none',
              background: activeTab === tab.id 
                ? (isDark 
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)')
                : 'transparent',
              color: activeTab === tab.id ? textPrimary : textMuted,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
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
                e.currentTarget.style.color = textMuted;
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px', color: textPrimary }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'heatmap' && renderHeatmap()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'streaks' && renderStreaks()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'comparison' && renderFamilyComparison()}
      </div>
    </div>
  );
}
