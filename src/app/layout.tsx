import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth"
import { SessionProvider } from "next-auth/react"
import { DialogProvider } from "@/components/providers/dialog-provider"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SVG Generation",
  description: "Create, Manage, and Share SVGs with AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
