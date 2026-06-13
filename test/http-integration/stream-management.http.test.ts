import { beforeAll, beforeEach, afterAll, describe, expect, test } from "vitest";

import {
  createStream,
  deleteStream,
  getStreamDetail,
  listStreams,
  publishStream,
  StreamApiError,
  unpublishStream,
  updateStream,
} from "../../src/shared/api/modules/stream-management.ts";
import {
  HTTP_INTEGRATION_BASE_URL,
  readRealtimeProjection,
  resetFirestore,
  resetRealtimeDatabase,
  restartBackendProcess,
  restartBackendProcessWithOverrides,
  startBackendHarness,
  stopBackendHarness,
  writeRealtimeProjection,
} from "./support/backend-harness.ts";

const config = {
  apiBaseUrl: HTTP_INTEGRATION_BASE_URL,
  appId: "bof-web",
  environmentName: "test",
} as const;

describe("stream-management HTTP integration", () => {
  beforeAll(async () => {
    await startBackendHarness();
  });

  afterAll(async () => {
    await stopBackendHarness();
  });

  beforeEach(async () => {
    await resetFirestore();
    await resetRealtimeDatabase();
    await restartBackendProcess();
    await seedActiveRealtimeProjection();
  });

  test("lists the seeded catalog through the real bof-be CRUD endpoint", async () => {
    const streams = await listStreams(config);

    expect(streams).toHaveLength(5);
    expect(streams[0]?.streamId).toBe("stream-morning-news");
    expect(streams[0]?.availableActions).toEqual(["publish", "unpublish", "edit", "view"]);
    expect(streams[2]?.streamId).toBe("stream-weekend-recap");
    expect(streams[2]?.availableActions).toEqual(["publish", "edit", "view", "delete"]);
  });

  test("creates, updates, reads, and deletes a stream against the emulator-backed backend", async () => {
    const createResult = await createStream(config, {
      imageUrl: "https://cdn.example.com/streams/late-signals.jpg",
      streamUrl: "https://radio.example.com/late-signals.m3u8",
      summary: "After-hours interviews and listener call-ins.",
      title: "Late Signals",
    });

    expect(createResult.status).toBe("draft");

    const createdDetail = await getStreamDetail(config, createResult.streamId);
    expect(createdDetail.title).toBe("Late Signals");

    const updateSource = {
      imageUrl: "https://cdn.example.com/streams/late-signals-remix.jpg",
      streamId: createResult.streamId,
      streamUrl: "https://radio.example.com/late-signals-remix.m3u8",
      summary: "Updated overnight mix and interviews.",
      title: "Late Signals Remix",
    };

    const updateResult = await updateStream(config, createResult.streamId, {
      imageUrl: updateSource.imageUrl,
      streamUrl: updateSource.streamUrl,
      summary: updateSource.summary,
      title: updateSource.title,
    });

    expect(updateResult.streamId).toBe(createResult.streamId);

    const updatedDetail = await getStreamDetail(config, createResult.streamId);
    expect(updatedDetail.title).toBe("Late Signals Remix");
    expect(updatedDetail.streamUrl).toBe("https://radio.example.com/late-signals-remix.m3u8");

    const deleteResult = await deleteStream(config, createResult.streamId);
    expect(deleteResult).toEqual({ deleted: true, streamId: createResult.streamId });

    await expect(getStreamDetail(config, createResult.streamId)).rejects.toMatchObject({
      message: expect.stringContaining("not found"),
    });
  });

  test("surfaces active-stream delete rejections from the real backend", async () => {
    const deletionPromise = deleteStream(config, "stream-morning-news");
    await expect(deletionPromise).rejects.toBeInstanceOf(StreamApiError);
    await expect(deletionPromise).rejects.toMatchObject({
      message: "Active streams must be unpublished before deletion.",
      status: 409,
    });
  });

  // Test: publish, republish, unpublish, and publish-again stay aligned with the live bof-be lifecycle contract.
  // Validates: RDS-AC-016, RDS-AC-017, RDS-AC-018, RDS-AC-027 (RDS-REQ-028/029/030/036 - publish, republish, unpublish, and edit-without-republish behavior stay backend-owned)
  test("executes the full stream lifecycle through the live bof-be HTTP boundary", async () => {
    const publishDraftResult = await publishStream(config, "stream-weekend-recap");
    expect(publishDraftResult).toEqual({
      projectionTarget: "/mobile/streams/stream-weekend-recap",
      status: "active",
      streamId: "stream-weekend-recap",
    });

    const publishedDraftProjection = await readRealtimeProjection("stream-weekend-recap");
    expect(publishedDraftProjection).toEqual({
      imageUrl: "https://cdn.example.com/streams/weekend-recap.jpg",
      streamId: "stream-weekend-recap",
      streamUrl: "https://radio.example.com/weekend-recap.m3u8",
      summary: "Highlights and interviews from the last seven days.",
      title: "Weekend Recap",
    });

    const updatedActiveResult = await updateStream(config, "stream-morning-news", {
      imageUrl: "https://cdn.example.com/streams/morning-news-special.jpg",
      streamUrl: "https://radio.example.com/morning-news-special.m3u8",
      summary: "Extended commuter coverage with market opens and weather alerts.",
      title: "Morning News Special",
    });
    expect(updatedActiveResult.streamId).toBe("stream-morning-news");

    const projectionBeforeRepublish = await readRealtimeProjection("stream-morning-news");
    expect(projectionBeforeRepublish).toEqual(buildMorningNewsProjection());

    const republishResult = await publishStream(config, "stream-morning-news");
    expect(republishResult).toEqual({
      projectionTarget: "/mobile/streams/stream-morning-news",
      status: "active",
      streamId: "stream-morning-news",
    });

    const projectionAfterRepublish = await readRealtimeProjection("stream-morning-news");
    expect(projectionAfterRepublish).toEqual({
      imageUrl: "https://cdn.example.com/streams/morning-news-special.jpg",
      streamId: "stream-morning-news",
      streamUrl: "https://radio.example.com/morning-news-special.m3u8",
      summary: "Extended commuter coverage with market opens and weather alerts.",
      title: "Morning News Special",
    });

    const unpublishResult = await unpublishStream(config, "stream-morning-news");
    expect(unpublishResult).toEqual({
      projectionRemoved: true,
      status: "inactive",
      streamId: "stream-morning-news",
    });
    expect(await readRealtimeProjection("stream-morning-news")).toBeNull();

    const publishAgainResult = await publishStream(config, "stream-morning-news");
    expect(publishAgainResult).toEqual({
      projectionTarget: "/mobile/streams/stream-morning-news",
      status: "active",
      streamId: "stream-morning-news",
    });

    expect(await readRealtimeProjection("stream-morning-news")).toEqual({
      imageUrl: "https://cdn.example.com/streams/morning-news-special.jpg",
      streamId: "stream-morning-news",
      streamUrl: "https://radio.example.com/morning-news-special.m3u8",
      summary: "Extended commuter coverage with market opens and weather alerts.",
      title: "Morning News Special",
    });

    const publishedDraftDetail = await getStreamDetail(config, "stream-weekend-recap");
    const republishedActiveDetail = await getStreamDetail(config, "stream-morning-news");
    expect(publishedDraftDetail.status).toBe("active");
    expect(republishedActiveDetail.status).toBe("active");
  });

  // Test: backend lifecycle failures are surfaced to the operator and keep Firestore/RTDB unchanged.
  // Validates: RDS-AC-028 (RDS-REQ-037 - publish and unpublish must fail atomically when realtime projection mutation cannot complete)
  test("surfaces realtime projection failures from the live bof-be HTTP boundary without mutating state", async () => {
    await restartBackendProcessWithOverrides({
      FIREBASE_DATABASE_EMULATOR_HOST: "127.0.0.1:9900",
    });

    const beforeFailedPublish = await getStreamDetail(config, "stream-weekend-recap");
    const failedPublishPromise = publishStream(config, "stream-weekend-recap");
    await expect(failedPublishPromise).rejects.toBeInstanceOf(StreamApiError);
    await expect(failedPublishPromise).rejects.toMatchObject({
      message:
        "Publish requires realtime projection mutation support before the lifecycle contract can succeed.",
      status: 503,
    });
    expect(await getStreamDetail(config, "stream-weekend-recap")).toEqual(beforeFailedPublish);
    expect(await readRealtimeProjection("stream-weekend-recap")).toBeNull();

    const beforeFailedUnpublish = await getStreamDetail(config, "stream-morning-news");
    const failedUnpublishPromise = unpublishStream(config, "stream-morning-news");
    await expect(failedUnpublishPromise).rejects.toBeInstanceOf(StreamApiError);
    await expect(failedUnpublishPromise).rejects.toMatchObject({
      message:
        "Unpublish requires realtime projection mutation support before the lifecycle contract can succeed.",
      status: 503,
    });
    expect(await getStreamDetail(config, "stream-morning-news")).toEqual(beforeFailedUnpublish);
    expect(await readRealtimeProjection("stream-morning-news")).toEqual(buildMorningNewsProjection());
  });
});

async function seedActiveRealtimeProjection() {
  await writeRealtimeProjection("stream-morning-news", buildMorningNewsProjection());
}

function buildMorningNewsProjection() {
  return {
    imageUrl: "https://cdn.example.com/streams/morning-news.jpg",
    streamId: "stream-morning-news",
    streamUrl: "https://radio.example.com/morning-news.m3u8",
    summary: "Fast-moving headlines, weather, and commuter updates.",
    title: "Morning News",
  };
}
