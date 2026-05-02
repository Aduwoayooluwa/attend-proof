import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

// Admin manual check-in — bypasses GPS, requires authenticated admin
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  // Ensure caller is a logged-in admin
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { fullName, identifier } = body;

  if (!fullName || !identifier) {
    return NextResponse.json({ error: 'Full name and Attendee ID are required.' }, { status: 400 });
  }

  const serviceDb = createServiceClient();

  // Verify the session belongs to this org
  const { data: session, error: sessionError } = await serviceDb
    .from('sessions')
    .select('id, org_id')
    .eq('id', sessionId)
    .eq('org_id', user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const cleanIdentifier = identifier.trim().toUpperCase();

  // Look up existing attendee by org + identifier
  let attendeeId: string;
  const { data: existingAttendee } = await serviceDb
    .from('attendees')
    .select('id')
    .eq('org_id', session.org_id)
    .eq('identifier', cleanIdentifier)
    .maybeSingle();

  if (existingAttendee) {
    attendeeId = existingAttendee.id;
  } else {
    // Create new attendee record
    const { data: newAttendee, error: createError } = await serviceDb
      .from('attendees')
      .insert({
        org_id: session.org_id,
        full_name: fullName.trim(),
        identifier: cleanIdentifier,
      })
      .select('id')
      .single();

    if (createError || !newAttendee) {
      return NextResponse.json({ error: createError?.message ?? 'Could not create attendee.' }, { status: 500 });
    }
    attendeeId = newAttendee.id;
  }

  // Prevent duplicate check-in for this session
  const { data: existing } = await serviceDb
    .from('attendance')
    .select('id')
    .eq('session_id', session.id)
    .eq('attendee_id', attendeeId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'This person has already been checked in.' }, { status: 409 });
  }

  // Insert manual attendance record (location_verified = false — admin override)
  const { data: attendance, error: insertError } = await serviceDb.from('attendance').insert({
    session_id: session.id,
    attendee_id: attendeeId,
    location_verified: false,
  }).select('check_in_number').single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, checkInNumber: attendance?.check_in_number ?? null }, { status: 201 });
}
