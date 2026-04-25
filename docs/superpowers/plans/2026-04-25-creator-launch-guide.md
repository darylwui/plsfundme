# Creator Launch Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/for-creators/launch-guide` — an interactive 18-item checklist that prepares creators before they open the campaign wizard — and wire it into the navbar, approval email, and dashboard empty state.

**Architecture:** A single `"use client"` Next.js page with localStorage-persisted checkbox state and an editable project title field. No DB changes. Four supporting edits (navbar, dashboard, email template, for-creators page) wire the guide into the creator journey.

**Tech Stack:** Next.js App Router, React (useState/useEffect), Tailwind CSS with design tokens (`var(--color-*)`), lucide-react icons, Next.js Link.

---

## File map

| File | Action | What changes |
|---|---|---|
| `app/(marketing)/for-creators/launch-guide/page.tsx` | **Replace** (draft exists) | Final polished implementation |
| `components/layout/Navbar.tsx` | Modify line 35 | `href` `/for-creators` → `/for-creators/launch-guide` |
| `app/dashboard/page.tsx` | Modify ~line 308 | Add nudge link + `BookOpen` import |
| `lib/email/templates.ts` | Modify ~line 226 | Add guide link paragraph before CTA anchor |
| `app/(marketing)/for-creators/page.tsx` | Modify ~line 184 | Add checklist link below "Start your campaign" Button |

---

### Task 1: Finalize the launch guide page

**Context:** A brainstorm draft exists at `app/(marketing)/for-creators/launch-guide/page.tsx`. It is functionally correct but was written quickly. This task replaces it with the final, production-ready implementation that exactly matches the spec.

**Files:**
- Replace: `app/(marketing)/for-creators/launch-guide/page.tsx`

- [ ] **Step 1: Replace the file with the final implementation**

Write the complete file — do not patch the draft, replace it entirely:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, BookOpen, ArrowRight } from "lucide-react";

const STORAGE_KEY = "gtb-launch-guide-v1";
const TITLE_KEY = "gtb-launch-guide-title-v1";
const DEFAULT_TITLE = "The world's best idea!";

type Item = { id: string; label: string; spec: string; editable?: boolean };
type Section = { id: string; title: string; intro: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "Campaign basics",
    intro: "These are the first fields in the campaign creation wizard.",
    items: [
      {
        id: "title",
        label: "Project title",
        spec: "5–100 characters. Clear and specific beats clever — backers skim fast.",
        editable: true,
      },
      {
        id: "short_desc",
        label: "Short description",
        spec: "20–200 characters. The hook that appears in search results and Explore cards.",
      },
      {
        id: "cover_image",
        label: "Cover image",
        spec: "1200×675 px, JPG or PNG, under 2 MB. Your campaign's first impression — make it count.",
      },
      {
        id: "full_desc",
        label: "Full description",
        spec: "Tell the story: what it is, why it matters, what backers receive. Minimum 50 characters.",
      },
      {
        id: "category",
        label: "Category",
        spec: "Pick the one that fits best — it determines where your campaign appears on Explore.",
      },
    ],
  },
  {
    id: "funding",
    title: "Funding goal & deadline",
    intro: "You can only reach your goal — you can't raise more than your target.",
    items: [
      {
        id: "goal",
        label: "Funding goal (SGD)",
        spec: "Minimum SGD 500, maximum SGD 10,000,000. Aim for what you genuinely need to deliver.",
      },
      {
        id: "deadline",
        label: "Campaign deadline",
        spec: "Must be a future date. Most campaigns run 30–60 days — shorter creates urgency.",
      },
    ],
  },
  {
    id: "rewards",
    title: "Reward tiers",
    intro: "You need at least one tier. Think carefully about what each tier costs you to fulfil.",
    items: [
      {
        id: "reward_title",
        label: "Tier title",
        spec: 'What backers call what they\'re getting. E.g. "Early bird", "Supporter", "Founding member".',
      },
      {
        id: "reward_pledge",
        label: "Minimum pledge amount",
        spec: "The lowest amount that unlocks this tier. Factor in delivery costs.",
      },
      {
        id: "reward_desc",
        label: "Tier description",
        spec: "What backers actually receive. Be specific — vague promises erode trust and increase disputes.",
      },
      {
        id: "reward_delivery",
        label: "Estimated delivery date",
        spec: "Optional but strongly recommended. Sets expectations on when backers receive their reward.",
      },
      {
        id: "reward_physical",
        label: "Physical item flag",
        spec: "Check this if you're shipping something physical. Backers see it before they pledge.",
      },
      {
        id: "reward_cap",
        label: "Max backers cap",
        spec: "Optional. Use for limited-edition runs or capacity-constrained experiences.",
      },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & payouts",
    intro:
      "Funds are released in three stages as you hit milestones — not all at once. Plan your deliverables before you launch.",
    items: [
      {
        id: "m1",
        label: "Milestone 1 — first deliverable (40% of funds)",
        spec: "Your first concrete proof of progress. Photos, prototypes, signed supplier agreements — anything verifiable.",
      },
      {
        id: "m2",
        label: "Milestone 2 — mid-project proof (40% of funds)",
        spec: "Show the project advancing. This is the largest release, so the proof needs to match.",
      },
      {
        id: "m3",
        label: "Milestone 3 — final delivery (20% of funds)",
        spec: "Completion proof: rewards shipped, build delivered, or service rendered. Closes out the campaign.",
      },
    ],
  },
  {
    id: "submit",
    title: "After you submit",
    intro: "Once you submit, the campaign goes into admin review before it goes live.",
    items: [
      {
        id: "review",
        label: "Admin review",
        spec: "We review within 2–3 business days. You'll get an email when approved or if changes are needed.",
      },
      {
        id: "live",
        label: "You're live",
        spec: "Once approved, your campaign page is public and backers can start pledging.",
      },
    ],
  },
];

