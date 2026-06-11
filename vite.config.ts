import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");
  const port = Number(env.RADIOSA_PORT || "3000");

  return {
    plugins: [react()],
    envDir: "..",
    envPrefix: ["VITE_", "RADIOSA_", "BOF_"],
    server: {
      host: env.RADIOSA_BIND_HOST || "127.0.0.1",
      port: Number.isFinite(port) ? port : 3000,
    },
    preview: {
      host: env.RADIOSA_BIND_HOST || "127.0.0.1",
      port: Number.isFinite(port) ? port : 3000,
    },
  };
});
