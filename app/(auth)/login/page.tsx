import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/divider";
import { Card } from "@/components/ui/card";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;

  // Redirect already-logged-in users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(redirectTo ?? "/dashboard");

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "#d97706" }}>
          Welcome back 👋
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Log in to back projects or manage your campaigns.
        </p>
      </div>

      <OAuthButtons redirectTo={redirectTo} />

      <Divider label="or continue with email" />

      <LoginForm redirectTo={redirectTo} />

      <p className="text-sm text-center text-[var(--color-ink-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-semibold text-[var(--color-brand-violet)] hover:underline"
        >
          Sign up free
        </Link>
      </p>
    </Card>
  );
}
