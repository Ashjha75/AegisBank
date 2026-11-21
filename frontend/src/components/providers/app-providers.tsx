"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@/lib/api/query-client";

/**
 * Client-side providers for the customer site:
 * theme (light-first, dark available), server state (TanStack Query), motion settings, toasts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {/* "user": honour the OS reduced-motion setting for every motion component */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
