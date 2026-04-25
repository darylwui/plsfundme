# Creator Dashboard Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the confusing empty-state + Singpass card combo on `/dashboard` with a 4-step onboarding stepper, and replace the misleading $0/goal funding view for draft-only creators with a focused draft-continuation card.

**Architecture:** Two new server components (`<CreatorOnboardingStepper>`, `<DraftContinuationCard>`) and one client island (`<DeleteDraftButton>`), conditionally rendered inside the existing `CreatorDashboard` server component in `app/dashboard/page.tsx`. No new routes, no new API endpoints, no schema changes. One small helper added to `lib/utils/dates.ts` for relative-time formatting.

**Tech Stack:** Next.js App Router (server components + client islands), Supabase (existing query), Tailwind CSS with project CSS vars, Vitest + Testing Library, lucide-react icons. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-25-creator-dashboard-onboarding-design.md`

---

## File Structure

**New files:**

- `lib/utils/__tests__/dates.test.ts` — tests for the relative-time helper (also covers existing helpers if convenient, but Task 1 only adds tests for the new function)
- `components/dashboard/CreatorOnboardingStepper.tsx` — 4-step vertical-list server component
- `components/dashboard/DeleteDraftButton.tsx` — client island for delete-with-confirm
- `components/dashboard/DraftContinuationCard.tsx` — server component shell that uses the delete island
- `tests/components/dashboard/CreatorOnboardingStepper.test.tsx`
- `tests/components/dashboard/DeleteDraftButton.test.tsx`
- `tests/components/dashboard/DraftContinuationCard.test.tsx`

**Modified files:**

- `lib/utils/dates.ts` — append `formatRelativeTime(date)` helper
- `app/dashboard/page.tsx` — three changes inside `CreatorDashboard`:
  1. Add `.is("deleted_at", null)` to the projects query
  2. Remove `SingpassVerificationCard` import and its conditional render
  3. Add render-decision logic that swaps in `<CreatorOnboardingStepper>` or `<DraftContinuationCard>` based on project state

---

## Task 1: `formatRelativeTime` helper + tests

**Files:**
- Modify: `lib/utils/dates.ts`
- Create: `lib/utils/__tests__/dates.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/utils/__tests__/dates.test.ts` with the following:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../dates';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null input', () => {
    expect(formatRelativeTime(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns empty string for invalid input', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });

  it('returns "just now" for under 60 seconds', () => {
    expect(formatRelativeTime('2026-04-25T11:59:30Z')).toBe('just now');
  });

  it('returns "just now" for future dates (clock skew)', () => {
    expect(formatRelativeTime('2026-04-25T12:05:00Z')).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    expect(formatRelativeTime('2026-04-25T11:59:00Z')).toBe('1 minute ago');
  });

  it('returns "5 minutes ago" for 5 minutes', () => {
    expect(formatRelativeTime('2026-04-25T11:55:00Z')).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    expect(formatRelativeTime('2026-04-25T11:00:00Z')).toBe('1 hour ago');
  });

  it('returns "3 hours ago" for 3 hours', () => {
    expect(formatRelativeTime('2026-04-25T09:00:00Z')).toBe('3 hours ago');
  });

  it('returns "1 day ago" for exactly 1 day', () => {
    expect(formatRelativeTime('2026-04-24T12:00:00Z')).toBe('1 day ago');
  });

  it('returns "3 days ago" for 3 days', () => {
    expect(formatRelativeTime('2026-04-22T12:00:00Z')).toBe('3 days ago');
  });

  it('falls back to absolute date format for 7+ days ago', () => {
    // Existing formatDate uses en-SG locale: "18 April 2026"
    expect(formatRelativeTime('2026-04-18T12:00:00Z')).toBe('18 April 2026');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/utils/__tests__/dates.test.ts`
Expected: FAIL — `formatRelativeTime is not exported` or similar.

- [ ] **Step 3: Implement `formatRelativeTime` in `lib/utils/dates.ts`**

Append to `lib/utils/dates.ts`:

```ts
/**
 * Format a date as a relative time string for "Last saved X ago" copy.
 *
 * Returns:
 * - empty string for invalid input
 * - "just now" for < 60s (or future dates from clock skew)
 * - "N minute(s) ago" for < 1h
 * - "N hour(s) ago" for < 24h
 * - "N day(s) ago" for < 7d
 * - falls back to formatDate(date) for >= 7d (e.g., "18 April 2026")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const then = new Date(date)
  if (Number.isNaN(then.getTime())) return ''

  const diffMs = Math.max(0, Date.now() - then.getTime())
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`
  }

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`
  }

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
  }

  return formatDate(then)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/utils/__tests__/dates.test.ts`
