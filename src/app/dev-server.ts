import http from "node:http";
import { pathToFileURL } from "node:url";

import { renderSpaDocument } from "./runtime.ts";
import { loadAppConfig, type AppConfig } from "../shared/config/app-config.ts";

async function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  config: AppConfig,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        environmentName: config.environmentName,
        runtimeBoundary: "browser-spa",
        service: "bof-web",
        status: "ok",
      }),
    );
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(renderSpaDocument(config, url.pathname));
}

export async function startDevServer(config: AppConfig = loadAppConfig()): Promise<http.Server> {
  const server = http.createServer((request, response) => {
    void handleRequest(request, response, config);
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, resolve);
  });

  return server;
}

async function main(): Promise<void> {
  const config = loadAppConfig();
  const server = await startDevServer(config);
  process.stdout.write(
    `bof-web browser SPA shell available at http://localhost:${config.port}\n`,
  );
  server.on("close", () => {
    process.stdout.write("bof-web dev server stopped\n");
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}
