import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TimeModeProvider } from "@/contexts/time-mode-context";
import { ConnectionStatusProvider } from "@/contexts/connection-status-context";
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
  title: "Log Viewer",
  description: "Docker container log viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <TimeModeProvider>
            <ConnectionStatusProvider>
              {children}
            </ConnectionStatusProvider>
          </TimeModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
