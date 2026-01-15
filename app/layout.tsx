import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";

/**
 * Poppins - Matching the Michael Williams Scholarship website
 * Professional, dignified, warm, and community-focused
 * Excellent for headings and body text
 */
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${poppins.variable} antialiased`}>
        <div className="pb-16 lg:pb-0">
          {children}
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
