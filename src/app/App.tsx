import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  StreamApiIssue,
  StreamBackendAction,
  StreamCatalogItem,
} from "../entities/stream/model/stream.ts";
import { buildEmptyStreamFormValues, buildStreamFormValues } from "../features/stream-management/model/stream-form.ts";
import { StreamFormCard } from "../features/stream-management/ui/render-stream-management.tsx";
import type { AppConfig } from "../shared/config/app-config.ts";
import {
  StreamApiError,
  createStream,
  deleteStream,
  getStreamDetail,
  listStreams,
  publishStream,
  unpublishStream,
  updateStream,
} from "../shared/api/modules/stream-management.ts";
import { MainSurface } from "./components/MainSurface.tsx";
import { SideBar } from "./components/SideBar.tsx";
import { StreamDetails } from "./components/StreamDetails.tsx";
import { StreamList } from "./components/StreamList.tsx";
import { StreamsSurface } from "./components/StreamsSurface.tsx";
import { StreamsToolbar } from "./components/StreamsToolbar.tsx";
import { resolveOperatorRoute } from "./routes.ts";

type AppProps = {
  config: AppConfig;
};

type Banner = {
  message: string;
  tone: "error" | "success";
};

type CatalogState =
  | { items: StreamCatalogItem[]; kind: "loading" }
  | { items: StreamCatalogItem[]; kind: "loaded" }
  | { items: StreamCatalogItem[]; kind: "error"; message: string };

type DetailState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; stream: Awaited<ReturnType<typeof getStreamDetail>> }
  | { kind: "error"; message: string };

const STREAMS_PER_PAGE = 6;

