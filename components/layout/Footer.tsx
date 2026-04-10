import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-black text-xl tracking-tight text-[var(--color-ink)] flex items-center gap-1.5"
            >
              <img src="/bread-icon.png" alt="" className="w-6 h-6 object-contain" />
              <span className="text-[var(--color-brand-violet)]">get</span>
              <span>that bread</span>
            </Link>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Singapore&apos;s platform for bold entrepreneurs.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-3">
              Discover
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/explore", label: "Explore projects" },
                { href: "/how-it-works", label: "How it works" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-3">
              Create
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/projects/create", label: "Start a project" },
                { href: "/dashboard", label: "Creator dashboard" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-3">
              Legal
            </h4>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/terms", label: "Terms of service" },
                { href: "/privacy", label: "Privacy policy" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--color-ink-subtle)]">
            © {new Date().getFullYear()} get that bread. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Payments secured by Stripe · Regulated under MAS Payment Services Act
          </p>
        </div>
      </div>
    </footer>
  );
}
