import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getTicketUrl } from '@/lib/tickets';

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from('attendance')
    .select(`
      check_in_number,
      verified_at,
      ticket_token,
      ticket_redeemed_at,
      attendees!inner(full_name, identifier),
      sessions!inner(name, date, qr_token, organizations!inner(name))
    `)
    .eq('ticket_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  }

  const attendee = firstRelation(data.attendees);
  const session = firstRelation(data.sessions);
  const organization = firstRelation(session?.organizations);

  return NextResponse.json({
    name: attendee?.full_name ?? '',
    identifier: attendee?.identifier ?? '',
    checkInNumber: data.check_in_number ?? null,
    verifiedAt: data.verified_at,
    ticketToken: data.ticket_token,
    ticketUrl: getTicketUrl(data.ticket_token),
    sessionName: session?.name ?? '',
    sessionDate: session?.date ?? '',
    sessionToken: session?.qr_token ?? '',
    organizationName: organization?.name ?? '',
    redeemedAt: data.ticket_redeemed_at ?? null,
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const authDb = await createClient();
  const { data: { user } } = await authDb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: ticket, error } = await db
    .from('attendance')
    .select(`
      id,
      ticket_token,
      ticket_redeemed_at,
      check_in_number,
      verified_at,
      attendees!inner(full_name, identifier),
      sessions!inner(org_id, name, date, qr_token, organizations!inner(name))
    `)
    .eq('ticket_token', token)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  }

  const attendee = firstRelation(ticket.attendees);
  const session = firstRelation(ticket.sessions);
  const organization = firstRelation(session?.organizations);

  if (session?.org_id !== user.id) {
    return NextResponse.json({ error: 'You cannot confirm tickets for this organization.' }, { status: 403 });
  }

  if (ticket.ticket_redeemed_at) {
    return NextResponse.json(
      {
        error: 'This ticket has already been confirmed.',
        redeemedAt: ticket.ticket_redeemed_at,
        name: attendee?.full_name ?? '',
        identifier: attendee?.identifier ?? '',
        checkInNumber: ticket.check_in_number ?? null,
        verifiedAt: ticket.verified_at,
        ticketToken: ticket.ticket_token,
        ticketUrl: getTicketUrl(ticket.ticket_token),
        sessionName: session?.name ?? '',
        sessionDate: session?.date ?? '',
        sessionToken: session?.qr_token ?? '',
        organizationName: organization?.name ?? '',
      },
      { status: 409 },
    );
  }

  const redeemedAt = new Date().toISOString();
  const { data: updated } = await db
    .from('attendance')
    .update({
      ticket_redeemed_at: redeemedAt,
      ticket_redeemed_by: user.id,
    })
    .eq('id', ticket.id)
    .is('ticket_redeemed_at', null)
    .select('ticket_redeemed_at')
    .maybeSingle();

  if (!updated?.ticket_redeemed_at) {
    const { data: fresh } = await db
      .from('attendance')
      .select('ticket_redeemed_at')
      .eq('id', ticket.id)
      .single();

    return NextResponse.json(
      {
        error: 'This ticket has already been confirmed.',
        redeemedAt: fresh?.ticket_redeemed_at ?? redeemedAt,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    name: attendee?.full_name ?? '',
    identifier: attendee?.identifier ?? '',
    checkInNumber: ticket.check_in_number ?? null,
    verifiedAt: ticket.verified_at,
    ticketToken: ticket.ticket_token,
    ticketUrl: getTicketUrl(ticket.ticket_token),
    sessionName: session?.name ?? '',
    sessionDate: session?.date ?? '',
    sessionToken: session?.qr_token ?? '',
    organizationName: organization?.name ?? '',
    redeemedAt: updated.ticket_redeemed_at,
  });
}
