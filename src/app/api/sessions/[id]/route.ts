import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  // RLS will ensure that they can only delete their own session org_id = user.id
  const { error } = await db.from('sessions').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, date, location_lat, location_lng, radius_meters, queue_numbers_enabled, strict_mode } = body;

  const { data, error } = await db
    .from('sessions')
    .update({ name, date, location_lat, location_lng, radius_meters, queue_numbers_enabled, strict_mode })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
