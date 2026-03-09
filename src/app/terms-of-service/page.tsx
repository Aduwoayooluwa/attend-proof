import { APP_NAME } from '@/lib/brand';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import styles from '../legal.module.css';

export const metadata = {
  title: `Terms of Service - ${APP_NAME}`,
  description: 'Our terms and conditions for utilizing our verifable attendance platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.legalPage}>
      <LandingHeader />

      <main className={styles.legalMain}>
        <h1 className={styles.legalTitle}>Terms of Service</h1>
        <p className={styles.legalUpdated}>Last updated: March 2026</p>

        <div className={styles.legalContent}>
          <p>
            Welcome to <strong>{APP_NAME}</strong>. By accessing our attendance recording platform, you agree to these Terms of Service. These Terms govern your access to and use of our services, software, and websites.
          </p>

          <h2>1. Use of Service</h2>
          <p>
            The {APP_NAME} platform provides administrators a way to monitor attendance via geofencing and WebAuthn (Passkeys) technologies. You must be at least 18 years of age or possess legal parental or guardian consent to use this service as a session administrator. Participants logging attendance must comply with the rules set by their session administrator.
          </p>
          
          <h2>2. User Accounts & Security</h2>
          <p>
            To use certain features, an administrator account is required. You are strictly responsible for safeguarding your password and any other credentials used to access the account securely.
          </p>
          <p>
            You agree to notify us immediately if you discover any unauthorized use of your account. We bear no liability for any loss or damage arising from your failure to protect your login credentials.
          </p>

          <h2>3. Attendance Data & Accuracy</h2>
          <p>
            You acknowledge that the accuracy of attendance records relies heavily on proper usage of standard device features (GPS, Location Services, and intrinsic biometrics sensors). 
          </p>
          <p>
            {APP_NAME} makes best-effort validations via geofencing and WebAuthn parameters. However, we do not guarantee total immunity against extremely sophisticated spoofing tools if a participant&apos;s device has been explicitly jailbroken or compromised at the hardware level.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The platform design, source code, logos, icons, and original content are the exclusive property of {APP_NAME} and are protected by applicable copyright, trademark, and other intellectual property laws globally.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>
            You agree not to misuse our services. Misuse ranges from attempting to bypass our geofencing checks, attempting to manipulate your device&apos;s time/date to forge attendance, or probing our infrastructure for vulnerabilities. Violation of these terms will result in immediate account termination.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {APP_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, resulting from the inability to use the services effectively.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            For inquiries regarding these Terms of Service, please reach out to <a href="mailto:support@example.com">support@example.com</a>.
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
