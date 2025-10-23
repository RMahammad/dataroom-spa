import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app/App";
import { initializeDatabase } from "./core/repos/db";
import { useDataroomStore } from "./store/useDataroomStore";

// Initialize database and load initial data
initializeDatabase()
  .then(() => {
    // Load datarooms after database is initialized
    useDataroomStore.getState().loadDatarooms();
  })
  .catch(console.error);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
