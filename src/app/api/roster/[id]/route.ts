import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

async function getAuthedUser() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { fullName, identifier } = await req.json();

  if (!fullName?.trim() || !identifier?.trim()) {
    return NextResponse.json({ error: 'Full name and Attendee ID are required.' }, { status: 400 });
  }

  const db = createServiceClient();

  // Confirm the attendee belongs to this org
  const { data: attendee } = await db
    .from('attendees')
    .select('id, org_id')
    .eq('id', id)
    .eq('org_id', user.id)
    .maybeSingle();

  if (!attendee) return NextResponse.json({ error: 'Attendee not found.' }, { status: 404 });

  const { data, error } = await db
    .from('attendees')
    .update({ full_name: fullName.trim(), identifier: identifier.trim().toUpperCase() })
    .eq('id', id)
    .select('id, full_name, identifier, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = createServiceClient();

  // Confirm the attendee belongs to this org
  const { data: attendee } = await db
    .from('attendees')
    .select('id, org_id')
    .eq('id', id)
    .eq('org_id', user.id)
    .maybeSingle();

  if (!attendee) return NextResponse.json({ error: 'Attendee not found.' }, { status: 404 });

  const { error } = await db.from('attendees').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
