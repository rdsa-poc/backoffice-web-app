import type { StreamCatalogState } from "../shared/api/modules/stream-management.ts";
import type { AppConfig } from "../shared/config/app-config.ts";
import { renderHomePage } from "../features/stream-management/ui/render-stream-management.ts";

export function renderOperatorShellPage(config: AppConfig): string {
  const placeholderCatalog: StreamCatalogState = {
    items: [
      {
        availableActions: ["deactivate", "edit", "view"],
        imageUrl: "https://cdn.example.com/streams/morning-news.jpg",
        position: 1,
        status: "active",
        streamId: "stream-morning-news",
        title: "Morning News",
      },
      {
        availableActions: ["activate", "edit", "view", "delete"],
        imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
        position: 2,
        status: "inactive",
        streamId: "stream-night-jazz",
        title: "Night Jazz",
      },
    ],
    kind: "loaded",
  };

  return renderHomePage(config, placeholderCatalog, {
    text: "Frontend shell preview only. Business data loading stays in the shared browser API layer.",
    tone: "success",
  });
}
