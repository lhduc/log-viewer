import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { TimeModeProvider } from "@/contexts/time-mode-context";
import { ConnectionStatusProvider } from "@/contexts/connection-status-context";
import "./globals.css";

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
      className="h-full antialiased"
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
