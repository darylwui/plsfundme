import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";
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
      "Launch your campaign, find your backers, bring your idea to life. All-or-nothing funding with PayNow & Stripe.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <CurrencyProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CurrencyProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-W93BB7060D" />
      </body>
    </html>
  );
}
