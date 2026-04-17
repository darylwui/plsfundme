# Project Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public fundraising project page into a Kickstarter-style anchored long-form experience, while fixing broken campaign rendering, cramped updates layout, and the authoring mismatch between raw text input and public HTML rendering.

**Architecture:** Keep `app/projects/[slug]/page.tsx` as the server-side data loader, but replace the current panel-swapping `ProjectPageTabs` behavior with a section-based client shell that renders all sections in one scroll flow. Introduce a constrained campaign editor component reused by create/edit surfaces, and extract campaign parsing/rendering logic so heading extraction, FAQ inference, and prose styling are handled in one place.

**Tech Stack:** Next.js 16 App Router, React 19 client/server components, TypeScript, Tailwind v4, existing Supabase-backed data model, plus a lightweight component test stack (`vitest` + `@testing-library/react`) for the new section behavior.

---

## File Structure

### Existing files to modify

- `app/projects/[slug]/page.tsx`
  - Keep data fetching and route metadata responsibilities.
  - Restructure the page composition around anchored sections instead of a tab panel.
- `components/projects/ProjectPageTabs.tsx`
  - Replace the current active-tab swapper with a long-form section shell, or split its responsibilities into new focused components and reduce this file to a thin orchestrator.
- `components/projects/ProjectUpdatesFeed.tsx`
  - Widen and restyle update presentation so it no longer feels cramped.
- `components/creation/Step1_BasicInfo.tsx`
  - Replace the `full_description` textarea with the new constrained campaign editor.
- `components/project/EditProjectForm.tsx`
  - Replace the `full_description` textarea with the same constrained campaign editor.
- `components/creation/Step4_Review.tsx`
  - Update preview styling so the authoring preview matches the public campaign body more closely.
- `lib/validations/project.ts`
  - Keep validation compatible with HTML-backed `full_description`.
- `app/globals.css`
  - Add project-page prose, sticky-nav, and campaign image treatment classes if the design is easier to express globally than inline utility strings.

### New files to create

- `components/projects/ProjectSectionNav.tsx`
  - Sticky section navigation with active-section highlighting and smooth-scroll/hash behavior.
- `components/projects/ProjectCampaignContent.tsx`
  - Campaign HTML rendering, heading extraction, subsection chips, and FAQ derivation.
- `components/projects/project-page-content.ts`
  - Shared types/helpers for section ids, labels, heading parsing, and FAQ inference.
- `components/projects/CampaignRichTextEditor.tsx`
  - Constrained rich-text authoring component used in create/edit flows.
- `components/projects/__tests__/project-page-content.test.ts`
  - Unit tests for heading extraction, slug stability, and FAQ inference.
- `components/projects/__tests__/ProjectSectionNav.test.tsx`
  - UI tests for section nav highlighting and interaction wiring.
- `components/projects/__tests__/CampaignRichTextEditor.test.tsx`
  - UI test coverage for the new campaign authoring surface.
- `vitest.config.ts`
  - Vitest configuration if the repo does not already provide one.
- `vitest.setup.ts`
  - Testing Library setup for jsdom component tests.

### Optional file removal or deprecation

- `components/projects/ProjectPageTabs.tsx`
  - If the logic is fully absorbed by more focused components, either rename it to reflect its new purpose or keep it as a thin composition layer to avoid a broad import churn.

## Task 1: Add a Minimal Component Test Harness

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`
- Test: `components/projects/__tests__/project-page-content.test.ts`

- [ ] **Step 1: Add the testing dependencies to `package.json`**

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: install completes and `package-lock.json` updates without removing existing dependencies.

- [ ] **Step 5: Add a sentinel test file to prove the harness works**

```ts
import { describe, expect, it } from "vitest";

