/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDeviceHash } from '@/lib/fingerprint';
import styles from './details-form.module.css';

interface DetailsFormProps {
  sessionToken: string;
  mode?: 'submit' | 'collect';
  onSuccess: (name: string, checkInNumber: number | null) => void;
  onError: (reason: string) => void;
  onCollected?: (details: { fullName: string; identifier: string }) => void;
}

export function DetailsForm({
  sessionToken,
  mode = 'submit',
  onSuccess,
  onError,
  onCollected,
}: DetailsFormProps) {
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; identifier?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!identifier.trim()) e.identifier = 'Attendee ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'collect') {
      onCollected?.({
        fullName: fullName.trim(),
        identifier: identifier.trim().toUpperCase(),
      });
      return;
    }

    setLoading(true);

    try {
      const deviceHash = await getDeviceHash();
      const res = await fetch('/api/attend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          deviceHash,
          fullName: fullName.trim(),
          identifier: identifier.trim().toUpperCase(),
          userLat: window.__nysc_lat,
          userLng: window.__nysc_lng,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      onSuccess(fullName.trim(), result.checkInNumber ?? null);
    } catch (err: any) {
      onError(err.message ?? 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Your Details</h2>
      <p className={styles.description}>Almost done — fill in your information to complete check-in.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="full-name"
          label="Full Name"
          placeholder=" Bola  Obi"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          autoComplete="name"
        />
        <Input
          id="identifier"
          label="Attendee ID"
          placeholder=" State Code / Staff ID / Student ID"
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
