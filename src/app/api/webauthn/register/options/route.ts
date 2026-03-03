import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { buildRegistrationOptions } from '@/lib/webauthn';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const userName = req.nextUrl.searchParams.get('userName');

  if (!userId || !userName) {
    return NextResponse.json({ error: 'Missing userId or userName' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: existing } = await db
    .from('attendees')
    .select('credential_id')
    .eq('id', userId)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already registered' }, { status: 409 });
  }

  const options = await buildRegistrationOptions(userId, userName);
  
  const cookieStore = await cookies();
  cookieStore.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 300,
  });

  return NextResponse.json(options);
}
