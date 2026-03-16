import { ImageResponse } from 'next/og';

export const alt = 'Build Your Bracket — Golden Bracket';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          fontFamily: 'Georgia, serif',
          padding: 60,
        }}
      >
        {/* Region badges */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {['East', 'West', 'South', 'Midwest'].map((region) => (
            <div
              key={region}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 20px',
                border: '1px solid #D4D2CC',
                background: 'rgba(139,105,20,0.06)',
              }}
            >
              <div style={{ fontSize: 14, color: '#8B6914', fontWeight: 600 }}>
                {region}
              </div>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>
                16 teams
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#1A1A1A',
          }}
        >
          Build Your Bracket
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#6B6B6B',
            marginTop: 16,
            fontStyle: 'italic',
          }}
        >
          68 Teams &bull; 4 Regions &bull; Algorithm-Powered Picks
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 40,
            padding: '14px 36px',
            border: '1px solid #8B6914',
            background: 'rgba(139,105,20,0.08)',
            color: '#8B6914',
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          Start Picking
        </div>

        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 24,
            fontSize: 14,
            color: '#6B6B6B',
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Golden Bracket
        </div>
      </div>
    ),
    { ...size },
  );
}
