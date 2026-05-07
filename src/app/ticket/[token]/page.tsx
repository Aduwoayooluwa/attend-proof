'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, Ticket, ScanQrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { AttendanceTicketView } from '@/types';
import styles from './page.module.css';

interface Props {
  params: Promise<{ token: string }>;
}

function formatDate(date: string) {
  if (!date) {
    return 'Session date unavailable';
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00+01:00`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'Session date unavailable';
  }

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function formatDateTime(timestamp: string) {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

export default function TicketPage({ params }: Props) {
  const { token } = use(params);
  const [ticket, setTicket] = useState<AttendanceTicketView | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/tickets/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? 'Could not load ticket.');
        }
        setTicket(data);
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Could not load ticket.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const confirmTicket = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/tickets/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.redeemedAt
            ? `Already confirmed at ${formatDateTime(data.redeemedAt)}.`
            : data.error ?? 'Could not confirm ticket.',
        );
      }
      setTicket(data);
      toast.success(`Confirmed at ${formatDateTime(data.redeemedAt)}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm ticket.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loader} />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.stateIcon}><ShieldAlert size={32} strokeWidth={1.6} /></div>
          <h1 className={styles.title}>Ticket unavailable</h1>
          <p className={styles.text}>{message || 'This attendance ticket could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.stateIcon}>
          {ticket.redeemedAt ? <CheckCircle2 size={32} strokeWidth={1.6} /> : <Ticket size={32} strokeWidth={1.6} />}
        </div>
        <p className={styles.eyebrow}>{ticket.organizationName}</p>
        <h1 className={styles.title}>{ticket.sessionName}</h1>
        <p className={styles.text}>{formatDate(ticket.sessionDate)}</p>

        <div className={styles.ticketMeta}>
          <div>
            <span className={styles.label}>Attendee</span>
            <strong>{ticket.name}</strong>
          </div>
          <div>
            <span className={styles.label}>Attendee ID</span>
            <strong>{ticket.identifier}</strong>
          </div>
          <div>
            <span className={styles.label}>Check-in number</span>
            <strong>{ticket.checkInNumber != null ? `#${ticket.checkInNumber}` : '—'}</strong>
          </div>
          <div>
            <span className={styles.label}>Checked in</span>
            <strong>{formatDateTime(ticket.verifiedAt)}</strong>
          </div>
        </div>

        <div className={`${styles.statusCard} ${ticket.redeemedAt ? styles.statusConfirmed : styles.statusPending}`}>
          <ScanQrCode size={18} />
          <span>
            {ticket.redeemedAt
              ? `Confirmed at ${formatDateTime(ticket.redeemedAt)}`
              : 'Awaiting admin confirmation'}
          </span>
        </div>

        {!ticket.redeemedAt && (
          <Button type="button" onClick={confirmTicket} loading={confirming}>
            Confirm Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
