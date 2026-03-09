import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isWithinRadius } from '@/lib/geo';

const RP_ID = process.env.WEBAUTHN_RP_ID!;
const ORIGIN = process.env.WEBAUTHN_ORIGIN!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { attendeeId, sessionToken, credential, userLat, userLng } = body;

  if (!attendeeId || !sessionToken || !credential) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const db = createServiceClient();

  // 1. Validate session
  const { data: session } = await db
    .from('sessions')
    .select('id, org_id, location_lat, location_lng, radius_meters, strict_mode')
    .eq('qr_token', sessionToken)
    .single();

  if (!session?.strict_mode) {
    return NextResponse.json({ error: 'This session does not require biometric authentication.' }, { status: 400 });
  }

  // 2. GPS validation
  if (userLat == null || userLng == null || !isWithinRadius(
    { lat: userLat, lng: userLng },
    { lat: session.location_lat, lng: session.location_lng },
    session.radius_meters,
  )) {
    return NextResponse.json({ error: 'You are outside the allowed location radius.' }, { status: 403 });
  }

  // 3. Fetch attendee's stored credential
  const { data: attendee } = await db
    .from('attendees')
    .select('id, full_name, credential_id, public_key, sign_count')
    .eq('id', attendeeId)
    .maybeSingle();

  if (!attendee?.credential_id || !attendee?.public_key) {
    return NextResponse.json({ error: 'No registered device found. Please register first.' }, { status: 404 });
  }

  // 4. Verify the WebAuthn authentication response
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: async (challenge) => !!challenge,
      expectedRPID: RP_ID,
      expectedOrigin: ORIGIN,
      credential: {
        id: attendee.credential_id,
        publicKey: Buffer.from(attendee.public_key, 'base64url'),
        counter: attendee.sign_count ?? 0,
      },
      requireUserVerification: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Biometric verification failed.' }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Biometric verification failed.' }, { status: 401 });
  }

  // 5. Update the sign counter (replay attack prevention)
  await db
    .from('attendees')
    .update({ sign_count: verification.authenticationInfo.newCounter })
    .eq('id', attendee.id);

  // 6. Check for duplicate attendance
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
  await db.from('attendance').insert({
    session_id: session.id,
    attendee_id: attendee.id,
    location_verified: true,
  });

  return NextResponse.json({ name: attendee.full_name }, { status: 200 });
}
