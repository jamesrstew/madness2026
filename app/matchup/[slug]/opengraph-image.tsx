import { ImageResponse } from 'next/og';
import { findTeamsBySlug, quickWinProb, getTeamStats } from '@/lib/og-utils';
import { loadOgFonts } from '@/lib/og-fonts';
import { resolveTeamColors } from '@/lib/color-utils';

export const alt = 'Matchup Analysis — Golden Bracket';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { team1, team2 } = await findTeamsBySlug(slug);

  const fonts = await loadOgFonts();

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
            fontFamily: 'Playfair Display',
          }}
        >
          Matchup Not Found
        </div>
      ),
      { ...size, fonts },
    );
  }

  const winProb = await quickWinProb(team1.id, team2.id);
  const team1Pct = Math.round(winProb * 100);
  const team2Pct = 100 - team1Pct;
  const { team1Color: color1, team2Color: color2 } = resolveTeamColors(team1, team2);
  const stats1 = await getTeamStats(team1.id);
  const stats2 = await getTeamStats(team2.id);

  // Apply dark overlay via gradient so content isn't covered by an absolute div
  const panelBg = (color: string) =>
    `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), ${color}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          fontFamily: 'Source Serif 4',
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
            background: panelBg(color1),
            padding: '40px 32px',
            boxSizing: 'border-box',
          }}
        >
          {/* Logo in a white square with padding — no circle clip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              background: 'rgba(255,255,255,0.95)',
              padding: 14,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={team1.logo} width={92} height={92} style={{ objectFit: 'contain' }} />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'Playfair Display',
              color: '#ffffff',
              marginTop: 20,
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
              marginTop: 8,
              fontFamily: 'Source Serif 4',
            }}
          >
            #{team1.seed} Seed · {team1.conference}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 4,
              fontFamily: 'Source Serif 4',
            }}
          >
            {team1.record.wins}-{team1.record.losses}
            {stats1 ? ` · ${stats1.ppg} PPG` : ''}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              fontFamily: 'Playfair Display',
              color: '#ffffff',
              marginTop: 24,
              lineHeight: 1,
            }}
          >
            {team1Pct}%
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
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Playfair Display',
                color: '#8B6914',
                fontStyle: 'italic',
              }}
            >
              VS
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              color: '#6B6B6B',
              marginTop: 10,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: 'Source Serif 4',
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
            background: panelBg(color2),
            padding: '40px 32px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              background: 'rgba(255,255,255,0.95)',
              padding: 14,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={team2.logo} width={92} height={92} style={{ objectFit: 'contain' }} />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'Playfair Display',
              color: '#ffffff',
              marginTop: 20,
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
              marginTop: 8,
              fontFamily: 'Source Serif 4',
            }}
          >
            #{team2.seed} Seed · {team2.conference}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 4,
              fontFamily: 'Source Serif 4',
            }}
          >
            {team2.record.wins}-{team2.record.losses}
            {stats2 ? ` · ${stats2.ppg} PPG` : ''}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              fontFamily: 'Playfair Display',
              color: '#ffffff',
              marginTop: 24,
              lineHeight: 1,
            }}
          >
            {team2Pct}%
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
          <div
            style={{
              fontSize: 13,
              color: '#6B6B6B',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: 'Source Serif 4',
            }}
          >
            Golden Bracket
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
