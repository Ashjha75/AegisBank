"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Copy, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import { useCreateAccount } from "@/lib/api/banking";
import { isApiError } from "@/lib/api/problem";
import {
  ACCOUNT_TYPES,
  type AccountResponse,
  type AccountType,
  accountTypeLabel,
} from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";
import {
  amountField,
  normalizeAmount,
  normalizePhone,
  phoneField,
} from "@/lib/validation";
import { ApiErrorState } from "./api-error-state";

/**
 * Opens an account - the only way into the app, since there is no sign-up service yet.
 *
 * The rules match account-service's CreateAccountRequest and its @MinimumInitialDeposit check:
 * email and phone are unique per account, and the first deposit has to meet the minimum balance
 * for the type (configured in account-service/.env, so the exact figure comes from the backend's
 * error, never hard-coded here).
 */
const schema = z.object({
  accountHolderName: z
    .string()
    .min(1, "Enter the account holder's name")
    .max(100, "Keep the name under 100 characters"),
  email: z.email("Enter a valid email address"),
  phone: phoneField,
  accountType: z.enum(ACCOUNT_TYPES),
  initialDeposit: amountField,
});

type Values = z.infer<typeof schema>;

const TYPE_DESCRIPTIONS: Record<AccountType, string> = {
  SAVINGS: "Everyday banking. Daily transfer limit ₹1,00,000.",
  CURRENT: "For business use. Daily transfer limit ₹5,00,000.",
  FIXED_DEPOSIT: "Money set aside. Daily transfer limit ₹5,00,000.",
};

export function OpenAccountForm() {
  const [opened, setOpened] = React.useState<AccountResponse | null>(null);
  const { add } = useKnownAccounts();
  const create = useCreateAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountHolderName: "",
      email: "",
      phone: "",
      accountType: "SAVINGS",
      initialDeposit: "",
    },
  });

  const accountType = watch("accountType");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const account = await create.mutateAsync({
        accountHolderName: values.accountHolderName.trim(),
        email: values.email.trim(),
        phone: normalizePhone(values.phone),
        accountType: values.accountType,
        initialDeposit: normalizeAmount(values.initialDeposit),
      });
      add(account.accountNumber);
      setOpened(account);
      toast.success("Account opened", {
        description: formatAccountNumber(account.accountNumber),
      });
    } catch (caught) {
      if (!isApiError(caught)) return;
      // The backend names the field that failed; show it where the customer typed it.
      for (const [field, message] of Object.entries(caught.fieldErrors)) {
        if (field in values) setError(field as keyof Values, { message });
      }
      if (caught.errorCode === "RESOURCE_ALREADY_EXISTS") {
        setError("email", {
          message: "An account already uses this email or phone number.",
        });
      }
    }
  });

  if (opened) return <OpenedAccount account={opened} />;

  return (
    <div className="grid gap-6">
      {create.isError && !shownOnAField(create.error) && (
        <ApiErrorState error={create.error} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Open an account</CardTitle>
          <CardDescription>
            The account is created straight away and added to this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid max-w-xl gap-5" noValidate>
            <Field
              label="Account holder name"
              error={errors.accountHolderName?.message}
            >
              <InputGroup start={<User aria-hidden="true" />}>
                <Input
                  autoComplete="name"
                  placeholder="Priya Sharma"
                  {...register("accountHolderName")}
                />
              </InputGroup>
            </Field>

            <Field
              label="Email"
              hint="Used for alerts. One account per email address."
              error={errors.email?.message}
            >
              <InputGroup start={<Mail aria-hidden="true" />}>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="priya@example.com"
                  {...register("email")}
                />
              </InputGroup>
            </Field>

            <Field
              label="Phone"
              hint="10-digit Indian mobile number."
              error={errors.phone?.message}
            >
              <InputGroup start={<Phone aria-hidden="true" />}>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  {...register("phone")}
                />
              </InputGroup>
            </Field>

            <fieldset className="grid gap-2">
              <legend className="pb-1 font-medium text-label text-foreground">
                Account type
              </legend>
              <RadioGroup
                value={accountType}
                onValueChange={(value) =>
                  setValue("accountType", value as AccountType)
                }
                className="grid gap-2"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <RadioCard
                    key={type}
                    value={type}
                    title={accountTypeLabel(type)}
                    description={TYPE_DESCRIPTIONS[type]}
                  />
                ))}
              </RadioGroup>
            </fieldset>

            <Field
              label="Initial deposit"
              hint="Must meet the minimum balance for the account type."
              error={errors.initialDeposit?.message}
            >
              <InputGroup start="₹" end="INR">
                <Input
                  inputMode="decimal"
                  placeholder="5000.00"
                  {...register("initialDeposit")}
                />
              </InputGroup>
            </Field>

            <Button type="submit" loading={create.isPending} className="w-fit">
              Open account
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OpenedAccount({ account }: { account: AccountResponse }) {
  return (
    <Card className="max-w-xl">
      <CardContent className="grid gap-5">
        <span className="flex size-10 items-center justify-center rounded-md border border-success-border bg-success-subtle text-success-foreground">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <div className="grid gap-1">
          <h2 className="text-h3 text-foreground">Your account is open</h2>
          <p className="text-body-sm text-muted-foreground">
            It is now the active account in this browser. Write the number down
            - without sign-in it is how you find the account again.
          </p>
        </div>

        <div className="grid gap-2 rounded-md border border-border bg-surface-subtle px-4 py-3">
          <span className="text-caption text-muted-foreground">
            Account number
          </span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-h4 text-foreground">
              {formatAccountNumber(account.accountNumber)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Copy account number"
              onClick={() => {
                navigator.clipboard
                  .writeText(account.accountNumber)
                  .then(() => toast.success("Account number copied"))
                  .catch(() => toast.error("Could not copy the number"));
              }}
            >
              <Copy aria-hidden="true" />
            </Button>
          </span>
          <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
            Opening balance
            <Amount value={account.balance} size="sm" />
          </span>
        </div>

        <Alert tone="info" title="Keep this number safe">
          Anyone with an account number can look the account up and transfer
          into it. Authentication is still to come.
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/app">
              Go to overview
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/app/transfers">Make a transfer</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Problems already shown under an input would only be noise in the page-level alert. */
function shownOnAField(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    Object.keys(error.fieldErrors).length > 0 ||
    error.errorCode === "RESOURCE_ALREADY_EXISTS"
  );
}
