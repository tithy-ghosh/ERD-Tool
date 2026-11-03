import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppProviders from "@/components/ui/AppProviders";
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
  title: {
    default: "ERD Studio — Visual PostgreSQL schema designer",
    template: "%s · ERD Studio",
  },
  description:
    "Design PostgreSQL database schemas visually. Add tables, connect relationships, import SQL, and export production-ready schemas.",
  applicationName: "ERD Studio",
  icons: {
    // Small-size mark derived from erd.png: a 512px logo cannot stay legible
    // once a browser shrinks it to a 16px tab icon.
    icon: [
      {
        url: "/favicon.ico?v=2",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-canvas font-sans text-ink">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
