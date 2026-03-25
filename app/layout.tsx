import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ensureCleanupScheduled } from "@/lib/cleanup-scheduler";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import HeaderNav from "@/components/HeaderNav";
import PageWrapper from "@/components/PageWrapper";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Convert to Markdown",
  description: "Convert file SOP sang Markdown tối ưu cho AI agent",
};

// Cleanup scheduler: chạy 1 lần khi server start, lặp mỗi 6 tiếng
ensureCleanupScheduled();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${dmSans.variable} ${beVietnam.variable}`}>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <SessionProviderWrapper>
          <HeaderNav />
          <PageWrapper>{children}</PageWrapper>
          <footer className="text-center py-4 text-xs text-gray-300">
            mdconvert v1.0 —{' '}
            <a href="https://nhannguyensharing.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
              by NNS
            </a>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
