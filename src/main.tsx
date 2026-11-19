import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import { initializeAppearance } from "./features/appearance/appearance";
import "./styles/themes.css";
import "./styles/app.css";

const appearance = initializeAppearance();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialAppearance={appearance} />
  </StrictMode>,
);