export function App({ config }: AppProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [catalogState, setCatalogState] = useState<CatalogState>({ items: [], kind: "loading" });
  const [currentPage, setCurrentPage] = useState(1);
  const [detailState, setDetailState] = useState<DetailState>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [query, setQuery] = useState("");

  const route = useMemo(() => resolveOperatorRoute(pathname), [pathname]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void refreshCatalog(config, setCatalogState, setBanner);
  }, [config]);

  useEffect(() => {
    if (route.kind === "catalog" || route.kind === "stream-create") {
      setDetailState({ kind: "idle" });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setDetailState({ kind: "loading" });
    });

    void getStreamDetail(config, route.streamId)
      .then((stream) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setDetailState({ kind: "loaded", stream });
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setDetailState({ kind: "error", message: toOperatorMessage(error, "Unable to load the selected stream.") });
        });
      });

    return () => {
      cancelled = true;
    };
  }, [config, route]);

  const filteredStreams = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return catalogState.items;
    }

    return catalogState.items.filter((stream) =>
      [stream.title, stream.streamId].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [catalogState.items, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStreams.length / STREAMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleStreams = filteredStreams.slice((safePage - 1) * STREAMS_PER_PAGE, safePage * STREAMS_PER_PAGE);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const metrics = useMemo(() => buildMetrics(catalogState.items), [catalogState.items]);

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  }

  async function handleCreate(values: ReturnType<typeof buildEmptyStreamFormValues>) {
    setIsSubmitting(true);
    try {
      const result = await createStream(config, values);
      await refreshCatalog(config, setCatalogState, setBanner);
      setBanner({ message: `Draft stream created as ${result.streamId}.`, tone: "success" });
      navigate(`/streams/${result.streamId}`);
    } catch (error: unknown) {
      setBanner({ message: toOperatorMessage(error, "Unable to create the stream."), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: ReturnType<typeof buildEmptyStreamFormValues>) {
    if (route.kind !== "stream-edit") {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStream(config, route.streamId, values);
      await refreshCatalog(config, setCatalogState, setBanner);
      setBanner({ message: `Stream ${route.streamId} was updated.`, tone: "success" });
      navigate(`/streams/${route.streamId}`);
    } catch (error: unknown) {
      setBanner({ message: toOperatorMessage(error, "Unable to save stream changes."), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(streamId: string) {
    if (!window.confirm(`Delete ${streamId}? This cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteStream(config, streamId);
      await refreshCatalog(config, setCatalogState, setBanner);
      setBanner({ message: `Stream ${streamId} was deleted.`, tone: "success" });
      if ((route.kind === "stream-detail" || route.kind === "stream-edit") && route.streamId === streamId) {
        navigate("/streams");
      }
    } catch (error: unknown) {
      setBanner({ message: toOperatorMessage(error, "Unable to delete the stream."), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLifecycleAction(stream: StreamCatalogItem, action: "publish" | "unpublish") {
    const successMessage = buildLifecycleSuccessMessage(stream, action);
    const failureMessage = buildLifecycleFailureMessage(stream, action);

    setIsSubmitting(true);
    try {
      if (action === "publish") {
        await publishStream(config, stream.streamId);
      } else {
        await unpublishStream(config, stream.streamId);
      }

      await refreshCatalog(config, setCatalogState, setBanner);

      if ((route.kind === "stream-detail" || route.kind === "stream-edit") && route.streamId === stream.streamId) {
        await refreshDetail(config, stream.streamId, setDetailState);
      }

      setBanner({ message: successMessage, tone: "success" });
    } catch (error: unknown) {
      setBanner({ message: toOperatorMessage(error, failureMessage), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAction(stream: StreamCatalogItem, action: StreamBackendAction) {
    if (action === "view") {
      navigate(`/streams/${stream.streamId}`);
      return;
    }

    if (action === "edit") {
      navigate(`/streams/${stream.streamId}/edit`);
      return;
    }

    if (action === "delete") {
      void handleDelete(stream.streamId);
      return;
    }

    void handleLifecycleAction(stream, action);
  }

  return (
    <main className="shell-page">
      <section className="shell-frame">
        <SideBar />
        <MainSurface>
          <StreamsSurface>
            <StreamsToolbar metrics={metrics} onCreateStream={() => navigate("/streams/new")} />

            {banner ? (
              <div className={`flash-banner flash-banner--${banner.tone}`} role="status">
                {banner.message}
              </div>
            ) : null}

            <section className="workspace-grid">
              <StreamList
                currentPage={safePage}
                isLoading={catalogState.kind === "loading"}
                onAction={handleAction}
                onPageChange={setCurrentPage}
                onQueryChange={(value) => {
                  setQuery(value);
                  setCurrentPage(1);
                }}
                onSelect={(streamId) => navigate(`/streams/${streamId}`)}
                query={query}
                selectedStreamId={route.kind === "stream-detail" || route.kind === "stream-edit" ? route.streamId : undefined}
                streams={visibleStreams}
                totalPages={totalPages}
                totalStreams={filteredStreams.length}
              />

              {renderPanel({
                detailState,
                isSubmitting,
                onCancelCreate: () => navigate("/streams"),
                onCancelEdit: () => {
                  if (route.kind === "stream-edit") {
                    navigate(`/streams/${route.streamId}`);
                  }
                },
                onCreate: handleCreate,
                onUpdate: handleUpdate,
                route,
              })}
            </section>
          </StreamsSurface>
        </MainSurface>
      </section>
    </main>
  );
}

function renderPanel({
  detailState,
  isSubmitting,
  onCancelCreate,
  onCancelEdit,
  onCreate,
  onUpdate,
  route,
}: {
  detailState: DetailState;
  isSubmitting: boolean;
  onCancelCreate: () => void;
  onCancelEdit: () => void;
  onCreate: (values: ReturnType<typeof buildEmptyStreamFormValues>) => Promise<void>;
  onUpdate: (values: ReturnType<typeof buildEmptyStreamFormValues>) => Promise<void>;
  route: ReturnType<typeof resolveOperatorRoute>;
}) {
  if (route.kind === "stream-create") {
    return (
      <StreamFormCard
        initialValues={buildEmptyStreamFormValues()}
        isSubmitting={isSubmitting}
        mode="create"
        onCancel={onCancelCreate}
        onSubmit={onCreate}
      />
    );
  }

  if (route.kind === "stream-edit") {
    if (detailState.kind === "loaded") {
      return (
        <StreamFormCard
          initialValues={buildStreamFormValues(detailState.stream)}
          isSubmitting={isSubmitting}
          mode="edit"
          onCancel={onCancelEdit}
          onSubmit={onUpdate}
        />
      );
    }

    return <section className="detail-card detail-card--empty">{detailState.kind === "error" ? detailState.message : "Loading stream editor..."}</section>;
  }

  if (route.kind === "stream-detail") {
    if (detailState.kind === "loaded") {
      return <StreamDetails stream={detailState.stream} />;
    }

    return <section className="detail-card detail-card--empty">{detailState.kind === "error" ? detailState.message : "Loading stream details..."}</section>;
  }

  return <section className="detail-card detail-card--empty">Select a stream to review its read-only details or create a new draft record.</section>;
}

async function refreshCatalog(
  config: AppConfig,
  setCatalogState: Dispatch<SetStateAction<CatalogState>>,
  setBanner: Dispatch<SetStateAction<Banner | null>>,
) {
  startTransition(() => {
    setCatalogState((current) => ({ items: current.items, kind: "loading" }));
  });

  try {
    const items = await listStreams(config);
    startTransition(() => {
      setCatalogState({ items, kind: "loaded" });
    });
  } catch (error: unknown) {
    const message = toOperatorMessage(error, "Unable to load the stream catalog.");
    startTransition(() => {
      setCatalogState((current) => ({ items: current.items, kind: "error", message }));
    });
    setBanner({ message, tone: "error" });
  }
}

async function refreshDetail(
  config: AppConfig,
  streamId: string,
  setDetailState: Dispatch<SetStateAction<DetailState>>,
) {
  startTransition(() => {
    setDetailState({ kind: "loading" });
  });

  try {
    const stream = await getStreamDetail(config, streamId);
    startTransition(() => {
      setDetailState({ kind: "loaded", stream });
    });
  } catch (error: unknown) {
    const message = toOperatorMessage(error, "Unable to load the selected stream.");
    startTransition(() => {
      setDetailState({ kind: "error", message });
    });
  }
}

function buildMetrics(streams: StreamCatalogItem[]) {
  return [
    { label: "Total Streams", tone: "total", value: String(streams.length) },
    { label: "Live", tone: "active", value: String(streams.filter((stream) => stream.status === "active").length) },
    { label: "Draft", tone: "draft", value: String(streams.filter((stream) => stream.status === "draft").length) },
    { label: "Inactive", tone: "inactive", value: String(streams.filter((stream) => stream.status === "inactive").length) },
  ] as const;
}

function toOperatorMessage(error: unknown, fallback: string) {
  if (error instanceof StreamApiError) {
    if (error.status === 400 && error.issues.length > 0) {
      return buildValidationSummary(error.issues);
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
}

function buildValidationSummary(issues: StreamApiIssue[]) {
  return `Review the highlighted fields and URL formats before saving. (${issues.map((issue) => issue.field).join(", ")})`;
}

function buildLifecycleSuccessMessage(stream: StreamCatalogItem, action: "publish" | "unpublish") {
  if (action === "unpublish") {
    return `Stream ${stream.streamId} was unpublished and removed from mobile availability.`;
  }

  if (stream.status === "active") {
    return `Stream ${stream.streamId} was republished with the latest saved fields.`;
  }

  if (stream.status === "inactive") {
    return `Stream ${stream.streamId} was published again and is now live.`;
  }

  return `Stream ${stream.streamId} was published and is now live.`;
}

function buildLifecycleFailureMessage(stream: StreamCatalogItem, action: "publish" | "unpublish") {
  if (action === "unpublish") {
    return "Unable to unpublish the stream.";
  }

  if (stream.status === "active") {
    return "Unable to republish the stream.";
  }

  if (stream.status === "inactive") {
    return "Unable to publish the stream again.";
  }

  return "Unable to publish the stream.";
}
