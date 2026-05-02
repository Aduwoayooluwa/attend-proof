'use client';

import { useState } from 'react';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './biometric-step.module.css';

const CREDENTIAL_KEY = 'ap_credential_id';
const ATTENDEE_KEY = 'ap_attendee_id';
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Request failed.';

interface BiometricStepProps {
  sessionToken: string;
  orgId: string;
  onSuccess: (name: string, checkInNumber: number | null) => void;
  onError: (reason: string) => void;
}

export function BiometricStep({ sessionToken, orgId, onSuccess, onError }: BiometricStepProps) {
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Check if this device already has a registered credential
  const savedCredentialId = typeof window !== 'undefined' ? localStorage.getItem(CREDENTIAL_KEY) : null;
  const savedAttendeeId = typeof window !== 'undefined' ? localStorage.getItem(ATTENDEE_KEY) : null;
  const isReturningUser = !!savedCredentialId && !!savedAttendeeId;

  // Registration form state
  const [identifier, setIdentifier] = useState('');
  const [idError, setIdError] = useState('');

  if (!browserSupportsWebAuthn()) {
    return (
      <div className={styles.unsupported}>
        <p>Your browser or device does not support biometric authentication.</p>
        <p>Please use a modern browser on a device with fingerprint or Face ID enabled.</p>
      </div>
    );
  }

  // ── Returning user: authenticate ──────────────────────────────
  const handleAuthenticate = async () => {
    if (!savedCredentialId || !savedAttendeeId) return;
    setLoading(true);
    try {
      const optRes = await fetch(`/api/webauthn/authenticate/options?credentialId=${savedCredentialId}`);
      if (!optRes.ok) throw new Error(await optRes.text());
      const options = await optRes.json();

      const credential = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId: savedAttendeeId,
          sessionToken,
          credential,
          userLat: window.__nysc_lat,
          userLng: window.__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);
      onSuccess(result.name ?? 'Attendee', result.checkInNumber ?? null);
    } catch (error: unknown) {
      onError(getErrorMessage(error) || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ── New user: register ────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim().toUpperCase();
    if (!clean) { setIdError('Attendee ID is required'); return; }
    setIdError('');
    setRegistering(true);

    try {
      // Step 1: validate the ID is in the org roster and unclaimed
      const checkRes = await fetch(`/api/webauthn/register/options?orgId=${orgId}&identifier=${encodeURIComponent(clean)}`);
      if (!checkRes.ok) {
        const err = await checkRes.json();
        throw new Error(err.error || 'Could not start registration');
      }
      const options = await checkRes.json();

      // Step 2: biometric registration on device
      const credential = await startRegistration({ optionsJSON: options });

      // Step 3: verify + record attendance
      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: clean,
          orgId,
          sessionToken,
          credential,
          userLat: window.__nysc_lat,
          userLng: window.__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      // Persist to localStorage so future sessions skip the form
      localStorage.setItem(CREDENTIAL_KEY, credential.id);
      localStorage.setItem(ATTENDEE_KEY, result.attendeeId);

      onSuccess(result.name ?? 'Attendee', result.checkInNumber ?? null);
    } catch (error: unknown) {
      onError(getErrorMessage(error) || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  if (isReturningUser) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}><ShieldCheck size={32} strokeWidth={1.5} /></div>
        <h2 className={styles.title}>Verify Your Identity</h2>
        <p className={styles.description}>Use your fingerprint or Face ID to confirm it&apos;s you.</p>
        <Button onClick={handleAuthenticate} loading={loading}>
          Authenticate with Biometric
        </Button>
        <button className={styles.link} onClick={() => {
          localStorage.removeItem(CREDENTIAL_KEY);
          localStorage.removeItem(ATTENDEE_KEY);
          window.location.reload();
        }}>
          Not you? Register a different identity
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}><Fingerprint size={32} strokeWidth={1.5} /></div>
      <h2 className={styles.title}>Register Your Identity</h2>
      <p className={styles.description}>
        Enter your Attendee ID. After verification, your biometric will be linked to your identity for all future sessions.
      </p>
      <form onSubmit={handleRegister} className={styles.form}>
        <Input
          id="bio-identifier"
          label="Attendee ID"
          placeholder=" State Code / Staff ID / Student ID"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={idError}
          autoComplete="off"
        />
        <Button type="submit" loading={registering}>
          Register Fingerprint / Face ID
        </Button>
      </form>
    </div>
  );
}
