import type { Metadata } from "next";
import { science_gothic } from "@/utils/fonts";
import "./globals.css";

import { ThemeContextProvider } from "@/context/ThemeContext";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { SnackbarProvider } from "@/context/SnackbarContext";
import LayoutWrapper from "@/components/widgets/Layout-Wrapper";

export const metadata: Metadata = {
  title: "Public Voting Panel",
  description: "Public Voting Panel for digixito",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={science_gothic.variable}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ThemeContextProvider>
            <SnackbarProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </SnackbarProvider>
          </ThemeContextProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
