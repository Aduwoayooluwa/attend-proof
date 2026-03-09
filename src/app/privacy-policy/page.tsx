import { APP_NAME } from '@/lib/brand';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import styles from '../legal.module.css';

export const metadata = {
  title: `Privacy Policy - ${APP_NAME}`,
  description: 'How we handle and protect your attendance and biometric data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.legalPage}>
      <LandingHeader />

      <main className={styles.legalMain}>
        <h1 className={styles.legalTitle}>Privacy Policy</h1>
        <p className={styles.legalUpdated}>Last updated: March 2026</p>

        <div className={styles.legalContent}>
          <p>
            At <strong>{APP_NAME}</strong>, we respect your privacy and are committed to protecting it through our compliance with this policy.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect several types of information from and about users of our platform, including:
          </p>
          <ul>
            <li>
              <strong>Identity Information:</strong> Full names, identifiers (e.g., student or employee IDs), and email addresses when provided by session administrators.
            </li>
            <li>
              <strong>Location Data:</strong> We access your device&apos;s GPS coordinates strictly at the moment of check-in to verify you are within the designated geofence. We do not track your location continuously.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating system, and IP address for diagnostic and security purposes.
            </li>
          </ul>

          <h2>2. How We Handle Biometric Data</h2>
          <p>
            When utilizing strict attendance mode, we employ WebAuthn (Passkeys) for robust identity verification utilizing your device&apos;s built-in biometrics (like Face ID or Touch ID).
          </p>
          <p>
            <strong>Crucial Note:</strong> We NEVER collect, transmit, or store your actual fingerprint, facial map, or any underlying biometric data. The biometric authentication happens entirely locally on your device. {APP_NAME} only receives and stores a cryptographic public key confirming that your device verified you successfully. 
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use information that we collect about you or that you provide to us:
          </p>
          <ul>
            <li>To present our platform and its contents to you.</li>
            <li>To verify your location and identity against active attendance sessions.</li>
            <li>To provide session administrators with accurate attendance records.</li>
            <li>To fulfill any other purpose for which you provide it.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All data is transmitted securely over HTTPS and stored using industry-standard cryptography.
          </p>

          <h2>5. Changes to Our Privacy Policy</h2>
          <p>
            It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users&apos; personal information, we will notify administrators through email or via dashboard notices.
          </p>

          <h2>6. Contact Information</h2>
          <p>
            To ask questions or comment about this privacy policy and our privacy practices, please contact us at <a href="mailto:privacy@attendproof.com">privacy@attendproof.com</a>.
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
