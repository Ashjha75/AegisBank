import type { IconProps, IconWeight } from "@phosphor-icons/react";
import * as Phosphor from "@phosphor-icons/react/ssr";
import {
  ArrowsLeftRight,
  Bank,
  BracketsCurly,
  Bug,
  Calculator,
  ChartLineUp,
  Cloud,
  Code,
  Coins,
  CreditCard,
  CurrencyInr,
  Database,
  FileCode,
  Fingerprint,
  GitBranch,
  GitPullRequest,
  Graph,
  HandCoins,
  HardDrives,
  IdentificationCard,
  Lightning,
  LockKey,
  Money,
  Package,
  PiggyBank,
  Plugs,
  Queue,
  Receipt,
  Scales,
  ShieldCheck,
  Stack,
  TerminalWindow,
  Vault,
  Wallet,
} from "@phosphor-icons/react/ssr";
import type { ComponentType } from "react";

/**
 * Phosphor icons for the docs (server-rendered, no client JavaScript).
 *
 *   <Ph name="Vault" />                    inline icon, inherits text colour and size 1.15em
 *   <Ph name="Database" weight="duotone" size={28} className="text-brand" />
 *
 * Browse names at https://phosphoricons.com. The product UI keeps using lucide (AGENTS.md);
 * Phosphor is for docs, diagrams and feature illustrations.
 */
export function Ph({
  name,
  weight = "regular",
  size = "1.15em",
  className,
  label,
}: {
  name: string;
  weight?: IconWeight;
  size?: number | string;
  className?: string;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string;
}) {
  const Icon = (
    Phosphor as unknown as Record<string, ComponentType<IconProps>>
  )[name];
  if (typeof Icon !== "function" && typeof Icon !== "object") {
    return (
      <code className="text-danger-foreground">{`<Ph name="${name}"> not found`}</code>
    );
  }
  return (
    <Icon
      weight={weight}
      size={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.15em" }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}

const banking: [string, ComponentType<IconProps>][] = [
  ["Bank", Bank],
  ["Vault", Vault],
  ["Wallet", Wallet],
  ["CreditCard", CreditCard],
  ["CurrencyInr", CurrencyInr],
  ["Coins", Coins],
  ["Money", Money],
  ["HandCoins", HandCoins],
  ["PiggyBank", PiggyBank],
  ["Receipt", Receipt],
  ["ArrowsLeftRight", ArrowsLeftRight],
  ["ChartLineUp", ChartLineUp],
  ["ShieldCheck", ShieldCheck],
  ["LockKey", LockKey],
  ["Fingerprint", Fingerprint],
  ["IdentificationCard", IdentificationCard],
  ["Scales", Scales],
  ["Calculator", Calculator],
];

const engineering: [string, ComponentType<IconProps>][] = [
  ["Code", Code],
  ["BracketsCurly", BracketsCurly],
  ["TerminalWindow", TerminalWindow],
  ["FileCode", FileCode],
  ["Database", Database],
  ["HardDrives", HardDrives],
  ["Cloud", Cloud],
  ["Stack", Stack],
  ["Package", Package],
  ["Queue", Queue],
  ["Graph", Graph],
  ["Plugs", Plugs],
  ["Lightning", Lightning],
  ["GitBranch", GitBranch],
  ["GitPullRequest", GitPullRequest],
  ["Bug", Bug],
];

const weights: IconWeight[] = [
  "thin",
  "light",
  "regular",
  "bold",
  "duotone",
  "fill",
];

function IconGrid({ icons }: { icons: [string, ComponentType<IconProps>][] }) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-6">
      {icons.map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 bg-surface px-2 py-4 text-center"
        >
          <Icon
            size={24}
            weight="regular"
            className="text-foreground"
            aria-hidden
          />
          <code className="break-all font-mono text-[10.5px] text-muted-foreground">
            {name}
          </code>
        </div>
      ))}
    </div>
  );
}

/** A curated set of Phosphor icons for banking and engineering topics, plus the six weights. */
export function IconGallery() {
  return (
    <div className="not-prose my-6 grid gap-6 font-sans">
      <section className="grid gap-2.5">
        <h4 className="font-semibold text-[0.9375rem] text-foreground">
          Banking
        </h4>
        <IconGrid icons={banking} />
      </section>
      <section className="grid gap-2.5">
        <h4 className="font-semibold text-[0.9375rem] text-foreground">
          Engineering
        </h4>
        <IconGrid icons={engineering} />
      </section>
      <section className="grid gap-2.5">
        <h4 className="font-semibold text-[0.9375rem] text-foreground">
          Weights
        </h4>
        <div className="flex flex-wrap gap-6 rounded-md border border-border bg-surface px-5 py-4">
          {weights.map((w) => (
            <div key={w} className="flex flex-col items-center gap-2">
              <Vault size={28} weight={w} className="text-brand" aria-hidden />
              <code className="font-mono text-[10.5px] text-muted-foreground">
                {w}
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
