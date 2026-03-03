import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { confirmAuthentication } from '@/lib/webauthn';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { isWithinRadius } from '@/lib/geo';
import { isSameDayWAT } from '@/lib/date';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { attendeeId, sessionToken, credential, deviceHash, userLat, userLng } = body;

  if (!attendeeId || !sessionToken || !credential || !deviceHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = createServiceClient();

  const [attendeeResult, sessionResult] = await Promise.all([
    db.from('attendees').select('*').eq('id', attendeeId).single(),
    db.from('sessions').select('*').eq('qr_token', sessionToken).single(),
  ]);

  if (attendeeResult.error || !attendeeResult.data) {
    return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
  }
  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const attendee = attendeeResult.data;
  const session = sessionResult.data;

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get('webauthn_auth_challenge')?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired. Please try again.' }, { status: 400 });
  }

  const publicKey = isoBase64URL.toBuffer(attendee.public_key) as Uint8Array<ArrayBuffer>;
  const verification = await confirmAuthentication(
    credential,
    expectedChallenge,
    publicKey,
    attendee.sign_count,
  );

  if (!verification.verified) {
    return NextResponse.json({ error: 'Biometric authentication failed' }, { status: 401 });
  }

  cookieStore.delete('webauthn_auth_challenge');

  const { data: existingAttendance } = await db
    .from('attendance')
    .select('id, verified_at')
    .eq('attendee_id', attendeeId)
    .eq('session_id', session.id)
    .single();

  if (existingAttendance && isSameDayWAT(existingAttendance.verified_at)) {
    return NextResponse.json({ error: 'Already signed in today' }, { status: 409 });
  }

  const { data: deviceCheck } = await db
    .from('attendance')
    .select('id')
    .eq('session_id', session.id)
    .eq('device_hash', deviceHash)
    .limit(1);

  if (deviceCheck && deviceCheck.length > 0) {
    return NextResponse.json({ error: 'This device has already been used to check into this session' }, { status: 409 });
  }

  if (userLat == null || userLng == null) {
    return NextResponse.json({ error: 'Location permissions required to check in for this session.' }, { status: 403 });
  }

  const locationVerified = isWithinRadius(
    { lat: userLat, lng: userLng },
    { lat: session.location_lat, lng: session.location_lng },
    session.radius_meters,
  );

  if (!locationVerified) {
    return NextResponse.json({ error: 'You are outside the allowed location radius for this session' }, { status: 403 });
  }

  await db
    .from('attendees')
    .update({ sign_count: verification.authenticationInfo.newCounter })
    .eq('id', attendeeId);

  const { error: insertError } = await db.from('attendance').insert({
    session_id: session.id,
    attendee_id: attendeeId,
    device_hash: deviceHash,
    location_verified: locationVerified,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
