"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/feedback/status-page";
import { Button } from "@/components/ui/button";

/** Unexpected error while rendering a site page. Expected API errors are handled inline instead. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      status="500"
      actions={
        <>
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back to home</Link>
          </Button>
        </>
      }
      footnote={error.digest ? `Reference ${error.digest}` : undefined}
    />
  );
}
