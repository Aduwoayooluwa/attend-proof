'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { APP_NAME, BRAND_IMAGE_URL } from '@/lib/brand';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/page.module.css';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={styles.lpHeader}>
      <nav className={styles.lpNav} aria-label="Primary">
        <Link href="/" className={styles.lpBrand} style={{ textDecoration: 'none' }}>
          <div className={styles.lpBrandIcon} aria-hidden="true">
            <img src={BRAND_IMAGE_URL} alt="" className={styles.lpBrandLogo} />
          </div>
          <span className={styles.lpBrandName}>{APP_NAME}</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className={styles.lpNavActions}>
          <Link href="/#how-it-works" className={styles.lpLoginLink}>
            How it works
          </Link>
          {user ? (
            <Link href="/admin" className={styles.lpSignupButton}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className={styles.lpLoginLink}>
                Log in
              </Link>
              <Link href="/auth/register" className={styles.lpSignupButton}>
                Create account
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className={styles.lpMobileMenuBtn} 
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <div className={`${styles.lpMobileMenu} ${isMenuOpen ? styles.lpMobileMenuOpen : ''}`}>
          <Link href="/#how-it-works" className={styles.lpMobileNavLink} onClick={toggleMenu}>
            How it works
          </Link>
          {user ? (
            <div className={styles.lpMobileActionWrap}>
              <Link href="/admin" className={styles.lpMobileSignupButton} onClick={toggleMenu}>
                Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className={styles.lpMobileNavLink} onClick={toggleMenu}>
                Log in
              </Link>
              <div className={styles.lpMobileActionWrap}>
                <Link href="/auth/register" className={styles.lpMobileSignupButton} onClick={toggleMenu}>
                  Create account
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
