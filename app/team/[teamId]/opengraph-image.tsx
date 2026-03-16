import { ImageResponse } from 'next/og';
import { findTeamById, getTeamStats, ensureHash } from '@/lib/og-utils';

export const alt = 'Team Profile — March Madness 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Mix a team color toward dark for a background that keeps white text readable. */
function darken(hex: string): string {
  const h = hex.replace('#', '');
  const r = Math.round(parseInt(h.substring(0, 2), 16) * 0.45);
  const g = Math.round(parseInt(h.substring(2, 4), 16) * 0.45);
  const b = Math.round(parseInt(h.substring(4, 6), 16) * 0.45);
  return `rgb(${r},${g},${b})`;
}

export default async function Image({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await findTeamById(Number(teamId));

  if (!team) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#FAFAF7',
            color: '#1A1A1A',
            fontSize: 40,
            fontFamily: 'Georgia, serif',
          }}
        >
          Team Not Found
        </div>
      ),
      { ...size },
    );
  }

  const stats = await getTeamStats(team.id);
  const color = ensureHash(team.color);
  const bg = darken(color);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          fontFamily: 'Georgia, serif',
          background: `linear-gradient(135deg, ${color} 0%, ${bg} 60%, #1A1A1A 100%)`,
          padding: '50px 60px',
        }}
      >
        {/* Left: Logo + Name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40%',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.logo}
            width={160}
            height={160}
            style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.95)' }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 44,
              fontWeight: 700,
              color: '#ffffff',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            {team.shortName}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              color: 'rgba(255,255,255,0.65)',
              marginTop: 8,
              fontStyle: 'italic',
            }}
          >
            {team.name}
          </div>
        </div>

        {/* Right: Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '60%',
            paddingLeft: 32,
          }}
        >
          {/* Seed + Region badges */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                border: '1px solid #8B6914',
                background: 'rgba(139,105,20,0.15)',
                color: '#8B6914',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              #{team.seed} Seed
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 20,
              }}
            >
              {team.region} Region
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 20,
              }}
            >
              {team.conference}
            </div>
          </div>

          {/* Record */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 24 }}>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
              {team.record.wins}-{team.record.losses}
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
              Record
            </div>
          </div>

          {/* Key stats */}
          {stats && (
            <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
              {[
                { label: 'Eff. Margin', value: stats.adjEM >= 0 ? `+${stats.adjEM.toFixed(1)}` : stats.adjEM.toFixed(1) },
                { label: 'PPG', value: stats.ppg.toFixed(1) },
                { label: 'Opp PPG', value: stats.oppg.toFixed(1) },
                { label: 'SOS', value: stats.sos.toFixed(1) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 18px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(139,105,20,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                    {stat.value}
                  </div>
                  <div style={{ display: 'flex', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom watermark */}
          <div style={{ display: 'flex', marginTop: 32 }}>
            <div style={{ display: 'flex', fontSize: 13, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              March Madness 2026
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
