"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Users, Wallet, Heart, LogOut,
  ClipboardList, UserCheck, UsersRound, User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PM_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "My projects", icon: FolderOpen, exact: false },
  { href: "/dashboard/creator-profile", label: "Creator profile", icon: User, exact: false },
  { href: "/dashboard/backers", label: "Backers", icon: Users, exact: false },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet, exact: false },
];

const BACKER_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/my-pledges", label: "My backed projects", icon: Heart, exact: false },
];

const ADMIN_NAV = [
  { href: "/dashboard/admin/projects", label: "Review campaigns", icon: ClipboardList, exact: false },
  { href: "/dashboard/admin/pms", label: "Creators", icon: UserCheck, exact: false },
  { href: "/dashboard/admin/users", label: "Users", icon: UsersRound, exact: false },
];

interface DashboardSidebarProps {
  role: "backer" | "project_manager" | string;
  isAdmin?: boolean;
}

export function DashboardSidebar({ role, isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "project_manager" ? PM_NAV : BACKER_NAV;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  function NavLink({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ElementType; exact: boolean }) {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          isActive
            ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm border border-[var(--color-border)]"
            : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--color-brand-violet)]" : ""}`} />
        <span className="hidden sm:block">{label}</span>
      </Link>
    );
  }

  return (
    <nav className="flex flex-row md:flex-col gap-1 md:justify-between md:h-full">
      <div className="flex flex-row md:flex-col gap-1 flex-1">
        {/* Regular nav */}
        {nav.map((item) => <NavLink key={item.href} {...item} />)}

        {/* Admin section */}
        {isAdmin && (
          <div className="mt-4 flex flex-col gap-1">
            <p className="hidden md:block px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] border-t border-[var(--color-border)]">
              Admin
            </p>
            {ADMIN_NAV.map((item) => <NavLink key={item.href} {...item} />)}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="hidden md:flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all mt-4"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Log out</span>
      </button>
    </nav>
  );
}
