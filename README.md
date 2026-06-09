# Backoffice Web App

Operator-facing web application shell for stream management, quiz configuration, execution control, and dashboard views.

## Scope

- quiz configuration UI
- quiz execution controls
- dashboard views backed by the Backoffice BE APP

## Development

- Use the shared root `.env` file at `../.env` as the local discovery source for this shell.
- `RADIOSA_ENVIRONMENT` identifies the local environment name shared across the PoC.
- `BOF_BE_BASE_URL` points to the local Backoffice BE APP shell, which defaults to `http://localhost:8080`.
- `RADIOSA_APP_ID` is optional for `bof-web`; the shell defaults it to the repo identifier when omitted from the shared root contract.
- `RADIOSA_PORT` is optional and overrides the local shell port when needed.
- `RADIOSA_BIND_HOST` is optional and controls which local interface the preview shell binds to. Leave it unset for `127.0.0.1`, or set it to `0.0.0.0` when exposing the stack to other devices.
- `npm run dev` starts the local browser SPA preview shell on `http://localhost:3000`
- `npm run start` starts the same preview shell without file watching
- `npm run verify` runs the stream management and scaffold checks for this repository

For the full local stack bootstrap from the workspace root, use `../scripts/start-local-stack.sh`.

## Notes

- The shell is intentionally dependency-free so the repo can boot immediately in a clean workspace.
- The project now follows the agreed SPA-oriented slice under `src/app`, `src/features`, `src/entities`, `src/shared`, and `src/pages`.
- The local preview server serves one browser shell and does not implement operator workflows or backend-substitute behavior.
- Backend discovery and HTTP access stay isolated under `src/shared/api`.
- Each stream item shows the backend-provided ordinal position, a compact image, a lower-left status icon, the title, and the available actions menu.
- Startup fails fast with a message that lists any missing required shared root `.env` values.

## Smoke Flow

- The operator shell surfaces the baseline smoke-flow contract directly on the placeholder screen.
- The bootstrap payload is served by `bof-be` at `http://localhost:8080/bootstrap/smoke-flow`.
- The full cross-application steps are documented in `../docs/baseline-smoke-flow.md`.
