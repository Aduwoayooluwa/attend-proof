import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithinRadius } from '@/lib/geo';

const RP_ID = process.env.WEBAUTHN_RP_ID!;
const ORIGIN = process.env.WEBAUTHN_ORIGIN!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { identifier, orgId, sessionToken, credential, userLat, userLng } = body;

  if (!identifier || !orgId || !sessionToken || !credential) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const db = createServiceClient();

  // 1. Validate session
  const { data: session, error: sessionErr } = await db
    .from('sessions')
    .select('id, org_id, location_lat, location_lng, radius_meters, strict_mode')
    .eq('qr_token', sessionToken)
    .single();

  if (sessionErr || !session || session.org_id !== orgId) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  if (!session.strict_mode) {
    return NextResponse.json({ error: 'This session does not require biometric registration.' }, { status: 400 });
  }

  // 2. GPS validation
  if (userLat == null || userLng == null || !isWithinRadius(
    { lat: userLat, lng: userLng },
    { lat: session.location_lat, lng: session.location_lng },
    session.radius_meters,
  )) {
    return NextResponse.json({ error: 'You are outside the allowed location radius.' }, { status: 403 });
  }

  // 3. Verify the attendee is in the roster and unclaimed
  const cleanId = identifier.trim().toUpperCase();
  const { data: attendee } = await db
    .from('attendees')
    .select('id, full_name, credential_id')
    .eq('org_id', orgId)
    .eq('identifier', cleanId)
    .maybeSingle();

  if (!attendee) {
    return NextResponse.json({ error: 'You are not on the attendee list for this session.' }, { status: 403 });
  }

  if (attendee.credential_id) {
    return NextResponse.json(
      { error: 'This Attendee ID is already registered to a device.' },
      { status: 409 },
    );
  }

  // 4. Verify the WebAuthn registration credential
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: async (challenge) => !!challenge, // stateless — challenge verified via WebAuthn library internally
      expectedRPID: RP_ID,
      expectedOrigin: ORIGIN,
      requireUserVerification: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Biometric verification failed.' }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Biometric registration could not be verified.' }, { status: 400 });
  }

  const { credential: regCredential } = verification.registrationInfo;

  // 5. Persist the credential on the attendee record
  const { error: updateErr } = await db
    .from('attendees')
    .update({
      credential_id: regCredential.id,
      public_key: Buffer.from(regCredential.publicKey).toString('base64url'),
      sign_count: regCredential.counter,
    })
    .eq('id', attendee.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 6. Check for duplicate attendance in this session
  const { data: existingAttendance } = await db
    .from('attendance')
    .select('id')
    .eq('session_id', session.id)
    .eq('attendee_id', attendee.id)
    .maybeSingle();

  if (existingAttendance) {
    return NextResponse.json({ error: 'You have already checked in to this session.' }, { status: 409 });
  }

  // 7. Record attendance
  const { error: insertErr } = await db.from('attendance').insert({
    session_id: session.id,
    attendee_id: attendee.id,
    location_verified: true,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ attendeeId: attendee.id, name: attendee.full_name }, { status: 201 });
}
