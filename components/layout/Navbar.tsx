"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  PlusCircle,
  Sun,
  Moon,
  ChevronDown,
  BookOpen,
  Shield,
  Rocket,
  Compass,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

type NavItem =
  | { type: "link"; href: string; label: string }
  | {
      type: "group";
      label: string;
      matchPaths: string[];
      children: {
        href: string;
        label: string;
        description: string;
        Icon: React.ComponentType<{ className?: string }>;
      }[];
    };

const NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/explore", label: "Explore" },
  {
    type: "group",
    label: "Learn",
    matchPaths: ["/how-it-works", "/backer-protection", "/for-creators", "/for-creators/launch-guide"],
    children: [
      {
        href: "/how-it-works",
        label: "How it works",
        description: "Pledging, escrow, milestones — the full picture.",
        Icon: BookOpen,
      },
      {
        href: "/backer-protection",
        label: "Backer protection",
        description: "How your money is safeguarded at every stage.",
        Icon: Shield,
      },
      {
        href: "/for-creators",
        label: "For creators",
        description: "Launch a campaign and raise from your community.",
        Icon: Rocket,
      },
      {
        href: "/for-creators/launch-guide",
        label: "Launch checklist",
        description: "A step-by-step guide to a successful campaign.",
        Icon: ClipboardList,
      },
    ],
  },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const { currency, setCurrency } = useCurrency();
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
              if (item.type === "link") {
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
              }
              return (
                <NavDropdown
                  key={item.label}
                  label={item.label}
                  matchPaths={item.matchPaths}
                  items={item.children}
                  pathname={pathname}
                />
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
            if (item.type === "link") {
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
                  <Compass className="w-4 h-4 mr-3 shrink-0" />
                  {item.label}
                </Link>
              );
            }
            return (
              <MobileNavGroup
                key={item.label}
                label={item.label}
                matchPaths={item.matchPaths}
                items={item.children}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
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

// ─────────────────────────────────────────────────────
// Desktop dropdown — hover-intent, keyboard accessible
// ─────────────────────────────────────────────────────
function NavDropdown({
  label,
  matchPaths,
  items,
  pathname,
}: {
  label: string;
  matchPaths: string[];
  items: {
    href: string;
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = matchPaths.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors duration-[160ms]",
          isActive || open
            ? "text-[var(--color-brand-golden)] bg-white/5"
            : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-[160ms]",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        role="menu"
        className={cn(
          "absolute left-0 top-full mt-2 w-72 rounded-[var(--radius-card)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)] p-1.5 z-50 transition-all duration-[180ms]",
          open ? "opacity-100 visible translate-y-0 pointer-events-auto" : "opacity-0 invisible -translate-y-1 pointer-events-none"
        )}
      >
        {/* Invisible hover bridge */}
        <span aria-hidden className="absolute -top-2 left-0 right-0 h-2" />
        {items.map((item) => {
          const selected = pathname === item.href;
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-start gap-3 rounded-[var(--radius-btn)] px-3 py-2.5 transition-colors duration-[160ms] group",
                selected
                  ? "bg-white/8"
                  : "hover:bg-white/5"
              )}
            >
              <div className={cn(
                "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-[160ms]",
                selected
                  ? "bg-[var(--color-brand-golden)]/20 text-[var(--color-brand-golden)]"
                  : "bg-white/8 text-[var(--color-ink-invert-muted)] group-hover:bg-[var(--color-brand-golden)]/15 group-hover:text-[var(--color-brand-golden)]"
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={cn(
                  "text-sm font-semibold leading-snug",
                  selected
                    ? "text-[var(--color-brand-golden)]"
                    : "text-[var(--color-ink-invert)] group-hover:text-[var(--color-ink-invert)]"
                )}>
                  {item.label}
                </div>
                <div className="text-xs text-[var(--color-ink-invert-subtle)] mt-0.5 leading-snug">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile accordion group
// ─────────────────────────────────────────────
function MobileNavGroup({
  label,
  matchPaths,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  matchPaths: string[];
  items: {
    href: string;
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[];
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = matchPaths.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-btn)] text-sm font-medium transition-colors duration-[160ms]",
          isActive
            ? "text-[var(--color-brand-golden)] bg-white/5"
            : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5"
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-[160ms]",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 pl-3">
          {items.map((item) => {
            const selected = pathname === item.href;
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] text-sm transition-colors duration-[160ms]",
                  selected
                    ? "text-[var(--color-brand-golden)] bg-white/5 font-medium"
                    : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] hover:bg-white/5 font-medium"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
