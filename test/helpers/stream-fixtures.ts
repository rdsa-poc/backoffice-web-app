import type { StreamCatalogItem, StreamDetail } from "../../src/entities/stream/model/stream.ts";

export function buildCatalogFixture(): StreamCatalogItem[] {
  return [
    {
      availableActions: ["publish", "unpublish", "edit", "view"],
      createdAt: "2026-06-10T09:00:00.000Z",
      imageUrl: "https://cdn.example.com/streams/morning-news.jpg",
      position: 1,
      status: "active",
      streamId: "stream-morning-news",
      title: "Morning News",
    },
    {
      availableActions: ["publish", "edit", "view", "delete"],
      createdAt: "2026-06-09T09:00:00.000Z",
      imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
      position: 2,
      status: "inactive",
      streamId: "stream-night-jazz",
      title: "Night Jazz",
    },
    {
      availableActions: ["publish", "edit", "view", "delete"],
      createdAt: "2026-06-08T09:00:00.000Z",
      imageUrl: "https://cdn.example.com/streams/weekend-recap.jpg",
      position: 3,
      status: "draft",
      streamId: "stream-weekend-recap",
      title: "Weekend Recap",
    },
  ];
}

export function buildDetailFixture(overrides: Partial<StreamDetail> = {}): StreamDetail {
  return {
    createdAt: "2026-06-10T09:00:00.000Z",
    imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
    status: "inactive",
    streamId: "stream-night-jazz",
    streamUrl: "https://radio.example.com/night-jazz.m3u8",
    summary: "Late-night jazz programming with host-led transitions.",
    title: "Night Jazz",
    updatedAt: "2026-06-11T09:00:00.000Z",
    ...overrides,
  };
}
