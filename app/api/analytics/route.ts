import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const period = searchParams.get('period') || '30'; // days
  const type = searchParams.get('type') || 'overview';
  
  if (!profileId) {
    return NextResponse.json({ error: 'ProfileId is required' }, { status: 400 });
  }
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));
    
    if (type === 'overview') {
      // Get daily analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (analyticsError) {
        console.error('Error fetching analytics data:', analyticsError);
        return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
      }
      
      // Get current streaks
      const { data: streaksData, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('profile_id', profileId);
      
      if (streaksError) {
        console.error('Error fetching streaks:', streaksError);
      }
      
      // Get achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', profileId)
        .gte('earned_at', startDate.toISOString())
        .order('earned_at', { ascending: false });
      
      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
      }
      
      // Calculate overview statistics
      const totalDays = analyticsData?.length || 0;
      const totalPrayers = analyticsData?.reduce((sum, day) => sum + (day.prayers_completed || 0), 0) || 0;
      const totalDhikr = analyticsData?.reduce((sum, day) => sum + (day.dhikr_total || 0), 0) || 0;
      const totalQuranPages = analyticsData?.reduce((sum, day) => sum + (day.quran_pages || 0), 0) || 0;
      const totalQuranVerses = analyticsData?.reduce((sum, day) => sum + (day.quran_verses || 0), 0) || 0;
      
      const prayerCompletion = totalDays > 0 ? Math.round((totalPrayers / (totalDays * 5)) * 100) : 0;
      const dhikrAverage = totalDays > 0 ? Math.round(totalDhikr / totalDays) : 0;
      const quranAverage = totalDays > 0 ? Math.round(totalQuranPages / totalDays) : 0;
      
      // Format streaks data
      const currentStreaks = {
        prayer: streaksData?.find(s => s.streak_type === 'prayer')?.current_streak || 0,
        dhikr: streaksData?.find(s => s.streak_type === 'dhikr')?.current_streak || 0,
        quran: streaksData?.find(s => s.streak_type === 'quran')?.current_streak || 0
      };
      
      // Format achievements
      const achievements = achievementsData?.map(a => a.achievement_type) || [];
      
      return NextResponse.json({
        overview: {
          period: `${period} days`,
          totalDays,
          prayerCompletion,
          dhikrAverage,
          quranAverage,
          currentStreaks,
          achievements,
          totals: {
            prayers: totalPrayers,
            dhikr: totalDhikr,
            quranPages: totalQuranPages,
            quranVerses: totalQuranVerses
          }
        },
        dailyData: analyticsData || []
      });
    }
    
    if (type === 'heatmap') {
      // Get daily progress data for heatmap
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress_view')
        .select('*')
        .eq('profile_id', profileId)
        .gte('day', startDate.toISOString().split('T')[0])
        .lte('day', endDate.toISOString().split('T')[0])
        .order('day', { ascending: true });
      
      if (progressError) {
        console.error('Error fetching progress data:', progressError);
        return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
      }
      
      // Format data for heatmap calendar
      const heatmapData = progressData?.map(day => {
        const prayerCount = [day.fajr, day.dhuhr, day.asr, day.maghrib, day.isha].filter(Boolean).length;
        const dhikrCount = day.dhikr_total || 0;
        const quranCount = day.pages_read || 0;
        
        // Calculate activity value (0-10 scale)
        const value = Math.min(
          prayerCount + 
          Math.min(dhikrCount / 20, 3) + 
          Math.min(quranCount, 3), 
          10
        );
        
        return {
          date: day.day,
          value: Math.round(value),
          prayers: prayerCount,
          dhikr: dhikrCount,
          quran: quranCount
        };
      }) || [];
      
      return NextResponse.json({ heatmapData });
    }
    
    if (type === 'trends') {
      // Get weekly trends data
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress_view')
        .select('*')
        .eq('profile_id', profileId)
        .gte('day', startDate.toISOString().split('T')[0])
        .lte('day', endDate.toISOString().split('T')[0])
        .order('day', { ascending: true });
      
      if (progressError) {
        console.error('Error fetching trends data:', progressError);
        return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
      }
      
      // Calculate weekly trends
      const weeklyData = [];
      const data = progressData || [];
      
      for (let i = 0; i < data.length; i += 7) {
        const weekData = data.slice(i, i + 7);
        const weekPrayers = weekData.reduce((sum, day) => {
          return sum + [day.fajr, day.dhuhr, day.asr, day.maghrib, day.isha].filter(Boolean).length;
        }, 0);
        
        const weekDhikr = weekData.reduce((sum, day) => sum + (day.dhikr_total || 0), 0);
        const weekQuran = weekData.reduce((sum, day) => sum + (day.pages_read || 0), 0);
        
        weeklyData.push({
          week: Math.floor(i / 7) + 1,
          prayers: weekPrayers,
          dhikr: weekDhikr,
          quran: weekQuran,
          startDate: weekData[0]?.day,
          endDate: weekData[weekData.length - 1]?.day
        });
      }
      
      return NextResponse.json({ trends: weeklyData });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, date, type, data } = body;
    
    if (!profileId || !date || !type) {
      return NextResponse.json({ error: 'ProfileId, date, and type are required' }, { status: 400 });
    }
    
    // Calculate overall score if we have the component scores
    let overallScore = 0;
    if (data.prayer_completion_rate !== undefined && 
        data.dhikr_completion_rate !== undefined && 
        data.quran_completion_rate !== undefined) {
      overallScore = (data.prayer_completion_rate + data.dhikr_completion_rate + data.quran_completion_rate) / 3;
    }
    
    // Update daily analytics
    const { error: analyticsError } = await supabase
      .from('daily_analytics')
      .upsert({
        profile_id: profileId,
        date: date,
        overall_score: overallScore,
        ...data
      }, { onConflict: 'profile_id,date' });
    
    if (analyticsError) {
      console.error('Error saving analytics data:', analyticsError);
      return NextResponse.json({ error: 'Failed to save analytics data' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}