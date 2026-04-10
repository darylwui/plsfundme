"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-black text-xl tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1.5"
          >
            <img src="/bread-icon.png" alt="" className="w-6 h-6 object-contain" />
            <span className="text-white">get that bread</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-[var(--color-brand-violet)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/projects/create">
                      <Button variant="secondary" size="sm">
                        <PlusCircle className="w-4 h-4" />
                        Start a project
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="primary" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="sm">
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-overlay)]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 flex flex-col gap-3">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <hr className="border-[var(--color-border)]" />
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/projects/create" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" size="md" fullWidth>
                      <PlusCircle className="w-4 h-4" />
                      Start a project
                    </Button>
                  </Link>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" size="md" fullWidth>
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>
                      Get started
                    </Button>
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