describe("project page test harness", () => {
  it("runs vitest in jsdom", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 6: Run the test command**

Run: `npm test`
Expected: PASS with `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts components/projects/__tests__/project-page-content.test.ts
git commit -m "test: add project page component test harness"
```

## Task 2: Extract Campaign Parsing and FAQ Logic

**Files:**
- Create: `components/projects/project-page-content.ts`
- Create: `components/projects/__tests__/project-page-content.test.ts`
- Modify: `components/projects/ProjectPageTabs.tsx`

- [ ] **Step 1: Write the failing parsing tests**

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignContentModel } from "@/components/projects/project-page-content";

describe("buildCampaignContentModel", () => {
  it("adds stable ids to h2 and h3 headings", () => {
    const model = buildCampaignContentModel(`
      <h2>Why this matters</h2>
      <p>Hello</p>
      <h3>How it works</h3>
    `);

    expect(model.headings).toEqual([
      { id: "section-why-this-matters-0", text: "Why this matters", level: 2 },
      { id: "section-how-it-works-1", text: "How it works", level: 3 },
    ]);
    expect(model.html).toContain('id="section-why-this-matters-0"');
    expect(model.html).toContain('id="section-how-it-works-1"');
  });

  it("derives FAQ items from question headings only", () => {
    const model = buildCampaignContentModel(`
      <h2>What do backers receive?</h2>
      <h2>Timeline</h2>
    `);

    expect(model.faqItems).toEqual([
      { id: "section-what-do-backers-receive-0", text: "What do backers receive?", level: 2 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/projects/__tests__/project-page-content.test.ts`
Expected: FAIL with module-not-found or missing export errors for `buildCampaignContentModel`.

- [ ] **Step 3: Implement `components/projects/project-page-content.ts`**

```ts
export type CampaignHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type CampaignContentModel = {
  html: string;
  headings: CampaignHeading[];
  faqItems: CampaignHeading[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, "")
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .slice(0, 60);
}

export function buildCampaignContentModel(descriptionHtml: string): CampaignContentModel {
  const headings: CampaignHeading[] = [];
  let idx = 0;

  const html = descriptionHtml.replace(/<h([23])([^>]*)>([\\s\\S]*?)<\\/h\\1>/gi, (_m, level, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text) return _m;
    const id = `section-${slugify(text)}-${idx++}`;
    headings.push({ id, text, level: level === "2" ? 2 : 3 });
    const cleanAttrs = String(attrs || "").replace(/\\sid="[^"]*"/gi, "");
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  return {
    html,
    headings,
    faqItems: headings.filter((heading) => {
      const lower = heading.text.toLowerCase();
      return heading.text.includes("?") || lower.startsWith("faq") || lower.includes("question");
    }),
  };
}
```

- [ ] **Step 4: Update `ProjectPageTabs.tsx` to consume the helper**

```ts
import { buildCampaignContentModel } from "@/components/projects/project-page-content";

const campaignContent = useMemo(
  () => buildCampaignContentModel(descriptionHtml),
  [descriptionHtml]
);
```

- [ ] **Step 5: Run the targeted test again**

Run: `npm test -- components/projects/__tests__/project-page-content.test.ts`
Expected: PASS with both parsing cases green.

- [ ] **Step 6: Commit**

```bash
git add components/projects/project-page-content.ts components/projects/__tests__/project-page-content.test.ts components/projects/ProjectPageTabs.tsx
git commit -m "refactor: extract campaign content parsing model"
```

## Task 3: Replace Panel-Swapping Tabs with an Anchored Section Nav

**Files:**
- Create: `components/projects/ProjectSectionNav.tsx`
- Create: `components/projects/__tests__/ProjectSectionNav.test.tsx`
- Modify: `components/projects/ProjectPageTabs.tsx`
- Modify: `app/projects/[slug]/page.tsx`

- [ ] **Step 1: Write the failing nav interaction test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectSectionNav } from "@/components/projects/ProjectSectionNav";

it("renders all sections and marks the active section", async () => {
  render(
    <ProjectSectionNav
      sections={[
        { id: "campaign", label: "Campaign" },
        { id: "updates", label: "Updates (2)" },
      ]}
      activeSection="updates"
      onNavigate={() => {}}
    />
  );

  expect(screen.getByRole("button", { name: "Updates (2)" })).toHaveAttribute("aria-current", "true");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/projects/__tests__/ProjectSectionNav.test.tsx`
Expected: FAIL with missing component export.

- [ ] **Step 3: Create `ProjectSectionNav.tsx`**

```tsx
"use client";

type ProjectSection = {
  id: string;
  label: string;
};

interface ProjectSectionNavProps {
  sections: ProjectSection[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export function ProjectSectionNav({
  sections,
  activeSection,
  onNavigate,
}: ProjectSectionNavProps) {
  return (
    <nav
      aria-label="Project sections"
      className="sticky top-16 z-20 border-y border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur"
    >
      <div className="flex items-center gap-2 overflow-x-auto px-1 py-3 sm:px-2">
        {sections.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => onNavigate(section.id)}
              className={isActive
                ? "rounded-full border border-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-brand-violet)] whitespace-nowrap"
                : "rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)] whitespace-nowrap hover:text-[var(--color-ink)]"
              }
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Reshape `ProjectPageTabs.tsx` into a long-form section renderer**

```tsx
const sections = [
  { id: "campaign", label: "Campaign" },
  { id: "rewards", label: `Rewards (${activeRewards.length})` },
  { id: "faq", label: "FAQ" },
  { id: "updates", label: `Updates (${updates.length})` },
  { id: "comments", label: `Comments (${feedback.length})` },
];

const [activeSection, setActiveSection] = useState("campaign");

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
  setActiveSection(id);
}
```

- [ ] **Step 5: Replace conditional panel rendering with anchored sections**

```tsx
<ProjectSectionNav
  sections={sections}
  activeSection={activeSection}
  onNavigate={scrollToSection}
/>

<div className="flex flex-col gap-10 py-6">
  <section id="campaign" className="scroll-mt-28">
    {/* campaign section */}
  </section>
  <section id="rewards" className="scroll-mt-28">
    {/* rewards section */}
  </section>
  <section id="faq" className="scroll-mt-28">
    {/* faq section */}
  </section>
  <section id="updates" className="scroll-mt-28">
    {/* updates section */}
  </section>
  <section id="comments" className="scroll-mt-28">
    {/* comments section */}
  </section>
</div>
```

- [ ] **Step 6: Hook up scroll tracking in the client shell**

```tsx
useEffect(() => {
  const elements = sections
    .map((section) => document.getElementById(section.id))
    .filter(Boolean) as HTMLElement[];

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveSection(visible.target.id);
      }
    },
    { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
  );

  elements.forEach((element) => observer.observe(element));
  return () => observer.disconnect();
}, [sections]);
```

- [ ] **Step 7: Run the new nav test and lint**

Run: `npm test -- components/projects/__tests__/ProjectSectionNav.test.tsx`
Expected: PASS.

Run: `npm run lint -- components/projects/ProjectSectionNav.tsx components/projects/ProjectPageTabs.tsx app/projects/[slug]/page.tsx`
Expected: no ESLint errors from the new nav shell.

- [ ] **Step 8: Commit**

```bash
git add components/projects/ProjectSectionNav.tsx components/projects/__tests__/ProjectSectionNav.test.tsx components/projects/ProjectPageTabs.tsx app/projects/[slug]/page.tsx
git commit -m "feat: convert project page tabs into anchored section nav"
```

## Task 4: Rebuild Campaign Rendering with Stronger Hierarchy

**Files:**
- Create: `components/projects/ProjectCampaignContent.tsx`
- Modify: `components/projects/ProjectPageTabs.tsx`
- Modify: `app/globals.css`
- Test: `components/projects/__tests__/project-page-content.test.ts`

- [ ] **Step 1: Extend the parser test to cover subsection chips**

```ts
it("preserves subsection ordering for navigation chips", () => {
  const model = buildCampaignContentModel(`
    <h2>Problem</h2>
    <h3>Why now</h3>
    <h2>Solution</h2>
  `);

  expect(model.headings.map((heading) => heading.text)).toEqual([
    "Problem",
    "Why now",
    "Solution",
  ]);
});
```

- [ ] **Step 2: Create `ProjectCampaignContent.tsx`**

```tsx
import type { CampaignContentModel } from "@/components/projects/project-page-content";

interface ProjectCampaignContentProps {
  content: CampaignContentModel;
}

export function ProjectCampaignContent({ content }: ProjectCampaignContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Campaign
          </p>
          <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
            The story behind this project
          </h2>
        </div>
      </div>

      {content.headings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              {heading.text}
            </a>
          ))}
        </div>
      )}

      <div
        className="project-campaign-prose max-w-none text-[var(--color-ink)]"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Add global prose treatment for campaign content**

```css
.project-campaign-prose {
  display: grid;
  gap: 1.25rem;
}

.project-campaign-prose h2 {
  margin-top: 2.5rem;
  font-size: clamp(1.6rem, 1.3rem + 1vw, 2.1rem);
  line-height: 1.05;
  font-weight: 900;
  color: var(--color-ink);
  scroll-margin-top: 7rem;
}

.project-campaign-prose h3 {
  margin-top: 1.75rem;
  font-size: 1.2rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--color-ink);
  scroll-margin-top: 7rem;
}

.project-campaign-prose p,
.project-campaign-prose li,
.project-campaign-prose blockquote {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-ink-muted);
}

.project-campaign-prose img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
}
```

- [ ] **Step 4: Swap the inline campaign `dangerouslySetInnerHTML` block for the new renderer**

```tsx
<section id="campaign" className="scroll-mt-28">
  <ProjectCampaignContent content={campaignContent} />
</section>
```

- [ ] **Step 5: Run tests and lint**

Run: `npm test -- components/projects/__tests__/project-page-content.test.ts`
Expected: PASS with updated heading behavior.

Run: `npm run lint -- components/projects/ProjectCampaignContent.tsx components/projects/ProjectPageTabs.tsx app/globals.css`
Expected: no lint errors in TypeScript files.

- [ ] **Step 6: Commit**

```bash
git add components/projects/ProjectCampaignContent.tsx components/projects/project-page-content.ts components/projects/ProjectPageTabs.tsx app/globals.css
git commit -m "feat: add editorial campaign content renderer"
```

## Task 5: Restyle Rewards, FAQ, Updates, and Comments as Full Sections

**Files:**
- Modify: `components/projects/ProjectPageTabs.tsx`
- Modify: `components/projects/ProjectUpdatesFeed.tsx`
- Modify: `components/project/PostUpdateForm.tsx`

- [ ] **Step 1: Add section headings and spacing to the non-campaign sections**

```tsx
<section id="updates" className="scroll-mt-28 border-t border-[var(--color-border)] pt-8">
  <div className="mb-5">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
      Updates
    </p>
    <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
      Campaign updates
    </h2>
  </div>
  {/* update composer + feed */}
</section>
```

- [ ] **Step 2: Widen and soften the updates feed cards**

```tsx
<div className="flex flex-col gap-6">
  {visible.map((update) => (
    <article
      key={update.id}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-[var(--color-ink)]">
            {update.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-subtle)]">
            {formatDate(update.created_at)}
          </p>
        </div>
      </div>
      <div className="whitespace-pre-line text-[15px] leading-7 text-[var(--color-ink-muted)]">
        {update.body}
      </div>
    </article>
  ))}
</div>
```

- [ ] **Step 3: Keep FAQ items as links back into the campaign body**

```tsx
{campaignContent.faqItems.map((item) => (
  <a
    key={item.id}
    href={`#${item.id}`}
    onClick={() => scrollToSection("campaign")}
    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-ink)]"
  >
    {item.text}
  </a>
))}
```

- [ ] **Step 4: Ensure comments input is visible without panel switching**

```tsx
<section id="comments" className="scroll-mt-28 border-t border-[var(--color-border)] pt-8">
  <div className="mb-5">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
      Community
    </p>
    <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
      Questions & feedback
    </h2>
  </div>
  {/* existing feedback form + thread list */}