Expected: 12 passing tests, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/dates.ts lib/utils/__tests__/dates.test.ts
git commit -m "feat(utils): add formatRelativeTime helper for last-saved copy"
```

---

## Task 2: Dashboard projects query — soft-delete filter

**Files:**
- Modify: `app/dashboard/page.tsx` (around line 149-154 — the `CreatorDashboard` `projects` query)

- [ ] **Step 1: Add the filter to the query**

Open `app/dashboard/page.tsx`. Find the existing query inside `CreatorDashboard`:

```ts
const { data: projects } = await supabase
  .from("projects")
  .select("*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)")
  .eq("creator_id", userId)
  .order("created_at", { ascending: false })
  .limit(5);
```

Insert `.is("deleted_at", null)` between `.eq(...)` and `.order(...)`:

```ts
const { data: projects } = await supabase
  .from("projects")
  .select("*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)")
  .eq("creator_id", userId)
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(5);
```

- [ ] **Step 2: Verify the dashboard still renders cleanly**

Run: `npx tsc --noEmit`
Expected: exit code 0, no errors.

(No automated test — this is a one-line query change. Smoke test will verify in Task 7.)

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "fix(dashboard): exclude soft-deleted projects from creator query"
```

---

## Task 3: `<CreatorOnboardingStepper />` component

**Files:**
- Create: `components/dashboard/CreatorOnboardingStepper.tsx`
- Create: `tests/components/dashboard/CreatorOnboardingStepper.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/dashboard/CreatorOnboardingStepper.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorOnboardingStepper } from '@/components/dashboard/CreatorOnboardingStepper';

describe('CreatorOnboardingStepper', () => {
  it('renders the card heading and subtitle', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Get your first campaign live')).toBeTruthy();
    expect(screen.getByText('Four quick steps from approved to launched.')).toBeTruthy();
  });

  it('renders all 4 step titles', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Application approved')).toBeTruthy();
    expect(screen.getByText('Verify identity with Singpass')).toBeTruthy();
    expect(screen.getByText('Run through the launch checklist')).toBeTruthy();
    expect(screen.getByText('Launch your first campaign')).toBeTruthy();
  });

  it('shows "Coming soon" pill on step 2 when singpassVerified is false', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });

  it('hides "Coming soon" pill on step 2 when singpassVerified is true', () => {
    render(<CreatorOnboardingStepper singpassVerified={true} />);
    expect(screen.queryByText('Coming soon')).toBeNull();
  });

  it('step 3 link points to /for-creators/launch-guide', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    const link = screen.getByRole('link', { name: /open guide/i });
    expect(link.getAttribute('href')).toBe('/for-creators/launch-guide');
  });

  it('step 4 CTA points to /projects/create', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    const link = screen.getByRole('link', { name: /start a project/i });
    expect(link.getAttribute('href')).toBe('/projects/create');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/dashboard/CreatorOnboardingStepper.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/dashboard/CreatorOnboardingStepper"`.

- [ ] **Step 3: Implement the component**

Create `components/dashboard/CreatorOnboardingStepper.tsx`:

