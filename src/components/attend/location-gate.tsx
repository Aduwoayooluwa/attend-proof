'use client';

import { useEffect, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './location-gate.module.css';

interface LocationGateProps {
  onPass: (lat: number, lng: number) => void;
  onFail: (reason: string) => void;
}

export function LocationGate({ onPass, onFail }: LocationGateProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'denied'>('idle');

  const requestLocation = () => {
    setStatus('checking');

    if (!navigator.geolocation) {
      onFail('Your browser does not support location access.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => onPass(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          onFail('Unable to get your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 25000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <MapPin size={32} strokeWidth={1.5} />
      </div>
      <h2 className={styles.title}>Verifying Location</h2>
      <p className={styles.description}>
        Please allow location access to confirm you are at the venue.
      </p>

      {status === 'checking' && (
        <div className={styles.pulse}>
          <div className={styles.ring} />
          <div className={styles.ring} />
          <MapPin size={20} />
        </div>
      )}

      {status === 'denied' && (
        <div className={styles.denied}>
          <AlertCircle size={16} />
          <span>Location access was denied. Please enable it in your browser settings.</span>
        </div>
      )}

      {status !== 'checking' && (
        <Button onClick={requestLocation}>
          {status === 'denied' ? 'Try Again' : 'Allow Location'}
        </Button>
      )}
    </div>
  );
}
