'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/bracket" className="font-display text-lg sm:text-xl tracking-tight text-old-gold">
          Golden Bracket
        </Link>

        <div className="flex gap-3 sm:gap-6 text-sm">
          <Link href="/bracket" className="text-ink-muted hover:text-old-gold transition-colors">
            Bracket
          </Link>
          <Link href="/methodology" className="text-ink-muted hover:text-old-gold transition-colors">
            Methodology
          </Link>
        </div>
      </nav>
    </header>
  );
}
