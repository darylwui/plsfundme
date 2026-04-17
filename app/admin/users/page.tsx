import { createServiceClient, createClient } from "@/lib/supabase/server";
import { UserList } from "@/components/admin/UserList";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const service = createServiceClient();
  const supabase = await createClient();

  // Get current session user id
  const { data: { user: sessionUser } } = await supabase.auth.getUser();

  // Fetch all auth users (includes email)
  const { data: { users: authUsers } } = await service.auth.admin.listUsers({
    perPage: 1000,
  });

  // Fetch all profiles
  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .order("created_at", { ascending: false });

  // Merge: index profiles by id
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
      <UserList users={users} currentUserId={sessionUser?.id ?? ""} />
    </div>
  );
}
