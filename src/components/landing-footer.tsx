import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import styles from '@/app/page.module.css';

export function LandingFooter() {
  return (
    <footer className={styles.lpFooter}>
      <div className={styles.lpFooterContent}>
        <div className={styles.lpFooterBrand}>
          <span className={styles.lpFooterBrandName}>{APP_NAME}</span>
          <p className={styles.lpFooterTagline}>
            Secure attendance for modern teams. Built to eliminate buddy-punching seamlessly.
          </p>
          <div className={styles.lpFooterCtaWrap}>
            <Link href="/auth/register" className={styles.lpFooterCta}>
              Get started now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className={styles.lpFooterLinks}>
          <div className={styles.lpFooterNav}>
            <h4 className={styles.lpFooterNavTitle}>Product</h4>
            <Link href="/#how-it-works" className={styles.lpFooterLink}>How it works</Link>
            <Link href="/#features" className={styles.lpFooterLink}>Features</Link>
            <Link href="/auth/login" className={styles.lpFooterLink}>Log in</Link>
          </div>
          <div className={styles.lpFooterNav}>
            <h4 className={styles.lpFooterNavTitle}>Company</h4>
            <Link href="/auth/register" className={styles.lpFooterLink}>Create organization</Link>
            <Link href="/#top" className={styles.lpFooterLink}>Back to top</Link>
          </div>
          <div className={styles.lpFooterNav}>
            <h4 className={styles.lpFooterNavTitle}>Legal</h4>
            <Link href="/privacy-policy" className={styles.lpFooterLink}>Privacy Policy</Link>
            <Link href="/terms-of-service" className={styles.lpFooterLink}>Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className={styles.lpFooterBottom}>
        <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
