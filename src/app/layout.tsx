import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TimeModeProvider } from "@/contexts/time-mode-context";
import { ConnectionStatusProvider } from "@/contexts/connection-status-context";
import { SourceProvider } from "@/contexts/source-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
      className={`h-full antialiased ${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <SourceProvider>
            <TimeModeProvider>
              <ConnectionStatusProvider>
                {children}
              </ConnectionStatusProvider>
            </TimeModeProvider>
          </SourceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
