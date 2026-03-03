'use client';

import { useState } from 'react';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './biometric-step.module.css';

const CREDENTIAL_KEY = 'nysc_credential_id';
const ATTENDEE_KEY = 'nysc_attendee_id';

interface BiometricStepProps {
  sessionToken: string;
  onSuccess: (attendeeId: string) => void;
  onError: (reason: string) => void;
  prefillName?: string;
  prefillStateCode?: string;
  onNeedDetails: (credentialId: string) => void;
}

export function BiometricStep({
  sessionToken,
  onSuccess,
  onError,
  onNeedDetails,
}: BiometricStepProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'auto' | 'register' | 'login'>('auto');

  const savedCredentialId = typeof window !== 'undefined' ? localStorage.getItem(CREDENTIAL_KEY) : null;
  const savedAttendeeId = typeof window !== 'undefined' ? localStorage.getItem(ATTENDEE_KEY) : null;

  const isReturningUser = !!savedCredentialId && !!savedAttendeeId;

  if (!browserSupportsWebAuthn()) {
    return (
      <div className={styles.unsupported}>
        <p>Your browser or device does not support biometric authentication.</p>
        <p>Please use a modern browser on a device with fingerprint or Face ID enabled.</p>
      </div>
    );
  }

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
          deviceHash: await getDeviceHash(),
          userLat: (window as any).__nysc_lat,
          userLng: (window as any).__nysc_lng,
        }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.error);
      onSuccess(options.attendeeId);
    } catch (err: any) {
      onError(err.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const tempId = crypto.randomUUID();
      const optRes = await fetch(`/api/webauthn/register/options?userId=${tempId}&userName=user-${tempId.slice(0, 8)}`);
      if (!optRes.ok) throw new Error(await optRes.text());
      const options = await optRes.json();

      const credential = await startRegistration({ optionsJSON: options });

      localStorage.setItem(CREDENTIAL_KEY, credential.id);
      localStorage.setItem(ATTENDEE_KEY, tempId);

      onNeedDetails(tempId);
    } catch (err: any) {
      onError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        {isReturningUser ? <ShieldCheck size={32} strokeWidth={1.5} /> : <Fingerprint size={32} strokeWidth={1.5} />}
      </div>

      <h2 className={styles.title}>
        {isReturningUser ? 'Verify Your Identity' : 'Register Biometric'}
      </h2>
      <p className={styles.description}>
        {isReturningUser
          ? 'Use your fingerprint or Face ID to confirm it\'s you.'
          : 'Set up your biometric so only you can sign in for yourself.'}
      </p>

      <Button onClick={isReturningUser ? handleAuthenticate : handleRegister} loading={loading}>
        {isReturningUser ? 'Authenticate with Biometric' : 'Register Fingerprint / Face ID'}
      </Button>

      {isReturningUser && (
        <button className={styles.link} onClick={() => { localStorage.removeItem(CREDENTIAL_KEY); localStorage.removeItem(ATTENDEE_KEY); window.location.reload(); }}>
          Not you? Register a new identity
        </button>
      )}
    </div>
  );
}

async function getDeviceHash(): Promise<string> {
  const { getDeviceHash: hash } = await import('@/lib/fingerprint');
  return hash();
}