const TOTAL_ITEMS = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);

export default function LaunchGuidePage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [projectTitle, setProjectTitle] = useState(DEFAULT_TITLE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored) as string[]));
      const storedTitle = localStorage.getItem(TITLE_KEY);
      if (storedTitle) setProjectTitle(storedTitle);
    } catch {
      // localStorage unavailable (e.g. private browsing with strict settings)
    }
    setMounted(true);
  }, []);

  function handleTitleChange(val: string) {
    setProjectTitle(val);
    try {
      localStorage.setItem(TITLE_KEY, val);
    } catch {}
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const doneCount = checked.size;
  const pct = TOTAL_ITEMS > 0 ? Math.round((doneCount / TOTAL_ITEMS) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 print:py-8">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 mb-4 print:hidden">
            <BookOpen className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
              Creator launch guide
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Everything you need before you hit launch
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] text-lg leading-relaxed">
            Run through this checklist before you open the campaign wizard. The more prepared
            you are, the faster your review goes — and the stronger your campaign looks to
            backers from day one.
          </p>
        </div>

        {/* Progress bar — hidden until mounted to avoid hydration flash */}
        {mounted && (
          <div className="mb-10 print:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {doneCount} of {TOTAL_ITEMS} items ready
              </span>
              <span className="text-sm text-[var(--color-ink-muted)]">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
              <div
                className="h-2 rounded-full bg-[var(--color-brand-golden)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {doneCount === TOTAL_ITEMS && (
              <p className="mt-3 text-sm font-semibold text-[var(--color-brand-crust)]">
                You&apos;re ready — head to the campaign wizard and launch. 🎉
              </p>
            )}
          </div>
        )}

        {/* Checklist sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <h2 className="text-xl font-black text-[var(--color-ink)] mb-1">
                {section.title}
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">{section.intro}</p>
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden print:border-[#ccc]">
                {section.items.map((item) => {
                  const done = mounted && checked.has(item.id);

                  if (item.editable) {
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                          done ? "opacity-60" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="mt-0.5 shrink-0 print:hidden"
                          aria-label={done ? "Uncheck project title" : "Check project title"}
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[var(--color-border)]" />
                          )}
                        </button>
                        <span className="hidden print:inline-block w-4 h-4 border border-[#999] rounded-sm shrink-0 mt-0.5" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-1">
                            {item.label}
                          </span>
                          <input
                            type="text"
                            value={mounted ? projectTitle : DEFAULT_TITLE}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            maxLength={100}
                            placeholder={DEFAULT_TITLE}
                            className={`w-full bg-transparent font-bold text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] border-b border-dashed border-[var(--color-border)] focus:border-[var(--color-brand-golden)] focus:outline-none py-0.5 transition-colors ${
                              done ? "line-through" : ""
                            }`}
                          />
                          <span className="block text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                            {item.spec}
                          </span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-raised)] print:pointer-events-none ${
                        done ? "opacity-60" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 print:hidden">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--color-border)]" />
                        )}
                      </span>
                      <span className="hidden print:inline-block w-4 h-4 border border-[#999] rounded-sm shrink-0 mt-0.5" />
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block font-semibold text-[var(--color-ink)] leading-snug ${
                            done ? "line-through" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="block text-sm text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                          {item.spec}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Print tip */}
        <p className="mt-8 text-xs text-center text-[var(--color-ink-subtle)] print:hidden">
          Want a copy to refer to offline? Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-border)] font-mono text-xs">
            ⌘P
          </kbd>{" "}
          and save as PDF.
        </p>

        {/* CTA */}
        <div className="mt-12 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] px-8 py-8 text-center print:hidden">
          <h3 className="text-xl font-black text-white mb-2">Ready to launch?</h3>
          <p className="text-sm text-white/75 mb-5">
            Open the campaign wizard — you&apos;ve got everything you need.
          </p>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand-golden)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Start your campaign <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center print:hidden">
          <Link
            href="/for-creators"
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            ← Back to For Creators
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify item count**

