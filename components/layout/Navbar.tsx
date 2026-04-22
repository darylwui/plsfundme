"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  PlusCircle,
  Search,
  Sun,
  Moon,
  ChevronDown,
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
      children: { href: string; label: string; description: string }[];
    };

const NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/explore", label: "Explore" },
  {
    type: "group",
    label: "How it works",
    matchPaths: ["/how-it-works", "/for-creators"],
    children: [
      {
        href: "/how-it-works",
        label: "For backers",
        description: "Back Singapore's next big thing — zero-risk pledges.",
      },
      {
        href: "/for-creators",
        label: "For creators",
        description: "Launch a campaign and raise capital from your community.",
      },
    ],
  },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/explore?q=${encodeURIComponent(q)}`);
    else router.push("/explore");
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-surface-invert)]/95 backdrop-blur-md border-b border-[var(--color-border-invert)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="font-black text-xl tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1.5 shrink-0"
          >
            <Image src="/bread-icon.png" alt="" width={24} height={24} priority className="object-contain" />
            <span className="text-[var(--color-ink-invert)]">get that bread</span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-invert-subtle)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert-raised)] pl-9 pr-4 py-2 text-sm text-[var(--color-ink-invert)] placeholder:text-[var(--color-ink-invert-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-golden)]"
            />
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            {NAV_ITEMS.map((item) => {
              if (item.type === "link") {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors duration-[160ms]",
                      pathname === item.href
                        ? "text-[var(--color-brand-golden)]"
                        : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)]"
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
            {/* Currency toggle */}
            <div className="flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert-raised)]/80 overflow-hidden text-xs font-bold">
              {(["SGD", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={cn(
                    "px-2.5 py-1.5 transition-colors duration-[160ms]",
                    currency === cur
                      ? "bg-[var(--color-brand-golden)] text-[#4A2208]"
                      : "bg-transparent text-[var(--color-ink-invert)]/90 hover:bg-[var(--color-surface-invert)] hover:text-[var(--color-ink-invert)]"
                  )}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--color-ink-invert-muted)] hover:bg-[var(--color-surface-invert-raised)] transition-colors duration-[160ms]"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/projects/create">
                      <Button variant="inverse" size="sm">
                        <PlusCircle className="w-4 h-4" />
                        Start a project
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="primary" size="sm">Dashboard</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="sm">Get started</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-[var(--color-ink-invert-muted)] hover:bg-[var(--color-surface-invert-raised)] transition-colors duration-[160ms]"
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
        <div className="md:hidden border-t border-[var(--color-border-invert)] bg-[var(--color-surface-invert)] px-4 py-4 flex flex-col gap-3">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-invert-subtle)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert-raised)] pl-9 pr-4 py-2.5 text-sm text-[var(--color-ink-invert)] placeholder:text-[var(--color-ink-invert-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-golden)]"
            />
          </form>

          {NAV_ITEMS.map((item) => {
            if (item.type === "link") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] transition-colors duration-[160ms]"
                  onClick={() => setMenuOpen(false)}
                >
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

          {/* Theme + currency row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)] transition-colors duration-[160ms]"
            >
              {theme === "dark"
                ? <><Sun className="w-4 h-4" /> Light mode</>
                : <><Moon className="w-4 h-4" /> Dark mode</>}
            </button>

            <div className="flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert-raised)]/80 overflow-hidden text-xs font-bold">
              {(["SGD", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={cn(
                    "px-3 py-1.5 transition-colors duration-[160ms]",
                    currency === cur
                      ? "bg-[var(--color-brand-golden)] text-[#4A2208]"
                      : "bg-transparent text-[var(--color-ink-invert)]/90 hover:bg-[var(--color-surface-invert)] hover:text-[var(--color-ink-invert)]"
                  )}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-[var(--color-border-invert)]" />

          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/projects/create" onClick={() => setMenuOpen(false)}>
                    <Button variant="inverse" size="md" fullWidth>
                      <PlusCircle className="w-4 h-4" />
                      Start a project
                    </Button>
                  </Link>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" size="md" fullWidth>Log in</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>Get started</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ───────────────────────────────────────────────
// Desktop dropdown — hover-intent + click-to-open
// ───────────────────────────────────────────────
function NavDropdown({
  label,
  matchPaths,
  items,
  pathname,
}: {
  label: string;
  matchPaths: string[];
  items: { href: string; label: string; description: string }[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = matchPaths.some((p) => pathname === p);

  // Close on outside click (useful when opened via click on touch devices)
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
          "inline-flex items-center gap-1 text-sm font-medium transition-colors duration-[160ms]",
          isActive
            ? "text-[var(--color-brand-golden)]"
            : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)]"
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

      <div
        role="menu"
        className={cn(
          "absolute left-1/2 top-full -translate-x-1/2 mt-3 w-72 rounded-[var(--radius-card)] border border-[var(--color-border-invert)] bg-[var(--color-surface-invert)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] p-1.5 z-50 transition-all duration-200",
          open ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
        )}
      >
          {/* Invisible hover bridge so the cursor can travel from trigger to menu without closing */}
          <span
            aria-hidden
            className="absolute -top-3 left-0 right-0 h-3"
          />
          {items.map((item) => {
            const selected = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-[var(--radius-btn)] px-3 py-2.5 transition-colors duration-[160ms]",
                  selected
                    ? "bg-[var(--color-surface-invert-raised)]"
                    : "hover:bg-[var(--color-surface-invert-raised)]"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-semibold",
                    selected
                      ? "text-[var(--color-brand-golden)]"
                      : "text-[var(--color-ink-invert)]"
                  )}
                >
                  {item.label}
                </div>
                <div className="text-xs text-[var(--color-ink-invert-subtle)] mt-0.5 leading-snug">
                  {item.description}
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Mobile accordion group
// ───────────────────────────────────────────────
function MobileNavGroup({
  label,
  matchPaths,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  matchPaths: string[];
  items: { href: string; label: string; description: string }[];
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = matchPaths.some((p) => pathname === p);
  const [open, setOpen] = useState(isActive);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between text-sm font-medium transition-colors duration-[160ms] py-1",
          isActive
            ? "text-[var(--color-brand-golden)]"
            : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)]"
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
        <div className="mt-2 ml-2 pl-3 border-l border-[var(--color-border-invert)] flex flex-col gap-2">
          {items.map((item) => {
            const selected = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "text-sm font-medium py-1 transition-colors duration-[160ms]",
                  selected
                    ? "text-[var(--color-brand-golden)]"
                    : "text-[var(--color-ink-invert-muted)] hover:text-[var(--color-ink-invert)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
