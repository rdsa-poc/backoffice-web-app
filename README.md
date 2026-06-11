# Backoffice Web App

Operator-facing React SPA for stream management, quiz configuration, execution control, and dashboard views.

## Scope

- quiz configuration UI
- quiz execution controls
- dashboard views backed by the Backoffice BE APP

## Development

- Use the shared root `.env` file at `../.env` as the local discovery source for this SPA.
- `RADIOSA_ENVIRONMENT` identifies the local environment name shared across the PoC.
- `BOF_BE_BASE_URL` points to the local Backoffice BE APP, which defaults to `http://localhost:8080`.
- `RADIOSA_APP_ID` is optional for `bof-web`; the app defaults it to the repo identifier when omitted.
- `RADIOSA_PORT` is optional and overrides the local Vite port when needed.
- `RADIOSA_BIND_HOST` is optional and controls which local interface the Vite dev server binds to.
- `npm run dev` starts the React SPA in development mode.
- `npm run start` starts the same Vite dev server alias.
- `npm run build` type-checks and builds the SPA.
- `npm run preview` serves the production build locally.
- `npm run verify` runs the current build verification for this repository.

For the full local stack bootstrap from the workspace root, use `../scripts/start-local-stack.sh`.

## Notes

- The app runs as a proper React SPA with Vite.
- The current implementation is intentionally frontend-only and focuses on the stream management shell visuals.
- Backend discovery still comes from the shared root `.env` through Vite environment loading.
- The stream screen includes the left navigation, KPI row, paginated stream list, contextual action menus, and detail pane.

## Smoke Flow

- The operator shell surfaces the baseline smoke-flow contract directly on the placeholder screen.
- The bootstrap payload is served by `bof-be` at `http://localhost:8080/bootstrap/smoke-flow`.
- The full cross-application steps are documented in `../docs/baseline-smoke-flow.md`.
