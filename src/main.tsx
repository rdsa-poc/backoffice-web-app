import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App.tsx";
import { loadAppConfig } from "./shared/config/app-config.ts";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element for bof-web.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App config={loadAppConfig()} />
  </StrictMode>,
);
