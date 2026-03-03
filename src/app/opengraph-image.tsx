import { ImageResponse } from 'next/og';
import { APP_DESCRIPTION, APP_TITLE, BRAND_IMAGE_URL } from '@/lib/brand';

export const runtime = 'edge';

export const alt = APP_TITLE;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0F1713, #1A2E22)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px',
        }}
      >
        <img
          src={BRAND_IMAGE_URL}
          alt={APP_TITLE}
          style={{
            width: 320,
            height: 320,
            objectFit: 'contain',
            marginBottom: 36,
          }}
        />
        <h1
          style={{
            fontSize: 68,
            fontWeight: 'bold',
            marginBottom: 18,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
          }}
        >
          {APP_TITLE}
        </h1>
        <p
          style={{
            fontSize: 30,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            maxWidth: '80%',
            margin: 0,
          }}
        >
          {APP_DESCRIPTION}
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
