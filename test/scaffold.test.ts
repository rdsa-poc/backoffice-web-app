import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import type { StreamDetail } from "../src/entities/stream/model/stream.ts";
import { bootstrapBackofficeApp } from "../src/index.ts";
import {
  buildEditStreamFormState,
  buildEmptyStreamFormState,
  normalizeStreamFormInput,
} from "../src/features/stream-management/model/stream-form.ts";
import {
  renderHomePage,
  renderStreamDetailPage,
  renderStreamFormPage,
} from "../src/features/stream-management/ui/render-stream-management.ts";
import { resolveOperatorRoute } from "../src/app/routes.ts";
import { renderSpaDocument } from "../src/app/runtime.ts";
import {
  createStreamWithValidation as createStream,
  loadStreamCatalog,
  loadStreamDetail,
  performStreamActionWithValidation as performStreamAction,
  type StreamCatalogState,
} from "../src/shared/api/modules/stream-management.ts";
import {
  MissingConfigurationError,
  parseEnvironmentFile,
  resolveAppConfig,
} from "../src/shared/config/app-config.ts";

const sharedEnvUrl = new URL("../../.env", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const readmeUrl = new URL("../README.md", import.meta.url);

function buildConfig() {
  return {
    appId: "bof-web",
    apiBaseUrl: "http://localhost:8080",
    environmentName: "local",
    port: 3000,
  };
}

function buildCatalogState(): StreamCatalogState {
  return {
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
      {
        availableActions: ["publish", "edit", "view", "delete"],
        imageUrl: "https://cdn.example.com/streams/weekend-recap.jpg",
        position: 3,
        status: "draft",
        streamId: "stream-weekend-recap",
        title: "Weekend Recap",
      },
    ],
    kind: "loaded",
  };
}

function buildDetail(): StreamDetail {
  return {
    createdAt: "2026-05-20T11:00:00.000Z",
    imageUrl: "https://cdn.example.com/streams/night-jazz.jpg",
    projectionSyncState: "in_sync",
    publishedAt: "2026-05-20T11:10:00.000Z",
    status: "inactive",
    streamId: "stream-night-jazz",
    streamUrl: "https://radio.example.com/night-jazz.m3u8",
    summary: "Late-night jazz programming with host-led transitions.",
    title: "Night Jazz",
    updatedAt: "2026-05-20T11:30:00.000Z",
  };
}

