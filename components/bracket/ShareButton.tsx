'use client';

import { useState, useCallback } from 'react';
import { useBracket } from '@/lib/bracket/state';
import { encodeBracket } from '@/lib/bracket/url-encoding';

export default function ShareButton() {
  const [linkStatus, setLinkStatus] = useState<'idle' | 'done'>('idle');
  const { state } = useBracket();

  const handleCopyLink = useCallback(async () => {
    const encoded = encodeBracket(state.selections, state.matchups);
    const url = new URL(window.location.href);
    if (encoded) {
      url.searchParams.set('b', encoded);
    } else {
      url.searchParams.delete('b');
    }
    url.hash = '';

    try {
      await navigator.clipboard.writeText(url.toString());
      setLinkStatus('done');
      setTimeout(() => setLinkStatus('idle'), 2000);
    } catch {
      setLinkStatus('idle');
    }
  }, [state.selections, state.matchups]);

  return (
    <button
      onClick={handleCopyLink}
      className="border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
    >
      {linkStatus === 'done' ? 'Copied!' : 'Copy Link'}
    </button>
  );
}
