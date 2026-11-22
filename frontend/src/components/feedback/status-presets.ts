import {
  Ban,
  Compass,
  FileWarning,
  Hourglass,
  LockKeyhole,
  type LucideIcon,
  ServerCrash,
  TriangleAlert,
  Wrench,
} from "lucide-react";

/**
 * Copy for every full-page status the app can show. Calm, specific, and always says whether
 * money was affected. Used by <StatusPage status="404" /> and the Next.js error files.
 */
export type StatusCode =
  | "400"
  | "401"
  | "403"
  | "404"
  | "429"
  | "500"
  | "502"
  | "503";

export const STATUS_PRESETS: Record<
  StatusCode,
  { Icon: LucideIcon; label: string; title: string; description: string }
> = {
  "400": {
    Icon: FileWarning,
    label: "Bad request",
    title: "That request didn't look right",
    description:
      "Some of the information sent was missing or invalid. Go back and check the details, then try again.",
  },
  "401": {
    Icon: LockKeyhole,
    label: "Sign-in required",
    title: "Please sign in to continue",
    description:
      "Your session has ended or you haven't signed in yet. For your security we sign you out after a period of inactivity.",
  },
  "403": {
    Icon: Ban,
    label: "No access",
    title: "You don't have access to this",
    description:
      "This page or account isn't available to you. If you think that's wrong, contact support with the reference below.",
  },
  "404": {
    Icon: Compass,
    label: "Not found",
    title: "We can't find that page",
    description:
      "The link may be broken or the page may have moved. Your accounts are not affected.",
  },
  "429": {
    Icon: Hourglass,
    label: "Too many requests",
    title: "Slow down for a moment",
    description:
      "We received a lot of requests from you in a short time. Wait a minute, then try again.",
  },
  "500": {
    Icon: TriangleAlert,
    label: "Server error",
    title: "Something went wrong on our side",
    description:
      "This page hit an unexpected problem. Your money is safe - nothing was charged or moved because of this error.",
  },
  "502": {
    Icon: ServerCrash,
    label: "Service unavailable",
    title: "We couldn't reach our servers",
    description:
      "A service behind this page didn't respond. Your money is safe. Please try again in a moment.",
  },
  "503": {
    Icon: Wrench,
    label: "Maintenance",
    title: "AegisBank is under maintenance",
    description:
      "We're making scheduled improvements. Payments already in progress will complete as normal.",
  },
};
