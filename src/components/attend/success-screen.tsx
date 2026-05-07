'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import styles from './success-screen.module.css';

interface SuccessScreenProps {
  name: string;
  identifier: string;
  sessionName: string;
  sessionDate: string;
  organizationName: string;
  verifiedAt: string;
  checkInNumber: number | null;
  ticketToken: string;
  ticketUrl: string;
}

const WAT_TIMEZONE = 'Africa/Lagos';

function formatSessionDate(date: string) {
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
    timeZone: WAT_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function formatCheckInTime(timestamp: string) {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: WAT_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

function sanitizeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function SuccessScreen({
  name,
  identifier,
  sessionName,
  sessionDate,
  organizationName,
  verifiedAt,
  checkInNumber,
  ticketToken,
  ticketUrl,
}: SuccessScreenProps) {
  const qrCanvasRef = useRef<HTMLDivElement | null>(null);
  const autoDownloadRef = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const formattedSessionDate = useMemo(() => formatSessionDate(sessionDate), [sessionDate]);
  const formattedCheckInTime = useMemo(() => formatCheckInTime(verifiedAt), [verifiedAt]);
  const fileName = useMemo(() => (
    [
      sanitizeFilePart(organizationName),
      sanitizeFilePart(sessionName),
      checkInNumber != null ? `ticket-${checkInNumber}` : 'attendance-ticket',
    ].filter(Boolean).join('-') + '.png'
  ), [checkInNumber, organizationName, sessionName]);

  const downloadTicket = useCallback(async () => {
    const qrCanvas = qrCanvasRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      return;
    }

    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1800;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      ctx.fillStyle = '#f4efe8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawRoundedRect(90, 90, 1220, 1620, 48);
      ctx.fillStyle = '#fffaf4';
      ctx.fill();
      ctx.strokeStyle = '#d9cfc0';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#7f5b3b';
      ctx.font = '600 34px Arial';
      ctx.fillText(organizationName, 150, 200);

      ctx.fillStyle = '#2f2418';
      ctx.font = '700 72px Arial';
      ctx.fillText(sessionName, 150, 290, 1080);

      ctx.fillStyle = '#6b5f52';
      ctx.font = '500 34px Arial';
      ctx.fillText(formattedSessionDate, 150, 350);
      ctx.fillText(`Checked in at ${formattedCheckInTime}`, 150, 400);

      if (checkInNumber != null) {
        drawRoundedRect(150, 470, 1100, 210, 36);
        ctx.fillStyle = '#efe5d7';
        ctx.fill();
        ctx.fillStyle = '#7f5b3b';
        ctx.font = '600 28px Arial';
        ctx.fillText('Check-in Number', 190, 545);
        ctx.fillStyle = '#2f2418';
        ctx.font = '700 112px Arial';
        ctx.fillText(`#${checkInNumber}`, 190, 635);
      }

      drawRoundedRect(150, 730, 1100, 220, 36);
      ctx.fillStyle = '#f8f3ec';
      ctx.fill();
      ctx.fillStyle = '#7f5b3b';
      ctx.font = '600 28px Arial';
      ctx.fillText('Attendee', 190, 805);
      ctx.fillStyle = '#2f2418';
      ctx.font = '700 54px Arial';
      ctx.fillText(name, 190, 875, 980);
      ctx.fillStyle = '#6b5f52';
      ctx.font = '500 32px Arial';
      ctx.fillText(identifier, 190, 920, 980);

      drawRoundedRect(330, 1010, 740, 560, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e7ddcf';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.drawImage(qrCanvas, 400, 1080, 600, 600);

      ctx.fillStyle = '#6b5f52';
      ctx.font = '500 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Present this QR for confirmation', canvas.width / 2, 1635);
      ctx.textAlign = 'start';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [checkInNumber, fileName, formattedCheckInTime, formattedSessionDate, identifier, name, organizationName, sessionName]);

  useEffect(() => {
    if (autoDownloadRef.current) {
      return;
    }

    const downloadedKey = `attendance-ticket-downloaded:${ticketToken}`;
    if (window.localStorage.getItem(downloadedKey)) {
      return;
    }

    autoDownloadRef.current = true;
    const timer = window.setTimeout(() => {
      void downloadTicket().then(() => {
        window.localStorage.setItem(downloadedKey, '1');
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [downloadTicket, ticketToken]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <CheckCircle2 size={48} className={styles.icon} strokeWidth={1.5} />
      </div>
      <h2 className={styles.title}>You&rsquo;re in!</h2>
      <p className={styles.name}>{name}</p>
      <p className={styles.session}>Attendance recorded for <strong>{sessionName}</strong></p>
      {checkInNumber != null && (
        <div className={styles.numberCard}>
          <span className={styles.numberLabel}>Your check-in number</span>
          <strong className={styles.numberValue}>#{checkInNumber}</strong>
        </div>
      )}
      <div className={styles.ticketCard}>
        <div className={styles.ticketMeta}>
          <span className={styles.ticketOrg}>{organizationName}</span>
          <strong className={styles.ticketSession}>{sessionName}</strong>
          <span className={styles.ticketDate}>{formattedSessionDate}</span>
        </div>
        <div className={styles.ticketIdentity}>
          <strong>{name}</strong>
          <span>{identifier}</span>
          <span>Checked in at {formattedCheckInTime}</span>
        </div>
        <div ref={qrCanvasRef} className={styles.qrWrap}>
          <QRCodeCanvas value={ticketUrl} size={220} marginSize={2} includeMargin />
        </div>
        <p className={styles.ticketHint}>This ticket opens the confirmation page when an admin scans it.</p>
        <Button type="button" onClick={() => void downloadTicket()} loading={downloading}>
          <Download size={16} /> Download Ticket
        </Button>
      </div>
      <div className={styles.badge}>✓ Verified today</div>
    </div>
  );
}
