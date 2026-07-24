import type { IntakeStatus } from "@/lib/markdowns";

type StatusBadgeProps = {
  status: IntakeStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
        Approved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/15">
      Raw
    </span>
  );
}
