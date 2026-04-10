import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/divider";
import { Card } from "@/components/ui/card";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
          Launch your idea 🚀
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Create an account to start raising funds or back exciting projects.
        </p>
      </div>

      <OAuthButtons />

      <Divider label="or sign up with email" />

      <RegisterForm />

      <p className="text-sm text-center text-[var(--color-ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand-violet)] hover:underline"
        >
          Log in
        </Link>
      </p>
    </Card>
  );
}
