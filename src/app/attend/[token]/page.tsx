'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StepIndicator } from '@/components/ui/step-indicator';
import { LocationGate } from '@/components/attend/location-gate';
import { BiometricStep } from '@/components/attend/biometric-step';
import { DetailsForm } from '@/components/attend/details-form';
import { SuccessScreen } from '@/components/attend/success-screen';
import { ErrorScreen } from '@/components/attend/error-screen';
import type { AttendanceCompletion, Session } from '@/types';
import styles from './page.module.css';

type Step = 'loading' | 'location' | 'biometric' | 'details' | 'success' | 'error';

interface PendingIdentity {
  fullName: string;
  identifier: string;
}

interface AttendPageProps {
  params: Promise<{ token: string }>;
}

export default function AttendPage({ params }: AttendPageProps) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [errorReason, setErrorReason] = useState('');
  const [successResult, setSuccessResult] = useState<AttendanceCompletion | null>(null);
  const [strictMode, setStrictMode] = useState(false);
  const [passkeyRequired, setPasskeyRequired] = useState(false);
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null);

  useEffect(() => {
    const resumeTicketToken = searchParams.get('ticket');
    const restoreIssuedTicket = async (sessionData: Session) => {
      if (!resumeTicketToken) {
        setStep('location');
        return;
      }

      const cached = typeof window !== 'undefined'
        ? window.localStorage.getItem(`attendance-ticket:${token}`)
        : null;

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AttendanceCompletion;
          if (parsed.ticketToken === resumeTicketToken) {
            setSuccessResult(parsed);
            setStep('success');
            return;
          }
        } catch {
          window.localStorage.removeItem(`attendance-ticket:${token}`);
        }
      }

      const ticketRes = await fetch(`/api/tickets/${resumeTicketToken}`);
      const ticketData = await ticketRes.json();

      if (!ticketRes.ok || ticketData.sessionToken !== sessionData.qr_token) {
        setErrorReason(ticketData.error ?? 'Could not restore your attendance ticket.');
        setStep('error');
        return;
      }

      const restoredTicket: AttendanceCompletion = {
        name: ticketData.name,
        identifier: ticketData.identifier,
        checkInNumber: ticketData.checkInNumber ?? null,
        verifiedAt: ticketData.verifiedAt,
        ticketToken: ticketData.ticketToken,
        ticketUrl: ticketData.ticketUrl,
      };

      window.localStorage.setItem(`attendance-ticket:${token}`, JSON.stringify(restoredTicket));
      setSuccessResult(restoredTicket);
      setStep('success');
    };

    fetch(`/api/sessions/token/${token}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) { setErrorReason(data.error); setStep('error'); return; }
        setSession(data);
        setStrictMode(data.strict_mode === true);
        setPasskeyRequired(data.passkey_required === true);
        await restoreIssuedTicket(data);
      })
      .catch(() => { setErrorReason('Could not load session.'); setStep('error'); });
  }, [searchParams, token]);

  const handleLocationPass = (lat: number, lng: number) => {
    window.__nysc_lat = lat;
    window.__nysc_lng = lng;
    setStep(passkeyRequired && strictMode ? 'biometric' : 'details');
  };

  const handleLocationFail = (reason: string) => {
    setErrorReason(reason);
    setStep('error');
  };

  const handleAttendanceSuccess = (result: AttendanceCompletion) => {
    setSuccessResult(result);
    window.localStorage.setItem(`attendance-ticket:${token}`, JSON.stringify(result));
    window.history.replaceState({}, '', `/attend/${token}?ticket=${encodeURIComponent(result.ticketToken)}`);
    setStep('success');
  };

  const handleDetailsCollected = (details: PendingIdentity) => {
    setPendingIdentity(details);
    setStep('biometric');
  };

  const handleError = (reason: string) => {
    setErrorReason(reason);
    setStep('error');
  };

  const totalSteps = passkeyRequired && !strictMode ? 3 : 2;
  const stepMap: Record<Step, number> = {
    loading: 0,
    location: 1,
    details: 2,
    biometric: passkeyRequired && !strictMode ? 3 : 2,
    success: totalSteps + 1,
    error: totalSteps + 1,
  };
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
          <StepIndicator total={totalSteps} current={stepNumber} />
        )}

        <main className={styles.main}>
          {step === 'location' && (
            <LocationGate onPass={handleLocationPass} onFail={handleLocationFail} />
          )}
          {step === 'biometric' && session && (
            <BiometricStep
              sessionToken={token}
              orgId={session.org_id}
              strictMode={strictMode}
              presetIdentifier={pendingIdentity?.identifier}
              presetFullName={pendingIdentity?.fullName}
              onSuccess={handleAttendanceSuccess}
              onError={handleError}
            />
          )}
          {step === 'details' && (
            <DetailsForm
              sessionToken={token}
              mode={passkeyRequired && !strictMode ? 'collect' : 'submit'}
              onSuccess={handleAttendanceSuccess}
              onCollected={handleDetailsCollected}
              onError={handleError}
            />
          )}
          {step === 'success' && session && successResult && (
            <SuccessScreen
              name={successResult.name}
              identifier={successResult.identifier}
              sessionName={session.name}
              sessionDate={session.date}
              organizationName={session.organizations?.name ?? 'Attendance'}
              verifiedAt={successResult.verifiedAt}
              checkInNumber={successResult.checkInNumber}
              ticketToken={successResult.ticketToken}
              ticketUrl={successResult.ticketUrl}
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
