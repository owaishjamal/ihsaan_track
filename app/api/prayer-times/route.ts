import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon') || searchParams.get('lng');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }
  
  try {
    // Check if we have cached prayer times for this location and date
    const { data: cachedTimes, error: cacheError } = await supabase
      .from('prayer_times')
      .select('*')
      .eq('latitude', parseFloat(lat))
      .eq('longitude', parseFloat(lon))
      .eq('date', date)
      .single();
    
    if (cachedTimes && !cacheError) {
      // Fetch sunrise/sunset from API even if using cache for main prayers
      let sunrise: string | undefined;
      let sunset: string | undefined;
      try {
        const extra = await fetchPrayerTimesFromAPI(parseFloat(lat), parseFloat(lon), date);
        sunrise = extra.sunrise;
        sunset = extra.sunset;
      } catch {}
      return NextResponse.json({
        fajr: cachedTimes.fajr,
        dhuhr: cachedTimes.dhuhr,
        asr: cachedTimes.asr,
        maghrib: cachedTimes.maghrib,
        isha: cachedTimes.isha,
        sunrise,
        sunset,
        calculation_method: cachedTimes.calculation_method,
        cached: true
      });
    }
    
    // If not cached, fetch from external API and cache it
    const prayerTimes = await fetchPrayerTimesFromAPI(parseFloat(lat), parseFloat(lon), date);
    
    // Cache the result
    const { error: insertError } = await supabase
      .from('prayer_times')
      .insert({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        date: date,
        fajr: prayerTimes.fajr,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
        calculation_method: prayerTimes.calculation_method || 'Umm al-Qura'
      });
    
    if (insertError) {
      console.error('Error caching prayer times:', insertError);
    }
    
    return NextResponse.json({ ...prayerTimes, cached: false });
  } catch (error) {
    console.error('Prayer times API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchPrayerTimesFromAPI(lat: number, lon: number, date: string) {
  try {
    // Using Aladhan API (free Islamic prayer times API)
    // Use HTTPS for better security
    const apiUrl = `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=4&school=1`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Aladhan API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || !data.data || !data.data.timings) {
      throw new Error('Invalid response structure from prayer times API');
    }
    
    const timings = data.data.timings;
    
    // Validate that we have all required prayer times
    if (!timings.Fajr || !timings.Dhuhr || !timings.Asr || !timings.Maghrib || !timings.Isha) {
      throw new Error('Missing prayer times in API response');
    }
    
    return {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      sunset: timings.Sunset,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      calculation_method: 'Umm al-Qura'
    };
  } catch (error) {
    console.error('Error fetching from external API:', error);
    throw error;
  }
}