"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
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
      Icon={TriangleAlert}
      title="Something went wrong"
      description="This page hit an unexpected problem. Your money is safe - nothing was charged or moved because of this error."
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
      footnote={error.digest ? `Reference: ${error.digest}` : undefined}
    />
  );
}
