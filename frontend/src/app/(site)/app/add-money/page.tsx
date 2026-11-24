"use client";

import { AccountGate } from "@/components/banking/account-gate";
import { AddMoneyForm } from "@/components/banking/add-money-form";
import { BankingShell } from "@/components/banking/banking-shell";

export default function AddMoneyPage() {
  return (
    <BankingShell
      title="Add money"
      description="Top up your AegisBank account through Razorpay."
    >
      <AccountGate>
        {(accountNumber) => <AddMoneyForm accountNumber={accountNumber} />}
      </AccountGate>
    </BankingShell>
  );
}
