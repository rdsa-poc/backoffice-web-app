# Backoffice Web App

Operator-facing web application shell for quiz configuration, execution control, and dashboard views.

## Scope

- quiz configuration UI
- quiz execution controls
- dashboard views backed by the Backoffice BE APP

## Development

- Copy `.env.example` to `.env.local` before first start and keep the `RADIOSA_*` names unchanged.
- `RADIOSA_ENVIRONMENT` identifies the local environment name shared across the PoC.
- `RADIOSA_APP_ID` must stay aligned with the repo identifier (`bof-web` here).
- `RADIOSA_API_BASE_URL` points to the local Backoffice BE APP shell, which defaults to `http://localhost:8080`.
- `RADIOSA_PORT` is optional and overrides the local shell port when needed.
- `npm run dev` starts the local shell on `http://localhost:3000`
- `npm run start` starts the local shell without file watching
- `npm run verify` runs the scaffold checks for this repository

## Notes

- The shell is intentionally dependency-free so the repo can boot immediately in a clean workspace.
- The runtime boundary is ready to evolve into the planned Next.js + TypeScript application structure.
- Startup fails fast with a message that lists any missing required `RADIOSA_*` values.

## Smoke Flow

- The operator shell surfaces the baseline smoke-flow contract directly on the placeholder screen.
- The bootstrap payload is served by `bof-be` at `http://localhost:8080/bootstrap/smoke-flow`.
- The full cross-application steps are documented in `../docs/baseline-smoke-flow.md`.
