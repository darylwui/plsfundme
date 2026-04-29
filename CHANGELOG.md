# Changelog

All notable changes to get that bread are documented here.

## [Unreleased]

## 2026-04-30

### Fixed
- **Dark mode crumb tokens** — `--color-brand-crumb` and `--color-brand-crumb-light` had no dark mode override, rendering jarring cream patches on dark backgrounds (campaign-by pill, "What they are building" inset, how-it-works sections). Now render as a subtle amber tint.
- **Admin 500 on re-approve** — re-approving a previously rejected project crashed with a 500 after the DB update succeeded. `service.auth.admin.getUserById()` returns `{ data: { user }, error }` — direct nested destructuring threw a TypeError when `data` was null. Fixed with safe optional chaining across all three email blocks (approve, reject, remove).

### Changed
- **Navbar** — simplified to two flat links (Explore, How it works). Removed dropdown, search bar, and currency toggle. Height reduced from `h-16` to `h-14`.
- **Homepage h1** — `tracking-tight` → `tracking-[-0.035em]` to match how-it-works heading standardisation.
- **How it works — creator tab label** — "I'm launching one" → "I'm creating a project".

### Added
- **Creator guide two-tier structure** — how-it-works creator tab now has a "Find out more" CTA at the bottom linking to `/for-creators`.
- **`/for-creators` comparison table** — new "So why us?" section with platform comparison table before the final CTA.
- **`PlatformComparisonTable`** — shared component used by both `/for-creators` and the how-it-works flow switcher.
- **Launch guide refresh** — `/for-creators/launch-guide` hero label and final CTA updated to use `Eyebrow` component and `--color-ink-deep` dark ribbon, consistent with the rest of the design system.

---

## 2026-04-29

### Added
- **8/8 visual refresh series** — all marketing pages now use `HeroGlow` for heroes, `Eyebrow` for section labels, and `--color-ink-deep` for dark ribbon CTAs. No raw amber/gradient hardcodes remain. Pages: homepage, explore, campaign detail, how-it-works, for-creators, backer-protection.
- **`HeroGlow` component** — radial gradient ambient glow for hero sections.
- **`Eyebrow` component** — mono-font, uppercase, wide-tracked section labels replacing inline badge chips.

### Fixed
- **How-it-works pivot CTA alignment** — creator card heading wraps to two lines while backer heading stays one line. Fixed with `mt-auto pt-6` to pin buttons to card bottom.

### Changed
- **`/for-creators` nav link** — updated to point to `/for-creators/launch-guide`.
- **Dashboard nudge** — added "Not sure where to start? Run through the launch checklist first." link below `CreatorOnboardingStepper`.
