"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FundingState {
  amount_pledged_sgd: number;
  backer_count: number;
}

export function useRealtimeFunding(
  projectId: string,
  initial: FundingState
) {
  const [funding, setFunding] = useState<FundingState>(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`funding:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          const updated = payload.new as FundingState & { id: string };
          setFunding({
            amount_pledged_sgd: updated.amount_pledged_sgd,
            backer_count: updated.backer_count,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return funding;
}
