import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "@/app/globals.css";
import "@/app/judooo-global.css";
import { AppProviders } from '@/app/providers';

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
const instrumentDisplay = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Judooo",
  description: "Judooo is an art map for discovering and planning art events across Vietnam.",
  icons: {
    icon: "/judooo_Favicon.svg",
    shortcut: "/judooo_Favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${instrumentDisplay.variable} min-h-screen bg-background font-sans antialiased`}>
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
