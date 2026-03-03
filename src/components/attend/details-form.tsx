'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import styles from './details-form.module.css';

interface DetailsFormProps {
  tempUserId: string;
  sessionToken: string;
  onSuccess: (name: string) => void;
  onError: (reason: string) => void;
}

export function DetailsForm({ tempUserId, sessionToken, onSuccess, onError }: DetailsFormProps) {
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; identifier?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!identifier.trim()) e.identifier = 'ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const credentialId = localStorage.getItem('nysc_credential_id');
      if (!credentialId) throw new Error('No credential found. Please restart.');

      const optRes = await fetch(`/api/webauthn/register/options?userId=${tempUserId}&userName=${encodeURIComponent(fullName)}`);
      if (!optRes.ok) {
        const err = await optRes.json();
        throw new Error(err.error || 'Failed to get registration options');
      }
      const options = await optRes.json();

      const credential = await startRegistration({ optionsJSON: options });

      const deviceHash = await (await import('@/lib/fingerprint')).getDeviceHash();

      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUserId,
          fullName: fullName.trim(),
          identifier: identifier.trim().toUpperCase(),
          credential,
          sessionToken,
          deviceHash,
          userLat: (window as any).__nysc_lat,
          userLng: (window as any).__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      localStorage.setItem('nysc_attendee_id', result.attendeeId);
      onSuccess(fullName.trim());
    } catch (err: any) {
      onError(err.message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Your Details</h2>
      <p className={styles.description}>Almost done — fill in your information.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="full-name"
          label="Full Name"
          placeholder="e.g. Amara Okonkwo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          autoComplete="name"
        />
        <Input
          id="identifier"
          label="Attendee ID"
          placeholder="e.g. Staff ID / Student ID"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          autoComplete="off"
        />
        <Button type="submit" loading={loading}>
          Submit Attendance
        </Button>
      </form>
    </div>
  );
}
