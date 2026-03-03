'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { AttendanceWithAttendee } from '@/types';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: Props) {
  const [records, setRecords] = useState<AttendanceWithAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRecords = async (id: string, page = 1) => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${id}/attendance?page=${page}`);
    const resData = await res.json();
    if (res.ok) {
      setRecords(resData.data || []);
      setTotalPages(Math.ceil((resData.count || 0) / 10));
    }
    setLoading(false);
  };

  useEffect(() => {
    params.then(({ id }) => {
      setSessionId(id);
      loadRecords(id, currentPage);
    });
  }, [params, currentPage]);

  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/export`);
      const fullRecords: AttendanceWithAttendee[] = await res.json();
      
      const rows = [
        ['S/N', 'Full Name', 'Attendee ID', 'Location Verified', 'Date', 'Time'],
        ...fullRecords.map((r, i) => [
          (i + 1).toString(),
          r.attendees?.full_name ?? '',
          r.attendees?.identifier ?? '',
          r.location_verified ? 'Yes' : 'No',
          new Date(r.verified_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' }),
          new Date(r.verified_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true }),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-full-${sessionId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Full CSV downloaded successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.inner} container container--wide`}>
        <header className={styles.header}>
          <div className={styles.titleContainer}>
            <Link href="/admin" className={styles.back} aria-label="Back to Dashboard">
              <ArrowLeft size={18} />
            </Link>
            <h1 className={styles.title}>Attendance Records</h1>
          </div>
          
          <button onClick={exportCsv} className={styles.exportBtn} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Exporting...' : 'Export Full CSV'}
          </button>
        </header>

        {loading ? (
          <div className={styles.loader} />
        ) : records.length === 0 ? (
          <div className={styles.empty}>No attendance records yet.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sn}>S/N</th>
                  <th>Full Name</th>
                  <th>Attendee ID</th>
                  <th>Location</th>
                  <th>Verified At</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td data-label="S/N" className={styles.sn}>
                      <span>{(currentPage - 1) * 10 + i + 1}</span>
                    </td>
                    <td data-label="Full Name">{r.attendees?.full_name ?? '—'}</td>
                    <td data-label="Attendee ID"><span className={styles.code}>{r.attendees?.identifier ?? '—'}</span></td>
                    <td data-label="Location">
                      <span className={r.location_verified ? styles.verified : styles.unverified}>
                        {r.location_verified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </td>
                    <td data-label="Verified At" className={styles.time}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                          {new Date(r.verified_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })}
                        </span>
                        <span style={{ fontSize: 12 }}>
                          {new Date(r.verified_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage <= 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
