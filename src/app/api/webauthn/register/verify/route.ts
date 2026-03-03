import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { confirmRegistration } from '@/lib/webauthn';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, fullName, identifier, credential, sessionToken, deviceHash, userLat, userLng } = body;

  if (!userId || !fullName || !identifier || !credential || !sessionToken || !deviceHash) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get('webauthn_challenge')?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 400 });
  }

  const verification = await confirmRegistration(credential, expectedChallenge);

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Biometric verification failed' }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('qr_token', sessionToken)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
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

  cookieStore.delete('webauthn_challenge');

  const { credential: cred } = verification.registrationInfo;
  const publicKeyBase64 = isoBase64URL.fromBuffer(cred.publicKey);

  if (userLat == null || userLng == null) {
    return NextResponse.json({ error: 'Location permissions required to register for this session.' }, { status: 403 });
  }

  const { isWithinRadius } = await import('@/lib/geo');
  const locationVerified = isWithinRadius(
    { lat: userLat, lng: userLng },
    { lat: session.location_lat, lng: session.location_lng },
    session.radius_meters,
  );

  if (!locationVerified) {
    return NextResponse.json({ error: 'You are outside the allowed location radius for this session.' }, { status: 403 });
  }
  const { data, error } = await db
    .from('attendees')
    .insert({
      id: userId,
      org_id: session.org_id,
      full_name: fullName,
      identifier: identifier,
      credential_id: cred.id,
      public_key: publicKeyBase64,
      sign_count: cred.counter,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Directly insert attendance
  const { error: attendError } = await db.from('attendance').insert({
    session_id: session.id,
    attendee_id: data.id,
    device_hash: deviceHash,
    location_verified: locationVerified,
  });

  if (attendError) return NextResponse.json({ error: attendError.message }, { status: 500 });

  return NextResponse.json({ attendeeId: data.id }, { status: 201 });
}
