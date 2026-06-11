export type AppConfig = {
  appId: string;
  apiBaseUrl: string;
  environmentName: string;
};

const DEFAULT_APP_ID = "bof-web";
const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_ENVIRONMENT_NAME = "local";

export function loadAppConfig(): AppConfig {
  return {
    appId: readEnv("RADIOSA_APP_ID") ?? DEFAULT_APP_ID,
    apiBaseUrl: readEnv("BOF_BE_BASE_URL") ?? DEFAULT_API_BASE_URL,
    environmentName: readEnv("RADIOSA_ENVIRONMENT") ?? DEFAULT_ENVIRONMENT_NAME,
  };
}

function readEnv(key: "RADIOSA_APP_ID" | "BOF_BE_BASE_URL" | "RADIOSA_ENVIRONMENT") {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}
