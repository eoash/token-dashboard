import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import { DateRangeProvider } from "@/lib/contexts/DateRangeContext";
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
  title: "EO Studio Token Dashboard",
  description: "Token usage and utilization dashboard for EO Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0A0A] text-white`}
      >
        <DateRangeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-60 flex-1 p-8">{children}</main>
          </div>
        </DateRangeProvider>
      </body>
    </html>
  );
}
