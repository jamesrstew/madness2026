import { ImageResponse } from 'next/og';
import { loadOgFonts } from '@/lib/og-fonts';

export const alt = 'Golden Bracket — Your Best Shot at a Perfect Bracket';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #FAFAF7 0%, #F0EFE9 50%, #E5E4DE 100%)',
          fontFamily: 'Source Serif 4',
          padding: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            fontFamily: 'Playfair Display',
            letterSpacing: '-1px',
            lineHeight: 1.1,
            color: '#1A1A1A',
          }}
        >
          <span style={{ color: '#8B6914' }}>Golden</span>
          <span style={{ marginLeft: 18 }}>Bracket</span>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#6B6B6B',
            marginTop: 16,
            fontStyle: 'italic',
            fontFamily: 'Playfair Display',
          }}
        >
          Your Best Shot at a Perfect Bracket
        </div>

        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 48,
          }}
        >
          {[
            { value: '68', label: 'Teams' },
            { value: '10', label: 'Prediction Factors' },
            { value: '10K+', label: 'Simulations' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 32px',
                border: '1px solid #D4D2CC',
                background: 'rgba(139,105,20,0.06)',
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 600, color: '#8B6914', fontFamily: 'Source Serif 4' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Source Serif 4' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
