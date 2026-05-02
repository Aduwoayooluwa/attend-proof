import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Fingerprint,
  QrCode,
  Smartphone,
  Users,
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { LandingHeroCta } from '@/components/landing-hero-cta';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.lpPage} id="top">
      <LandingHeader />

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

            <LandingHeroCta />

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
              <div className={styles.lpPanelLabelWrap}>
                <div className={styles.lpLiveIndicator} aria-hidden="true" />
                <p className={styles.lpPanelLabel}>Live session overview</p>
              </div>
              <span className={styles.lpPanelStatus}>In progress</span>
            </div>

            {/* Big KPI */}
            <div className={styles.lpKpiBig}>
              <div className={styles.lpKpiLeft}>
                <span className={styles.lpKpiSession}>Morning Community Briefing</span>
                <p className={styles.lpKpiNumber}>142</p>
                <p className={styles.lpKpiSub}>members checked in today</p>
              </div>
              <div className={styles.lpMockGraph} aria-hidden="true">
                <div className={styles.lpBar} style={{ height: '38%' }} />
                <div className={styles.lpBar} style={{ height: '52%' }} />
                <div className={styles.lpBar} style={{ height: '44%' }} />
                <div className={styles.lpBar} style={{ height: '68%' }} />
                <div className={styles.lpBar} style={{ height: '57%' }} />
                <div className={styles.lpBar} style={{ height: '82%' }} />
                <div className={styles.lpBarActive} style={{ height: '100%' }} />
              </div>
            </div>

            {/* Recent check-in feed */}
            <div className={styles.lpFeedList}>
              <div className={styles.lpFeedRow}>
                <div className={styles.lpFeedDot} aria-hidden="true" />
                <span className={styles.lpFeedName}>Bola Obi</span>
                <span className={styles.lpFeedMeta}>Just now</span>
                <span className={styles.lpFeedBadge}>#142</span>
              </div>
              <div className={styles.lpFeedRow}>
                <div className={styles.lpFeedDot} aria-hidden="true" />
                <span className={styles.lpFeedName}>Chidi Eze</span>
                <span className={styles.lpFeedMeta}>2m ago</span>
                <span className={styles.lpFeedBadge}>#141</span>
              </div>
              <div className={styles.lpFeedRow}>
                <div className={styles.lpFeedDot} aria-hidden="true" />
                <span className={styles.lpFeedName}>Fatima Sule</span>
                <span className={styles.lpFeedMeta}>4m ago</span>
                <span className={styles.lpFeedBadge}>#140</span>
              </div>
            </div>
          </aside>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className={styles.lpStepsSection}>
          <div className={styles.lpStepsHeader}>
            <p className={styles.lpSectionKicker}>Simple Setup</p>
            <h2 className={styles.lpSectionTitle}>How it protects your attendance</h2>
            <p className={styles.lpStepsIntro}>
              Launch a secure session in minutes, let people check in from their phones, and keep
              records you can confidently audit later.
            </p>
          </div>

          <div className={styles.lpStepsMetaRow} aria-label="Setup highlights">
            <span className={styles.lpStepsMetaPill}>Average setup: under 5 minutes</span>
            <span className={styles.lpStepsMetaPill}>No app download for attendees</span>
            <span className={styles.lpStepsMetaPill}>Works across modern smartphones</span>
          </div>

          <div className={styles.lpStepsGrid}>
            <article className={styles.lpStepCard}>
              <span className={styles.lpStepNumber}>Step 01</span>
              <div className={styles.lpStepIconWrap}>
                <MapPin size={24} />
              </div>
              <div className={styles.lpStepBody}>
                <h3 className={styles.lpStepTitle}>1. Create a radius</h3>
                <p className={styles.lpStepDesc}>
                  Set up a session with a strict location boundary. People can only check in if their GPS confirms they are physically on site.
                </p>
                <p className={styles.lpStepNote}>Ideal for classrooms, camps, offices, and event grounds.</p>
              </div>
            </article>

            <article className={styles.lpStepCard}>
              <span className={styles.lpStepNumber}>Step 02</span>
              <div className={styles.lpStepIconWrap}>
                <QrCode size={24} />
              </div>
              <div className={styles.lpStepBody}>
                <h3 className={styles.lpStepTitle}>2. Attendees scan in</h3>
                <p className={styles.lpStepDesc}>
                  Attendees simply open a provided link or scan a QR code on arrival. No app required—it works instantly in the browser.
                </p>
                <p className={styles.lpStepNote}>Faster queue times and fewer onboarding issues.</p>
              </div>
            </article>

            <article className={styles.lpStepCard}>
              <span className={styles.lpStepNumber}>Step 03</span>
              <div className={styles.lpStepIconWrap}>
                <Fingerprint size={24} />
              </div>
              <div className={styles.lpStepBody}>
                <h3 className={styles.lpStepTitle}>3. Biometric proof</h3>
                <p className={styles.lpStepDesc}>
                  In strict mode, attendees register their device. Subsequent check-ins require a Face ID or fingerprint scan, eliminating buddy-punching completely.
                </p>
                <p className={styles.lpStepNote}>Device-bound verification keeps your logs trustworthy.</p>
              </div>
            </article>
          </div>
        </section>

        <section id="features" className={styles.lpFeaturesSection}>
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
                <Smartphone size={20} />
              </div>
              <h3 className={styles.lpFeatureTitle}>No downloads needed</h3>
              <p className={styles.lpFeatureDescription}>
                Because we use native browser APIs, there are no clunky apps for users to install. A 10-second check-in flow via web.
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

      <LandingFooter />
    </div>
  );
}
