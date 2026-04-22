"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Tag, Rocket, Users, UserCheck } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/projects", label: "Projects", icon: Rocket },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/creators", label: "Creators", icon: UserCheck },
  { href: "/admin/categories", label: "Categories", icon: Tag },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row md:flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        // Exact match for /admin, prefix match for sub-pages
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm border border-[var(--color-border)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--color-brand-crust)]" : ""}`}
            />
            <span className="hidden sm:block">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
