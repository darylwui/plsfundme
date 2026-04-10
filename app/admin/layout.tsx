import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, Tag, Rocket } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/projects", label: "Projects", icon: Rocket },
  { href: "/admin/categories", label: "Categories", icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-52 shrink-0">
            <div className="mb-3 px-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-coral)]">
                Admin
              </span>
            </div>
            <nav className="flex flex-row md:flex-col gap-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-all"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
