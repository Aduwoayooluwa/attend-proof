'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Sign up the user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          org_name: orgName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData?.user) {
      // 2. Insert into the organizations table via our server API to bypass RLS issues
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: authData.user.id,
          name: orgName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(`Failed to set up organization: ${errData.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Create your organization</h1>
          <p className={styles.subtitle}>
            Set up your workspace and start collecting trusted attendance records.
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleRegister} className={styles.form}>
          <Input
            id="orgName"
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
          <Input
            id="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            type="password"
            label="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            enablePasswordToggle
            required
            minLength={6}
          />
          <Button loading={loading} type="submit" className={styles.submitBtn}>
            Create Account
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.footerLink}>
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}
