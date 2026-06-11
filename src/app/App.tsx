import { useEffect, useMemo, useState } from "react";

import type { StreamListItem, VisibleStreamAction } from "../entities/stream/model/stream.ts";
import type { AppConfig } from "../shared/config/app-config.ts";
import { MainSurface } from "./components/MainSurface.tsx";
import { MetaRow } from "./components/MetaRow.tsx";
import { SideBar } from "./components/SideBar.tsx";
import { StreamDetails } from "./components/StreamDetails.tsx";
import { StreamList } from "./components/StreamList.tsx";
import { StreamsSurface } from "./components/StreamsSurface.tsx";
import { StreamsToolbar } from "./components/StreamsToolbar.tsx";
import { STREAMS_PER_PAGE, buildMockStreams } from "./mock-streams.ts";
import { resolveOperatorRoute } from "./router.ts";

type AppProps = {
  config: AppConfig;
};

type Banner = {
  tone: "info" | "success";
  text: string;
};

export function App({ config }: AppProps) {
  const [streams, setStreams] = useState(() => buildMockStreams());
  const [pathname, setPathname] = useState(window.location.pathname);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState<Banner | null>({
    tone: "info",
    text: "",
  });

  const route = useMemo(() => resolveOperatorRoute(pathname), [pathname]);

  const filteredStreams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return streams;
    }

    return streams.filter((stream) =>
      [stream.title, stream.summary].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, streams]);

  const totalPages = Math.max(1, Math.ceil(filteredStreams.length / STREAMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleStreams = filteredStreams.slice(
    (safePage - 1) * STREAMS_PER_PAGE,
    safePage * STREAMS_PER_PAGE,
  );

  const selectedStream = useMemo(() => {
    if (route.kind === "stream-detail" || route.kind === "stream-edit") {
      return streams.find((stream) => stream.streamId === route.streamId) ?? visibleStreams[0] ?? streams[0];
    }

    return visibleStreams[0] ?? streams[0];
  }, [route, streams, visibleStreams]);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  useEffect(() => {
    if (!selectedStream) {
      return;
    }

    const selectedIndex = filteredStreams.findIndex((stream) => stream.streamId === selectedStream.streamId);
    if (selectedIndex === -1) {
      return;
    }

    const requiredPage = Math.floor(selectedIndex / STREAMS_PER_PAGE) + 1;
    if (requiredPage !== currentPage) {
      setCurrentPage(requiredPage);
    }
  }, [currentPage, filteredStreams, selectedStream]);

  const metrics = buildMetrics(streams);

  function navigate(nextPath: string) {
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  }

  function handleSelectStream(streamId: string) {
    navigate(`/streams/${streamId}`);
  }

  function handleLifecycleAction(streamId: string, action: VisibleStreamAction) {
    setStreams((currentStreams) =>
      currentStreams.map((stream) => {
        if (stream.streamId !== streamId) {
          return stream;
        }

        if (action === "publish") {
          return {
            ...stream,
            availableActions: ["unpublish", "edit", "view"],
            status: "active",
          };
        }

        if (action === "unpublish") {
          return {
            ...stream,
            availableActions: ["publish", "edit", "view"],
            status: "inactive",
          };
        }

        return stream;
      }),
    );

    if (action === "edit") {
      navigate(`/streams/${streamId}/edit`);
      setBanner({ tone: "info", text: "Edit remains a visual SPA stub in this shell." });
      return;
    }

    if (action === "view") {
      navigate(`/streams/${streamId}`);
      return;
    }

    const verb = action === "publish" ? "published" : "unpublished";
    setBanner({ tone: "success", text: `Visual shell updated: stream ${verb} locally.` });
  }

  return (
    <main className="shell-page">
      <section className="shell-frame">
        <SideBar />
        <MainSurface>
          <StreamsSurface>
            <StreamsToolbar
              metrics={metrics}
              onCreateStream={() => {
                navigate("/streams/new");
              }}
            />

            {banner ? (
              <div className={`flash-banner flash-banner--${banner.tone}${banner.text ? "" : " flash-banner--hidden"}`}>
                {banner.text}
              </div>
            ) : null}

            <section className="workspace-grid">
              <StreamList
                currentPage={safePage}
                onAction={handleLifecycleAction}
                onPageChange={setCurrentPage}
                onQueryChange={(value) => {
                  setQuery(value);
                  setCurrentPage(1);
                }}
                onSelect={handleSelectStream}
                query={query}
                selectedStreamId={selectedStream?.streamId}
                streams={visibleStreams}
                totalPages={totalPages}
                totalStreams={filteredStreams.length}
              />

              {selectedStream ? (
                <StreamDetails
                  detailKicker={detailKicker(route.kind)}
                  footerAction={
                    <button className="analytics-link" type="button">
                      View Analytics ↗
                    </button>
                  }
                  runtimeMeta={
                    <>
                      <MetaRow label="Runtime" value={config.environmentName} />
                      <MetaRow label="App ID" value={config.appId} />
                    </>
                  }
                  stream={selectedStream}
                />
              ) : null}
            </section>
          </StreamsSurface>
        </MainSurface>
      </section>
    </main>
  );
}

function buildMetrics(streams: StreamListItem[]) {
  return [
    { label: "Total Streams", tone: "total", value: String(streams.length) },
    { label: "Live", tone: "active", value: String(streams.filter((stream) => stream.status === "active").length) },
    { label: "Scheduled", tone: "draft", value: String(streams.filter((stream) => stream.status === "draft").length) },
    { label: "Offline", tone: "inactive", value: String(streams.filter((stream) => stream.status === "inactive").length) },
  ] as const;
}

function detailKicker(routeKind: "catalog" | "stream-create" | "stream-detail" | "stream-edit") {
  if (routeKind === "stream-edit") {
    return "Edit route preview";
  }

  if (routeKind === "stream-create") {
    return "Create route preview";
  }

  return "Read-only stream details";
}
