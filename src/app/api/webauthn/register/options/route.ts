import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase/server';

const RP_ID = process.env.WEBAUTHN_RP_ID!;
const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? 'AttendProof';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const sessionToken = searchParams.get('sessionToken');
  const identifier = searchParams.get('identifier')?.trim().toUpperCase();
  const fullName = searchParams.get('fullName')?.trim();

  if (!orgId || !sessionToken || !identifier) {
    return NextResponse.json({ error: 'orgId, sessionToken, and identifier are required.' }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: session, error: sessionError } = await db
    .from('sessions')
    .select('org_id, strict_mode, passkey_required')
    .eq('qr_token', sessionToken)
    .single();

  if (sessionError || !session || session.org_id !== orgId) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  if (!session.passkey_required) {
    return NextResponse.json({ error: 'This session does not require passkey verification.' }, { status: 400 });
  }

  const { data: attendee, error: rosterError } = await db
    .from('attendees')
    .select('id, full_name, credential_id')
    .eq('org_id', orgId)
    .eq('identifier', identifier)
    .maybeSingle();

  if (rosterError) {
    return NextResponse.json({ error: rosterError.message }, { status: 500 });
  }

  if (session.strict_mode && !attendee) {
    return NextResponse.json({ error: 'You are not on the attendee list for this session.' }, { status: 403 });
  }

  if (attendee?.credential_id) {
    return NextResponse.json(
      {
        error: 'This Attendee ID is already registered to a device. Authenticate to continue.',
        action: 'authenticate',
        attendeeId: attendee.id,
        credentialId: attendee.credential_id,
        name: attendee.full_name,
      },
      { status: 409 },
    );
  }

  const displayName = attendee?.full_name ?? fullName;

  if (!displayName) {
    return NextResponse.json({ error: 'Full name is required for first-time passkey registration.' }, { status: 400 });
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: `${identifier}@org-${orgId.slice(0, 8)}`,
    userDisplayName: displayName,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  });

  return NextResponse.json(options);
}
