import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    let query = supa
      .from('entries')
      .select('*')
      .order('day', { ascending: false });
    
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    
    if (date) {
      query = query.eq('day', date);
    }
    
    if (startDate) {
      query = query.gte('day', startDate);
    }
    
    if (endDate) {
      query = query.lte('day', endDate);
    }
    
    const { data: entries, error } = await query;
    
    if (error) {
      console.error('Error fetching entries:', error);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
    
    return NextResponse.json(entries || []);
  } catch (error) {
    console.error('Entries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const entryData = await request.json();
    const { profileId, day, ...fields } = entryData;
    
    if (!profileId || !day) {
      return NextResponse.json({ error: 'ProfileId and day are required' }, { status: 400 });
    }
    
    // Prepare the entry data
    const entry = {
      profile_id: profileId,
      day: day,
      fajr: fields.fajr || false,
      dhuhr: fields.dhuhr || false,
      asr: fields.asr || false,
      maghrib: fields.maghrib || false,
      isha: fields.isha || false,
      tahajjud: fields.tahajjud || false,
      morning_dhikr: fields.morning_dhikr || false,
      evening_dhikr: fields.evening_dhikr || false,
      before_sleep_dhikr: fields.before_sleep_dhikr || false,
      yaseen_after_fajr: fields.yaseen_after_fajr || false,
      mulk_before_sleep: fields.mulk_before_sleep || false,
      istighfar_count: fields.istighfar_count || 0,
      fajr_at: fields.fajr_at || null,
      dhuhr_at: fields.dhuhr_at || null,
      asr_at: fields.asr_at || null,
      maghrib_at: fields.maghrib_at || null,
      isha_at: fields.isha_at || null,
      tahajjud_at: fields.tahajjud_at || null,
      morning_dhikr_at: fields.morning_dhikr_at || null,
      evening_dhikr_at: fields.evening_dhikr_at || null,
      sleep_dhikr_at: fields.sleep_dhikr_at || null,
      updated_by: fields.updated_by || null,
      notes: fields.notes || null
    };
    
    const { data: newEntry, error } = await supa
      .from('entries')
      .upsert(entry, { onConflict: 'profile_id,day' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving entry:', error);
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
    }
    
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Entries POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const entryData = await request.json();
    const { profileId, day, ...fields } = entryData;
    
    if (!profileId || !day) {
      return NextResponse.json({ error: 'ProfileId and day are required' }, { status: 400 });
    }
    
    // Prepare the update data
    const updateData: any = {};
    if (fields.fajr !== undefined) updateData.fajr = fields.fajr;
    if (fields.dhuhr !== undefined) updateData.dhuhr = fields.dhuhr;
    if (fields.asr !== undefined) updateData.asr = fields.asr;
    if (fields.maghrib !== undefined) updateData.maghrib = fields.maghrib;
    if (fields.isha !== undefined) updateData.isha = fields.isha;
    if (fields.tahajjud !== undefined) updateData.tahajjud = fields.tahajjud;
    if (fields.morning_dhikr !== undefined) updateData.morning_dhikr = fields.morning_dhikr;
    if (fields.evening_dhikr !== undefined) updateData.evening_dhikr = fields.evening_dhikr;
    if (fields.before_sleep_dhikr !== undefined) updateData.before_sleep_dhikr = fields.before_sleep_dhikr;
    if (fields.yaseen_after_fajr !== undefined) updateData.yaseen_after_fajr = fields.yaseen_after_fajr;
    if (fields.mulk_before_sleep !== undefined) updateData.mulk_before_sleep = fields.mulk_before_sleep;
    if (fields.istighfar_count !== undefined) updateData.istighfar_count = fields.istighfar_count;
    if (fields.notes !== undefined) updateData.notes = fields.notes;
    if (fields.updated_by !== undefined) updateData.updated_by = fields.updated_by;
    
    // Add timestamp fields if provided
    if (fields.fajr_at !== undefined) updateData.fajr_at = fields.fajr_at;
    if (fields.dhuhr_at !== undefined) updateData.dhuhr_at = fields.dhuhr_at;
    if (fields.asr_at !== undefined) updateData.asr_at = fields.asr_at;
    if (fields.maghrib_at !== undefined) updateData.maghrib_at = fields.maghrib_at;
    if (fields.isha_at !== undefined) updateData.isha_at = fields.isha_at;
    if (fields.tahajjud_at !== undefined) updateData.tahajjud_at = fields.tahajjud_at;
    if (fields.morning_dhikr_at !== undefined) updateData.morning_dhikr_at = fields.morning_dhikr_at;
    if (fields.evening_dhikr_at !== undefined) updateData.evening_dhikr_at = fields.evening_dhikr_at;
    if (fields.sleep_dhikr_at !== undefined) updateData.sleep_dhikr_at = fields.sleep_dhikr_at;
    
    const { data: updatedEntry, error } = await supa
      .from('entries')
      .upsert({ profile_id: profileId, day, ...updateData }, { onConflict: 'profile_id,day' })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating entry:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
    
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Entries PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const day = searchParams.get('day');
    
    if (!profileId || !day) {
      return NextResponse.json({ error: 'ProfileId and day are required' }, { status: 400 });
    }
    
    const { error } = await supa
      .from('entries')
      .delete()
      .eq('profile_id', profileId)
      .eq('day', day);
    
    if (error) {
      console.error('Error deleting entry:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Entries DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}