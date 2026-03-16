# Golden Bracket

**Your best shot at a perfect bracket.**

No one has ever picked a perfect NCAA Tournament bracket. The odds are roughly 1 in 9.2 quintillion. Golden Bracket combines a multi-factor statistical model, Monte Carlo simulation, and real-time prediction market data to give you the most informed picks possible.

**Live at [goldenbracket.app](https://goldenbracket.app)**

## How It Works

Golden Bracket blends three layers of analysis into a single win probability for every matchup:

### 10-Factor Composite Rating

Every team is scored across 10 weighted factors, normalized via z-score:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Adjusted Efficiency Margin | 32% | Points scored vs. allowed per 100 possessions, adjusted for opponent strength |
| Strength of Schedule | 10% | Quality of opponents faced throughout the season |
| Coaching Pedigree | 10% | Head coach's tournament history — Final Fours, championships, appearances |
| Recent Form | 10% | Performance trend over the last 10 games |
| Consistency | 10% | Game-to-game variance in scoring margin (lower is better) |
| Turnover Differential | 7% | Ability to protect the ball and force mistakes |
| Offensive Rebounding | 6% | Second-chance scoring opportunities |
| Offensive eFG% | 5% | Shooting efficiency beyond the arc and inside |
| Defensive eFG% | 5% | Ability to contest and limit opponent shooting |
| Free Throw Rate | 5% | Getting to the line and converting |

In close matchups (seed differential of 4 or less), intangible factors like coaching, form, and consistency are boosted — because when talent is equal, those edges matter most.

### Monte Carlo Simulation

10,000 full tournament simulations using Log5 win probability with Bayesian strength updating. Teams that beat strong opponents mid-simulation get a credibility boost for subsequent rounds. Outputs championship, Final Four, Elite Eight, and Sweet Sixteen probabilities.

### Ensemble Model + Market Blend

The statistical model is blended with Polymarket prediction market odds (70/30 by default) to capture wisdom-of-the-crowd signals that pure stats might miss — like transfer portal impact, injury rumors, or matchup-specific betting patterns.

### Contextual Adjustments

- **Player Health** — Detects missing star players from recent box scores (up to 8% adjustment)
- **Location Advantage** — Haversine distance from campus to tournament venue (up to 3% adjustment)
- **Seed Calibration** — Historical upset rates by seed pairing to ground predictions in reality

## Features

- **Interactive Bracket Builder** — Click to pick or auto-fill with algorithm predictions
- **Matchup Analysis** — Deep-dive into any game with factor breakdowns, stat comparisons, and market odds
- **Team Profiles** — Full season stats, recent form, and season leaders for all 68 teams
- **Shareable Brackets** — URL-encoded bracket state for sharing picks with friends
- **Dynamic OG Images** — Every page generates rich social preview images with team colors and stats

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org) 16 with App Router, React 19
- **Styling** — [Tailwind CSS](https://tailwindcss.com) 4
- **Animation** — [Framer Motion](https://www.framer.com/motion/)
- **Data Sources** — ESPN API, College Basketball Data API, Polymarket
- **Testing** — [Vitest](https://vitest.dev)
- **Deployment** — [Vercel](https://vercel.com)

## Getting Started

```bash
git clone https://github.com/jamesrstew/madness2026.git
cd madness2026
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works out of the box with ESPN data and falls back to mock data if APIs are unavailable.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CBBD_API_KEY` | No | [College Basketball Data](https://collegebasketballdata.com) API key for advanced efficiency metrics. Without it, the app uses ESPN data only. |

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run unit tests
```

## Project Structure

```
app/
  api/              API routes (predict, teams, stats, schedule, scores, rankings)
  bracket/          Bracket builder page
  matchup/[slug]/   Matchup analysis pages
  team/[teamId]/    Team profile pages

components/
  bracket/          Bracket UI (GameCard, RegionTabs, RoundStepper, ShareButton)
  matchup/          Analysis components (WinProbability, AlgorithmBreakdown, MarketInsight)
  team/             Team components (TeamCard, TeamStats, RecentForm, SeasonLeaders)
  ui/               Shared layout (Header, Footer, Loading)

lib/
  algorithm/        Prediction engine (composite rating, Monte Carlo, ensemble, health, location)
  api/              External API clients (ESPN, CBBD, Polymarket)
  bracket/          Bracket state management, storage, URL encoding
  data/             Static data (coaching history, team locations, venue locations)
  types/            TypeScript type definitions
```

## License

ISC
