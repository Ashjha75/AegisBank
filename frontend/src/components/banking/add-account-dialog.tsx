"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import {
  isValidAccountNumber,
  normalizeAccountNumber,
} from "@/lib/accounts/known-accounts";
import { apiFetch } from "@/lib/api/client";
import { userMessageFor } from "@/lib/api/error-messages";
import { isApiError } from "@/lib/api/problem";
import type { AccountResponse } from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";

/**
 * Adds an existing account to this browser.
 *
 * The number is checked against the backend before it is stored, so the switcher can never hold
 * an account that does not exist - a wrong digit is caught here instead of breaking every screen.
 */
export function AddAccountDialog({
  trigger,
  open: openProp,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { add } = useKnownAccounts();
  const [innerOpen, setInnerOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setValue("");
      setError(undefined);
    }
  };

  const lookup = useMutation({
    mutationFn: (accountNumber: string) =>
      apiFetch<AccountResponse>(`/v1/accounts/${accountNumber}`),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const accountNumber = normalizeAccountNumber(value);
    if (!isValidAccountNumber(accountNumber)) {
      setError("Enter the 12 digits of an existing AegisBank account.");
      return;
    }
    setError(undefined);
    try {
      const account = await lookup.mutateAsync(accountNumber);
      add(account.accountNumber);
      toast.success(`${account.accountHolderName}'s account added`, {
        description: formatAccountNumber(account.accountNumber),
      });
      setOpen(false);
    } catch (caught) {
      if (!isApiError(caught)) {
        setError(userMessageFor({ errorCode: "UNKNOWN_ERROR" }).message);
        return;
      }
      setError(
        caught.errorCode === "RESOURCE_NOT_FOUND"
          ? "No AegisBank account has this number."
          : userMessageFor(caught).message,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Add an account</DialogTitle>
          <DialogDescription>
            Enter the 12-digit number of an account you have already opened. It
            is remembered in this browser only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <Field
            label="Account number"
            hint="12 digits, e.g. 7588 8571 7853"
            error={error}
          >
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="758885717853"
              maxLength={17}
              className="font-mono"
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={lookup.isPending}>
              Add account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
