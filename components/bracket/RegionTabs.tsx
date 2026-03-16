'use client';

import type { Region } from '@/lib/types/bracket';

type Tab = Region | 'Final Four';

interface RegionTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  completionByRegion: Map<Tab, { done: number; total: number }>;
}

const TABS: Tab[] = ['East', 'West', 'South', 'Midwest', 'Final Four'];

export default function RegionTabs({
  activeTab,
  onTabChange,
  completionByRegion,
}: RegionTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-rule pb-px">
      {TABS.map((tab) => {
        const comp = completionByRegion.get(tab) ?? { done: 0, total: 0 };
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex items-baseline gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-b-2 border-old-gold text-old-gold'
                : 'text-ink-faint hover:text-ink-muted'
            }`}
          >
            <span>{tab}</span>
            {comp.total > 0 && (
              <span
                className={`font-mono text-[10px] ${
                  isActive ? 'text-old-gold/70' : 'text-ink-faint/70'
                }`}
              >
                {comp.done}/{comp.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
