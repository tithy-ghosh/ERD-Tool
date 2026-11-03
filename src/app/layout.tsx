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
    icon: [{ url: "/erd2.png", type: "image/png" }],
    shortcut: "/erd2.png",
    apple: [{ url: "/erd2.png", type: "image/png" }],
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
