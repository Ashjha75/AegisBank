import {
  CircleCheck,
  CircleX,
  Clock,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import { Badge } from "./badge";

/** Mirrors transaction-service's TransactionStatus enum. */
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PENDING_VERIFICATION"
  | "COMPLETED"
  | "FAILED"
  | "FLAGGED";

const config: Record<
  TransactionStatus,
  {
    label: string;
    tone: "neutral" | "info" | "success" | "warning" | "danger";
    Icon: typeof Clock;
  }
> = {
  PENDING: { label: "Pending", tone: "warning", Icon: Clock },
  PROCESSING: { label: "Processing", tone: "warning", Icon: Clock },
  PENDING_VERIFICATION: {
    label: "Needs OTP",
    tone: "info",
    Icon: ShieldQuestion,
  },
  COMPLETED: { label: "Completed", tone: "success", Icon: CircleCheck },
  FAILED: { label: "Failed", tone: "danger", Icon: CircleX },
  FLAGGED: { label: "Flagged", tone: "danger", Icon: ShieldAlert },
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const { label, tone, Icon } = config[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
