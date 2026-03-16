import { ImageResponse } from 'next/og';
import { findTeamsBySlug, quickWinProb, getTeamStats } from '@/lib/og-utils';
import { resolveTeamColors } from '@/lib/color-utils';

export const alt = 'Matchup Analysis — March Madness 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { team1, team2 } = await findTeamsBySlug(slug);

  if (!team1 || !team2) {
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
          Matchup Not Found
        </div>
      ),
      { ...size },
    );
  }

  const winProb = await quickWinProb(team1.id, team2.id);
  const team1Pct = Math.round(winProb * 100);
  const team2Pct = 100 - team1Pct;
  const { team1Color: color1, team2Color: color2 } = resolveTeamColors(team1, team2);
  const stats1 = await getTeamStats(team1.id);
  const stats2 = await getTeamStats(team2.id);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Team 1 panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44%',
            height: '100%',
            backgroundColor: color1,
            padding: '40px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team1.logo}
              width={100}
              height={100}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.95)' }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {team1.shortName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 6,
              }}
            >
              #{team1.seed} Seed &bull; {team1.conference}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 4,
                fontFamily: 'monospace',
              }}
            >
              {team1.record.wins}-{team1.record.losses}
              {stats1 ? ` &bull; ${stats1.ppg} PPG` : ''}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 20,
                fontFamily: 'monospace',
              }}
            >
              {team1Pct}%
            </div>
          </div>
        </div>

        {/* Center VS column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12%',
            height: '100%',
            background: '#FAFAF7',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              border: '1px solid #8B6914',
              background: 'rgba(139,105,20,0.08)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: '#8B6914', fontStyle: 'italic' }}>VS</div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              color: '#6B6B6B',
              marginTop: 8,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Win Prob
          </div>
        </div>

        {/* Team 2 panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44%',
            height: '100%',
            backgroundColor: color2,
            padding: '40px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team2.logo}
              width={100}
              height={100}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.95)' }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {team2.shortName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 6,
              }}
            >
              #{team2.seed} Seed &bull; {team2.conference}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 4,
                fontFamily: 'monospace',
              }}
            >
              {team2.record.wins}-{team2.record.losses}
              {stats2 ? ` &bull; ${stats2.ppg} PPG` : ''}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 20,
                fontFamily: 'monospace',
              }}
            >
              {team2Pct}%
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '14px 0',
            background: 'rgba(250,250,247,0.9)',
          }}
        >
          <div style={{ fontSize: 13, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '2px' }}>
            March Madness 2026
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
