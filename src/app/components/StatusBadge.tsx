import type { StreamStatus } from "../../entities/stream/model/stream.ts";

type StatusBadgeProps = {
  compact?: boolean;
  status: StreamStatus;
};

export function StatusBadge({ compact = false, status }: StatusBadgeProps) {
  return (
    <span className={`badge${compact ? " badge--compact" : ""}`} data-status={status}>
      <span aria-hidden="true" className="badge-dot" />
      {status === "active" ? "Live" : status === "draft" ? "Draft" : "Inactive"}
    </span>
  );
}
