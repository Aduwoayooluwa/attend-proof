'use client';

import { CheckCircle2 } from 'lucide-react';
import styles from './success-screen.module.css';

interface SuccessScreenProps {
  name: string;
  sessionName: string;
}

export function SuccessScreen({ name, sessionName }: SuccessScreenProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <CheckCircle2 size={48} className={styles.icon} strokeWidth={1.5} />
      </div>
      <h2 className={styles.title}>You&rsquo;re in!</h2>
      <p className={styles.name}>{name}</p>
      <p className={styles.session}>Attendance recorded for <strong>{sessionName}</strong></p>
      <div className={styles.badge}>✓ Verified today</div>
    </div>
  );
}
