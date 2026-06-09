import type { AppConfig } from "../shared/config/app-config.ts";
import { renderOperatorShellPage } from "../pages/operator-shell.ts";
import { resolveOperatorRoute } from "./routes.ts";

export function renderSpaDocument(config: AppConfig, pathname = "/"): string {
  const route = resolveOperatorRoute(pathname);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Radiosa Backoffice Web App</title>
  </head>
  <body data-route="${route.kind}">
    <div id="app-root">${renderOperatorShellPage(config)}</div>
    <script type="application/json" id="app-config">${escapeJson(config)}</script>
  </body>
</html>`;
}

function escapeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
