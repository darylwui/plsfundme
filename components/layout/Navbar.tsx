"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, PlusCircle, Search, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/components/ThemeProvider";

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

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#2C1A0E]/95 backdrop-blur-md border-b border-[#4A2E1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-black text-xl tracking-tight hover:opacity-80 transition-opacity flex items-center gap-1.5 shrink-0"
          >
            <img src="/bread-icon.png" alt="" className="w-6 h-6 object-contain" />
            <span className="text-white">get that bread</span>
          </Link>

          {/* Desktop search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-sm relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-[var(--radius-btn)] border border-[#4A2E1A] bg-[#3D2010] pl-9 pr-4 py-2 text-sm text-[#F5EDD8] placeholder:text-[#8B6545] focus:outline-none focus:ring-2 focus:ring-[#F2C480]"
            />
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-[#F2C480]"
                    : "text-[#C4956A] hover:text-[#F5EDD8]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Currency toggle */}
            <div className="flex items-center rounded-[var(--radius-btn)] border border-[#4A2E1A] overflow-hidden text-xs font-bold">
              <button
                onClick={() => setCurrency("SGD")}
                className={`px-2.5 py-1.5 transition-colors ${
                  currency === "SGD"
                    ? "bg-[#F2C480] text-[#1C1208]"
                    : "text-[#C4956A] hover:text-[#F5EDD8]"
                }`}
              >
                SGD
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1.5 transition-colors ${
                  currency === "USD"
                    ? "bg-[#F2C480] text-[#1C1208]"
                    : "text-[#C4956A] hover:text-[#F5EDD8]"
                }`}
              >
                USD
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[#C4956A] hover:bg-[#3D2010] transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />}
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
            className="md:hidden p-2 rounded-lg text-[#C4956A] hover:bg-[#3D2010]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#4A2E1A] bg-[#2C1A0E] px-4 py-4 flex flex-col gap-3">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-[var(--radius-btn)] border border-[#4A2E1A] bg-[#3D2010] pl-9 pr-4 py-2.5 text-sm text-[#F5EDD8] placeholder:text-[#8B6545] focus:outline-none focus:ring-2 focus:ring-[#F2C480]"
            />
          </form>

          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[#C4956A] hover:text-[#F5EDD8]"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          {/* Mobile theme + currency row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm font-medium text-[#C4956A] hover:text-[#F5EDD8] transition-colors"
            >
              {theme === "dark"
                ? <><Sun className="w-4 h-4" /> Light mode</>
                : <><Moon className="w-4 h-4" /> Dark mode</>}
            </button>
          </div>

          {/* Mobile currency toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B6545] font-medium">Currency:</span>
            <div className="flex items-center rounded-[var(--radius-btn)] border border-[#4A2E1A] overflow-hidden text-xs font-bold">
              <button
                onClick={() => setCurrency("SGD")}
                className={`px-3 py-1.5 transition-colors ${
                  currency === "SGD"
                    ? "bg-[#F2C480] text-[#1C1208]"
                    : "text-[#C4956A]"
                }`}
              >
                SGD
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 transition-colors ${
                  currency === "USD"
                    ? "bg-[#F2C480] text-[#1C1208]"
                    : "text-[#C4956A]"
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <hr className="border-[#4A2E1A]" />
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
