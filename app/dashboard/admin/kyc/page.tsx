import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KycApprovalList } from "@/components/admin/KycApprovalList";

export const metadata = { title: "KYC — Admin" };

export default async function DashboardAdminKycPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, kyc_status, kyc_submitted_at, created_at")
    .eq("kyc_status", "pending")
    .order("kyc_submitted_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">KYC Verification</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Review and approve identity verification requests from users.
        </p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <KycApprovalList profiles={(profiles as any[]) ?? []} />
    </div>
  );
}
