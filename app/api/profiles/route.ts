import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { data: profiles, error } = await supa
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
    
    return NextResponse.json(profiles || []);
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supa = getSupabaseForRequest(request);
    const { name, color, email, phone, dateOfBirth } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Resolve caller user for ownership (RLS)
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build insert payload with provided fields
    const insertData: any = {
      name: name.trim(),
      color: color || '#3b82f6',
      user_id: userId
    };
    if (email !== undefined) insertData.email = email || null;
    if (phone !== undefined) insertData.phone = phone || null;
    if (dateOfBirth !== undefined) insertData.date_of_birth = dateOfBirth;

    // First attempt: insert with all provided fields
    let { data: newProfile, error } = await supa
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    // If schema mismatch (column missing), retry with minimal fields only
    if (error && (error.code === 'PGRST204' || (error.message || '').toLowerCase().includes('schema cache'))) {
      const minimalData = { name: name.trim(), color: color || '#3b82f6', user_id: userId } as any;
      const retry = await supa
        .from('profiles')
        .insert(minimalData)
        .select()
        .single();
      newProfile = retry.data;
      error = retry.error as any;
    }

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }
    
    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('Profiles POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, color, email, phone, dateOfBirth } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    
    const supa = getSupabaseForRequest(request);
    const { data: updatedProfile, error } = await supa
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profiles PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }
    
    const supa = getSupabaseForRequest(request);
    const { error } = await supa
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profiles DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}