import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { renderHomePage } from "../src/app.ts";
import {
  MissingConfigurationError,
  parseEnvironmentFile,
  resolveAppConfig,
} from "../src/config.ts";

const envExampleUrl = new URL("../.env.example", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const readmeUrl = new URL("../README.md", import.meta.url);

// Test: exposes the operator shell and documented startup commands.
// Validates: RDS-AC-001 (RDS-REQ-013 - Provide a runnable application skeleton for bof-web)
test("backoffice web scaffold exposes the expected shell", () => {
  const html = renderHomePage({
    appId: "bof-web",
    apiBaseUrl: "http://localhost:8080",
    environmentName: "local",
    port: 3000,
  });

  assert.match(html, /Backoffice Web App/);
  assert.match(html, /Quiz Configuration/);
  assert.match(html, /Execution Control/);
  assert.match(html, /Analytics Dashboard/);
  assert.match(html, /http:\/\/localhost:8080/);
});

// Test: renders the operator-facing main placeholder workflow screen.
// Validates: RDS-AC-008 (RDS-REQ-020 - Provide a backoffice main placeholder screen)
test("backoffice web renders the main operator placeholder screen", () => {
  const html = renderHomePage({
    appId: "bof-web",
    apiBaseUrl: "http://localhost:8080",
    environmentName: "local",
    port: 3000,
  });

  assert.match(html, /Backoffice Main Placeholder Screen/);
  assert.match(html, /Operator Workflow Placeholder/);
  assert.match(html, /No live quiz configuration or analytics data is loaded on this screen yet\./);
  assert.match(html, /Quiz Configuration/);
  assert.match(html, /Execution Control/);
  assert.match(html, /Analytics Dashboard/);
});

// Test: surfaces the documented baseline smoke flow contract on the operator shell.
// Validates: RDS-AC-011 (RDS-REQ-023 - Provide a minimal cross-application smoke flow)
test("backoffice web renders the baseline smoke flow contract", () => {
  const html = renderHomePage({
    appId: "bof-web",
    apiBaseUrl: "http://localhost:8080",
    environmentName: "local",
    port: 3000,
  });

  assert.match(html, /Baseline Smoke Flow/);
  assert.match(html, /http:\/\/localhost:8080\/bootstrap\/smoke-flow/);
  assert.match(html, /baseline-smoke-flow/);
  assert.match(html, /quiz-smoke-demo/);
  assert.match(html, /stream-smoke-demo/);
  assert.match(html, /participant-smoke-demo/);
});

// Test: publishes the required development entrypoints.
// Validates: RDS-AC-001 (RDS-REQ-013 - Provide a runnable application skeleton for bof-web)
test("backoffice web scaffold declares startup commands", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as {
    scripts: Record<string, string>;
  };
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(packageJson.scripts.dev, "node --watch --experimental-strip-types src/server.ts");
  assert.equal(packageJson.scripts.start, "node --experimental-strip-types src/server.ts");
  assert.match(readme, /npm run dev/);
  assert.match(readme, /npm run start/);
  assert.match(readme, /http:\/\/localhost:3000/);
});

// Test: resolves the shared local configuration convention from the committed example file.
// Validates: RDS-AC-005 (RDS-REQ-017 - Define a shared environment configuration convention)
test("backoffice web scaffold resolves the documented environment convention", () => {
  const environment = parseEnvironmentFile(readFileSync(envExampleUrl, "utf8"));
  const config = resolveAppConfig(environment);
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(config.appId, "bof-web");
  assert.equal(config.environmentName, "local");
  assert.equal(config.apiBaseUrl, "http://localhost:8080");
  assert.match(readme, /copy `\.env\.example` to `\.env\.local`/i);
  assert.match(readme, /RADIOSA_ENVIRONMENT/);
  assert.match(readme, /RADIOSA_API_BASE_URL/);
});

// Test: reports exactly which required configuration values are missing.
// Validates: RDS-AC-006 (RDS-REQ-018 - Report missing required configuration values)
test("backoffice web scaffold reports missing configuration keys", () => {
  assert.throws(
    () => resolveAppConfig({ RADIOSA_APP_ID: "bof-web" }),
    (error: unknown) => {
      assert.ok(error instanceof MissingConfigurationError);
      assert.deepEqual(error.missingKeys, ["RADIOSA_ENVIRONMENT", "RADIOSA_API_BASE_URL"]);
      assert.match(
        error.message,
        /Missing required configuration values for bof-web: RADIOSA_ENVIRONMENT, RADIOSA_API_BASE_URL/,
      );
      return true;
    },
  );
});
