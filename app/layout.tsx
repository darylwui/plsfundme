import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
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
  title: "get that bread — Fund the future.",
  description:
    "Singapore's crowdfunding platform for entrepreneurs. Fund the future, one bold idea at a time.",
  icons: {
    icon: "/bread-icon.png",
    shortcut: "/favicon.ico",
    apple: "/bread-icon.png",
  },
  openGraph: {
    title: "get that bread",
    description: "Fund the future.",
    siteName: "get that bread",
    locale: "en_SG",
    type: "website",
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
    >
      <body className="min-h-full flex flex-col">
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
