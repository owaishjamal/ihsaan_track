import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  try {
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const query = supa
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    const { data, error } = await (date ? query.eq('date', date) : query);
    if (error) return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const { title, date } = await request.json();
    const { data: userRes } = await supa.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supa
      .from('daily_tasks')
      .insert({ title: String(title || '').trim(), date: date || new Date().toISOString().split('T')[0], user_id: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const { id, is_done, title } = await request.json();
    if (!id) return NextResponse.json({ error: 'Task id required' }, { status: 400 });
    const update: any = {};
    if (is_done !== undefined) update.is_done = !!is_done;
    if (title !== undefined) update.title = String(title).trim();
    const { data, error } = await supa
      .from('daily_tasks')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supa = getSupabaseForRequest(request);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Task id required' }, { status: 400 });
    const { error } = await supa
      .from('daily_tasks')
      .delete()
      .eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


