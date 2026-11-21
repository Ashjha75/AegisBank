import { KeyRound, ShieldCheck, Undo2 } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
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
        <section className="mx-auto grid max-w-(--container-max) items-center gap-14 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24 lg:pb-28">
          <div className="grid max-w-xl gap-6">
            <Reveal>
              <p className="font-semibold text-accent text-overline uppercase">
                Digital banking
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="text-[2.25rem] text-foreground leading-[1.1] tracking-[-0.025em] sm:text-display">
                Banking that checks every transfer before it moves.
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-body-lg text-muted-foreground">
                AegisBank screens each payment for fraud in real time, asks for
                a one-time code when something looks unusual, and reverses the
                debit automatically if a transfer can&apos;t complete.
              </p>
            </Reveal>
            <Reveal
              delay={0.18}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Button asChild size="lg">
                <a href="#how-it-works">See how it works</a>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#security">Security</a>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="flex justify-center lg:justify-end">
            <TransferPreview />
          </Reveal>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 border-border border-t bg-surface"
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
              className="grid scroll-mt-24 gap-10 md:grid-cols-3 md:gap-8"
            >
              {pillars.map(({ Icon, title, body }, index) => (
                <Reveal
                  key={title}
                  inView
                  delay={index * 0.06}
                  className="grid content-start gap-3"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-primary">
                    <Icon
                      className="size-5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <h3 className="text-h4 text-foreground">{title}</h3>
                  <p className="text-body text-muted-foreground">{body}</p>
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
