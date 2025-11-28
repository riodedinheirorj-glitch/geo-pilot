import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerSW";
import { initDB } from "./pwa/offlineStorage";

// Inicializa IndexedDB
initDB().catch(console.error);

// Registra Service Worker
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
