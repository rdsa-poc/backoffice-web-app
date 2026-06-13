import type { StreamCatalogItem } from "../entities/stream/model/stream.ts";

export const STREAMS_PER_PAGE = 6;

export function buildMockStreams(): StreamCatalogItem[] {
  return [
    createStream({
      availableActions: ["publish", "unpublish", "edit", "view"],
      createdAt: "2024-05-12T08:42:00.000Z",
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=640&q=80",
      position: 1,
      status: "active",
      streamId: "stream-morning-light",
      title: "Morning Light Radio",
    }),
    createStream({
      availableActions: ["publish", "edit", "view", "delete"],
      createdAt: "2024-05-11T09:15:00.000Z",
      imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=640&q=80",
      position: 2,
      status: "inactive",
      streamId: "stream-urban-pulse",
      title: "Urban Pulse",
    }),
  ];
}

function createStream(stream: StreamCatalogItem): StreamCatalogItem {
  return stream;
}
