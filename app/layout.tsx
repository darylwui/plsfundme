import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getUsdToSgdRate } from "@/lib/currency/sgd-rate";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Mono is used only for stats numbers (hero card post-launch),
  // small captions on /for-creators, and the error page. None of
  // those are LCP elements, so we skip the head preload tag — the
  // font still loads via CSS @font-face when actually needed,
  // we just save the critical-path HTTP request on every page.
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "get that bread — Singapore crowdfunding for entrepreneurs",
    template: "%s — get that bread",
  },
  description:
    "Let's go get that bread. Singapore's reward-based crowdfunding platform for entrepreneurs. Launch your campaign, find your backers, bring your idea to life.",
  icons: {
    icon: "/bread-icon.png",
    shortcut: "/favicon.ico",
    apple: "/bread-icon.png",
  },
  openGraph: {
    title: "get that bread — Singapore's Crowdfunding Platform",
    description:
      "Launch your campaign, find your backers, bring your idea to life. Milestone-based escrow funding with PayNow & Stripe.",
    siteName: "get that bread",
    url: SITE_URL,
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "get that bread",
    description: "Singapore's crowdfunding platform for entrepreneurs.",
  },
  verification: {
    google: "rHunRAvO6MkAeJ5OnqB4mTd-MekqNbWpNWQjaSa-DYQ",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 24h-cached server-side fetch (open.er-api.com) → injected into the
  // currency provider. Falls back to 1.35 if the upstream is down. The
  // displayed rate only affects USD-toggle UX on the marketing surface;
  // actual Stripe charges always settle in SGD regardless.
  const usdToSgdRate = await getUsdToSgdRate();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Theme-flash preventer — must run before first paint. `beforeInteractive`
            tells Next to emit this inline in <head> during SSR, avoiding the
            React 19 "script tag while rendering" warning that fires when you
            put raw <script> in a Server Component tree. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`}
        </Script>

        {/* Structured data — rendered via next/script to avoid the same React
            19 warning. type="application/ld+json" keeps search engines happy. */}
        <Script
          id="schema-org-graph"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}#organization`,
                name: "get that bread",
                alternateName: "getthatbread",
                url: SITE_URL,
                logo: `${SITE_URL}/bread-icon.png`,
                description:
                  "Singapore's reward-based crowdfunding platform for entrepreneurs.",
                areaServed: { "@type": "Country", name: "Singapore" },
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}#website`,
                url: SITE_URL,
                name: "get that bread",
                publisher: { "@id": `${SITE_URL}#organization` },
                inLanguage: "en-SG",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          })}
        </Script>

        <ThemeProvider>
          <CurrencyProvider initialUsdToSgd={usdToSgdRate}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CurrencyProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-W93BB7060D" />
        <Script
          id="hs-script-loader"
          src="//js.hs-scripts.com/20135231.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
