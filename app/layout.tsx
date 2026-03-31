import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BrandLogo } from "@/components/brand/brand-logo";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ActiviqHQ",
  description: "Run your classes in one system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center px-4 sm:px-6">
            <BrandLogo compact />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
