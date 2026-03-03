import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await db
    .from('attendance')
    .select('id, device_hash, location_verified, verified_at, attendees(full_name, identifier)', { count: 'exact' })
    .eq('session_id', id)
    .order('verified_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}
