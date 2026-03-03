import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { APP_DESCRIPTION, APP_TITLE, BRAND_IMAGE_URL, SITE_URL } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  icons: {
    icon: BRAND_IMAGE_URL,
    shortcut: BRAND_IMAGE_URL,
    apple: BRAND_IMAGE_URL,
  },
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: BRAND_IMAGE_URL,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [BRAND_IMAGE_URL],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: 'nysc-toast',
              title: 'nysc-toast-title',
              description: 'nysc-toast-desc',
              success: 'nysc-toast-success',
              error: 'nysc-toast-error',
              actionButton: 'nysc-toast-action',
              cancelButton: 'nysc-toast-cancel',
            },
          }}
        />
      </body>
    </html>
  );
}
