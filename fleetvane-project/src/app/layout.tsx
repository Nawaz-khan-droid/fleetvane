import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FleetVane — Intelligent Fleet Orchestration Platform",
  description:
    "FleetVane is a modern fleet management system that streamlines logistics operations with real-time vehicle tracking, shipment lifecycle management, driver coordination, and route intelligence for enterprises across India.",
  keywords: [
    "fleet management",
    "logistics software",
    "vehicle tracking",
    "shipment management",
    "fleet orchestration",
    "delivery tracking",
    "route optimization",
    "driver management",
    "transport management system",
    "FleetVane",
    "India logistics",
  ],
  authors: [{ name: "FleetVane Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "FleetVane — Intelligent Fleet Orchestration",
    description:
      "Streamline fleet operations with real-time tracking, intelligent route optimization, and seamless coordination across your entire fleet.",
    type: "website",
    siteName: "FleetVane",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetVane — Intelligent Fleet Orchestration",
    description:
      "Modern fleet management with real-time visibility, shipment tracking, and driver coordination.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#047857" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
