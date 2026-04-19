import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/divider";
import { Card } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

export const metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { role } = await searchParams;
  const initialRole = role === "pm" ? "project_manager" : null;

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
          {initialRole === "project_manager" ? "Apply as Project Manager 🚀" : "Launch your idea 🚀"}
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {initialRole === "project_manager"
            ? "Tell us about yourself and your campaign plan. We'll review your application within 1–2 business days."
            : "Create an account to start raising funds or back exciting projects."}
        </p>
      </div>

      {!initialRole && (
        <>
          <OAuthButtons />
          <Divider label="or sign up with email" />
        </>
      )}

      <RegisterForm initialRole={initialRole} />

      <p className="text-sm text-center text-[var(--color-ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Log in
        </Link>
      </p>
    </Card>
  );
}
