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
  const search = url.searchParams.get('search')?.trim() || '';
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from('attendance')
    .select('id, check_in_number, ticket_redeemed_at, location_verified, verified_at, attendees!inner(full_name, identifier)', { count: 'exact' })
    .eq('session_id', id)
    .order('verified_at', { ascending: true });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,identifier.ilike.%${search}%`, {
      foreignTable: 'attendees',
    });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}
