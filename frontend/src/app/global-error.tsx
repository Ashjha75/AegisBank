"use client";

import "@/styles/site.css";
import { RotateCcw } from "lucide-react";
import { StatusPage } from "@/components/feedback/status-page";
import { Button } from "@/components/ui/button";
import { fontVariables } from "@/lib/fonts";

/** Last-resort boundary when even the root layout fails. Must render its own <html> and <body>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <StatusPage
          status="500"
          title="AegisBank is having trouble"
          description="We couldn't load the app. Your money is safe. Please try again in a moment."
          actions={
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          }
          footnote={error.digest ? `Reference ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
