import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  // Export grabs EVERYTHING without pagination limitations
  const { data, error } = await db
    .from('attendance')
    .select('id, check_in_number, ticket_redeemed_at, location_verified, verified_at, attendees(full_name, identifier)')
    .eq('session_id', id)
    .order('verified_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
