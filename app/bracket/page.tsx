import { BracketProvider } from '@/lib/bracket/state';
import BracketView from '@/components/bracket/BracketView';
import BracketInitializer from '@/components/bracket/BracketInitializer';
import WelcomeBanner from '@/components/bracket/WelcomeBanner';

export const metadata = {
  title: 'Build Your Bracket',
  description:
    'Fill out your 2026 NCAA Tournament bracket with algorithm-powered predictions. 68 teams across 4 regions — pick every game from the First Four to the Championship.',
  openGraph: {
    title: 'Build Your Bracket — March Madness 2026',
    description:
      '68 teams, 4 regions, 1 champion. Use our algorithm to fill your bracket or make every pick yourself.',
  },
};

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-2 py-10 sm:px-4 xl:px-6">
      <WelcomeBanner />
      <h1 className="mb-8 font-display text-3xl sm:text-4xl">Build Your Bracket</h1>
      <BracketProvider>
        <BracketInitializer />
        <BracketView />
      </BracketProvider>
    </div>
  );
}
