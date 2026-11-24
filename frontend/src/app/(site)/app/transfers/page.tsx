"use client";

import { AccountGate } from "@/components/banking/account-gate";
import { BankingShell } from "@/components/banking/banking-shell";
import { TransferForm } from "@/components/banking/transfer-form";

export default function TransfersPage() {
  return (
    <BankingShell
      title="Transfer money"
      description="Send money to another AegisBank account. Every transfer is screened before the receiver is credited."
    >
      <AccountGate>
        {(accountNumber) => <TransferForm accountNumber={accountNumber} />}
      </AccountGate>
    </BankingShell>
  );
}
