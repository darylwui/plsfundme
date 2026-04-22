"use client";

import dynamic from "next/dynamic";

export const CreatorTimelineScrub = dynamic(
  () =>
    import("@/components/marketing/CreatorTimelineScrub").then(
      (m) => m.CreatorTimelineScrub
    ),
  { ssr: false }
);
