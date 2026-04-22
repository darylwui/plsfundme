type Props = {
  className?: string;
  size?: number;
};

export function FeaturedSticker({ className = "", size }: Props) {
  const pathId = "gtb-featured-sticker-path";
  const wrapperStyle = size !== undefined ? { width: size, height: size } : undefined;
  const emojiStyle = size !== undefined ? { fontSize: size * 0.3 } : undefined;
  const emojiSizeClass = size === undefined ? "text-[30cqw]" : "";

  return (
    <div
      aria-label="Featured — a project we love"
      role="img"
      className={`shrink-0 @container ${className}`}
      style={wrapperStyle}
    >
      <div className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <path
            id={pathId}
            d="M 50, 50 m -39, 0 a 39,39 0 1,1 78,0 a 39,39 0 1,1 -78,0"
            fill="none"
          />
        </defs>

        <circle cx="50" cy="50" r="49" fill="var(--color-brand-crust-dark)" />
        <circle cx="50" cy="50" r="46" fill="var(--color-brand-crumb)" />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="var(--color-surface)"
          stroke="var(--color-brand-crust-dark)"
          strokeWidth="1.5"
        />

        <text
          fill="var(--color-brand-crust-dark)"
          fontSize="8"
          fontWeight="900"
          letterSpacing="1.4"
          style={{ fontFamily: "var(--font-sans, ui-sans-serif)" }}
        >
          <textPath href={`#${pathId}`} startOffset="0">
            A PROJECT WE LOVE · A PROJECT WE LOVE ·
          </textPath>
        </text>
      </svg>

      <div
        className={`absolute inset-0 flex items-center justify-center select-none pointer-events-none leading-none ${emojiSizeClass}`}
        style={emojiStyle}
      >
        🍞
      </div>
      </div>
    </div>
  );
}
