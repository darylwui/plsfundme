"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderOpen, Users, Wallet, Heart, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PM_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "My projects", icon: FolderOpen, exact: false },
  { href: "/dashboard/backers", label: "Backers", icon: Users, exact: false },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet, exact: false },
];

const BACKER_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/my-pledges", label: "My pledges", icon: Heart, exact: false },
];

interface DashboardSidebarProps {
  role: "backer" | "project_manager" | string;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "project_manager" ? PM_NAV : BACKER_NAV;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="flex flex-row md:flex-col gap-1 md:justify-between md:h-full">
      <div className="flex flex-row md:flex-col gap-1 flex-1">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
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
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--color-brand-violet)]" : ""}`} />
              <span className="hidden sm:block">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout — desktop only (mobile has it in navbar) */}
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
