/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BOF_BE_BASE_URL?: string;
  readonly RADIOSA_APP_ID?: string;
  readonly RADIOSA_ENVIRONMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
