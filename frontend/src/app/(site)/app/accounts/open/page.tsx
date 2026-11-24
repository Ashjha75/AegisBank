"use client";

import { BankingShell } from "@/components/banking/banking-shell";
import { OpenAccountForm } from "@/components/banking/open-account-form";

export default function OpenAccountPage() {
  return (
    <BankingShell
      title="Open an account"
      description="A new AegisBank account, ready to use straight away."
    >
      <OpenAccountForm />
    </BankingShell>
  );
}
