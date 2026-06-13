import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");

export default async function globalSetup() {
  await execFileAsync("bash", ["scripts/start-local-stack.sh", "--public-host", "127.0.0.1", "--bind-host", "127.0.0.1", "--firestore-mode", "emulators", "--skip-build"], {
    cwd: ROOT_DIR,
  });
}
