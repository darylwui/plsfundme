import type { Metadata } from "next";

// The launch-guide page is a client component (interactive checklist with
// localStorage), so metadata can't live in the page itself. Putting it in
// this sibling layout is the canonical Next.js workaround.
export const metadata: Metadata = {
  title: "Creator launch guide — get that bread",
  description:
    "Everything you need to prep before launching a crowdfunding campaign on get that bread. 18-item checklist with a downloadable PDF.",
};

export default function LaunchGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
