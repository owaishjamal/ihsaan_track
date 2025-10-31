import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const { profileId, name, type } = await request.json();
    if (!profileId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const today = new Date().toISOString().split('T')[0];

    // Avoid duplicates for same day
    const { data: existing, error: selErr } = await supa
      .from('achievements')
      .select('id')
      .eq('profile_id', profileId)
      .eq('achievement_name', name)
      .gte('earned_at', `${today}T00:00:00Z`)
      .lte('earned_at', `${today}T23:59:59Z`)
      .limit(1)
      .maybeSingle();
    if (selErr) {
      // continue
    }
    if (existing) return NextResponse.json({ ok: true, skipped: true });

    const { data, error } = await supa
      .from('achievements')
      .insert({ profile_id: profileId, achievement_type: type || 'dhikr', achievement_name: name, earned_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Failed to record achievement' }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


