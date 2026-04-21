"use client";

// Global error boundary — catches errors thrown inside the root
// layout itself (which `app/error.tsx` can't, because error.tsx lives
// *inside* the layout it's supposed to wrap). Required by Sentry so
// we capture layout-level crashes.
//
// Must render its own <html> + <body> since at this point the root
// layout has failed to render. Keep markup minimal for the same
// reason — any dependency that blew up the layout could blow this up
// too.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafafa",
          color: "#111",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }} aria-hidden>
            🫠
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            Something went badly wrong.
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#555", lineHeight: 1.5 }}>
            We&apos;ve been notified and are looking into it. Try refreshing
            the page.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#888",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
