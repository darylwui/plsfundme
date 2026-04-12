import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getthatbread.vercel.app"),
  title: {
    default: "get that bread — Fund the future.",
    template: "%s — get that bread",
  },
  description:
    "Singapore's reward-based crowdfunding platform for entrepreneurs. Launch your campaign, find your backers, bring your idea to life.",
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
    url: "https://getthatbread.vercel.app",
    locale: "en_SG",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "get that bread — Singapore's crowdfunding platform for entrepreneurs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "get that bread",
    description: "Singapore's crowdfunding platform for entrepreneurs.",
    images: ["/og-default.png"],
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
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
