'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, UserPlus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Request failed.';

  const loadRecords = useCallback(async (id: string, page = 1, query = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('search', query);
    const res = await fetch(`/api/sessions/${id}/attendance?${params.toString()}`);
    const resData = await res.json();
    if (res.ok) {
      setRecords(resData.data || []);
      setTotalPages(Math.ceil((resData.count || 0) / 10));
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    params.then(({ id }) => {
      setSessionId(id);
      loadRecords(id, currentPage, search);
    });
  }, [params, currentPage, search, loadRecords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Manual Check-in ─────────────────────────────────────────────
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualId, setManualId] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualId.trim()) return;
    setManualLoading(true);
    try {
      const res = await fetch(`/api/attend/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: manualName.trim(), identifier: manualId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        data.checkInNumber != null
          ? `${manualName.trim()} checked in manually as #${data.checkInNumber}.`
          : `${manualName.trim()} checked in manually.`,
      );
      setManualName('');
      setManualId('');
      setShowManual(false);
      // Reload current page to show new record
      loadRecords(sessionId, currentPage);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Manual check-in failed.');
    } finally {
      setManualLoading(false);
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/export`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to export CSV');
      }

      const fullRecords: AttendanceWithAttendee[] = Array.isArray(data) ? data : [];
      
      const rows = [
        ['S/N', 'Check-in Number', 'Full Name', 'Attendee ID', 'Location Verified', 'Checked-in Date', 'Checked-in Time', 'Ticket Confirmed At'],
        ...fullRecords.map((r, i) => [
          (i + 1).toString(),
          r.check_in_number?.toString() ?? '',
          r.attendees?.full_name ?? '',
          r.attendees?.identifier ?? '',
          r.location_verified ? 'Yes' : 'No',
          new Date(r.verified_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' }),
          new Date(r.verified_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true }),
          r.ticket_redeemed_at
            ? new Date(r.ticket_redeemed_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })
            : '',
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to export CSV');
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

          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name or attendee ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search attendance records"
            />
            {searchInput && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className={styles.headerActions}>
            <button onClick={() => setShowManual(true)} className={styles.manualBtn}>
              <UserPlus size={16} /> Manual Check-in
            </button>
            <button onClick={exportCsv} className={styles.exportBtn} disabled={exporting}>
              <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </header>

        {/* Manual Check-in Modal */}
        {showManual && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowManual(false); }}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Manual Check-in</h2>
                <button className={styles.closeBtn} onClick={() => setShowManual(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <p className={styles.modalDesc}>
                Use this for attendees who can&apos;t check in on their own device. Their record will be marked as manually verified.
              </p>
              <form onSubmit={handleManualCheckin} className={styles.manualForm}>
                <Input
                  id="manual-name"
                  label="Full Name"
                  placeholder=" Bola  Obi"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                />
                <Input
                  id="manual-id"
                  label="Attendee ID"
                  placeholder=" State Code / Staff ID / Student ID"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  required
                />
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={() => setShowManual(false)}>Cancel</Button>
                  <Button type="submit" loading={manualLoading}>Check In</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loader} />
        ) : records.length === 0 ? (
          <div className={styles.empty}>
            {search ? 'No matching attendance records found.' : 'No attendance records yet.'}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sn}>S/N</th>
                  <th>Check-in No.</th>
                  <th>Full Name</th>
                  <th>Attendee ID</th>
                  <th>Location</th>
                  <th>Verified At</th>
                  <th>Ticket</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td data-label="S/N" className={styles.sn}>
                      <span>{(currentPage - 1) * 10 + i + 1}</span>
                    </td>
                    <td data-label="Check-in No.">{r.check_in_number != null ? `#${r.check_in_number}` : '—'}</td>
                    <td data-label="Full Name">{r.attendees?.full_name ?? '—'}</td>
                    <td data-label="Attendee ID"><span className={styles.code}>{r.attendees?.identifier ?? '—'}</span></td>
                    <td data-label="Location">
                      <span className={r.location_verified ? styles.verified : styles.unverified}>
                        {r.location_verified ? '✓ Verified' : '✎ Manual'}
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
                    <td data-label="Ticket">
                      <span className={r.ticket_redeemed_at ? styles.verified : styles.pending}>
                        {r.ticket_redeemed_at
                          ? `✓ ${new Date(r.ticket_redeemed_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })}`
                          : 'Awaiting scan'}
                      </span>
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
