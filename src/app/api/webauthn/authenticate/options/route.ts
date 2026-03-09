import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase/server';

const RP_ID = process.env.WEBAUTHN_RP_ID!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const credentialId = searchParams.get('credentialId');

  if (!credentialId) {
    return NextResponse.json({ error: 'credentialId is required.' }, { status: 400 });
  }

  const db = createServiceClient();

  // Look up the attendee by their stored credential ID
  const { data: attendee } = await db
    .from('attendees')
    .select('id, credential_id, public_key, sign_count')
    .eq('credential_id', credentialId)
    .maybeSingle();

  if (!attendee) {
    return NextResponse.json({ error: 'Device not recognised. Please register first.' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: [{ id: credentialId }],
    userVerification: 'required',
  });

  return NextResponse.json(options);
}