```tsx
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatorOnboardingStepperProps {
  singpassVerified: boolean;
}

type StepStatus = "done" | "locked" | "pointer" | "cta";

interface Step {
  number: number;
  status: StepStatus;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

export function CreatorOnboardingStepper({ singpassVerified }: CreatorOnboardingStepperProps) {
  const steps: Step[] = [
    {
      number: 1,
      status: "done",
      title: "Application approved",
      description: "You're cleared to create campaigns",
    },
    {
      number: 2,
      status: singpassVerified ? "done" : "locked",
      title: "Verify identity with Singpass",
      description: "Builds trust with your backers — we'll email you when it's live",
      comingSoon: !singpassVerified,
    },
    {
      number: 3,
      status: "pointer",
      title: "Run through the launch checklist",
      description: "15-min prep doc covering every section of your campaign",
      href: "/for-creators/launch-guide",
    },
    {
      number: 4,
      status: "cta",
      title: "Launch your first campaign",
      description: "Walk through the form and submit for review",
      href: "/projects/create",
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
      <h2 className="text-lg font-black text-[var(--color-ink)]">Get your first campaign live</h2>
      <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 mb-4">
        Four quick steps from approved to launched.
      </p>

      <div className="flex flex-col">
        {steps.map((step, idx) => (
          <StepRow key={step.number} step={step} isLast={idx === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function StepRow({ step, isLast }: { step: Step; isLast: boolean }) {
  const dimmed = step.status === "locked";
  const borderClass = isLast ? "" : "border-b border-[var(--color-border)]";

  return (
    <div className={`flex gap-3 py-3 ${borderClass} ${dimmed ? "opacity-70" : ""}`}>
      <StepIcon step={step} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[var(--color-ink)] text-sm">{step.title}</p>
          {step.comingSoon && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">{step.description}</p>
        {step.status === "cta" && step.href && (
          <Link href={step.href} className="inline-block mt-3">
            <Button size="sm" variant="primary">
              Start a project →
            </Button>
          </Link>
        )}
      </div>
      {step.status === "pointer" && step.href && (
        <Link
          href={step.href}
          className="self-center text-sm font-bold text-[var(--color-brand-crust)] hover:underline shrink-0"
        >
          Open guide →
        </Link>
      )}
    </div>
  );
}

function StepIcon({ step }: { step: Step }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold";

  if (step.status === "done") {
    return (
      <div className={`${base} bg-[var(--color-brand-success)]/10 text-[var(--color-brand-success)]`}>
        <Check className="w-4 h-4" />
      </div>
    );
  }

  if (step.status === "locked") {
    return (
      <div className={`${base} bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`}>
        <Lock className="w-3.5 h-3.5" />
      </div>
    );
  }

  if (step.status === "pointer") {
    return (
      <div className={`${base} bg-[var(--color-brand-crumb)] text-[var(--color-brand-crust-dark)] dark:bg-[var(--color-brand-crust-dark)]/25 dark:text-[var(--color-brand-golden)]`}>
        {step.number}
      </div>
    );
  }

  // cta
  return (
    <div className={`${base} bg-[var(--color-brand-golden)] text-white`}>
      {step.number}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/dashboard/CreatorOnboardingStepper.test.tsx`
Expected: 6 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/CreatorOnboardingStepper.tsx tests/components/dashboard/CreatorOnboardingStepper.test.tsx
git commit -m "feat(dashboard): add CreatorOnboardingStepper component"
```

---

## Task 4: `<DeleteDraftButton />` client island

**Files:**
- Create: `components/dashboard/DeleteDraftButton.tsx`
- Create: `tests/components/dashboard/DeleteDraftButton.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/dashboard/DeleteDraftButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteDraftButton } from '@/components/dashboard/DeleteDraftButton';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe('DeleteDraftButton', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.restoreAllMocks();
  });

  it('renders a "Delete draft" button', () => {
    render(<DeleteDraftButton projectId="proj-1" />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
  });

  it('shows confirm dialog with the right copy on click', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DeleteDraftButton projectId="proj-1" />);

    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this draft? This cannot be undone.');
  });

  it('does nothing when user dismisses the confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('calls POST /api/projects/[id]/delete on confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/projects/proj-1/delete', { method: 'POST' });
    });
  });

  it('calls router.refresh() on success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows "Deleting…" while pending', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.spyOn(global, 'fetch').mockReturnValue(fetchPromise);

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deleting/i })).toBeTruthy();
    });

    resolveFetch!(new Response(null, { status: 200 }));
  });

  it('shows error message on non-ok response', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't delete draft/i)).toBeTruthy();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('shows error message on fetch throw', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    render(<DeleteDraftButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't delete draft/i)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/dashboard/DeleteDraftButton.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/dashboard/DeleteDraftButton"`.

- [ ] **Step 3: Implement the component**

Create `components/dashboard/DeleteDraftButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteDraftButtonProps {
  projectId: string;
}

type Status = "idle" | "pending" | "error";

const ERROR_MESSAGE = "Couldn't delete draft. Try again or contact support.";

export function DeleteDraftButton({ projectId }: DeleteDraftButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    if (status === "pending") return;

    const confirmed = window.confirm("Delete this draft? This cannot be undone.");
    if (!confirmed) return;

    setStatus("pending");
    try {
      const res = await fetch(`/api/projects/${projectId}/delete`, { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      router.refresh();
      // status stays "pending" until refresh swaps the dashboard view; don't reset
      // to avoid a flash of the idle button right before unmount.
    } catch {
      setStatus("error");
    }
  }

  const label = status === "pending" ? "Deleting…" : "Delete draft";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "pending"}
        className="text-sm font-semibold text-[var(--color-ink-subtle)] hover:text-[var(--color-ink-muted)] underline underline-offset-2 disabled:no-underline disabled:cursor-not-allowed"
      >
        {label}
      </button>
      {status === "error" && <p className="text-xs text-red-600 dark:text-red-400">{ERROR_MESSAGE}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/dashboard/DeleteDraftButton.test.tsx`
