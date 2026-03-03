'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  enablePasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  id,
  type,
  enablePasswordToggle,
  className = '',
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const canTogglePassword = enablePasswordToggle && type === 'password';
  const resolvedType = canTogglePassword ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>{label}</label>

      <div className={styles.inputField}>
        <input
          id={id}
          type={resolvedType}
          className={`${styles.input} ${canTogglePassword ? styles.inputWithToggle : ''} ${error ? styles.hasError : ''} ${className}`}
          {...props}
        />

        {canTogglePassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
          >
            {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
