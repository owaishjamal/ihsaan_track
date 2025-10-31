import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  
  try {
    // Get Islamic events for the specified month/year or current month
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1).toString();
    const targetYear = year || currentDate.getFullYear().toString();
    
    // Get all Islamic events
    const { data: islamicEvents, error: eventsError } = await supa
      .from('islamic_events')
      .select('*')
      .order('hijri_date');
    
    if (eventsError) {
      console.error('Error fetching Islamic events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch Islamic events' }, { status: 500 });
    }
    
    // Get current Hijri date from Aladhan API for accuracy
    const today = new Date();
    const gDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const hijriResp = await fetch(`https://api.aladhan.com/v1/gToH/${gDate}`);
    const hijriJson = await hijriResp.json();
    const hijriData = hijriJson?.data?.hijri;
    const hijriDate = {
      year: parseInt(hijriData?.year || '0', 10),
      month: parseInt(hijriData?.month?.number || '0', 10),
      day: parseInt(hijriData?.day || '0', 10)
    };
    
    // Filter events for current month (simplified)
    const currentMonthEvents = islamicEvents?.filter(event => {
      const eventMonth = event.hijri_date.split('-')[0];
      return eventMonth === hijriDate.month.toString();
    }) || [];
    
    // Get fasting records for current month (if any)
    const { data: fastingRecords, error: fastingError } = await supa
      .from('fasting_records')
      .select('*')
      .gte('date', `${targetYear}-${targetMonth.padStart(2, '0')}-01`)
      .lt('date', `${targetYear}-${(parseInt(targetMonth) + 1).toString().padStart(2, '0')}-01`);
    
    if (fastingError) {
      console.error('Error fetching fasting records:', fastingError);
    }
    
    return NextResponse.json({
      hijriDate: `${hijriDate.year}-${hijriDate.month.toString().padStart(2, '0')}-${hijriDate.day.toString().padStart(2, '0')}`,
      islamicMonth: hijriData?.month?.en || getIslamicMonthName(hijriDate.month),
      islamicYear: hijriDate.year,
      importantDates: currentMonthEvents.map(event => ({
        date: event.gregorian_date || getGregorianDateFromHijri(event.hijri_date),
        event: event.event_name,
        type: event.event_type,
        description: event.description
      })),
      fastingRecords: fastingRecords || [],
      upcomingEvents: getUpcomingEvents(islamicEvents || [], hijriDate)
    });
  } catch (error) {
    console.error('Islamic calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getCurrentHijriDate() {
  // Simplified Hijri date calculation
  // In production, use a proper Hijri calendar library
  const gregorianDate = new Date();
  const hijriYear = 1446; // Approximate current Hijri year
  const hijriMonth = 4; // Approximate current Hijri month
  const hijriDay = 23; // Approximate current Hijri day
  
  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay
  };
}

function getIslamicMonthName(month: number) {
  const months = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];
  return months[month - 1] || 'Unknown';
}

function getGregorianDateFromHijri(hijriDate: string) {
  // Simplified conversion - in production use proper Hijri calendar library
  const [month, day] = hijriDate.split('-').map(Number);
  const currentYear = new Date().getFullYear();
  
  // Very rough approximation
  const gregorianMonth = month + 8; // Approximate offset
  const gregorianYear = currentYear;
  
  return `${gregorianYear}-${gregorianMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function getUpcomingEvents(events: any[], currentHijriDate: any) {
  // Get events for the next 30 days (simplified)
  return events.slice(0, 5).map(event => ({
    date: event.gregorian_date || getGregorianDateFromHijri(event.hijri_date),
    event: event.event_name,
    type: event.event_type,
    description: event.description
  }));
}