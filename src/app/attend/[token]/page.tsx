'use client';

import { use, useEffect, useState } from 'react';
import { StepIndicator } from '@/components/ui/step-indicator';
import { LocationGate } from '@/components/attend/location-gate';
import { BiometricStep } from '@/components/attend/biometric-step';
import { DetailsForm } from '@/components/attend/details-form';
import { SuccessScreen } from '@/components/attend/success-screen';
import { ErrorScreen } from '@/components/attend/error-screen';
import type { Session } from '@/types';
import styles from './page.module.css';

type Step = 'loading' | 'location' | 'biometric' | 'details' | 'success' | 'error';

interface AttendPageProps {
  params: Promise<{ token: string }>;
}

export default function AttendPage({ params }: AttendPageProps) {
  const { token } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [errorReason, setErrorReason] = useState('');
  const [successName, setSuccessName] = useState('');
  const [successCheckInNumber, setSuccessCheckInNumber] = useState<number | null>(null);
  const [strictMode, setStrictMode] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/token/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setErrorReason(data.error); setStep('error'); return; }
        setSession(data);
        setStrictMode(data.strict_mode === true);
        setStep('location');
      })
      .catch(() => { setErrorReason('Could not load session.'); setStep('error'); });
  }, [token]);

  const handleLocationPass = (lat: number, lng: number) => {
    window.__nysc_lat = lat;
    window.__nysc_lng = lng;
    // Branch: strict mode → biometric, open mode → details form
    setStep(strictMode ? 'biometric' : 'details');
  };

  const handleLocationFail = (reason: string) => {
    setErrorReason(reason);
    setStep('error');
  };

  const handleDetailsSuccess = (name: string, checkInNumber: number | null) => {
    setSuccessName(name);
    setSuccessCheckInNumber(checkInNumber);
    setStep('success');
  };

  const handleError = (reason: string) => {
    setErrorReason(reason);
    setStep('error');
  };

  const stepMap: Record<Step, number> = { loading: 0, location: 1, biometric: 2, details: 2, success: 3, error: 3 };
  const stepNumber = stepMap[step];

  if (step === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loader} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logo}>{session?.organizations?.name || 'Attendance'}</div>
          {session && <p className={styles.sessionName}>{session.name}</p>}
        </header>

        {step !== 'success' && step !== 'error' && (
          <StepIndicator total={2} current={stepNumber} />
        )}

        <main className={styles.main}>
          {step === 'location' && (
            <LocationGate onPass={handleLocationPass} onFail={handleLocationFail} />
          )}
          {step === 'biometric' && session && (
            <BiometricStep
              sessionToken={token}
              orgId={session.org_id}
              onSuccess={(name, checkInNumber) => {
                setSuccessName(name);
                setSuccessCheckInNumber(checkInNumber);
                setStep('success');
              }}
              onError={handleError}
            />
          )}
          {step === 'details' && (
            <DetailsForm
              sessionToken={token}
              onSuccess={handleDetailsSuccess}
              onError={handleError}
            />
          )}
          {step === 'success' && session && (
            <SuccessScreen
              name={successName}
              sessionName={session.name}
              checkInNumber={successCheckInNumber}
            />
          )}
          {step === 'error' && (
            <ErrorScreen
              reason={errorReason}
              onRetry={step === 'error' ? () => { setStep('location'); setErrorReason(''); } : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
}
