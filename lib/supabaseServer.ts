import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseForRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authorization = request.headers.get('authorization') || '';
  return createClient(supabaseUrl, supabaseAnon, {
    global: {
      headers: authorization ? { Authorization: authorization } : {}
    }
  });
}


