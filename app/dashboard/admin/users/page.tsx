import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { UserList } from "@/components/admin/UserList";

export const metadata = { title: "Users — Admin" };

export default async function DashboardAdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const service = createServiceClient();

  const { data: { users: authUsers } } = await service.auth.admin.listUsers({
    perPage: 1000,
  });

  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .order("created_at", { ascending: false });

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = (authUsers ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    display_name: profileMap.get(u.id)?.display_name ?? "—",
    is_admin: profileMap.get(u.id)?.is_admin ?? false,
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Users</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          {users.length} registered user{users.length !== 1 ? "s" : ""}
        </p>
      </div>
      <UserList users={users} currentUserId={user.id} />
    </div>
  );
}
