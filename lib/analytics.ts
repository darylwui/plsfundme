import { sendGAEvent } from "@next/third-parties/google";

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  sendGAEvent("event", name, params ?? {});
}
