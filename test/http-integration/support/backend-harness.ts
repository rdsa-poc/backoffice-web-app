import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../../..");
const OUTPUT_DIR = join(ROOT_DIR, "output", "test-http-integration");
const FIREBASE_PROJECT_ID = "radiosa-poc";
const FIRESTORE_COLLECTION = "streams";
const FIRESTORE_DATABASE_ID = "backoffice";
const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
const FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const FIREBASE_DATABASE_NAMESPACE = `${FIREBASE_PROJECT_ID}-default-rtdb`;
const EMULATOR_HUB_URL = "http://127.0.0.1:4400/emulators";
const BOF_BE_PORT = 18080;
const BOF_BE_HEALTH_URL = `http://127.0.0.1:${BOF_BE_PORT}/health`;

let backendProcess: ChildProcessWithoutNullStreams | null = null;
let emulatorProcess: ChildProcessWithoutNullStreams | null = null;
let backendEnvironmentOverrides: Record<string, string | undefined> = {};

export const HTTP_INTEGRATION_BASE_URL = `http://127.0.0.1:${BOF_BE_PORT}`;
export const FIREBASE_DATABASE_URL = `http://${FIREBASE_DATABASE_EMULATOR_HOST}`;

type StreamProjection = {
  imageUrl: string;
  streamId: string;
  streamUrl: string;
  summary: string;
  title: string;
};

export async function startBackendHarness() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  if (emulatorProcess === null) {
    emulatorProcess = spawn(
      "firebase",
      ["emulators:start", "--only", "firestore,database", "--project", FIREBASE_PROJECT_ID],
      {
        cwd: ROOT_DIR,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    captureProcessOutput(emulatorProcess, join(OUTPUT_DIR, "firebase-emulators.log"));
    await waitForHttp(EMULATOR_HUB_URL);
    await waitForHttp(buildCollectionUrl(), 60_000, (response) => response.status < 500);
  }

  if (backendProcess === null) {
    await startBackendProcess();
  }
}

export async function stopBackendHarness() {
  await stopBackendProcess();

  if (emulatorProcess !== null) {
    emulatorProcess.kill("SIGTERM");
    await waitForExit(emulatorProcess);
    emulatorProcess = null;
  }
}

export async function restartBackendProcess() {
  await stopBackendProcess();
  await startBackendProcess();
}

export async function restartBackendProcessWithOverrides(
  environmentOverrides: Record<string, string | undefined>,
) {
  backendEnvironmentOverrides = environmentOverrides;
  await stopBackendProcess(false);
  await startBackendProcess();
}

export async function resetFirestore() {
  const collectionUrl = buildCollectionUrl();
  const response = await fetch(collectionUrl);
  if (!response.ok) {
    throw new Error(`Failed to list emulator documents: ${response.status}`);
  }

  const payload = (await response.json()) as { documents?: Array<{ name: string }> };
  for (const document of payload.documents ?? []) {
    const deleteResponse = await fetch(`http://${FIRESTORE_EMULATOR_HOST}/v1/${document.name}`, {
      method: "DELETE",
    });
    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete emulator document ${document.name}: ${deleteResponse.status}`);
    }
  }
}

export async function resetRealtimeDatabase() {
  const response = await fetch(buildRealtimeCollectionUrl(), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to reset RTDB emulator state: ${response.status}`);
  }
}

export async function writeRealtimeProjection(streamId: string, projection: StreamProjection) {
  const response = await fetch(buildRealtimeProjectionUrl(streamId), {
    body: JSON.stringify(projection),
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Failed to seed RTDB projection ${streamId}: ${response.status}`);
  }
}

export async function readRealtimeProjection(streamId: string): Promise<StreamProjection | null> {
  const response = await fetch(buildRealtimeProjectionUrl(streamId));
  if (!response.ok) {
    throw new Error(`Failed to read RTDB projection ${streamId}: ${response.status}`);
  }

  return (await response.json()) as StreamProjection | null;
}

function buildCollectionUrl() {
  return `http://${FIRESTORE_EMULATOR_HOST}/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${FIRESTORE_COLLECTION}`;
}

function buildRealtimeCollectionUrl() {
  const url = new URL("/mobile/streams.json", FIREBASE_DATABASE_URL);
  url.searchParams.set("ns", FIREBASE_DATABASE_NAMESPACE);
  return url.toString();
}

function buildRealtimeProjectionUrl(streamId: string) {
  const url = new URL(`/mobile/streams/${encodeURIComponent(streamId)}.json`, FIREBASE_DATABASE_URL);
  url.searchParams.set("ns", FIREBASE_DATABASE_NAMESPACE);
  return url.toString();
}

async function waitForHttp(
  url: string,
  timeoutMs = 60_000,
  isReady: (response: Response) => boolean = (response) => response.ok,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (isReady(response)) {
        return;
      }
    } catch {
      // Keep polling until the service becomes reachable.
    }

    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function captureProcessOutput(process: ChildProcessWithoutNullStreams, filePath: string) {
  writeFileSync(filePath, "");
  process.stdout.on("data", (chunk) => appendFileSync(filePath, chunk));
  process.stderr.on("data", (chunk) => appendFileSync(filePath, chunk));
}

async function startBackendProcess() {
  backendProcess = spawn("npm", ["run", "start"], {
    cwd: join(ROOT_DIR, "backoffice-be-app"),
    env: {
      ...process.env,
      ...backendEnvironmentOverrides,
      BOF_BE_STREAM_REPOSITORY: "firestore",
      FIRESTORE_DATABASE_ID,
      FIRESTORE_EMULATOR_HOST,
      FIRESTORE_PROJECT_ID: FIREBASE_PROJECT_ID,
      RADIOSA_BIND_HOST: "127.0.0.1",
      RADIOSA_ENVIRONMENT: "test",
      RADIOSA_PORT: String(BOF_BE_PORT),
      RT_FN_BASE_URL: "http://127.0.0.1:5001",
      FIREBASE_DATABASE_EMULATOR_HOST:
        backendEnvironmentOverrides.FIREBASE_DATABASE_EMULATOR_HOST ?? FIREBASE_DATABASE_EMULATOR_HOST,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  captureProcessOutput(backendProcess, join(OUTPUT_DIR, "bof-be.log"));
  await waitForHttp(BOF_BE_HEALTH_URL);
}

async function stopBackendProcess(resetEnvironmentOverrides = true) {
  if (backendProcess === null) {
    if (resetEnvironmentOverrides) {
      backendEnvironmentOverrides = {};
    }
    return;
  }

  backendProcess.kill("SIGTERM");
  await waitForExit(backendProcess);
  backendProcess = null;
  if (resetEnvironmentOverrides) {
    backendEnvironmentOverrides = {};
  }
}

async function waitForExit(process: ChildProcessWithoutNullStreams, timeoutMs = 10_000) {
  const exited = new Promise<void>((resolvePromise) => {
    process.once("exit", () => resolvePromise());
  });

  await Promise.race([
    exited,
    sleep(timeoutMs).then(() => {
      process.kill("SIGKILL");
    }),
  ]);
}

function sleep(ms: number) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
