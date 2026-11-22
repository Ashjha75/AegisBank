import { Fingerprint, History, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const assurances = [
  {
    Icon: History,
    title: "Every step is recorded",
    body: "Each status change of a transfer is saved the moment it happens.",
  },
  {
    Icon: Fingerprint,
    title: "A code for large transfers",
    body: "Transfers of ₹50,000 or more wait for your one-time code.",
  },
  {
    Icon: Undo2,
    title: "Failed means refunded",
    body: "If a transfer can't complete, the debit is reversed automatically.",
  },
];

/** Split-screen sign-in. UI only until the auth service exists (see SignInForm). */
export default function SignInPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/" aria-label="AegisBank home" className="w-fit rounded-sm">
          <Logo />
        </Link>
        <main
          id="main"
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12"
        >
          <div className="mb-8 grid gap-2">
            <h1 className="text-h1 text-foreground">Sign in</h1>
            <p className="text-body text-muted-foreground">
              Welcome back. Use the email linked to your AegisBank account.
            </p>
          </div>
          <SignInForm />
        </main>
        <p className="text-caption text-subtle-foreground">
          A learning project. Not a real bank - no real money is held or moved.
        </p>
      </div>

      <aside
        aria-label="Why AegisBank is safe"
        className="relative isolate hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div
          className="-z-10 pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:2.5rem_2.5rem] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden="true"
        />
        <p className="font-medium text-overline text-primary-foreground/60 uppercase">
          Security first
        </p>
        <div className="grid max-w-md gap-10">
          <h2 className="text-[2.5rem] leading-[1.1] tracking-[-0.03em]">
            Every transfer, accounted for at every step.
          </h2>
          <ul className="grid gap-6">
            {assurances.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary-foreground/15 bg-primary-foreground/5">
                  <Icon
                    className="size-4.5 text-brand-mark-accent"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-medium text-body">{title}</span>
                  <span className="text-body-sm text-primary-foreground/65">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-caption text-primary-foreground/50">
          SAGA-tracked transfers · OTP from ₹50,000 · Automatic refunds
        </p>
      </aside>
    </div>
  );
}