</section>
```

- [ ] **Step 5: Run lint and do a manual browser verification**

Run: `npm run lint -- components/projects/ProjectPageTabs.tsx components/projects/ProjectUpdatesFeed.tsx components/project/PostUpdateForm.tsx`
Expected: no ESLint errors.

Run: `npm run dev`
Expected: local server starts.

Manual verification:
- Open `/projects/test-bread-1-lu0kj`
- Scroll through all sections
- Confirm updates no longer feel boxed-in
- Confirm rewards CTA still navigates to checkout
- Confirm FAQ items jump back to campaign content

- [ ] **Step 6: Commit**

```bash
git add components/projects/ProjectPageTabs.tsx components/projects/ProjectUpdatesFeed.tsx components/project/PostUpdateForm.tsx
git commit -m "feat: restyle project page sections for long-form reading"
```

## Task 6: Introduce a Constrained Campaign Editor for Create/Edit Flows

**Files:**
- Create: `components/projects/CampaignRichTextEditor.tsx`
- Modify: `components/creation/Step1_BasicInfo.tsx`
- Modify: `components/project/EditProjectForm.tsx`
- Modify: `components/creation/Step4_Review.tsx`
- Modify: `lib/validations/project.ts`

- [ ] **Step 1: Write the failing editor rendering test**

```tsx
import { render, screen } from "@testing-library/react";
import { CampaignRichTextEditor } from "@/components/projects/CampaignRichTextEditor";

