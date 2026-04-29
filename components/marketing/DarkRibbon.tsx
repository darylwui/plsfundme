import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

/**
 * Full-bleed dark CTA card for the end of marketing pages.
 *
 * Used by: CreatorGuidePage perks ribbon, HowItWorksPage final CTA,
 * TrustExplainer closer, PreLaunchLanding "free for the first one" block.
 *
 * @example
 *   <DarkRibbon
 *     eyebrow="Founding creator perks"
 *     heading="Free for the first one. Then it's just five percent."
 *     body="Our first fifteen creators pay zero platform fee on their first campaign."
 *     primaryAction={<Link href="/apply/creator"><Button variant="primary">Apply to launch</Button></Link>}
 *     side={<PerksList />}
 *   />
 */
export function DarkRibbon({
  eyebrow,
  heading,
  body,
  primaryAction,
  side,
  className,
}: {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  body?: React.ReactNode;
  primaryAction?: React.ReactNode;
  side?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24", className)}>
      <div className="rounded-[var(--radius-card)] bg-[var(--color-ink-deep)] text-[var(--color-ink-invert)] p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center">
        <div>
          {eyebrow && (
            <Eyebrow variant="golden" className="mb-3.5">
              {eyebrow}
            </Eyebrow>
          )}
          <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,44px)] m-0 text-white">
            {heading}
          </h2>
          {body && (
            <p className="mt-4 text-base md:text-[16px] leading-[1.55] text-white/70 max-w-xl">
              {body}
            </p>
          )}
          {primaryAction && <div className="mt-6">{primaryAction}</div>}
        </div>
        {side && <div className="text-sm text-white/85">{side}</div>}
      </div>
    </section>
  );
}
