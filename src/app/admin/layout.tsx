import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // Fetch the organization name to display
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
      <header className={styles.layoutHeader}>
        <div>
          <h1 className={styles.layoutTitle}>
            {org?.name || 'Organization'} Dashboard
          </h1>
          <p className={styles.layoutSubtitle}>
            Manage your attendance sessions and access records.
          </p>
        </div>
        
        <form action={async () => {
          'use server';
          const sb = await createClient();
          await sb.auth.signOut();
          redirect('/auth/login');
        }}>
          <button type="submit" className={styles.signOutBtn}>Sign Out</button>
        </form>
      </header>
      
      <main className={styles.layoutMain}>
        {children}
      </main>
    </div>
  );
}
