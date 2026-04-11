import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#2C1A0E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-black text-xl tracking-tight flex items-center gap-1.5 text-white"
            >
              <img src="/bread-icon.png" alt="" className="w-6 h-6 object-contain" />
              <span>get that bread</span>
            </Link>
            <p className="mt-2 text-sm text-[#8B6545]">
              Singapore&apos;s platform for bold entrepreneurs.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8B6545] mb-3">
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
                    className="text-sm text-[#8B6545] hover:text-[#F5EDD8] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8B6545] mb-3">
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
                    className="text-sm text-[#8B6545] hover:text-[#F5EDD8] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8B6545] mb-3">
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
                    className="text-sm text-[#8B6545] hover:text-[#F5EDD8] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#4A2E1A] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#8B6545]">
            © {new Date().getFullYear()} get that bread. All rights reserved.
          </p>
          <p className="text-xs text-[#8B6545]">
            Payments secured by Stripe · Built for Singapore entrepreneurs
          </p>
        </div>
      </div>
    </footer>
  );
}