it("shows the existing html-backed campaign content", () => {
  render(
    <CampaignRichTextEditor
      label="Campaign story"
      value="<h2>Problem</h2><p>Hello</p>"
      onChange={() => {}}
    />
  );

  expect(screen.getByText("Campaign story")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/projects/__tests__/CampaignRichTextEditor.test.tsx`
Expected: FAIL because `CampaignRichTextEditor` does not exist yet.

- [ ] **Step 3: Create the constrained editor component**

```tsx
"use client";

interface CampaignRichTextEditorProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function CampaignRichTextEditor({
  label,
  value,
  error,
  onChange,
}: CampaignRichTextEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--color-ink)]">{label}</label>
      <textarea
        rows={12}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="<h2>Why this matters</h2><p>Tell the story...</p>"
        className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-ink)]"
      />
      <p className="text-xs text-[var(--color-ink-subtle)]">
        First pass: support paragraphs, H2/H3, lists, quotes, links, and images.
      </p>
      {error ? <p className="text-xs text-[var(--color-brand-coral)]">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 4: Replace both `full_description` textareas with `CampaignRichTextEditor`**

```tsx
<CampaignRichTextEditor
  label="Campaign story"
  value={draft.full_description}
  error={errors.full_description}
  onChange={(value) => onUpdate({ full_description: value })}
/>
```

```tsx
<CampaignRichTextEditor
  label="Campaign story"
  value={fullDesc}
  error={errors.full_description}
  onChange={setFullDesc}
/>
```

- [ ] **Step 5: Update validation and preview copy**

```ts
export const projectBasicInfoSchema = z.object({
  title: z.string().min(1).max(60),
  category_id: z.string().min(1),
  short_description: z.string().min(1).max(200),
  full_description: z.string().min(50, "Campaign story must be at least 50 characters"),
  cover_image_url: z.string().nullable(),
  video_url: z.string().nullable(),
});
```

```tsx
<p className="mt-1 text-sm text-[var(--color-ink-muted)]">
  Build the public campaign story with headings, lists, quotes, links, and images.
</p>
```

- [ ] **Step 6: Run tests, lint, and a manual authoring verification**

Run: `npm test`
Expected: all component tests pass.

Run: `npm run lint`
Expected: ESLint passes repo-wide or, if the repo has pre-existing failures, only unrelated existing failures remain.

Manual verification:
- Create or edit a project
- Paste HTML with `h2`, `h3`, lists, and an image
- Save the project
- Open the public project page
- Confirm headings, chips, FAQ inference, and images render correctly

- [ ] **Step 7: Commit**

```bash
git add components/projects/CampaignRichTextEditor.tsx components/creation/Step1_BasicInfo.tsx components/project/EditProjectForm.tsx components/creation/Step4_Review.tsx lib/validations/project.ts
git commit -m "feat: add constrained campaign story editor"
```

## Task 7: Final Verification and Cleanup

**Files:**
- Modify: `docs/superpowers/specs/2026-04-16-project-page-redesign-design.md` only if implementation changed scope
- Modify: `docs/superpowers/plans/2026-04-16-project-page-redesign.md` only to check off completed tasks during execution

- [ ] **Step 1: Run the full verification set**

Run: `npm test`
Expected: all project page component tests pass.

Run: `npm run lint`
Expected: lint passes for changed files or only pre-existing unrelated failures remain.

Run: `npm run build`
Expected: Next.js build succeeds and the project page route compiles cleanly.

- [ ] **Step 2: Manual regression pass on the project page**

Manual checklist:
- Visit `/projects/test-bread-1-lu0kj`
- Confirm `Campaign`, `Rewards`, `FAQ`, `Updates`, and `Comments` appear in one long page
- Confirm sticky section nav tracks the scroll position
- Confirm desktop sticky funding widget still functions
- Confirm mobile layout keeps CTA access
- Confirm updates and comments retain working behavior

- [ ] **Step 3: Update docs if scope changed during implementation**

```md
- If inline image upload support slipped to a follow-up, note it in the spec and final handoff.
- If the editor shipped as HTML-first rather than toolbar-first, note that explicitly.
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: verify project page redesign"
```

## Self-Review

### Spec coverage

- Sticky section navigation: covered in Task 3.
- Stronger campaign hierarchy: covered in Tasks 2 and 4.
- Wider, less cramped updates/comments flow: covered in Task 5.
- Rich-text authoring path for `full_description`: covered in Task 6.
- Verification across desktop/mobile and page functionality: covered in Task 7.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task includes file paths, commands, and representative code.

### Type consistency

- Shared campaign parsing types are defined in `components/projects/project-page-content.ts`.
- The section-nav API consistently uses `id`, `label`, `activeSection`, and `onNavigate`.
- The campaign editor API consistently uses `label`, `value`, `error`, and `onChange`.
