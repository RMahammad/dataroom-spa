import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app/App";
import { initializeDatabase } from "./core/repos/db";
import { useDataroomStore } from "./store/useDataroomStore";

// Initialize database and load initial data before rendering
(async () => {
  try {
    // Wait for database to initialize
    await initializeDatabase();
    console.log("Database initialized");

    // Load datarooms after database is initialized
    await useDataroomStore.getState().loadDatarooms();
    console.log("Datarooms loaded");
  } catch (error) {
    console.error("Failed to initialize app:", error);
  } finally {
    // Render the app after initialization (or on error to show error state)
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
})();
