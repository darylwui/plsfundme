'use client';

import { useRouter } from 'next/navigation';

const TABS = [
  { id: 'terms' as const, label: 'Terms of Service' },
  { id: 'refund' as const, label: 'Refund & Dispute' },
];

export type LegalTabId = 'terms' | 'refund';

export function LegalTabs({
  activeTab,
  children,
}: {
  activeTab: LegalTabId;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleTab(id: LegalTabId) {
    router.push(id === 'terms' ? '/terms' : `/terms?tab=${id}`, { scroll: false });
  }

  return (
    <div>
      <div className="border-b border-[var(--color-border)] mb-10">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--color-brand-crust)] text-[var(--color-brand-crust)] dark:border-[var(--color-brand-golden)] dark:text-[var(--color-brand-golden)]'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
