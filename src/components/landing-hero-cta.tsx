'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/page.module.css';

export function LandingHeroCta() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data?.user);
    });
  }, []);

  if (isLoggedIn) {
    return (
      <div className={styles.lpHeroActions}>
        <Link href="/admin" className={styles.lpPrimaryAction}>
          Go to Dashboard
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.lpHeroActions}>
      <Link href="/auth/register" className={styles.lpPrimaryAction}>
        Start with your organization
        <ArrowRight size={18} />
      </Link>
      <Link href="/auth/login" className={styles.lpSecondaryAction}>
        Go to dashboard
      </Link>
    </div>
  );
}
