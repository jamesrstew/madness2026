'use client';

import { useActualResults } from '@/lib/hooks/useActualResults';

export default function ActualResultsSync() {
  useActualResults();
  return null;
}
