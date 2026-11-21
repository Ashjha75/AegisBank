import "@/styles/site.css";
import { Compass } from "lucide-react";
import Link from "next/link";
import { StatusPage } from "@/components/feedback/status-page";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

/** Any URL that matches no route. */
export default function NotFound() {
  return (
    <StatusPage
      Icon={Compass}
      code="404"
      title="We can't find that page"
      description="The link may be broken or the page may have moved. Your accounts are not affected."
      actions={
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      }
    />
  );
}