Expected: 8 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/DeleteDraftButton.tsx tests/components/dashboard/DeleteDraftButton.test.tsx
git commit -m "feat(dashboard): add DeleteDraftButton client island"
```

---

## Task 5: `<DraftContinuationCard />` component

**Files:**
- Create: `components/dashboard/DraftContinuationCard.tsx`
- Create: `tests/components/dashboard/DraftContinuationCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/dashboard/DraftContinuationCard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftContinuationCard } from '@/components/dashboard/DraftContinuationCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('DraftContinuationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseProject = {
    id: 'proj-1',
    title: 'Sourdough Starter Kit',
    slug: 'sourdough-starter-kit',
    updated_at: '2026-04-25T10:00:00Z', // 2 hours ago
  };

  it('renders the project title', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText('Sourdough Starter Kit')).toBeTruthy();
  });

  it('renders the "Pick up where you left off" header strip', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText(/pick up where you left off/i)).toBeTruthy();
  });

  it('renders "Last saved 2 hours ago"', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText(/last saved 2 hours ago/i)).toBeTruthy();
  });

  it('falls back to "Untitled draft" for empty title', () => {
    render(<DraftContinuationCard project={{ ...baseProject, title: '' }} />);
    expect(screen.getByText('Untitled draft')).toBeTruthy();
  });

  it('"Continue editing" button links to /projects/[slug]/edit', () => {
    render(<DraftContinuationCard project={baseProject} />);
    const link = screen.getByRole('link', { name: /continue editing/i });
    expect(link.getAttribute('href')).toBe('/projects/sourdough-starter-kit/edit');
  });

  it('renders a Delete draft button', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/dashboard/DraftContinuationCard.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/dashboard/DraftContinuationCard"`.

- [ ] **Step 3: Implement the component**

Create `components/dashboard/DraftContinuationCard.tsx`:

```tsx
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDraftButton } from "@/components/dashboard/DeleteDraftButton";
import { formatRelativeTime } from "@/lib/utils/dates";

interface DraftContinuationCardProps {
  project: {
    id: string;
    title: string;
    slug: string;
    updated_at: string;
  };
}

export function DraftContinuationCard({ project }: DraftContinuationCardProps) {
  const title = project.title?.trim() ? project.title : "Untitled draft";
  const lastSaved = formatRelativeTime(project.updated_at);

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[var(--color-brand-crumb)] to-[var(--color-brand-crumb)]/40 dark:from-[var(--color-brand-crust-dark)]/25 dark:to-[var(--color-brand-crust-dark)]/10 px-5 py-2.5 border-b border-[var(--color-border)]">
        <p className="text-xs font-bold text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
          📝 Pick up where you left off
        </p>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase tracking-wider">
            Draft
          </span>
          {lastSaved && (
            <span className="text-xs text-[var(--color-ink-subtle)]">Last saved {lastSaved}</span>
          )}
        </div>

        <h2 className="text-xl font-black text-[var(--color-ink)] mb-2">{title}</h2>

        <p className="text-sm text-[var(--color-ink-muted)] mb-5 leading-relaxed">
          Your draft is saved. Continue editing, then submit for review when you&apos;re ready.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link href={`/projects/${project.slug}/edit`}>
            <Button variant="primary">
              <Pencil className="w-4 h-4" />
              Continue editing
            </Button>
          </Link>
          <DeleteDraftButton projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/dashboard/DraftContinuationCard.test.tsx`
Expected: 6 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/DraftContinuationCard.tsx tests/components/dashboard/DraftContinuationCard.test.tsx
git commit -m "feat(dashboard): add DraftContinuationCard component"
```

---

## Task 6: Wire dashboard render logic

**Files:**
- Modify: `app/dashboard/page.tsx`

This task replaces the existing `SingpassVerificationCard` render and the empty-state card / active-project conditional logic with the new components. Read the current `CreatorDashboard` function first (lines 144-379) before editing.

- [ ] **Step 1: Update imports at the top of `app/dashboard/page.tsx`**

Change line 1-2 imports as follows. Find the existing imports:

```ts
import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil, Heart, Clock, XCircle, MessageCircleQuestion, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FundingProgressCard } from "@/components/dashboard/FundingProgressCard";
import { BackerTable } from "@/components/dashboard/BackerTable";
import {
  SingpassVerificationCard,
  SingpassVerifiedBadge,
} from "@/components/dashboard/SingpassVerificationCard";
import { Button } from "@/components/ui/button";
```

Replace with:

```ts
import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil, Heart, Clock, XCircle, MessageCircleQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FundingProgressCard } from "@/components/dashboard/FundingProgressCard";
import { BackerTable } from "@/components/dashboard/BackerTable";
import { SingpassVerifiedBadge } from "@/components/dashboard/SingpassVerificationCard";
import { CreatorOnboardingStepper } from "@/components/dashboard/CreatorOnboardingStepper";
import { DraftContinuationCard } from "@/components/dashboard/DraftContinuationCard";
import { Button } from "@/components/ui/button";
```

(Two changes: remove `BookOpen` from lucide imports because it was only used in the empty-state card we're replacing; remove `SingpassVerificationCard` from the named import; add the two new components.)

- [ ] **Step 2: Compute the render-decision flags inside `CreatorDashboard`**

In `app/dashboard/page.tsx`, find the line:

```ts
const activeProject = typedProjects.find((p) => p.status === "active") ?? typedProjects[0];
```

Add the two flags directly below that line:

```ts
const activeProject = typedProjects.find((p) => p.status === "active") ?? typedProjects[0];
const hasActiveCampaign = typedProjects.some((p) => p.status === "active");
const onlyProjectIsDraft =
  typedProjects.length > 0 && !hasActiveCampaign && activeProject?.status === "draft";
