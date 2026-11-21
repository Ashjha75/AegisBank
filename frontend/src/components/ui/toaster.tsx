"use client";

import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";

/**
 * Toasts for transient feedback ("Transfer sent", "Copied"). Errors that block the user belong
 * in an inline <Alert/> instead. Call `toast.success(...)` / `toast.error(...)` from "sonner".
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border! border-border! bg-surface! text-foreground! shadow-md! font-sans! text-body-sm!",
          description: "text-muted-foreground!",
          success: "[&_[data-icon]]:text-success!",
          error: "[&_[data-icon]]:text-danger!",
          warning: "[&_[data-icon]]:text-warning!",
          info: "[&_[data-icon]]:text-info!",
        },
      }}
      style={{ zIndex: "var(--z-toast)" } as CSSProperties}
    />
  );
}
