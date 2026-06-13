import type { StreamDetail } from "../../entities/stream/model/stream.ts";
import { MetaRow } from "./MetaRow.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type StreamDetailsProps = {
  stream: StreamDetail;
};

export function StreamDetails({ stream }: StreamDetailsProps) {
  return (
    <article className="detail-card">
      <div className="detail-image-wrap">
        <img alt={`${stream.title} artwork`} className="detail-image" src={stream.imageUrl} />
        <div className="detail-live">
          <StatusBadge status={stream.status} />
        </div>
      </div>
      <div className="detail-body">
        <div>
          <h2 className="detail-title">{stream.title}</h2>
          <p className="detail-kicker">Read-only stream detail</p>
        </div>
        <p className="detail-summary">{stream.summary}</p>
        <div className="detail-meta">
          <MetaRow label="Status" value={<StatusBadge compact status={stream.status} />} />
          <MetaRow label="Stream ID" value={stream.streamId} />
          <MetaRow label="Stream URL" value={stream.streamUrl} />
          <MetaRow label="Created" value={formatDateTime(stream.createdAt)} />
          <MetaRow label="Updated" value={formatDateTime(stream.updatedAt)} />
        </div>
      </div>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
