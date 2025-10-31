import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  if (!profileId) {
    return NextResponse.json({ error: 'ProfileId is required' }, { status: 400 });
  }
  
  try {
    // Get Quran progress for the specific date
    const { data: quranProgress, error } = await supabase
      .from('quran_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching Quran progress:', error);
      return NextResponse.json({ error: 'Failed to fetch Quran progress' }, { status: 500 });
    }
    
    // Return default values if no data found
    const result = quranProgress || {
      pages_read: 0,
      verses_read: 0,
      surahs_completed: [],
      time_spent_minutes: 0
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Quran API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profileId, date, pages, verses, surahs, timeSpent, notes } = await request.json();
    
    if (!profileId || !date) {
      return NextResponse.json({ error: 'ProfileId and date are required' }, { status: 400 });
    }
    
    // Upsert Quran progress
    const { data, error } = await supabase
      .from('quran_progress')
      .upsert({
        profile_id: profileId,
        date: date,
        pages_read: pages || 0,
        verses_read: verses || 0,
        surahs_completed: surahs || [],
        time_spent_minutes: timeSpent || 0,
        notes: notes || null
      }, { onConflict: 'profile_id,date' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving Quran progress:', error);
      return NextResponse.json({ error: 'Failed to save Quran progress' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Quran POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}