'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { APP_NAME, BRAND_IMAGE_URL } from '@/lib/brand';
import styles from './landing-nav.module.css';

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Primary">
        <Link href="/" className={styles.brand} onClick={() => setIsOpen(false)}>
          <div className={styles.brandIcon} aria-hidden="true">
            <img src={BRAND_IMAGE_URL} alt="" className={styles.brandLogo} />
          </div>
          <span className={styles.brandName}>{APP_NAME}</span>
        </Link>
        
        {/* Desktop Links */}
        <div className={styles.desktopLinks}>
          <Link href="#how-it-works" className={styles.navLink}>How It Works</Link>
          <Link href="#features" className={styles.navLink}>Features</Link>
        </div>

        <div className={styles.navActions}>
          <Link href="/auth/login" className={styles.loginLink}>
            Log in
          </Link>
          <Link href="/auth/register" className={styles.signupButton}>
            Create account
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          className={styles.mobileToggle} 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
        <div className={styles.mobileLinks}>
          <Link href="#how-it-works" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>How It Works</Link>
          <Link href="#features" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>Features</Link>
          <div className={styles.mobileDivider} />
          <Link href="/auth/login" className={styles.mobileLoginLink} onClick={() => setIsOpen(false)}>Log in</Link>
          <Link href="/auth/register" className={styles.mobileSignupBtn} onClick={() => setIsOpen(false)}>Create account</Link>
        </div>
      </div>
    </header>
  );
}
