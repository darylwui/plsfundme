import Link from "next/link";

const LINKS = {
  Discover: [
    { href: "/explore", label: "Explore projects" },
    { href: "/how-it-works", label: "How it works" },
  ],
  Create: [
    { href: "/projects/create", label: "Start a project" },
    { href: "/dashboard", label: "Creator dashboard" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of service" },
    { href: "/privacy", label: "Privacy policy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-invert)]">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link
              href="/"
              className="font-black text-xl tracking-tight flex items-center gap-2 text-[var(--color-ink-invert)] hover:opacity-80 transition-opacity duration-[160ms]"
            >
              <img src="/bread-icon.png" alt="" className="w-7 h-7 object-contain" />
              <span>get that bread</span>
            </Link>
            <p className="text-sm text-[var(--color-ink-invert-subtle)] leading-relaxed max-w-[220px]">
              Singapore&apos;s reward-based crowdfunding platform for bold entrepreneurs.
            </p>
            <p className="text-xs text-[var(--color-ink-invert-subtle)]">
              Payments secured by Stripe
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-ink-invert-subtle)] mb-4">
                {section}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] transition-colors duration-[160ms]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--color-border-invert)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ink-invert-subtle)]">
            © {new Date().getFullYear()} get that bread. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-ink-invert-subtle)]">
            Built for Singapore entrepreneurs 🇸🇬
          </p>
        </div>
      </div>
    </footer>
  );
}
