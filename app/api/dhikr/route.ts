import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseForRequest(request);
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const dhikrType = searchParams.get('dhikrType');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  if (!profileId) {
    return NextResponse.json({ error: 'ProfileId is required' }, { status: 400 });
  }
  
  try {
    // Get dhikr progress for the specific date
    const { data: dhikrProgress, error } = await supabase
      .from('dhikr_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching dhikr progress:', error);
      return NextResponse.json({ error: 'Failed to fetch dhikr progress' }, { status: 500 });
    }
    
    // If specific dhikr type requested, return only that count
    if (dhikrType && dhikrProgress) {
      const count = dhikrProgress[`${dhikrType}_count`] || 0;
      return NextResponse.json({ count });
    }
    
    // Return all dhikr counts if no specific type requested
    const result = dhikrProgress || {
      tasbih_count: 0,
      tahmid_count: 0,
      takbir_count: 0,
      istighfar_count: 0,
      salawat_count: 0,
      lailaha_count: 0,
      total_count: 0
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dhikr API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseForRequest(request);
  try {
    const { profileId, date, dhikrType, count, customDhikr } = await request.json();
    
    if (!profileId || !date) {
      return NextResponse.json({ error: 'ProfileId and date are required' }, { status: 400 });
    }
    
    // Get existing dhikr progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('dhikr_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', date)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing dhikr progress:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing progress' }, { status: 500 });
    }
    
    // Prepare update data
    const updateData: any = {
      profile_id: profileId,
      date: date
    };
    
    // If specific dhikr type and count provided, update that specific count
    if (dhikrType && count !== undefined) {
      // Normalize column key (allow passing either 'takbir' or 'takbir_count')
      const allowed = new Set(['tasbih_count','tahmid_count','takbir_count','istighfar_count','salawat_count','lailaha_count']);
      const columnKey = dhikrType.endsWith('_count') ? dhikrType : `${dhikrType}_count`;
      if (!allowed.has(columnKey)) {
        return NextResponse.json({ error: 'Invalid dhikr type' }, { status: 400 });
      }
      updateData[columnKey] = count;
      
      // Preserve other counts from existing data
      if (existingProgress) {
        Object.keys(existingProgress).forEach(key => {
          if (key.endsWith('_count') && key !== columnKey && key !== 'total_count') {
            updateData[key] = existingProgress[key];
          }
        });
      }
    }
    
    // Add custom dhikr if provided
    if (customDhikr) {
      updateData.custom_dhikr = customDhikr;
    }
    
    // Upsert dhikr progress
    const { data, error } = await supabase
      .from('dhikr_progress')
      .upsert(updateData, { onConflict: 'profile_id,date' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving dhikr progress:', error);
      return NextResponse.json({ error: 'Failed to save dhikr progress' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Dhikr POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}