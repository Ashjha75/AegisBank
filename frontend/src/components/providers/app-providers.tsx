"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { type ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@/lib/api/query-client";

/**
 * Client-side providers for the customer site: server state (TanStack Query), motion settings,
 * toasts. The site has a single light theme, so there is no theme provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {/* "user": honour the OS reduced-motion setting for every motion component */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster />
    </QueryClientProvider>
  );
}
