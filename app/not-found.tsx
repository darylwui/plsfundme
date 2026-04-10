import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-[var(--color-surface-raised)] px-4 py-24">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
            Hmm, we couldn&apos;t find what you were looking for. It might have
            moved or never existed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button size="lg">Go home</Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary">
                Explore projects
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
