'use client';

import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './error-screen.module.css';

interface ErrorScreenProps {
  reason: string;
  onRetry?: () => void;
}

export function ErrorScreen({ reason, onRetry }: ErrorScreenProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <XCircle size={48} strokeWidth={1.5} className={styles.icon} />
      </div>
      <h2 className={styles.title}>Unable to Record Attendance</h2>
      <p className={styles.reason}>{reason}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  );
}
