import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase/server';

const RP_ID = process.env.WEBAUTHN_RP_ID!;
const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? 'AttendProof';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const identifier = searchParams.get('identifier')?.trim().toUpperCase();

  if (!orgId || !identifier) {
    return NextResponse.json({ error: 'orgId and identifier are required.' }, { status: 400 });
  }

  const db = createServiceClient();

  // 1. Check the identifier exists in the org's roster
  const { data: attendee, error: rosterError } = await db
    .from('attendees')
    .select('id, full_name, credential_id')
    .eq('org_id', orgId)
    .eq('identifier', identifier)
    .maybeSingle();

  if (rosterError || !attendee) {
    return NextResponse.json({ error: 'You are not on the attendee list for this session.' }, { status: 403 });
  }

  // 2. Check the identifier is not already claimed by another device
  if (attendee.credential_id) {
    return NextResponse.json(
      { error: 'This Attendee ID is already registered to a device. Please use that device to check in.' },
      { status: 409 },
    );
  }

  // 3. Generate WebAuthn registration options
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: `${identifier}@org-${orgId.slice(0, 8)}`,
    userDisplayName: attendee.full_name,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  });

  return NextResponse.json(options);
}
