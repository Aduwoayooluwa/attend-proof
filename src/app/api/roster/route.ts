import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Auth check
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceDb = createServiceClient();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!file.name.endsWith('.csv')) return NextResponse.json({ error: 'Only CSV files are accepted.' }, { status: 400 });

    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row.' }, { status: 400 });
    }

    // Parse header to find column indices (case-insensitive)
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('identifier') || h.includes('code'));

    if (nameIdx === -1 || idIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have a "Full Name" column and an "Attendee ID" (or "ID" / "Identifier") column.' },
        { status: 400 },
      );
    }

    const rows = lines.slice(1).map((line) => {
      // Handle quoted CSV values
      const cols = line.match(/(".*?"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').trim()) ?? [];
      const fullName = cols[nameIdx]?.trim();
      const identifier = cols[idIdx]?.trim().toUpperCase();
      return { fullName, identifier };
    }).filter((r) => r.fullName && r.identifier);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in the CSV.' }, { status: 400 });
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);

      for (const row of batch) {
        const { data: existing } = await serviceDb
          .from('attendees')
          .select('id')
          .eq('org_id', user.id)
          .eq('identifier', row.identifier)
          .maybeSingle();

        if (existing) {
          // Update name if it changed
          const { error } = await serviceDb
            .from('attendees')
            .update({ full_name: row.fullName! })
            .eq('id', existing.id);
          if (error) errors++;
          else updated++;
        } else {
          const { error } = await serviceDb
            .from('attendees')
            .insert({ org_id: user.id, full_name: row.fullName!, identifier: row.identifier! });
          if (error) errors++;
          else inserted++;
        }
      }
    }

    return NextResponse.json({ inserted, updated, errors, total: rows.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Upload failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceDb = createServiceClient();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search')?.trim() || '';
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = serviceDb
    .from('attendees')
    .select('id, full_name, identifier, created_at', { count: 'exact' })
    .eq('org_id', user.id)
    .order('full_name', { ascending: true });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,identifier.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}
