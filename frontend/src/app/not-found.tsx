import "@/styles/site.css";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatusPage } from "@/components/feedback/status-page";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

/** Any URL that matches no route. */
export default function NotFound() {
  return (
    <StatusPage
      status="404"
      actions={
        <Button asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      }
    />
  );
}
