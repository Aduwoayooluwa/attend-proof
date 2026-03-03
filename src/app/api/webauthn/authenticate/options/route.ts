import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { buildAuthenticationOptions } from '@/lib/webauthn';

export async function GET(req: NextRequest) {
  const credentialId = req.nextUrl.searchParams.get('credentialId');

  if (!credentialId) {
    return NextResponse.json({ error: 'Missing credentialId' }, { status: 400 });
  }

  // We don't verify the credential ID here because base64url padding can differ
  // between the browser and the database. We leave the strict check to the verify step.

  const options = await buildAuthenticationOptions(credentialId);
  
  const cookieStore = await cookies();
  cookieStore.set('webauthn_auth_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300,
  });

  return NextResponse.json({ ...options, attendeeId: credentialId }); // pass it through temporarily
}