```

- [ ] **Step 3: Remove the standalone Singpass card render**

Find this block (around line 222-223):

```tsx
{/* Singpass card — only relevant once approved */}
{creatorStatus === "approved" && !singpassVerified && <SingpassVerificationCard />}
```

Delete it entirely. Singpass info now lives only inside the stepper (when relevant).

- [ ] **Step 4: Replace the approved branch with the new conditional**

Find the existing approved branch (starts around line 297-298, looks like `{creatorStatus === "approved" && (typedProjects.length === 0 ? ( ...empty-state-card... ) : ( ...active-project-view... ))}`).

Replace the entire `{creatorStatus === "approved" && (...)}` JSX block with:

```tsx
{creatorStatus === "approved" && (
  typedProjects.length === 0 ? (
    <CreatorOnboardingStepper singpassVerified={singpassVerified} />
  ) : onlyProjectIsDraft && activeProject ? (
    <div className="flex flex-col gap-8">
      <DraftContinuationCard
        project={{
          id: activeProject.id,
          title: activeProject.title,
          slug: activeProject.slug,
          updated_at: activeProject.updated_at,
        }}
      />
      {typedProjects.length > 1 && (
        <div>
          <h2 className="font-bold text-[var(--color-ink)] mb-4">All campaigns</h2>
          <div className="flex flex-col gap-3">
            {typedProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-ink)] truncate">{p.title}</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">Ends {formatDate(p.deadline)}</p>
                </div>
                <Badge variant={getProjectStatusVariant(p.status)}>{getProjectStatusLabel(p.status)}</Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/projects/${p.slug}/edit`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  <Link href={`/projects/${p.slug}`}><ArrowRight className="w-4 h-4 text-[var(--color-ink-subtle)]" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-8">
      {activeProject && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[var(--color-ink)]">{activeProject.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getProjectStatusVariant(activeProject.status)}>
                  {getProjectStatusLabel(activeProject.status)}
                </Badge>
                <span className="text-xs text-[var(--color-ink-subtle)]">Ends {formatDate(activeProject.deadline)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/projects/${activeProject.slug}/edit`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                <Pencil className="w-3 h-3" /> Edit
              </Link>
              <Link href={`/projects/${activeProject.slug}`} className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline flex items-center gap-1">
                View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <FundingProgressCard projectId={activeProject.id} goal={activeProject.funding_goal_sgd} deadline={activeProject.deadline} initialPledged={activeProject.amount_pledged_sgd} initialBackers={activeProject.backer_count} />
        </div>
      )}

      {activeProject && (
        <div>
          <h2 className="font-bold text-[var(--color-ink)] mb-4">Recent backers</h2>
          <BackerTable projectId={activeProject.id} initialPledges={recentPledges} />
        </div>
      )}

      {typedProjects.length > 1 && (
        <div>
          <h2 className="font-bold text-[var(--color-ink)] mb-4">All campaigns</h2>
          <div className="flex flex-col gap-3">
            {typedProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-ink)] truncate">{p.title}</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">Ends {formatDate(p.deadline)}</p>
                </div>
                <Badge variant={getProjectStatusVariant(p.status)}>{getProjectStatusLabel(p.status)}</Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/projects/${p.slug}/edit`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  <Link href={`/projects/${p.slug}`}><ArrowRight className="w-4 h-4 text-[var(--color-ink-subtle)]" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
)}
```

Notes:
- The `else` branch (active campaign view) is the existing layout, copied verbatim from the current code.
- `onlyProjectIsDraft` branch reuses the "All campaigns" list from the existing layout for the multi-draft case.
- `Heart` icon stays imported (used elsewhere in `BackerDashboard`); only `BookOpen` was removed in Step 1.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 6: Run all dashboard-related tests**

Run: `npx vitest run tests/components/dashboard/ lib/utils/__tests__/`
Expected: All tests passing (the 26 tests added in Tasks 1, 3, 4, 5).

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): wire onboarding stepper and draft continuation card"
```

---

## Task 7: Final verification

**Files:** none new. This task validates the integrated work.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all existing + new tests pass. If any pre-existing test fails for unrelated reasons (e.g., flake), document it but do not fix it in this PR.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exit code 0, or only pre-existing warnings unrelated to changed files.

- [ ] **Step 4: Manual smoke test (gating release)**

Open the dev server (`http://localhost:65207` or current port) and log in as a creator. Verify each of the six scenarios. **Each is a hard gate — do not skip.**

1. **Approved creator with zero projects** → stepper renders. All 4 steps visible. Step 1 shows green check. Step 2 shows "Coming soon" pill and is dimmed. Step 3 shows "Open guide →" link. Step 4 shows "Start a project →" CTA button.
2. Click step 4 CTA → navigates to `/projects/create`.
3. **Approved creator with one draft** → draft card renders. "📝 Pick up where you left off" header visible. "Last saved" shows a sensible relative time. "Continue editing" button visible.
4. Click "Continue editing" → navigates to `/projects/[slug]/edit`.
5. Click "Delete draft" → confirm dialog appears with copy "Delete this draft? This cannot be undone." Confirm → dashboard refreshes back to the stepper (because that was their only project).
6. **Approved creator with active campaign** → existing layout renders unchanged: FundingProgressCard + Recent backers + (if applicable) All campaigns list.
7. **Pre-approval states** (`pending_review`, `needs_info`, `rejected`) → existing cards render unchanged. Stepper does not appear.
8. Toggle dark mode on each scenario above. Contrast and readability look right; no broken color combinations.

If any check fails, fix it inline in this task (add follow-up steps as needed).

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin claude/dashboard-onboarding-stepper
gh pr create --base main --head claude/dashboard-onboarding-stepper --title "feat(dashboard): creator onboarding stepper + draft continuation card" --body "$(cat <<'EOF'
## Summary
- New 4-step onboarding stepper replaces the empty-state + Singpass card combo for approved creators with zero projects
- New draft-continuation card replaces the misleading $0/goal funding view when the creator's only project is a draft
- Wires Singpass into the orientation roadmap as a "Coming soon" step (forward-compatible — future PR just flips the prop)
- Dashboard query now filters out soft-deleted projects so deletes correctly return creators to the empty state

## Test plan
- [x] All new automated tests pass (\`npm test\`)
- [x] \`npx tsc --noEmit\` clean
- [x] Manual smoke test: zero-projects state, draft state, delete-draft flow, active-campaign state, pre-approval states, light + dark mode

Spec: \`docs/superpowers/specs/2026-04-25-creator-dashboard-onboarding-design.md\`
EOF
)"
```

---

## Self-review checklist (for the executor)

Before declaring this plan done:

- [ ] Every spec section has a corresponding task: stepper component (Task 3), draft card (Task 5), delete button (Task 4), `formatRelativeTime` helper (Task 1), soft-delete query filter (Task 2), dashboard wiring (Task 6), automated tests (Tasks 1/3/4/5), manual smoke test (Task 7)
- [ ] All component prop names match between definition and consumer (e.g., `singpassVerified` boolean in stepper; `project: { id, title, slug, updated_at }` in draft card; `projectId` string in delete button)
- [ ] No tasks reference helpers or types not defined in this plan or in the existing codebase
- [ ] Smoke test in Task 7 is gated and required before declaring done
