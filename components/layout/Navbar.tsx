"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  PlusCircle,
  Sun,
  Moon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

type NavItem = { type: "link"; href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/explore", label: "Explore" },
  { type: "link", href: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const { theme, mounted: themeMounted, toggle: toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-surface-invert)]/95 backdrop-blur-md border-b border-[var(--color-border-invert)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="font-black text-[15px] tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 shrink-0"
          >
            <Image src="/bread-icon.png" alt="" width={22} height={22} priority className="object-contain" />
            <span className="text-[var(--color-ink-invert)]">get that bread</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors duration-[160ms]",
                    active
                      ? "text-[var(--color-brand-golden)] bg-white/5"
                      : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-btn)] text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5 transition-colors duration-[160ms]"
              aria-label="Toggle dark mode"
              suppressHydrationWarning
            >
              <span className="block w-4 h-4" suppressHydrationWarning>
                {themeMounted ? (
                  theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                ) : null}
              </span>
            </button>

            <div className="w-px h-4 bg-white/10" />

            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Button asChild variant="ghost" size="sm" className="text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5">
                        <Link href="/projects/create">
                          <PlusCircle className="w-3.5 h-3.5" />
                          New campaign
                        </Link>
                      </Button>
                      <Button asChild variant="inverse" size="sm">
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" size="sm" className="text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5">
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button asChild variant="primary" size="sm">
                        <Link href="/register">Get started</Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-[var(--radius-btn)] text-[var(--color-ink-invert-muted)] hover:bg-white/5 transition-colors duration-[160ms]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-invert)] bg-[var(--color-surface-invert)] px-4 py-5 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors duration-[160ms]",
                  active
                    ? "text-[var(--color-brand-golden)] bg-white/5"
                    : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5"
                )}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-3 pt-3 border-t border-[var(--color-border-invert)] flex flex-col gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Button asChild variant="inverse" size="md" fullWidth>
                      <Link href="/projects/create" onClick={() => setMenuOpen(false)}>
                        <PlusCircle className="w-4 h-4" />
                        New campaign
                      </Link>
                    </Button>
                    <Button asChild variant="primary" size="md" fullWidth>
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="md" fullWidth className="text-[var(--color-ink-invert-muted)]">
                      <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                    </Button>
                    <Button asChild variant="primary" size="md" fullWidth>
                      <Link href="/register" onClick={() => setMenuOpen(false)}>Get started</Link>
                    </Button>
                  </>
                )}
              </>
            )}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] transition-colors duration-[160ms]"
            >
              {theme === "dark"
                ? <><Sun className="w-4 h-4" /> Light mode</>
                : <><Moon className="w-4 h-4" /> Dark mode</>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
