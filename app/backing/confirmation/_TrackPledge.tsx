"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function TrackPledge() {
  useEffect(() => {
    trackEvent("pledge_started");
  }, []);

  return null;
}
