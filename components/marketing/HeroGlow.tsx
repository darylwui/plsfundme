import { cn } from "@/lib/utils";

type HeroGlowTone = "golden" | "crust";
type HeroGlowOrigin = "top-left" | "top-right" | "center" | "bottom-left";

const TONE_RGB: Record<HeroGlowTone, string> = {
  golden: "245, 176, 62",
  crust: "224, 127, 20",
};

const ORIGIN_POSITION: Record<HeroGlowOrigin, string> = {
  "top-left": "18% 24%",
  "top-right": "82% 24%",
  center: "50% 35%",
  "bottom-left": "18% 76%",
};

/**
 * Soft radial-gradient ambient glow used as a background accent on hero
 * sections. Absolutely positioned, pointer-events disabled, sits behind
 * content (z-index 0). Wrap the hero in a `relative` container for proper
 * stacking.
 *
 * @example
 *   <section className="relative">
 *     <HeroGlow />
 *     <div className="relative z-10">...</div>
 *   </section>
 */
export function HeroGlow({
  tone = "golden",
  origin = "top-left",
  intensity = 0.22,
  size = "640px 380px",
  className,
}: {
  tone?: HeroGlowTone;
  origin?: HeroGlowOrigin;
  intensity?: number;
  size?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 z-0 pointer-events-none", className)}
      style={{
        background: `radial-gradient(${size} at ${ORIGIN_POSITION[origin]}, rgba(${TONE_RGB[tone]}, ${intensity}), transparent 60%)`,
      }}
    />
  );
}
