import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authDb = await createClient();
  const { data: { user } } = await authDb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: session, error: sessionError } = await db
    .from('sessions')
    .select('id')
    .eq('id', id)
    .eq('org_id', user.id)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  // Export grabs EVERYTHING without pagination limitations
  const { data, error } = await db
    .from('attendance')
    .select('id, check_in_number, ticket_redeemed_at, location_verified, verified_at, attendees(full_name, identifier)')
    .eq('session_id', id)
    .order('verified_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
