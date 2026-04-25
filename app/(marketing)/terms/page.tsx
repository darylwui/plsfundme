import type { Metadata } from "next";
import { LegalTabs, type LegalTabId } from "@/components/legal/LegalTabs";
import { TermsContent } from "@/components/legal/TermsContent";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { RefundContent } from "@/components/legal/RefundContent";
import { BackToTop } from "@/components/ui/back-to-top";

const META: Record<LegalTabId, { title: string; description: string }> = {
  terms: {
    title: "Terms of Service — get that bread",
    description: "Terms of Service for get that bread, Singapore's reward-based crowdfunding platform.",
  },
  privacy: {
    title: "Privacy Policy — get that bread",
    description: "How get that bread collects, uses, and protects your personal data under Singapore's PDPA.",
  },
  refund: {
    title: "Refund & dispute policy — get that bread",
    description:
      "When and how backers get refunded on get that bread — milestone-based escrow, two-stage disputes, full refunds including platform fee.",
  },
};

interface TermsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ searchParams }: TermsPageProps): Promise<Metadata> {
  const { tab } = await searchParams;
  const key = (tab === "privacy" || tab === "refund" ? tab : "terms") as LegalTabId;
  return META[key];
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { tab } = await searchParams;
  const activeTab = (tab === "privacy" || tab === "refund" ? tab : "terms") as LegalTabId;

  const content = {
    terms: <TermsContent />,
    privacy: <PrivacyContent />,
    refund: <RefundContent />,
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <LegalTabs activeTab={activeTab}>
          {content[activeTab]}
        </LegalTabs>

        <div className="mt-10 flex justify-center">
          <BackToTop />
        </div>
      </div>
    </div>
  );
}
