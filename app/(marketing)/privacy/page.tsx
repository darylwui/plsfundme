import type { Metadata } from "next";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { BackToTop } from "@/components/ui/back-to-top";

export const metadata: Metadata = {
  title: "Privacy Policy — get that bread",
  description:
    "How get that bread collects, uses, and protects your personal data under Singapore's PDPA.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PrivacyContent />

        <div className="mt-10 flex justify-center">
          <BackToTop />
        </div>
      </div>
    </div>
  );
}
