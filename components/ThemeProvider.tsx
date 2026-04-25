"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; mounted: boolean; toggle: () => void }>({
  theme: "light",
  mounted: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light" on both server and first client render to match SSR
  // output exactly. The real theme is resolved in the mount effect below —
  // consumers that render theme-dependent UI (e.g. icon swaps) should gate
  // on `mounted` to avoid hydration mismatches.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let resolved: Theme = "light";
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") {
        resolved = stored;
      } else {
        resolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
      }
    } catch {
      resolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

  function toggle() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch {}
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
