'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, ExternalLink, MapPin, Calendar, Trash2, Edit2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Session } from '@/types';
import styles from './page.module.css';

const LocationPicker = dynamic(
  () => import('@/components/admin/location-picker').then((mod) => mod.LocationPicker),
  { ssr: false, loading: () => <div style={{ height: 300, background: 'var(--card)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading Map...</div> }
);

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', location_lat: '', location_lng: '', radius_meters: '150' });
  const [formLoading, setFormLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadSessions = async (page = 1) => {
    setLoading(true);
    const res = await fetch(`/api/sessions?page=${page}`);
    const resData = await res.json();
    if (res.ok) {
      setSessions(resData.data || []);
      setTotalPages(Math.ceil((resData.count || 0) / 10));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions(currentPage);
  }, [currentPage]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const url = editingId ? `/api/sessions/${editingId}` : '/api/sessions';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        location_lat: parseFloat(form.location_lat),
        location_lng: parseFloat(form.location_lng),
        radius_meters: parseInt(form.radius_meters),
      }),
    });
    
    if (res.ok) {
      toast.success(editingId ? 'Session updated successfully' : 'Session created successfully');
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', date: '', location_lat: '', location_lng: '', radius_meters: '150' });
      await loadSessions(1);
      setCurrentPage(1);
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to save session');
    }
    setFormLoading(false);
  };

  const performDelete = async (id: string, name: string) => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success(`Session "${name}" deleted`);
      // If deleting the last item on a page, drop back a page
      if (sessions.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await loadSessions(currentPage);
      }
    } else {
      setLoading(false);
      const data = await res.json();
      toast.error(data.error || 'Failed to delete session');
    }
  };

  const handleDelete = (id: string, name: string) => {
    toast.warning(`Delete session "${name}"?`, {
      description: 'This will also delete all attendance records.',
      action: {
        label: 'Delete',
        onClick: () => performDelete(id, name),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 10000,
    });
  };

  const openEdit = (session: Session) => {
    setForm({
      name: session.name || '',
      date: session.date || '',
      location_lat: session.location_lat?.toString() || '',
      location_lng: session.location_lng?.toString() || '',
      radius_meters: session.radius_meters?.toString() || '150',
    });
    setEditingId(session.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadQR = (id: string, name: string) => {
    const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const getAttendUrl = (token: string) =>
    `${window.location.origin}/attend/${token}`;

  return (
    <div>
      <div className={`container container--wide`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 'max-content' }}>
            <Button onClick={() => { setEditingId(null); setForm({ name: '', date: '', location_lat: '', location_lng: '', radius_meters: '150' }); setShowForm(true); }}>
              <Plus size={16} /> New Session
            </Button>
          </div>
        </div>

        {showForm && (
          <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.formTitle}>{editingId ? 'Edit Session' : 'Create Session'}</h2>
                <button type="button" className={styles.closeParamsBtn} onClick={() => { setShowForm(false); setEditingId(null); }} aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <form onSubmit={handleCreateOrUpdate} className={styles.form}>
                  <Input id="s-name" label="Session Name" placeholder="Morning Muster" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <Input id="s-date" label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  <div style={{ margin: '8px 0' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Session Location</label>
                    <LocationPicker 
                      lat={form.location_lat ? parseFloat(form.location_lat) : 6.5244} 
                      lng={form.location_lng ? parseFloat(form.location_lng) : 3.3792} 
                      onChange={(lat, lng) => setForm({ ...form, location_lat: lat.toString(), location_lng: lng.toString() })} 
                    />
                  </div>
                  <Input id="s-radius" label="Radius (metres)" type="number" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: e.target.value })} required />
                  <div className={styles.formActions}>
                    <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                    <Button type="submit" loading={formLoading}>{editingId ? 'Save Changes' : 'Create & Generate QR'}</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loader} />
        ) : sessions.length === 0 ? (
          <div className={styles.empty}>No sessions yet. Create one above.</div>
        ) : (
          <div className={styles.grid}>
            {sessions.map((s) => (
              <div key={s.id} className={styles.sessionCard}>
                <div className={styles.sessionInfo}>
                  <h3 className={styles.sessionName}>{s.name}</h3>
                  <div className={styles.meta}>
                    <span><Calendar size={13} /> {s.date}</span>
                    <span><MapPin size={13} /> {s.radius_meters}m radius</span>
                  </div>
                  <Link href={`/admin/${s.id}`} className={styles.viewLink}>
                    View Records <ExternalLink size={12} />
                  </Link>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(s)} title="Edit Session">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(s.id, s.name)} title="Delete Session">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
                <div className={styles.qrWrapper}>
                  <QRCodeCanvas
                    id={`qr-${s.id}`}
                    value={getAttendUrl(s.qr_token)}
                    size={100}
                    fgColor="#1A2E22"
                    bgColor="#FFFFFF"
                    marginSize={2}
                  />
                  <button className={styles.qrDownloadBtn} onClick={() => handleDownloadQR(s.id, s.name)} title="Download QR">
                     Download
                  </button>
                </div>
              </div>
            ))}
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
