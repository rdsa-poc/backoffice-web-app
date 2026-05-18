import http from "node:http";
import { pathToFileURL } from "node:url";

import { renderHomePage } from "./app.ts";
import { loadAppConfig, type AppConfig } from "./config.ts";

function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  config: AppConfig,
): void {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        environmentName: config.environmentName,
        service: "bof-web",
        status: "ok",
      }),
    );
    return;
  }

  if (request.url === "/" || request.url === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderHomePage(config));
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not Found" }));
}

export function createServer(config: AppConfig): http.Server {
  return http.createServer((request, response) => handleRequest(request, response, config));
}

export function startServer(config: AppConfig): Promise<http.Server> {
  const server = createServer(config);
  return new Promise((resolve) => {
    server.listen(config.port, () => resolve(server));
  });
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const config = loadAppConfig();
  await startServer(config);
  console.log(
    `bof-web shell listening on http://localhost:${config.port} for ${config.environmentName}`,
  );
}
