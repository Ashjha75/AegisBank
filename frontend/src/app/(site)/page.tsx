import { ArrowRight, KeyRound, ShieldCheck, Undo2 } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ScreeningLog } from "@/components/site/screening-log";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TransferPreview } from "@/components/site/transfer-preview";
import { Button } from "@/components/ui/button";

/*
 * Placeholder home page. The full customer UI is designed after the backend services are complete
 * (docs/plan.md > Customer UI). This page already follows the design system so the direction is visible.
 */

const pillars = [
  {
    Icon: ShieldCheck,
    title: "Every transfer is screened",
    body: "Each payment is checked against velocity, amount and balance rules before the receiver is credited.",
  },
  {
    Icon: KeyRound,
    title: "A code when something looks unusual",
    body: "Large or unusual transfers pause for a one-time code, so only you can approve them.",
  },
  {
    Icon: Undo2,
    title: "Money is never left in limbo",
    body: "If any step fails, the debit is reversed automatically and the transfer shows exactly why.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="mx-auto grid max-w-(--container-max) gap-12 px-5 pt-16 pb-16 sm:px-8 lg:pt-24">
          <div className="grid max-w-3xl gap-6">
            <Reveal>
              <h1 className="text-[2.5rem] text-foreground leading-[1.08] tracking-[-0.035em] sm:text-display">
                Banking that checks every transfer before it moves.
              </h1>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="max-w-2xl text-body-lg text-muted-foreground">
                AegisBank screens each payment for fraud in real time, asks for
                a one-time code when something looks unusual, and reverses the
                debit automatically if a transfer can&apos;t complete.
              </p>
            </Reveal>
            <Reveal
              delay={0.12}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Button asChild size="lg">
                <Link href="/sign-in">
                  Sign in
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#how-it-works">How it works</a>
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.18}>
            <div className="relative isolate overflow-hidden rounded-xl border border-border bg-surface-subtle p-4 sm:p-8 lg:p-12">
              <div
                className="bg-grid -z-10 pointer-events-none absolute inset-0 opacity-70"
                aria-hidden="true"
              />
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
                <div className="flex justify-center">
                  <TransferPreview />
                </div>
                <ScreeningLog />
              </div>
            </div>
          </Reveal>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 border-border border-t"
        >
          <div className="mx-auto grid max-w-(--container-max) gap-12 px-5 py-20 sm:px-8">
            <Reveal inView className="grid max-w-2xl gap-3">
              <h2 className="text-h1 text-foreground">How a transfer works</h2>
              <p className="text-body-lg text-muted-foreground">
                Three checks stand between your money and a mistake. You see
                each one as it happens.
              </p>
            </Reveal>
            <div
              id="security"
              className="grid scroll-mt-24 border-border border-y md:grid-cols-3"
            >
              {pillars.map(({ Icon, title, body }, index) => (
                <Reveal
                  key={title}
                  inView
                  delay={index * 0.06}
                  className="grid content-start gap-3 border-border py-8 not-last:border-b md:px-8 md:py-10 md:not-last:border-r md:not-last:border-b-0 md:first:pl-0"
                >
                  <Icon
                    className="size-5 text-brand"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <h3 className="text-h4 text-foreground">{title}</h3>
                  <p className="text-body-sm text-muted-foreground">{body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
