import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithinRadius } from '@/lib/geo';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionToken, fullName, identifier, deviceHash, userLat, userLng } = body;

  if (!sessionToken || !fullName || !identifier || !deviceHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (userLat == null || userLng == null) {
    return NextResponse.json({ error: 'Location is required to check in.' }, { status: 403 });
  }

  const db = createServiceClient();

  const { data: session, error: sessionError } = await db
    .from('sessions')
    .select('*')
    .eq('qr_token', sessionToken)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  if (session.passkey_required) {
    return NextResponse.json({ error: 'This session requires passkey verification.' }, { status: 400 });
  }

  // Enforce GPS geofence server-side
  const locationVerified = isWithinRadius(
    { lat: userLat, lng: userLng },
    { lat: session.location_lat, lng: session.location_lng },
    session.radius_meters,
  );

  if (!locationVerified) {
    return NextResponse.json(
      { error: 'You are outside the allowed location radius for this session.' },
      { status: 403 },
    );
  }

  const cleanIdentifier = identifier.trim().toUpperCase();

  // Look up existing attendee by org + identifier
  let attendeeId: string;
  const { data: existingAttendee } = await db
    .from('attendees')
    .select('id, full_name')
    .eq('org_id', session.org_id)
    .eq('identifier', cleanIdentifier)
    .maybeSingle();

  if (existingAttendee) {
    attendeeId = existingAttendee.id;
  } else {
    if (session.strict_mode) {
      return NextResponse.json(
        { error: 'You are not on the attendee list for this session.' },
        { status: 403 },
      );
    }

    // Create new attendee record
    const { data: newAttendee, error: createError } = await db
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
  const { data: existing } = await db
    .from('attendance')
    .select('id')
    .eq('session_id', session.id)
    .eq('attendee_id', attendeeId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already checked in to this session.' }, { status: 409 });
  }

  const { data: existingDevice } = await db
    .from('attendance')
    .select('id')
    .eq('session_id', session.id)
    .eq('device_hash', deviceHash)
    .maybeSingle();

  if (existingDevice) {
    return NextResponse.json(
      { error: 'This device has already been used for attendance in this session.' },
      { status: 409 },
    );
  }

  // Record attendance
  const { data: attendance, error: insertError } = await db.from('attendance').insert({
    session_id: session.id,
    attendee_id: attendeeId,
    device_hash: deviceHash,
    location_verified: true,
  }).select('check_in_number').single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'This device has already been used for attendance in this session.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, name: fullName.trim(), checkInNumber: attendance?.check_in_number ?? null },
    { status: 201 },
  );
}
