import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";

/**
 * Inter - Apple HIG-inspired typography
 *
 * Inter is the closest cross-platform match to Apple's SF Pro:
 * - Designed for screens with excellent readability at all sizes
 * - Tabular numbers for score displays
 * - Proper optical sizing characteristics
 * - Great x-height for small text legibility
 */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Super Bowl Pool - Michael Williams Memorial Scholarship",
  description: "Join the Super Bowl pool and support the Michael Williams Memorial Scholarship Fund",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SB Squares",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#cda33b", // Gold - matching michaelwilliamsscholarship.com brand
  width: "device-width",
  initialScale: 1,
  // Allow users to zoom for accessibility - do NOT set userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <div className="pb-16 lg:pb-0">
          {children}
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