Run in the terminal:

```bash
grep -c '"id":' app/\(marketing\)/for-creators/launch-guide/page.tsx
```

Expected output: `18` (one `"id":` per checklist item in SECTIONS).

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors on the launch guide file. Pre-existing errors in other files are acceptable.

- [ ] **Step 4: Run lint**

```bash
npm run lint 2>&1 | grep -E "(launch-guide|error)" | head -20
```

Expected: no errors from `for-creators/launch-guide/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add app/\(marketing\)/for-creators/launch-guide/page.tsx
git commit -m "feat: creator launch guide page — interactive checklist with localStorage state"
```

---

### Task 2: Update navbar link

**Context:** The navbar currently links "Creator guide" to `/for-creators`. It should point to the new `/for-creators/launch-guide` page. `components/layout/Navbar.tsx` line 35 is the only change needed.

**Files:**
- Modify: `components/layout/Navbar.tsx:35`

- [ ] **Step 1: Make the change**

In `components/layout/Navbar.tsx`, find line 35:

```ts
{ type: "link", href: "/for-creators", label: "Creator guide" },
```

Change to:

```ts
{ type: "link", href: "/for-creators/launch-guide", label: "Creator guide" },
```

- [ ] **Step 2: Verify**

```bash
grep -n "Creator guide" components/layout/Navbar.tsx
```

Expected output:
```
35:  { type: "link", href: "/for-creators/launch-guide", label: "Creator guide" },
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: wire navbar Creator guide link to /for-creators/launch-guide"
```

---

### Task 3: Dashboard nudge card

**Context:** `app/dashboard/page.tsx` shows an empty state for approved creators with no campaigns (lines 298–309). After the existing "Start a project" Button link, add a secondary text link pointing to the launch guide.

`BookOpen` is not yet imported in dashboard — it needs to be added to the lucide-react import on line 2. `ArrowRight` is already imported.

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add BookOpen to the lucide-react import**

Line 2 currently reads:

```ts
import { PlusCircle, ArrowRight, Pencil, Heart, Clock, XCircle, MessageCircleQuestion } from "lucide-react";
```

Change to:

```ts
import { PlusCircle, ArrowRight, Pencil, Heart, Clock, XCircle, MessageCircleQuestion, BookOpen } from "lucide-react";
```

- [ ] **Step 2: Add the nudge link after the Button**

Find this block (lines 306–308):

```tsx
            <Link href="/projects/create">
              <Button size="lg"><PlusCircle className="w-4 h-4" /> Start a project</Button>
            </Link>
```

Add the nudge link immediately after the closing `</Link>`, still inside the `<div>` wrapper:

```tsx
            <Link href="/projects/create">
              <Button size="lg"><PlusCircle className="w-4 h-4" /> Start a project</Button>
            </Link>
            <Link
              href="/for-creators/launch-guide"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Not sure where to start? Run through the launch checklist first.
              <ArrowRight className="w-3 h-3" />
            </Link>
```

- [ ] **Step 3: Verify the import and addition**

```bash
grep -n "BookOpen\|launch-guide" app/dashboard/page.tsx
```

Expected: two matches — one in the import line, one in the Link href.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "dashboard" | head -10
```

Expected: no errors from dashboard/page.tsx.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add launch guide nudge link to approved-creator empty state"
```

---

### Task 4: For-creators page link

**Context:** `app/(marketing)/for-creators/page.tsx` has a final CTA section (lines 167–188) with a "Start your campaign" Button. Add a secondary "Get the launch checklist →" link below it so visitors who aren't ready to launch yet have a clear next step.

`ArrowRight` is already imported in this file (line 6).

**Files:**
- Modify: `app/(marketing)/for-creators/page.tsx`

- [ ] **Step 1: Add the link below the Button**

Find this block (lines 180–185):

```tsx
            <Link href="/projects/create">
              <Button size="lg" variant="primary">
                Start your campaign
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
```

