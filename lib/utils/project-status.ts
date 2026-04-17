import type { ProjectStatus } from "@/types/database.types";

type BadgeVariant = "violet" | "lime" | "coral" | "neutral" | "amber";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  active: "Live",
  funded: "Funded",
  failed: "Didn't reach goal",
  cancelled: "Needs changes",
  removed: "Removed",
};

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  draft: "neutral",
  pending_review: "amber",
  active: "violet",
  funded: "lime",
  failed: "coral",
  cancelled: "amber",
  removed: "coral",
};

export function getProjectStatusLabel(status: string): string {
  return PROJECT_STATUS_LABEL[status as ProjectStatus] ?? status;
}

export function getProjectStatusVariant(status: string): BadgeVariant {
  return PROJECT_STATUS_VARIANT[status as ProjectStatus] ?? "neutral";
}
