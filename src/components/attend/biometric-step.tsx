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
import { getDeviceHash } from '@/lib/fingerprint';
import type { AttendanceCompletion } from '@/types';
import styles from './biometric-step.module.css';

const CREDENTIAL_KEY = 'ap_credential_id';
const ATTENDEE_KEY = 'ap_attendee_id';
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Request failed.';

interface BiometricStepProps {
  sessionToken: string;
  orgId: string;
  strictMode: boolean;
  presetIdentifier?: string;
  presetFullName?: string;
  onSuccess: (result: AttendanceCompletion) => void;
  onError: (reason: string) => void;
}

export function BiometricStep({
  sessionToken,
  orgId,
  strictMode,
  presetIdentifier,
  presetFullName,
  onSuccess,
  onError,
}: BiometricStepProps) {
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [fullName] = useState(presetFullName ?? '');

  // Check if this device already has a registered credential
  const savedCredentialId = typeof window !== 'undefined' ? localStorage.getItem(CREDENTIAL_KEY) : null;
  const savedAttendeeId = typeof window !== 'undefined' ? localStorage.getItem(ATTENDEE_KEY) : null;
  const isReturningUser = !!savedCredentialId && !!savedAttendeeId;

  // Registration form state
  const [identifier, setIdentifier] = useState(presetIdentifier ?? '');
  const [idError, setIdError] = useState('');
  const isIdentityPreset = !!presetIdentifier;

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
      const deviceHash = await getDeviceHash();
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
          deviceHash,
          userLat: window.__nysc_lat,
          userLng: window.__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);
      onSuccess({
        name: result.name ?? 'Attendee',
        identifier: result.identifier ?? identifier.trim().toUpperCase(),
        checkInNumber: result.checkInNumber ?? null,
        verifiedAt: result.verifiedAt,
        ticketToken: result.ticketToken,
        ticketUrl: result.ticketUrl,
      });
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
    if (!strictMode && !fullName.trim()) {
      setIdError('Complete your details before continuing.');
      return;
    }
    setIdError('');
    setRegistering(true);

    try {
      const deviceHash = await getDeviceHash();
      // Step 1: validate the ID is in the org roster and unclaimed
      const params = new URLSearchParams({
        orgId,
        sessionToken,
        identifier: clean,
      });

      if (!strictMode && fullName.trim()) {
        params.set('fullName', fullName.trim());
      }

      const checkRes = await fetch(`/api/webauthn/register/options?${params.toString()}`);
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        if (
          checkRes.status === 409 &&
          checkData.action === 'authenticate' &&
          checkData.credentialId &&
          checkData.attendeeId
        ) {
          const optRes = await fetch(`/api/webauthn/authenticate/options?credentialId=${checkData.credentialId}`);
          if (!optRes.ok) throw new Error((await optRes.json()).error || 'Could not start authentication');
          const authOptions = await optRes.json();

          const authCredential = await startAuthentication({ optionsJSON: authOptions });

          const verifyAuthRes = await fetch('/api/webauthn/authenticate/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendeeId: checkData.attendeeId,
              sessionToken,
              credential: authCredential,
              deviceHash,
              userLat: window.__nysc_lat,
              userLng: window.__nysc_lng,
            }),
          });

          const authResult = await verifyAuthRes.json();
          if (!verifyAuthRes.ok) throw new Error(authResult.error);

          localStorage.setItem(CREDENTIAL_KEY, checkData.credentialId);
          localStorage.setItem(ATTENDEE_KEY, checkData.attendeeId);
          onSuccess({
            name: authResult.name ?? checkData.name ?? 'Attendee',
            identifier: authResult.identifier ?? clean,
            checkInNumber: authResult.checkInNumber ?? null,
            verifiedAt: authResult.verifiedAt,
            ticketToken: authResult.ticketToken,
            ticketUrl: authResult.ticketUrl,
          });
          return;
        }

        throw new Error(checkData.error || 'Could not start registration');
      }
      const options = checkData;

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
          fullName: strictMode ? undefined : fullName.trim(),
          deviceHash,
          userLat: window.__nysc_lat,
          userLng: window.__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);

      // Persist to localStorage so future sessions skip the form
      localStorage.setItem(CREDENTIAL_KEY, credential.id);
      localStorage.setItem(ATTENDEE_KEY, result.attendeeId);

      onSuccess({
        name: result.name ?? 'Attendee',
        identifier: result.identifier ?? clean,
        checkInNumber: result.checkInNumber ?? null,
        verifiedAt: result.verifiedAt,
        ticketToken: result.ticketToken,
        ticketUrl: result.ticketUrl,
      });
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
        {isIdentityPreset ? (
          <div className={styles.prefilledIdentity}>
            <p className={styles.prefilledLabel}>Attendee ID</p>
            <p className={styles.prefilledValue}>{identifier}</p>
          </div>
        ) : (
          <Input
            id="bio-identifier"
            label="Attendee ID"
            placeholder="State Code / Staff ID / Student ID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={idError}
            autoComplete="off"
          />
        )}
        <Button type="submit" loading={registering}>
          Register Fingerprint / Face ID
        </Button>
      </form>
    </div>
  );
}
