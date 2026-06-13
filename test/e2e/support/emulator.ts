export async function resetFirestore() {
  const response = await fetch(
    "http://127.0.0.1:8081/v1/projects/radiosa-poc/databases/backoffice/documents/streams",
  );
  if (!response.ok) {
    throw new Error(`Failed to load Firestore emulator state: ${response.status}`);
  }

  const payload = (await response.json()) as { documents?: Array<{ name: string }> };
  for (const document of payload.documents ?? []) {
    const deleteResponse = await fetch(`http://127.0.0.1:8081/v1/${document.name}`, {
      method: "DELETE",
    });
    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete emulator document ${document.name}: ${deleteResponse.status}`);
    }
  }
}

export async function seedFirestoreCatalog() {
  for (const stream of seededStreams) {
    const response = await fetch(
      `http://127.0.0.1:8081/v1/projects/radiosa-poc/databases/backoffice/documents/streams/${encodeURIComponent(stream.streamId)}`,
      {
        body: JSON.stringify({
          fields: {
            createdAt: { stringValue: stream.createdAt },
            imageUrl: { stringValue: stream.imageUrl },
            status: { stringValue: stream.status },
            streamId: { stringValue: stream.streamId },
            streamUrl: { stringValue: stream.streamUrl },
            summary: { stringValue: stream.summary },
            title: { stringValue: stream.title },
            updatedAt: { stringValue: stream.updatedAt },
          },
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to seed emulator document ${stream.streamId}: ${response.status}`);
    }
  }
}

const seededStreams = [
  {
    createdAt: "2026-06-10T09:00:00.000Z",
    imageUrl: "https://cdn.example.com/streams/morning-news.jpg",
    status: "active",
    streamId: "stream-morning-news",
    streamUrl: "https://radio.example.com/morning-news.m3u8",
    summary: "Daily news and weather coverage for the morning drive.",
    title: "Morning News",
    updatedAt: "2026-06-10T09:00:00.000Z",
  },
  {
    createdAt: "2026-06-09T09:00:00.000Z",
    imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
    status: "inactive",
    streamId: "stream-night-jazz",
    streamUrl: "https://radio.example.com/night-jazz.m3u8",
    summary: "Late-night jazz programming with host-led transitions.",
    title: "Night Jazz",
    updatedAt: "2026-06-09T09:00:00.000Z",
  },
  {
    createdAt: "2026-06-08T09:00:00.000Z",
    imageUrl: "https://cdn.example.com/streams/weekend-recap.jpg",
    status: "draft",
    streamId: "stream-weekend-recap",
    streamUrl: "https://radio.example.com/weekend-recap.m3u8",
    summary: "Weekend highlights prepared for the next publish window.",
    title: "Weekend Recap",
    updatedAt: "2026-06-08T09:00:00.000Z",
  },
] as const;