Add the checklist link immediately after the closing `</Link>`:

```tsx
            <Link href="/projects/create">
              <Button size="lg" variant="primary">
                Start your campaign
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <div className="mt-4">
              <Link
                href="/for-creators/launch-guide"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)] hover:underline"
              >
                Get the launch checklist <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
```

- [ ] **Step 2: Verify**

```bash
grep -n "launch-guide\|launch checklist" app/\(marketing\)/for-creators/page.tsx
```

Expected: two matches — href and link text.

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/for-creators/page.tsx
git commit -m "feat: add launch checklist link to for-creators bottom CTA"
```

---

### Task 5: Approval email — add guide link

**Context:** `lib/email/templates.ts` function `sendCreatorApprovedEmail` (line 217) sends the approval email. Currently it jumps straight from the "you can now create" paragraph to the primary CTA button. Add a guide link paragraph between them.

**Files:**
- Modify: `lib/email/templates.ts:217–234`

- [ ] **Step 1: Update the HTML in sendCreatorApprovedEmail**

Find the current `html` template literal inside `sendCreatorApprovedEmail` (lines 222–232):

```ts
    html: `
      <h2>Welcome aboard, ${args.creatorName}! 🎉</h2>
      <p>Great news — your creator application has been reviewed and <strong>approved</strong>.</p>
      <p>You can now create and publish your first campaign on get that bread. Share your idea with backers and start raising funds today.</p>
      <a href="${appUrl}/projects/create" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Launch your first campaign
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
```

Replace with:

```ts
    html: `
      <h2>Welcome aboard, ${args.creatorName}! 🎉</h2>
      <p>Great news — your creator application has been reviewed and <strong>approved</strong>.</p>
      <p>You can now create and publish your first campaign on get that bread. Share your idea with backers and start raising funds today.</p>
      <p style="margin-top:16px;font-size:14px;color:#6b7280;">
        Not sure where to start?
        <a href="${appUrl}/for-creators/launch-guide" style="color:#7C3AED;">Run through our launch checklist</a>
        — it covers everything you need to prepare before you open the campaign wizard.
      </p>
      <a href="${appUrl}/projects/create" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Launch your first campaign
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
```

- [ ] **Step 2: Verify the guide link is present**

```bash
grep -n "launch-guide\|launch checklist" lib/email/templates.ts
```

Expected: two matches — the href and the link text in `sendCreatorApprovedEmail`.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "templates" | head -10
```

Expected: no errors from `lib/email/templates.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/email/templates.ts
git commit -m "feat: add launch guide link to creator approval email"
```

---

### Task 6: Final verification

**Context:** All five files are now changed. This task does a full lint + tsc pass and browser smoke to confirm the feature works end-to-end.

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: no new errors introduced by the five changed files. Pre-existing errors in unrelated files are acceptable.

- [ ] **Step 2: Full lint check**

```bash
npm run lint 2>&1 | tail -5
```

Expected: `✔ No ESLint warnings or errors` or only pre-existing warnings.

- [ ] **Step 3: Browser smoke — launch guide page**

Visit `http://localhost:<port>/for-creators/launch-guide`. Verify:
- All 5 sections are visible.
- Total item count reads "0 of 18 items ready".
- "Project title" row shows an editable input with placeholder "The world's best idea!".
- Clicking any non-editable row: golden checkmark appears, label gets strikethrough, progress bar increments.
- Clicking the editable row's circle: input gets `line-through`, opacity dims.
- Typing in the project title input updates the text live.
- Refreshing the page: checked state and typed title are restored (localStorage persisted).
- Checking all 18 items shows: "You're ready — head to the campaign wizard and launch. 🎉"

- [ ] **Step 4: Browser smoke — navbar**

Verify the "Creator guide" nav link in the navbar navigates to `/for-creators/launch-guide` (not `/for-creators`).

- [ ] **Step 5: Browser smoke — dashboard**

Log in as an approved creator with no campaigns. Verify the empty state shows both:
1. The existing "Start a project" Button.
2. The new "Not sure where to start? Run through the launch checklist first." link with BookOpen icon.

Clicking the link navigates to `/for-creators/launch-guide`.

- [ ] **Step 6: Browser smoke — for-creators page**

Visit `/for-creators`. Scroll to the bottom CTA section. Verify "Get the launch checklist →" link appears below "Start your campaign" and navigates to `/for-creators/launch-guide`.

- [ ] **Step 7: Final commit if any fixes were needed**

If any issues were found and fixed in steps 3–6, commit them:

```bash
git add -p
git commit -m "fix: creator launch guide smoke test corrections"
```

If no fixes needed, skip.
