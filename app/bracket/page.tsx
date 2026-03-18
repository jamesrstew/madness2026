import { BracketProvider } from '@/lib/bracket/state';
import BracketView from '@/components/bracket/BracketView';
import BracketInitializer from '@/components/bracket/BracketInitializer';
import ActualResultsSync from '@/components/bracket/ActualResultsSync';
import WelcomeBanner from '@/components/bracket/WelcomeBanner';

export const metadata = {
  title: 'Build Your Bracket',
  description:
    'No one has ever picked a perfect bracket. Golden Bracket gives you the best shot — algorithm-powered predictions across 68 teams and 4 regions, from the First Four to the Championship.',
  openGraph: {
    title: 'Build Your Bracket — Golden Bracket',
    description:
      '68 teams, 4 regions, 1 champion. Your best shot at the golden ticket — a perfect bracket.',
  },
};

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-2 py-10 sm:px-4 xl:px-6">
      <WelcomeBanner />
      <h1 className="mb-8 font-display text-3xl sm:text-4xl">Build Your Bracket</h1>
      <BracketProvider>
        <BracketInitializer />
        <ActualResultsSync />
        <BracketView />
      </BracketProvider>
    </div>
  );
}
