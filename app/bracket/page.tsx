import { BracketProvider } from '@/lib/bracket/state';
import Bracket from '@/components/bracket/Bracket';
import BracketInitializer from '@/components/bracket/BracketInitializer';

export const metadata = {
  title: 'Build Your Bracket — March Madness 2026',
  description: 'Fill out your 2026 NCAA Tournament bracket with algorithm-powered predictions',
};

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Build Your Bracket</h1>
      <BracketProvider>
        <BracketInitializer />
        <Bracket />
      </BracketProvider>
    </div>
  );
}
