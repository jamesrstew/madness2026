'use client';

import { useEffect } from 'react';
import { useBracket } from '@/lib/bracket/state';
import { generateInitialBracket } from '@/lib/bracket/structure';
import { MOCK_TEAMS } from '@/lib/mock-data';

/**
 * Initializes the bracket with mock tournament data if it hasn't been loaded
 * from localStorage yet. Renders nothing — purely a side-effect component.
 */
export default function BracketInitializer() {
  const { state, dispatch } = useBracket();

  useEffect(() => {
    // Only initialize if the bracket is empty (no localStorage data loaded)
    if (state.matchups.size === 0) {
      const matchups = generateInitialBracket(MOCK_TEAMS);
      dispatch({ type: 'RESET_BRACKET', matchups });
    }
  }, [state.matchups.size, dispatch]);

  return null;
}
