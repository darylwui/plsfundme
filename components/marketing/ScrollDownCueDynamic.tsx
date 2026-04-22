"use client";

import dynamic from "next/dynamic";

export const ScrollDownCue = dynamic(
  () => import("@/components/marketing/ScrollDownCue").then((m) => m.ScrollDownCue),
  { ssr: false }
);
