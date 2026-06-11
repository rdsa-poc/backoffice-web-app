import type { ReactNode } from "react";

import type { StreamListItem } from "../../entities/stream/model/stream.ts";
import { MetaRow } from "./MetaRow.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

type StreamDetailsProps = {
  detailKicker: string;
  footerAction?: ReactNode;
  runtimeMeta: ReactNode;
  stream: StreamListItem;
};

export function StreamDetails({ detailKicker, footerAction, runtimeMeta, stream }: StreamDetailsProps) {
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
          <p className="detail-kicker">{detailKicker}</p>
        </div>
        <p className="detail-summary">{stream.summary}</p>
        <div className="detail-meta">
          <MetaRow label="Status" value={<StatusBadge compact status={stream.status} />} />
          <MetaRow label="Stream URL" value={`https://stream.radiosa.fm/${stream.streamId}`} />
          <MetaRow label="Audio Format" value="AAC" />
          <MetaRow label="Bitrate" value="128 kbps" />
          <MetaRow label="Region" value="Global" />
          <MetaRow label="Created" value={formatDateTime(stream.createdAt)} />
          <MetaRow label="Updated" value={formatDateTime(stream.createdAt)} />
          {runtimeMeta}
        </div>
        <div className="health-card">
          <div className="health-copy">
            <span className="health-title">Stream is healthy</span>
            <span className="health-caption">Last checked 30 seconds ago</span>
          </div>
          {footerAction}
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
