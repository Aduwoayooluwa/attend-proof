import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from('sessions')
    .select('id, name, date, radius_meters, qr_token, org_id, queue_numbers_enabled, strict_mode, organizations(name)')
    .eq('qr_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