// Test: renders the stream management list with operator CRUD controls and action routes.
// Validates: RDS-AC-008, RDS-AC-029, RDS-AC-030
test("backoffice web renders the stream catalog list with actionable menu entries", () => {
  const html = renderHomePage(buildConfig(), buildCatalogState());

  assert.match(html, /Stream Management/);
  assert.match(html, /Create Stream/);
  assert.match(html, /#1/);
  assert.match(html, /#2/);
  assert.match(html, /#3/);
  assert.match(html, /Actions for Morning News/);
  assert.match(html, /href="\/streams\/stream-morning-news"/);
  assert.match(html, /Activate \(Phase 2\)/);
  assert.match(html, /Deactivate \(Phase 2\)/);
  assert.match(html, /Publish \(Phase 2\)/);
  assert.match(html, /href="\/streams\/stream-weekend-recap\/edit"/);
  assert.match(html, /action="\/streams\/stream-night-jazz\/actions\/delete"/);
  assert.match(html, /action="\/streams\/stream-weekend-recap\/actions\/delete"/);
  assert.doesNotMatch(html, /stream-night-jazz\/actions\/activate/);
  assert.doesNotMatch(html, /stream-weekend-recap\/actions\/publish/);
  assert.doesNotMatch(html, /stream-morning-news\/actions\/delete/);
});

// Test: renders the compact cover image and lower-left status icon semantics.
// Validates: RDS-AC-008
test("backoffice web renders compact cover art with status overlays", () => {
  const html = renderHomePage(buildConfig(), buildCatalogState());

  assert.match(html, /class="stream-thumbnail"/);
  assert.match(html, /width: 32px;/);
  assert.match(html, /height: 32px;/);
  assert.match(html, /class="status-icon"/);
  assert.match(html, /data-availability="on-air"/);
  assert.match(html, /data-availability="offline"/);
  assert.match(html, /left: -1px;/);
  assert.match(html, /bottom: -1px;/);
});

// Test: renders the create/edit form scaffold for operator mutations.
// Validates: RDS-AC-030
test("backoffice web renders stream creation and editing forms", () => {
  const createHtml = renderStreamFormPage(buildConfig(), buildEmptyStreamFormState());
  const editHtml = renderStreamFormPage(buildConfig(), buildEditStreamFormState(buildDetail()));

  assert.match(createHtml, /Create Draft Stream/);
  assert.match(createHtml, /action="\/streams"/);
  assert.match(createHtml, /name="title"/);
  assert.match(editHtml, /Edit Stream/);
  assert.match(editHtml, /action="\/streams\/stream-night-jazz"/);
  assert.match(editHtml, /Late-night jazz programming with host-led transitions\./);
});

// Test: renders the stream detail view with status transitions and metadata.
// Validates: RDS-AC-030
test("backoffice web renders stream detail actions and metadata", () => {
  const html = renderStreamDetailPage(buildConfig(), buildDetail());

  assert.match(html, /Stream Detail/);
  assert.match(html, /Night Jazz/);
  assert.match(html, /stream-night-jazz/);
  assert.match(html, /action="\/streams\/stream-night-jazz\/actions\/delete"/);
  assert.match(html, /Lifecycle action visible for this status: <strong>Activate<\/strong>/);
  assert.doesNotMatch(html, /stream-night-jazz\/actions\/activate/);
  assert.match(html, /https:\/\/radio\.example\.com\/night-jazz\.m3u8/);
});

// Test: exposes an operator-visible error state when the stream list request fails.
// Validates: RDS-REQ-038
test("backoffice web renders an error state when the catalog is unavailable", async () => {
  const catalog = await loadStreamCatalog(buildConfig(), async () => {
    throw new Error("connect ECONNREFUSED");
  });
  const html = renderHomePage(buildConfig(), catalog);

  assert.equal(catalog.kind, "error");
  assert.match(html, /Stream catalog unavailable/);
  assert.match(html, /Backoffice BE APP request failed: connect ECONNREFUSED/);
});

// Test: loads the stream catalog from the documented backend endpoint.
// Validates: RDS-AC-063
test("backoffice web requests the stream catalog from GET /api/streams", async () => {
  const seenUrls: string[] = [];
  const catalog = await loadStreamCatalog(buildConfig(), async (input) => {
    seenUrls.push(String(input));
    return new Response(
      JSON.stringify({
        items: [
          {
            availableActions: ["edit"],
            imageUrl: "https://cdn.example.com/streams/indie-preview.jpg",
            position: 5,
            status: "inactive",
            streamId: "stream-indie-preview",
            title: "Indie Preview",
          },
        ],
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      },
    );
  });

  assert.deepEqual(seenUrls, ["http://localhost:8080/api/streams"]);
  assert.deepEqual(catalog, {
    items: [
      {
        availableActions: ["edit"],
        imageUrl: "https://cdn.example.com/streams/indie-preview.jpg",
        position: 5,
        status: "inactive",
        streamId: "stream-indie-preview",
        title: "Indie Preview",
      },
    ],
    kind: "loaded",
  });
});

// Test: requests the stream detail endpoint for the operator view flow.
// Validates: RDS-AC-063
test("backoffice web requests the stream detail endpoint", async () => {
  const seenUrls: string[] = [];
  const response = await loadStreamDetail(buildConfig(), "stream-night-jazz", async (input) => {
    seenUrls.push(String(input));
    return new Response(JSON.stringify(buildDetail()), {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    });
  });

  assert.deepEqual(seenUrls, ["http://localhost:8080/api/streams/stream-night-jazz"]);
  assert.equal(response.ok, true);
});

// Test: creates a new draft stream through the backend endpoint.
// Validates: RDS-AC-063
test("backoffice web posts draft creation to POST /api/streams", async () => {
  const requests: Array<{ body: string; method: string; url: string }> = [];
  const result = await createStream(
    buildConfig(),
    {
      imageUrl: "https://cdn.example.com/streams/late-signals.jpg",
      streamUrl: "https://radio.example.com/late-signals.m3u8",
      summary: "After-hours interviews and listener call-ins.",
      title: "Late Signals",
    },
    async (input, init) => {
      requests.push({
        body: String(init?.body),
        method: String(init?.method),
        url: String(input),
      });
      return new Response(JSON.stringify({ status: "draft", streamId: "stream-late-signals" }), {
        headers: { "content-type": "application/json" },
        status: 201,
      });
    },
  );

  assert.equal(result.kind, "success");
  assert.deepEqual(requests, [
    {
      body: JSON.stringify({
        imageUrl: "https://cdn.example.com/streams/late-signals.jpg",
        streamUrl: "https://radio.example.com/late-signals.m3u8",
        summary: "After-hours interviews and listener call-ins.",
        title: "Late Signals",
      }),
      method: "POST",
      url: "http://localhost:8080/api/streams",
    },
  ]);
});

// Test: surfaces explicit backend validation details to the operator.
// Validates: RDS-REQ-039
test("backoffice web preserves validation errors returned by the backend", async () => {
  const result = await createStream(
    buildConfig(),
    {
      imageUrl: "notaurl",
      streamUrl: "notaurl",
      summary: "",
      title: "",
    },
    async () =>
      new Response(
        JSON.stringify({
          issues: [
            { field: "title", message: "title is required." },
            { field: "summary", message: "summary is required." },
            { field: "streamUrl", message: "streamUrl must be a valid http or https URL." },
            { field: "imageUrl", message: "imageUrl must be a valid http or https URL." },
          ],
        }),
        {
          headers: { "content-type": "application/json" },
          status: 400,
        },
      ),
  );

  assert.equal(result.kind, "error");
  if (result.kind === "error") {
    assert.match(result.message, /title: title is required\./);
    assert.equal(result.fieldErrors?.title, "title is required.");
    assert.equal(result.fieldErrors?.summary, "summary is required.");
  }
});

// Test: routes delete requests through the backend.
// Validates: RDS-AC-063
test("backoffice web routes delete actions through the backend", async () => {
  const requests: Array<{ body?: string; method: string; url: string }> = [];

  const deleteResult = await performStreamAction(
    buildConfig(),
    "stream-night-jazz",
    "delete",
    async (input, init) => {
      requests.push({
        body: init?.body === undefined ? undefined : String(init.body),
        method: String(init?.method),
        url: String(input),
      });
      return new Response(JSON.stringify({ deleted: true, streamId: "stream-night-jazz" }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    },
  );

  assert.equal(deleteResult.kind, "success");
  assert.deepEqual(requests, [
    {
      body: undefined,
      method: "DELETE",
      url: "http://localhost:8080/api/streams/stream-night-jazz",
    },
  ]);
});

// Test: surfaces the active-stream delete rejection explicitly.
// Validates: RDS-AC-063
test("backoffice web surfaces active-stream delete rejections", async () => {
  const result = await performStreamAction(
    buildConfig(),
    "stream-morning-news",
    "delete",
    async () =>
      new Response(
        JSON.stringify({
          error: "ACTIVE_STREAM_DELETE_FORBIDDEN",
          message: "Active streams must be deactivated before deletion.",
        }),
        {
          headers: { "content-type": "application/json" },
          status: 409,
        },
      ),
  );

  assert.equal(result.kind, "error");
  if (result.kind === "error") {
    assert.equal(result.message, "Active streams must be deactivated before deletion.");
    assert.equal(result.statusCode, 409);
  }
});

// Test: publishes the required development entrypoints.
// Validates: RDS-AC-029
test("backoffice web scaffold declares startup commands", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
    scripts: Record<string, string>;
  };
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(packageJson.scripts.dev, "node --watch --experimental-strip-types src/app/dev-server.ts");
  assert.equal(packageJson.scripts.start, "node --experimental-strip-types src/app/dev-server.ts");
  assert.match(readme, /npm run dev/);
  assert.match(readme, /npm run start/);
  assert.match(readme, /http:\/\/localhost:3000/);
});

// Test: resolves the shared local configuration convention from the shared root contract file.
// Validates: RDS-AC-061, RDS-AC-062
test("backoffice web scaffold resolves the documented environment convention", () => {
  const environment = parseEnvironmentFile(readFileSync(sharedEnvUrl, "utf8"));
  const config = resolveAppConfig(environment);
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(config.appId, "bof-web");
  assert.equal(config.environmentName, "local");
  assert.equal(config.apiBaseUrl, "http://localhost:8080");
  assert.match(readme, /shared root `\.env` file/i);
  assert.match(readme, /RADIOSA_ENVIRONMENT/);
  assert.match(readme, /BOF_BE_BASE_URL/);
  assert.match(readFileSync(sharedEnvUrl, "utf8"), /^BOF_BE_BASE_URL=http:\/\/localhost:8080$/m);
});

// Test: reports exactly which required configuration values are missing.
// Validates: RDS-AC-061
test("backoffice web scaffold reports missing configuration keys", () => {
  assert.throws(
    () => resolveAppConfig({}),
    (error: unknown) => {
      assert.ok(error instanceof MissingConfigurationError);
      assert.deepEqual(error.missingKeys, ["RADIOSA_ENVIRONMENT", "BOF_BE_BASE_URL"]);
      assert.match(
        error.message,
        /Missing required configuration values for bof-web: RADIOSA_ENVIRONMENT, BOF_BE_BASE_URL/,
      );
      return true;
    },
  );
});

// Test: resolves a client-side route boundary and bootstraps the SPA entrypoint.
// Validates: RDS-AC-031, RDS-AC-032
test("backoffice web exposes a browser SPA route boundary", () => {
  assert.deepEqual(resolveOperatorRoute("/streams/new"), { kind: "stream-create" });
  assert.deepEqual(resolveOperatorRoute("/streams/stream-night-jazz/edit"), {
    kind: "stream-edit",
    streamId: "stream-night-jazz",
  });

  const bootstrap = bootstrapBackofficeApp(buildConfig(), "/streams/stream-night-jazz");
  assert.deepEqual(bootstrap.route, {
    kind: "stream-detail",
    streamId: "stream-night-jazz",
  });
});

// Test: serves one SPA shell document from the runtime boundary without workflow POST routes.
// Validates: RDS-AC-031, RDS-AC-032
test("backoffice web runtime renders a single SPA shell document", () => {
  const html = renderSpaDocument(buildConfig(), "/streams/new");

  assert.match(html, /id="app-root"/);
  assert.match(html, /data-route="stream-create"/);
  assert.match(html, /type="application\/json" id="app-config"/);
  assert.match(html, /Browser SPA boundary/);
  assert.doesNotMatch(html, /<form action="\/api\//);
});

// Test: keeps the agreed SPA directory layout in the repository.
// Validates: RDS-AC-032
test("backoffice web keeps the SPA baseline folder structure", () => {
  for (const relativePath of [
    "../src/app/dev-server.ts",
    "../src/app/routes.ts",
    "../src/entities/stream/model/stream.ts",
    "../src/features/stream-management/model/stream-form.ts",
    "../src/features/stream-management/ui/render-stream-management.ts",
    "../src/pages/operator-shell.ts",
    "../src/shared/api/base-client.ts",
    "../src/shared/api/modules/stream-management.ts",
    "../src/shared/config/app-config.ts",
    "../src/index.ts",
  ]) {
    assert.equal(existsSync(new URL(relativePath, import.meta.url)), true, relativePath);
  }
});

// Test: normalizes form input at the feature boundary instead of inside a server route.
// Validates: RDS-AC-031
test("backoffice web normalizes operator input in the frontend feature layer", () => {
  assert.deepEqual(
    normalizeStreamFormInput({
      imageUrl: " https://cdn.example.com/cover.png ",
      streamUrl: " https://radio.example.com/live.m3u8 ",
      summary: "  Frontend-owned input cleanup. ",
      title: " Night Shift ",
    }),
    {
      imageUrl: "https://cdn.example.com/cover.png",
      streamUrl: "https://radio.example.com/live.m3u8",
      summary: "Frontend-owned input cleanup.",
      title: "Night Shift",
    },
  );
});
