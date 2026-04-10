"use client";

import { useState } from "react";
import { Mail, Search, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
  last_sign_in: string | null;
}

export function UserList({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.display_name.toLowerCase().includes(q)
    );
  });

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-ink-muted)]">
        <p className="text-4xl mb-3">👥</p>
        <p className="font-semibold">No users yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)] py-8 text-center">
          No users match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-overlay)] border-b border-[var(--color-border)]">
              <tr>
                {["User", "Email", "Joined", "Last active", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  {/* Name + admin badge */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-brand-violet)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-brand-violet)] shrink-0">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">
                          {user.display_name}
                        </p>
                        {user.is_admin && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-[var(--color-brand-violet)] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                    {user.email}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-[var(--color-ink-subtle)] whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Last sign in */}
                  <td className="px-4 py-3 text-[var(--color-ink-subtle)] whitespace-nowrap">
                    {user.last_sign_in ? formatDate(user.last_sign_in) : "Never"}
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${user.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-brand-violet)] hover:text-white hover:border-[var(--color-brand-violet)] text-[var(--color-ink-muted)] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
