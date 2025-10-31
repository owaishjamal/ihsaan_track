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
    if (!heatmapData?.heatmapData) return <div>Loading heatmap...</div>;
    
    const data = heatmapData.heatmapData;
    const maxValue = Math.max(...data.map((d: any) => d.value));
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Activity Heatmap</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Less</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: level === 0 ? '#f1f5f9' : 
                                   level === 1 ? '#cbd5e1' :
                                   level === 2 ? '#94a3b8' :
                                   level === 3 ? '#64748b' : '#1e293b',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>More</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '16px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', padding: '4px' }}>
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
                  backgroundColor: intensity === 0 ? '#f1f5f9' : 
                                 intensity === 1 ? '#cbd5e1' :
                                 intensity === 2 ? '#94a3b8' :
                                 intensity === 3 ? '#64748b' : '#1e293b',
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
    if (!trendsData?.trends) return <div>Loading trends...</div>;
    
    const trends = trendsData.trends;
    const maxPrayers = Math.max(...trends.map((t: any) => t.prayers));
    const maxDhikr = Math.max(...trends.map((t: any) => t.dhikr));
    const maxQuran = Math.max(...trends.map((t: any) => t.quran));
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Weekly Progress Trends</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {trends.map((week: any, index: number) => (
            <div key={index} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Week {week.week}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                {week.startDate} - {week.endDate}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span>Prayers</span>
                  <span>{week.prayers}/35</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ 
                    width: `${(week.prayers / 35) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '2px' 
                  }} />
                </div>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span>Dhikr</span>
                  <span>{week.dhikr}</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ 
                    width: `${Math.min((week.dhikr / maxDhikr) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: '#16a34a', 
                    borderRadius: '2px' 
                  }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                  <span>Quran</span>
                  <span>{week.quran} pages</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
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
    if (!analyticsData?.overview?.currentStreaks) return <div>Loading streaks...</div>;
    
    const streaks = analyticsData.overview.currentStreaks;
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Current Streaks</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #f59e0b', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
              {streaks.prayer} days
            </div>
            <div style={{ fontSize: '14px', color: '#92400e' }}>Prayer Streak</div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #16a34a', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📿</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
              {streaks.dhikr} days
            </div>
            <div style={{ fontSize: '14px', color: '#166534' }}>Dhikr Streak</div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #3b82f6', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
              {streaks.quran} days
            </div>
            <div style={{ fontSize: '14px', color: '#1e40af' }}>Quran Streak</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    if (!analyticsData?.overview?.achievements) return <div>Loading achievements...</div>;
    
    const achievements = analyticsData.overview.achievements;
    
    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Achievement Badges</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {achievements.map((achievement: string) => {
            const badge = achievementBadges[achievement as keyof typeof achievementBadges];
            if (!badge) return null;
            
            return (
              <div key={achievement} style={{ 
                padding: '16px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '24px' }}>{badge.icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
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
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Family Comparison</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
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
    if (!analyticsData?.overview) return <div>Loading overview...</div>;
    
    const overview = analyticsData.overview;
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Analytics Overview</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #3b82f6', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🕌</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
              {overview.prayerCompletion}%
            </div>
            <div style={{ fontSize: '14px', color: '#1e40af' }}>Prayer Completion</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {overview.totals.prayers} prayers
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #16a34a', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📿</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
              {overview.dhikrAverage}
            </div>
            <div style={{ fontSize: '14px', color: '#166534' }}>Daily Dhikr Avg</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {overview.totals.dhikr} total
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #f59e0b', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
              {overview.quranAverage}
            </div>
            <div style={{ fontSize: '14px', color: '#92400e' }}>Daily Quran Avg</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {overview.totals.quranPages} pages
            </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#f3e8ff', borderRadius: '12px', border: '1px solid #8b5cf6', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#7c3aed', marginBottom: '4px' }}>
              {overview.achievements.length}
            </div>
            <div style={{ fontSize: '14px', color: '#7c3aed' }}>Achievements</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Earned badges
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>Current Streaks</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Prayer Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.currentStreaks.prayer} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Dhikr Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.currentStreaks.dhikr} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Quran Streak</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.currentStreaks.quran} days</span>
            </div>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>Period Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Total Days</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.totalDays}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Total Prayers</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.totals.prayers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Total Dhikr</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{overview.totals.dhikr}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading Analytics...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Processing your spiritual journey data</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#f3f4f6' : 'white',
              color: activeTab === tab.id ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px' }}>
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
