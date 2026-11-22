"use client";

import type * as React from "react";
import { useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

/**
 * Ready-made confirmation modal: title, description, optional details, Cancel + Confirm.
 * `onConfirm` may be async - the confirm button shows a spinner and the dialog stays open until it
 * resolves; if it throws, the dialog stays open so the page can show the error.
 *
 *   <ConfirmDialog
 *     trigger={<Button variant="danger">Remove payee</Button>}
 *     tone="danger"
 *     title="Remove Priya Sharma?"
 *     description="You can add her again later."
 *     confirmLabel="Remove"
 *     onConfirm={() => removePayee(id)}
 *   />
 *
 * Controlled use (open from code): pass `open` and `onOpenChange` instead of `trigger`.
 */
export function ConfirmDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  size = "md",
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra content between the description and the buttons (a summary, an OTP field). */
  children?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** primary (ink), brand (green - positive money actions), danger (irreversible). */
  tone?: "primary" | "brand" | "danger";
  onConfirm: () => void | Promise<void>;
  size?: "sm" | "md" | "lg";
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (busy) return;
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setBusy(false);
      setInnerOpen(false);
      onOpenChange?.(false);
    } catch {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent size={size} hideClose={busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button variant={tone} loading={busy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
