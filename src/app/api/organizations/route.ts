import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, name } = body;

  if (!id || !name) {
    return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
  }

  const db = createServiceClient();

  // We use the service client to bypass RLS, because the newly signed-up user
  // might not have a fully settled authenticated session yet on the client side.
  const { error } = await db.from('organizations').insert({
    id,
    name,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
