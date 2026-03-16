'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'golden-bracket-welcome-dismissed';

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mb-6 border-l-2 border-old-gold bg-old-gold/[0.06] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl">
                  Chase the Perfect Bracket
                </h2>
                <p className="mt-2 text-base text-ink-muted leading-relaxed max-w-2xl">
                  No one has ever picked a perfect bracket. This is your best shot.
                  Click any team to make your pick, or hit <em>Auto-fill</em> to let our algorithm build your golden ticket.
                  Tap <em>Analyze</em> on any matchup for a full breakdown.
                  68 teams, 10 prediction factors, real ESPN data.
                </p>
              </div>
              <button
                onClick={dismiss}
                className="flex-shrink-0 p-1 text-ink-faint hover:text-ink-muted transition-colors"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
