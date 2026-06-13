// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { App } from "../../src/app/App.tsx";
import { buildCatalogFixture, buildDetailFixture } from "../helpers/stream-fixtures.ts";

const api = vi.hoisted(() => {
  class MockStreamApiError extends Error {
    readonly issues: Array<{ field: string; message: string }>;
    readonly status: number;

    constructor(status: number, message: string, issues: Array<{ field: string; message: string }> = []) {
      super(message);
      this.name = "StreamApiError";
      this.status = status;
      this.issues = issues;
    }
  }

  return {
    StreamApiError: MockStreamApiError,
    createStream: vi.fn(),
    deleteStream: vi.fn(),
    getStreamDetail: vi.fn(),
    listStreams: vi.fn(),
    publishStream: vi.fn(),
    unpublishStream: vi.fn(),
    updateStream: vi.fn(),
  };
});

vi.mock("../../src/shared/api/modules/stream-management.ts", () => api);

const config = {
  apiBaseUrl: "http://127.0.0.1:8080",
  appId: "bof-web",
  environmentName: "test",
} as const;

function renderAppAt(pathname = "/streams") {
  window.history.pushState({}, "", pathname);
  return render(<App config={config} />);
}

describe("App UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listStreams.mockResolvedValue(buildCatalogFixture());
    api.getStreamDetail.mockImplementation(async (_config: unknown, streamId: string) =>
      buildDetailFixture({ streamId, title: streamId === "stream-late-signals" ? "Late Signals" : "Night Jazz" }),
    );
    api.createStream.mockResolvedValue({ status: "draft", streamId: "stream-late-signals" });
    api.updateStream.mockResolvedValue({
      status: "draft",
      streamId: "stream-night-jazz",
      updatedAt: "2026-06-11T09:00:00.000Z",
    });
    api.publishStream.mockResolvedValue({
      projectionTarget: "/mobile/streams/stream-night-jazz",
      status: "active",
      streamId: "stream-night-jazz",
    });
    api.unpublishStream.mockResolvedValue({
      projectionRemoved: true,
      status: "inactive",
      streamId: "stream-morning-news",
    });
    api.deleteStream.mockResolvedValue({ deleted: true, streamId: "stream-night-jazz" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  test("renders the catalog and filters the current list in the React shell", async () => {
    renderAppAt("/streams");

    expect(await screen.findByText("Morning News")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Streams" })).toBeTruthy();
    expect(screen.getByText("Total Streams")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Search by title or stream ID..."), {
      target: { value: "night" },
    });

    await waitFor(() => {
      expect(screen.getByText("Night Jazz")).toBeTruthy();
      expect(screen.queryByText("Morning News")).toBeNull();
    });
  });

  // Test: action menu visibility follows status-specific CRUD rules.
  // Validates: RDS-AC-024 (RDS-REQ-034 - delete appears only for draft/inactive streams)
  test("shows delete only for draft and inactive streams in the contextual actions menu", async () => {
    renderAppAt("/streams");

    expect(await screen.findByText("Morning News")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Morning News" }));

    expect(screen.getByRole("button", { name: "View Details" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Night Jazz" }));

    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  // Test: lifecycle action labels stay aligned with the backend status contract.
  // Validates: RDS-AC-016, RDS-AC-017, RDS-AC-018 (RDS-REQ-028/029/030 - publish, republish, and unpublish actions are exposed only when valid)
  test("shows publish lifecycle actions with status-specific labels", async () => {
    renderAppAt("/streams");

    expect(await screen.findByText("Morning News")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Morning News" }));

    expect(screen.getByRole("button", { name: "Republish" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unpublish" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Morning News" }));
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Night Jazz" }));

    expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Unpublish" })).toBeNull();
  });

  // Test: choosing the view action opens a read-only detail view with stream metadata.
  // Validates: RDS-AC-023 (RDS-REQ-034 - view action renders image, title, status, and created time)
  test("opens the read-only detail panel from the view action", async () => {
    renderAppAt("/streams");

    expect(await screen.findByText("Night Jazz")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Night Jazz" }));
    fireEvent.click(screen.getByRole("button", { name: "View Details" }));

    expect(await screen.findByText("Read-only stream detail")).toBeTruthy();
    expect(api.getStreamDetail).toHaveBeenCalledWith(config, "stream-night-jazz");
    expect(screen.getByRole("img", { name: "Night Jazz artwork" })).toBeTruthy();
    expect(screen.getAllByText("stream-night-jazz")).toHaveLength(2);
    expect(screen.getByText(formatDetailDateTime("2026-06-10T09:00:00.000Z"))).toBeTruthy();
  });

  test("submits the create form and navigates to the new detail panel", async () => {
    api.listStreams
      .mockResolvedValueOnce(buildCatalogFixture())
      .mockResolvedValueOnce([
        {
          availableActions: ["view", "edit", "delete"],
          createdAt: "2026-06-12T09:00:00.000Z",
          imageUrl: "https://cdn.example.com/streams/late-signals.jpg",
          position: 1,
          status: "draft",
          streamId: "stream-late-signals",
          title: "Late Signals",
        },
        ...buildCatalogFixture(),
      ]);

    renderAppAt("/streams/new");

    await screen.findByText("Morning News");

    fireEvent.change(screen.getByPlaceholderText("Night Jazz"), { target: { value: "  Late Signals  " } });
    fireEvent.change(screen.getByPlaceholderText("https://radio.example.com/night-jazz.m3u8"), {
      target: { value: " https://radio.example.com/late-signals.m3u8 " },
    });
    fireEvent.change(screen.getByPlaceholderText("https://cdn.example.com/streams/night-jazz.jpg"), {
      target: { value: " https://cdn.example.com/streams/late-signals.jpg " },
    });
    fireEvent.change(screen.getByPlaceholderText("Late-night jazz programming with host-led transitions."), {
      target: { value: "  After-hours interviews and listener call-ins.  " },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Create Stream$/ }));

    await waitFor(() => {
      expect(api.createStream).toHaveBeenCalledWith(
        config,
        {
          imageUrl: "https://cdn.example.com/streams/late-signals.jpg",
          streamUrl: "https://radio.example.com/late-signals.m3u8",
          summary: "After-hours interviews and listener call-ins.",
          title: "Late Signals",
        },
      );
    });

    expect(await screen.findByText("Draft stream created as stream-late-signals.")).toBeTruthy();
    expect(await screen.findByText("Late Signals")).toBeTruthy();
  });

  // Test: publish-again waits for the backend response and refreshed catalog before showing the stream as live.
  // Validates: RDS-AC-016 and RDS-AC-028 (RDS-REQ-028 and RDS-REQ-037 - lifecycle success/failure stay backend-driven without optimistic mutation)
  test("publishes an inactive stream through the backend and refreshes the catalog state", async () => {
    api.listStreams
      .mockResolvedValueOnce(buildCatalogFixture())
      .mockResolvedValueOnce([
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
          availableActions: ["publish", "unpublish", "edit", "view"],
          createdAt: "2026-06-09T09:00:00.000Z",
          imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
          position: 2,
          status: "active",
          streamId: "stream-night-jazz",
          title: "Night Jazz",
        },
        buildCatalogFixture()[2]!,
      ]);

    renderAppAt("/streams");

    expect(await screen.findByText("Night Jazz")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Night Jazz" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(api.publishStream).toHaveBeenCalledWith(config, "stream-night-jazz");
    });

    expect(await screen.findByText("Stream stream-night-jazz was published again and is now live.")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
    });
  });

  test("shows backend publish failures in the operator banner", async () => {
    api.publishStream.mockRejectedValue(new api.StreamApiError(503, "Publish sync failed."));

    renderAppAt("/streams");

    expect(await screen.findByText("Night Jazz")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Night Jazz" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publish sync failed.")).toBeTruthy();
  });
});

function formatDetailDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
