'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Users, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, X, Search, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import styles from './page.module.css';

interface Attendee {
  id: string;
  full_name: string;
  identifier: string;
  created_at: string;
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'done';

interface UploadResult {
  inserted: number;
  updated: number;
  errors: number;
  total: number;
}

export default function RosterPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ fullName: string; identifier: string }[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', identifier: '' });
  const [editLoading, setEditLoading] = useState(false);

  const loadAttendees = useCallback(async (p = 1, q = search) => {
    setListLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set('search', q);
    const res = await fetch(`/api/roster?${params}`);
    const data = await res.json();
    if (res.ok) {
      setAttendees(data.data || []);
      setTotalPages(Math.ceil((data.count || 0) / 20));
      setTotal(data.count || 0);
    }
    setListLoading(false);
  }, [search]);

  useEffect(() => {
    loadAttendees(page);
  }, [page, loadAttendees]);

  // Debounce: only fire search after 350ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    // Quick preview — show first 5 data rows
    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const headers = lines[0]?.split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const nameIdx = headers?.findIndex((h) => h.includes('name')) ?? -1;
    const idIdx = headers?.findIndex((h) => h.includes('id') || h.includes('identifier') || h.includes('code')) ?? -1;

    const rows = lines.slice(1, 6).map((line) => {
      const cols = line.match(/(".*?"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').trim()) ?? [];
      return {
        fullName: nameIdx >= 0 ? cols[nameIdx] : '?',
        identifier: idIdx >= 0 ? cols[idIdx]?.toUpperCase() : '?',
      };
    }).filter((r) => r.fullName && r.identifier);

    setPreview(rows);
    setUploadState('preview');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState('uploading');
    const form = new FormData();
    form.append('file', selectedFile);

    try {
      const res = await fetch('/api/roster', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setUploadState('done');
      // Reload the list
      setPage(1);
      loadAttendees(1);
      toast.success(`Roster uploaded: ${data.inserted} added, ${data.updated} updated`);
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
      setUploadState('idle');
    }
  };

  const resetUpload = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setPreview([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (a: Attendee) => {
    setEditingId(a.id);
    setEditForm({ fullName: a.full_name, identifier: a.identifier });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.fullName.trim() || !editForm.identifier.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/roster/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: editForm.fullName, identifier: editForm.identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAttendees((prev) => prev.map((a) => (a.id === id ? data : a)));
      setEditingId(null);
      toast.success('Attendee updated');
    } catch (err: any) {
      toast.error(err.message ?? 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    toast.warning(`Delete "${name}" from roster?`, {
      description: 'This will remove them from your roster. Existing attendance records are kept.',
      action: { label: 'Delete', onClick: () => confirmDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 8000,
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/roster/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setAttendees((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      toast.success('Attendee removed from roster');
    } catch (err: any) {
      toast.error(err.message ?? 'Delete failed');
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.inner} container container--wide`}>

        <header className={styles.header}>
          <div className={styles.titleRow}>
            <Link href="/admin" className={styles.back} aria-label="Back to Dashboard">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className={styles.title}>Attendee Roster</h1>
              {total > 0 && <p className={styles.subtitle}>{total} attendee{total !== 1 ? 's' : ''} in your organisation</p>}
            </div>
          </div>

          <button className={styles.uploadTrigger} onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Upload CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </header>

        {/* Upload panel */}
        {uploadState !== 'idle' && (
          <div className={styles.uploadPanel}>
            {(uploadState === 'preview') && (
              <>
                <div className={styles.uploadPanelHeader}>
                  <div className={styles.uploadPanelTitle}>
                    <Upload size={16} />
                    Preview — {selectedFile?.name}
                  </div>
                  <button className={styles.closeUploadBtn} onClick={resetUpload}><X size={16} /></button>
                </div>
                <p className={styles.uploadHint}>Showing first 5 rows. Confirm to upload all rows.</p>
                <div className={styles.previewTable}>
                  <div className={styles.previewHeader}>
                    <span>Full Name</span><span>Attendee ID</span>
                  </div>
                  {preview.map((row, i) => (
                    <div key={i} className={styles.previewRow}>
                      <span>{row.fullName}</span>
                      <span className={styles.code}>{row.identifier}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.uploadActions}>
                  <Button variant="ghost" onClick={resetUpload}>Cancel</Button>
                  <Button onClick={handleUpload}>Confirm & Upload</Button>
                </div>
              </>
            )}

            {uploadState === 'uploading' && (
              <div className={styles.uploadingState}>
                <div className={styles.uploadSpinner} />
                <p>Processing roster CSV...</p>
              </div>
            )}

            {uploadState === 'done' && result && (
              <div className={styles.uploadResult}>
                <CheckCircle2 size={28} className={styles.successIcon} />
                <h3>Upload Complete</h3>
                <div className={styles.resultStats}>
                  <div className={styles.resultStat}>
                    <span className={styles.statNum}>{result.inserted}</span>
                    <span>New</span>
                  </div>
                  <div className={styles.resultStat}>
                    <span className={styles.statNum}>{result.updated}</span>
                    <span>Updated</span>
                  </div>
                  {result.errors > 0 && (
                    <div className={`${styles.resultStat} ${styles.statError}`}>
                      <span className={styles.statNum}>{result.errors}</span>
                      <span>Errors</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" onClick={resetUpload}>Done</Button>
              </div>
            )}
          </div>
        )}

        {/* CSV format hint */}
        <div className={styles.hint}>
          <AlertCircle size={14} />
          <span>CSV must have <strong>Full Name</strong> and <strong>Attendee ID</strong> (or ID / Identifier) columns. First row is the header.</span>
        </div>

        {/* Attendee list */}
        <div className={styles.listSection}>
          <div className={styles.listTopRow}>
            <div className={styles.listHeader}>
              <Users size={16} />
              <span>Current Roster</span>
            </div>
            {/* Search input */}
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name or ID…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search roster"
              />
              {searchInput && (
                <button className={styles.searchClear} onClick={() => setSearchInput('')} aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {listLoading ? (
            <div className={styles.loader} />
          ) : attendees.length === 0 ? (
            <div className={styles.empty}>No attendees uploaded yet. Upload a CSV to get started.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Full Name</th>
                    <th>Attendee ID</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a, i) => (
                    <tr key={a.id} className={editingId === a.id ? styles.editingRow : ''}>
                      <td data-label="S/N" className={styles.sn}><span>{(page - 1) * 20 + i + 1}</span></td>

                      {editingId === a.id ? (
                        <>
                          <td data-label="Full Name">
                            <input
                              className={styles.inlineInput}
                              value={editForm.fullName}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                              placeholder="Full Name"
                              autoFocus
                            />
                          </td>
                          <td data-label="Attendee ID">
                            <input
                              className={styles.inlineInput}
                              value={editForm.identifier}
                              onChange={(e) => setEditForm({ ...editForm, identifier: e.target.value.toUpperCase() })}
                              placeholder="Attendee ID"
                            />
                          </td>
                          <td data-label="Added" className={styles.time}>
                            {new Date(a.created_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td data-label="Actions" className={styles.actions}>
                            <div className={styles.actionGroup}>
                              <button className={styles.saveBtn} onClick={() => handleSaveEdit(a.id)} disabled={editLoading} title="Save">
                                <Check size={14} />
                              </button>
                              <button className={styles.cancelBtn} onClick={() => setEditingId(null)} title="Cancel">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td data-label="Full Name">{a.full_name}</td>
                          <td data-label="Attendee ID"><span className={styles.code}>{a.identifier}</span></td>
                          <td data-label="Added" className={styles.time}>
                            {new Date(a.created_at).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td data-label="Actions" className={styles.actions}>
                            <div className={styles.actionGroup}>
                              <button className={styles.editBtn} onClick={() => startEdit(a)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className={styles.deleteBtn} onClick={() => handleDelete(a.id, a.full_name)} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!listLoading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
