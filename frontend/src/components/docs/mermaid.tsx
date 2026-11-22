"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Mermaid diagram in MDX: flowcharts, sequence, state, ER, class diagrams ...
 *
 *   <Mermaid caption="Transfer SAGA" chart={`
 *   sequenceDiagram
 *     Client->>Gateway: POST /transfer
 *   `} />
 *
 * Mermaid is loaded only on pages that use it. Colours come from the design tokens and follow
 * the light/dark theme.
 */
export function Mermaid({
  chart,
  caption,
}: {
  chart: string;
  caption?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const { default: mermaid } = await import("mermaid");
      const c = tokenColours();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        themeVariables: {
          darkMode: resolvedTheme === "dark",
          fontSize: "14px",
          background: c.surface,
          mainBkg: c.surface,
          primaryColor: c.surface,
          primaryTextColor: c.foreground,
          primaryBorderColor: c.primary,
          secondaryColor: c.accentSubtle,
          secondaryTextColor: c.foreground,
          secondaryBorderColor: c.accent,
          tertiaryColor: c.surfaceSubtle,
          tertiaryTextColor: c.foreground,
          tertiaryBorderColor: c.border,
          lineColor: c.muted,
          textColor: c.foreground,
          nodeTextColor: c.foreground,
          clusterBkg: c.surfaceSubtle,
          clusterBorder: c.border,
          edgeLabelBackground: c.surface,
          noteBkgColor: c.warningSubtle,
          noteTextColor: c.foreground,
          noteBorderColor: c.warningBorder,
          actorBkg: c.surface,
          actorBorder: c.primary,
          actorTextColor: c.foreground,
          actorLineColor: c.border,
          signalColor: c.foreground,
          signalTextColor: c.foreground,
          labelBoxBkgColor: c.surfaceSubtle,
          labelBoxBorderColor: c.border,
          labelTextColor: c.foreground,
          loopTextColor: c.foreground,
          activationBkgColor: c.accentSubtle,
          activationBorderColor: c.accent,
          sequenceNumberColor: c.primaryForeground,
        },
      });
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-border bg-surface">
      {error ? (
        <div className="grid gap-2 p-4">
          <p className="font-medium text-danger-foreground text-sm">
            Mermaid could not draw this diagram
          </p>
          <pre className="overflow-x-auto font-mono text-muted-foreground text-xs">
            {error}
          </pre>
        </div>
      ) : (
        <div
          ref={ref}
          className="flex min-h-24 justify-center overflow-x-auto p-5 [&_svg]:h-auto [&_svg]:max-w-full"
          aria-busy={!ready}
        />
      )}
      {caption && (
        <figcaption className="border-border border-t bg-surface-subtle px-4 py-2 text-muted-foreground text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Mermaid only understands hex/rgb, so resolve the OKLCH tokens to RGB through a 1x1 canvas. */
function tokenColours() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const styles = getComputedStyle(document.documentElement);
  const read = (token: string) => {
    const value = styles.getPropertyValue(`--${token}`).trim();
    if (!ctx || !value) return "#888888";
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  };
  return {
    surface: read("surface"),
    surfaceSubtle: read("surface-subtle"),
    foreground: read("foreground"),
    muted: read("muted-foreground"),
    border: read("border-strong"),
    primary: read("primary"),
    primaryForeground: read("primary-foreground"),
    accent: read("brand"),
    accentSubtle: read("brand-subtle"),
    warningSubtle: read("warning-subtle"),
    warningBorder: read("warning-border"),
  };
}
