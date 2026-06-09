import type {
  StreamDetail,
  StreamListItem,
} from "../../../entities/stream/model/stream.ts";
import type {
  StreamFormInput,
  StreamFormState,
} from "../model/stream-form.ts";
import type { AppConfig } from "../../../shared/config/app-config.ts";
import type { StreamCatalogState } from "../../../shared/api/modules/stream-management.ts";

type FlashMessage = { tone: "error" | "success"; text: string };

export function renderHomePage(
  config: AppConfig,
  catalog: StreamCatalogState,
  flash?: FlashMessage,
): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Radiosa Backoffice Stream Management</title>
    <style>
      body { font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif; margin: 0; background: #f7f3ec; color: #11202b; }
      main { margin: 0 auto; max-width: 960px; padding: 32px 20px 64px; }
      .page-shell, .catalog-list, .stream-card, .flash-banner { display: grid; gap: 16px; }
      .hero, .catalog-panel, .stream-card, .detail-card, .form-card { background: rgba(255,255,255,0.92); border-radius: 24px; box-shadow: 0 18px 40px rgba(17, 32, 43, 0.1); padding: 24px; }
      .catalog-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
      .button-link, button { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 10px 16px; border: 1px solid #11202b; background: #11202b; color: #fff; text-decoration: none; cursor: pointer; }
      .ghost-link { background: transparent; color: #11202b; }
      .stream-thumbnail { width: 32px; height: 32px; border-radius: 10px; position: relative; object-fit: cover; display: block; }
      .status-icon { position: absolute; left: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 999px; border: 2px solid #fff; }
      .status-icon[data-availability="on-air"] { background: #0f8b4c; }
      .status-icon[data-availability="offline"] { background: #8a6b24; }
      .actions-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .flash-banner { padding: 12px 14px; border-radius: 18px; background: ${flash?.tone === "error" ? "#ffe9e4" : "#e8f5e9"}; }
      .field-error { color: #aa2e25; font-size: 0.92rem; }
      .field-stack { display: grid; gap: 8px; margin-bottom: 12px; }
      input, textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #c9c2b8; font: inherit; }
      textarea { min-height: 120px; }
      .detail-grid { display: grid; gap: 16px; }
    </style>
  </head>
  <body>
    <main>
      <div class="page-shell">
        <section class="hero">
          <p>Browser SPA boundary for operator workflows. Backend discovery target: <strong>${escapeHtml(config.apiBaseUrl)}</strong></p>
          <h1>Stream Management</h1>
          <p>The operator placeholder surface stays on the frontend side while HTTP discovery remains isolated in the shared API layer.</p>
        </section>
        ${flash ? `<div class="flash-banner">${escapeHtml(flash.text)}</div>` : ""}
        <section class="catalog-panel">
          <div class="catalog-header">
            <div>
              <h2>Operator catalog</h2>
              <p>Smoke-flow visibility remains visible from the main placeholder shell.</p>
            </div>
            <a class="button-link" href="/streams/new">Create Stream</a>
          </div>
          ${renderCatalogBody(catalog)}
        </section>
      </div>
    </main>
  </body>
</html>`;
}

export function renderStreamFormPage(config: AppConfig, state: StreamFormState): string {
  const title = state.mode === "create" ? "Create Draft Stream" : "Edit Stream";
  const action = state.mode === "create" ? "/streams" : `/streams/${state.streamId}`;

  return `<!doctype html>
<html lang="en">
  <body>
    <main>
      <section class="form-card">
        <p>Operator workflow boundary: browser SPA with backend mutations over HTTP only.</p>
        <h1>${title}</h1>
        ${state.globalError ? `<p class="field-error">${escapeHtml(state.globalError)}</p>` : ""}
        <form action="${action}" method="post">
          ${renderField("title", "Title", state.input, state.fieldErrors)}
          ${renderField("summary", "Summary", state.input, state.fieldErrors, true)}
          ${renderField("streamUrl", "Stream URL", state.input, state.fieldErrors)}
          ${renderField("imageUrl", "Image URL", state.input, state.fieldErrors)}
          <button type="submit">${state.mode === "create" ? "Create Draft Stream" : "Save Stream"}</button>
        </form>
      </section>
    </main>
  </body>
</html>`;
}

export function renderStreamDetailPage(
  config: AppConfig,
  detail: StreamDetail,
  flash?: FlashMessage,
): string {
  const lifecycleLabel =
    detail.status === "active"
      ? "Deactivate"
      : detail.status === "inactive"
        ? "Activate"
        : "Publish";

  return `<!doctype html>
<html lang="en">
  <body>
    <main>
      <section class="detail-card">
        <p>Browser SPA shell for operator detail route.</p>
        <h1>Stream Detail</h1>
        ${flash ? `<div class="flash-banner">${escapeHtml(flash.text)}</div>` : ""}
        <div class="detail-grid">
          <div>
            <h2>${escapeHtml(detail.title)}</h2>
            <p>${escapeHtml(detail.summary)}</p>
            <p>Lifecycle action visible for this status: <strong>${lifecycleLabel}</strong></p>
            <p><a href="${escapeHtml(detail.streamUrl)}">${escapeHtml(detail.streamUrl)}</a></p>
            <p>${escapeHtml(detail.streamId)}</p>
          </div>
          <form action="/streams/${detail.streamId}/actions/delete" method="post">
            <button type="submit">Delete Stream</button>
          </form>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function renderCatalogBody(catalog: StreamCatalogState): string {
  if (catalog.kind === "error") {
    return `<div class="stream-card"><h3>Stream catalog unavailable</h3><p>${escapeHtml(catalog.message)}</p></div>`;
  }

  return `<div class="catalog-list">${catalog.items.map((item) => renderCatalogItem(item)).join("")}</div>`;
}

function renderCatalogItem(item: StreamListItem): string {
  return `<article class="stream-card">
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <div style="position:relative;">
        <img class="stream-thumbnail" src="${escapeHtml(item.imageUrl)}" alt="" />
        <span class="status-icon" data-availability="${item.status === "active" ? "on-air" : "offline"}"></span>
      </div>
      <div style="display:grid; gap:8px;">
        <p>#${item.position}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>Actions for ${escapeHtml(item.title)}</p>
        <div class="actions-list">${item.availableActions.map((action) => renderAction(item.streamId, action)).join("")}</div>
      </div>
    </div>
  </article>`;
}

function renderAction(streamId: string, action: string): string {
  if (action === "view") {
    return `<a class="ghost-link" href="/streams/${streamId}">View</a>`;
  }

  if (action === "edit") {
    return `<a class="ghost-link" href="/streams/${streamId}/edit">Edit</a>`;
  }

  if (action === "activate") {
    return `<span>Activate (Phase 2)</span>`;
  }

  if (action === "deactivate") {
    return `<span>Deactivate (Phase 2)</span>`;
  }

  if (action === "publish") {
    return `<span>Publish (Phase 2)</span>`;
  }

  return `<form action="/streams/${streamId}/actions/delete" method="post"><button type="submit">Delete</button></form>`;
}

function renderField(
  key: keyof StreamFormInput,
  label: string,
  input: StreamFormInput,
  fieldErrors: StreamFormState["fieldErrors"],
  multiline = false,
): string {
  const error = fieldErrors?.[key];

  return `<label class="field-stack">
    <span>${label}</span>
    ${
      multiline
        ? `<textarea name="${key}">${escapeHtml(input[key])}</textarea>`
        : `<input name="${key}" value="${escapeHtml(input[key])}" />`
    }
    ${error ? `<span class="field-error">${escapeHtml(error)}</span>` : ""}
  </label>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
