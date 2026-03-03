'use client';

import styles from './step-indicator.module.css';

interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className={styles.wrapper} role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${styles.dot} ${i < current ? styles.done : ''} ${i === current - 1 ? styles.active : ''}`}
        />
      ))}
    </div>
  );
}
