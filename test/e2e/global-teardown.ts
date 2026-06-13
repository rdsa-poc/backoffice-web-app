import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");

export default async function globalTeardown() {
  await execFileAsync("bash", ["scripts/stop-local-stack.sh"], {
    cwd: ROOT_DIR,
  });
}
