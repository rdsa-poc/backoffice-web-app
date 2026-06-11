import type { StreamStatus } from "../../entities/stream/model/stream.ts";

type StatusBadgeProps = {
  compact?: boolean;
  status: StreamStatus;
};

export function StatusBadge({ compact = false, status }: StatusBadgeProps) {
  return (
    <span className={`badge${compact ? " badge--compact" : ""}`} data-status={status}>
      {status === "active" ? "Live" : status === "draft" ? "Scheduled" : "Offline"}
    </span>
  );
}
