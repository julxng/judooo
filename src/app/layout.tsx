import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import "@/app/judooo-global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from '@/app/providers';

const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-sans",
});
const interDisplay = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-display",
});

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Judooo",
  description: "Judooo is an art map for discovering and planning art events across Vietnam.",
  icons: {
    icon: "/judooo_Favicon.svg",
    shortcut: "/judooo_Favicon.svg",
  },
  openGraph: {
    title: "Judooo",
    description: "Judooo is an art map for discovering and planning art events across Vietnam.",
    url: "https://www.judooo.art",
    siteName: "Judooo",
    images: [
      {
        url: "https://www.judooo.art/og-image.png",
        width: 1200,
        height: 630,
        alt: "Judooo — Art Map for Vietnam",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Judooo",
    description: "Judooo is an art map for discovering and planning art events across Vietnam.",
    images: ["https://www.judooo.art/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          data-domain="judooo.art"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} ${interDisplay.variable} min-h-screen bg-background font-sans antialiased`}>
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
