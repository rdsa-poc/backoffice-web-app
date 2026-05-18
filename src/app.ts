import type { AppConfig } from "./config.ts";

export function renderHomePage(config: AppConfig): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Radiosa Backoffice</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif;
        background: #f4f1ea;
        color: #12212f;
      }

      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(195, 221, 255, 0.9), transparent 35%),
          linear-gradient(180deg, #f7f4ed 0%, #ece8df 100%);
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 48px 24px 64px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      .hero {
        display: grid;
        gap: 16px;
        padding: 32px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 18px 40px rgba(18, 33, 47, 0.12);
      }

      .eyebrow {
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #365d7c;
      }

      .hero p {
        max-width: 42rem;
        line-height: 1.5;
      }

      .hero-grid {
        display: grid;
        gap: 12px;
      }

      .hero-meta {
        display: grid;
        gap: 12px;
      }

      .meta-card {
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(18, 33, 47, 0.06);
      }

      .meta-card strong {
        display: block;
        margin-bottom: 4px;
      }

      .panels {
        display: grid;
        gap: 16px;
        margin-top: 24px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .panel {
        padding: 20px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 12px 28px rgba(18, 33, 47, 0.08);
      }

      .panel p {
        margin-top: 8px;
        line-height: 1.5;
      }

      .panel ul {
        margin: 12px 0 0;
        padding-left: 18px;
        line-height: 1.5;
      }

      .status-strip {
        display: grid;
        gap: 12px;
        margin-top: 24px;
      }

      .status-card {
        padding: 20px;
        border-radius: 20px;
        background: #12212f;
        color: #f8f5ef;
      }

      .status-card p + p {
        margin-top: 8px;
      }

      @media (min-width: 760px) {
        .hero-grid {
          grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
          align-items: start;
        }

        .status-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="hero-grid">
          <div>
            <p class="eyebrow">Radiosa Operator Console</p>
            <p>Backoffice Web App</p>
            <h1>Backoffice Main Placeholder Screen</h1>
            <p>
              Minimal operator shell for the future quiz configuration, execution
              control, and analytics workflow. This view is intentionally static
              so the end-to-end product shape can be demonstrated before business
              functionality is implemented.
            </p>
          </div>
          <div class="hero-meta" aria-label="Placeholder environment details">
            <div class="meta-card">
              <strong>Environment</strong>
              <span>${config.environmentName}</span>
            </div>
            <div class="meta-card">
              <strong>API Base URL</strong>
              <span>${config.apiBaseUrl}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="status-strip" aria-label="Placeholder operator status">
        <article class="status-card">
          <h2>Operator Workflow Placeholder</h2>
          <p>Next milestone: wire these panels to the Backoffice BE APP.</p>
          <p>No live quiz configuration or analytics data is loaded on this screen yet.</p>
        </article>
        <article class="status-card">
          <h2>Demo Readiness</h2>
          <p>Use this shell to explain the operator journey from setup to reporting.</p>
          <p>All values on this page are mocked or environment-driven placeholders.</p>
        </article>
      </section>
      <section class="panels" aria-label="Baseline smoke flow">
        <article class="panel">
          <h2>Baseline Smoke Flow</h2>
          <p>Bootstrap contract: ${config.apiBaseUrl}/bootstrap/smoke-flow</p>
          <ul>
            <li>Smoke flow id: baseline-smoke-flow</li>
            <li>Quiz id: quiz-smoke-demo</li>
            <li>Mobile stream id: stream-smoke-demo</li>
            <li>Participant id: participant-smoke-demo</li>
          </ul>
        </article>
      </section>
      <section class="panels" aria-label="Backoffice workflow panels">
        <article class="panel">
          <h2>Quiz Configuration</h2>
          <p>Prepare quiz settings, answer metadata, and scoring rules.</p>
          <ul>
            <li>Create and revise quiz structure.</li>
            <li>Document answer metadata placeholders.</li>
            <li>Reserve space for future scoring rule controls.</li>
          </ul>
        </article>
        <article class="panel">
          <h2>Execution Control</h2>
          <p>Start, pause, and monitor live quiz sessions.</p>
          <ul>
            <li>Preview future start and stop actions.</li>
            <li>Expose a placeholder runtime status area.</li>
            <li>Keep operational controls visible in demos.</li>
          </ul>
        </article>
        <article class="panel">
          <h2>Analytics Dashboard</h2>
          <p>Surface results proxied from the Backoffice BE APP.</p>
          <ul>
            <li>Reserve the overview for engagement metrics.</li>
            <li>Show where score trends will appear.</li>
            <li>Explain the future analytics handoff from BigQuery.</li>
          </ul>
        </article>
      </section>
    </main>
  </body>
</html>`;
}
