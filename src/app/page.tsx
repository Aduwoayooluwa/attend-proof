import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Fingerprint,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { APP_NAME, BRAND_IMAGE_URL } from '@/lib/brand';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.lpPage}>
      <header className={styles.lpHeader}>
        <nav className={styles.lpNav} aria-label="Primary">
          <div className={styles.lpBrand}>
            <div className={styles.lpBrandIcon} aria-hidden="true">
              <img src={BRAND_IMAGE_URL} alt="" className={styles.lpBrandLogo} />
            </div>
            <span className={styles.lpBrandName}>{APP_NAME}</span>
          </div>
          <div className={styles.lpNavActions}>
            <Link href="/auth/login" className={styles.lpLoginLink}>
              Log in
            </Link>
            <Link href="/auth/register" className={styles.lpSignupButton}>
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.lpMain}>
        <section className={styles.lpHero}>
          <div className={styles.lpHeroGlow} aria-hidden="true" />

          <div className={styles.lpHeroTextBlock}>
            <p className={styles.lpEyebrow}>For coordinators who need clean, verifiable attendance records</p>
            <h1 className={styles.lpHeroTitle}>
              Location-verified attendance
              <span className={styles.lpHeroTitleAccent}> that stays honest.</span>
            </h1>
            <p className={styles.lpHeroSummary}>
              {APP_NAME} helps you capture attendance with geofencing and device-bound passkeys so
              records are accurate, auditable, and easy to manage.
            </p>

            <div className={styles.lpHeroActions}>
              <Link href="/auth/register" className={styles.lpPrimaryAction}>
                Start with your organization
                <ArrowRight size={18} />
              </Link>
              <Link href="/auth/login" className={styles.lpSecondaryAction}>
                Go to dashboard
              </Link>
            </div>

            <ul className={styles.lpProofList}>
              <li className={styles.lpProofItem}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Device-bound verification
              </li>
              <li className={styles.lpProofItem}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Geofence-aware check-ins
              </li>
              <li className={styles.lpProofItem}>
                <CheckCircle2 size={16} aria-hidden="true" />
                Live, exportable attendance logs
              </li>
            </ul>
          </div>

          <aside className={styles.lpHeroPanel} aria-label="Attendance snapshot preview">
            <div className={styles.lpPanelHeaderRow}>
              <p className={styles.lpPanelLabel}>Live session</p>
              <span className={styles.lpPanelStatus}>In progress</span>
            </div>
            <h2 className={styles.lpPanelTitle}>Today&apos;s active attendance session</h2>

            <div className={styles.lpKpiGrid}>
              <div className={styles.lpKpiCard}>
                <p className={styles.lpKpiValue}>142</p>
                <p className={styles.lpKpiLabel}>Checked in</p>
              </div>
              <div className={styles.lpKpiCard}>
                <p className={styles.lpKpiValue}>11</p>
                <p className={styles.lpKpiLabel}>Outside fence</p>
              </div>
              <div className={styles.lpKpiCard}>
                <p className={styles.lpKpiValue}>98%</p>
                <p className={styles.lpKpiLabel}>Verification rate</p>
              </div>
              <div className={styles.lpKpiCard}>
                <p className={styles.lpKpiValue}>3m</p>
                <p className={styles.lpKpiLabel}>Avg. check-in time</p>
              </div>
            </div>

            <div className={styles.lpActivityList}>
              <div className={styles.lpActivityRow}>
                <span className={styles.lpActivityIcon}>
                  <Clock3 size={14} />
                </span>
                <p>14 new check-ins within the last 10 minutes</p>
              </div>
              <div className={styles.lpActivityRow}>
                <span className={styles.lpActivityIcon}>
                  <ShieldCheck size={14} />
                </span>
                <p>All records cryptographically signed</p>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.lpFeaturesSection}>
          <div className={styles.lpSectionHeading}>
            <p className={styles.lpSectionKicker}>Core capabilities</p>
            <h2 className={styles.lpSectionTitle}>Everything needed for reliable attendance</h2>
          </div>

          <div className={styles.lpFeaturesGrid}>
            <article className={styles.lpFeatureCard}>
              <div className={styles.lpFeatureIconWrap} aria-hidden="true">
                <MapPin size={20} />
              </div>
              <h3 className={styles.lpFeatureTitle}>Smart geofence validation</h3>
              <p className={styles.lpFeatureDescription}>
                Define attendance zones per session so only people physically on-site can mark
                presence.
              </p>
            </article>

            <article className={styles.lpFeatureCard}>
              <div className={styles.lpFeatureIconWrap} aria-hidden="true">
                <Fingerprint size={20} />
              </div>
              <h3 className={styles.lpFeatureTitle}>Passkey-based identity checks</h3>
              <p className={styles.lpFeatureDescription}>
                Stop proxy attendance with secure WebAuthn passkeys tied to each participant&apos;s
                device.
              </p>
            </article>

            <article className={styles.lpFeatureCard}>
              <div className={styles.lpFeatureIconWrap} aria-hidden="true">
                <ShieldCheck size={20} />
              </div>
              <h3 className={styles.lpFeatureTitle}>Auditable attendance records</h3>
              <p className={styles.lpFeatureDescription}>
                Monitor in real time and export clean records for compliance, payroll, or internal
                reporting.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.lpCtaSection}>
          <h2 className={styles.lpCtaTitle}>Ready to run cleaner attendance operations?</h2>
          <p className={styles.lpCtaText}>
            Start with one team, one location, and scale to every session from a single dashboard.
          </p>
          <div className={styles.lpCtaActions}>
            <Link href="/auth/register" className={styles.lpCtaPrimary}>
              Create your organization
            </Link>
            <Link href="/auth/login" className={styles.lpCtaSecondary}>
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.lpFooter}>
        <p>© {new Date().getFullYear()} {APP_NAME}. Secure attendance for modern teams.</p>
      </footer>
    </div>
  );
}
