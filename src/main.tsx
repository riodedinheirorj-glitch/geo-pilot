import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDB } from "./pwa/offlineStorage";

// Inicializa IndexedDB
initDB().catch(console.error);

// O Service Worker agora é registrado automaticamente pelo vite-plugin-pwa
// registerServiceWorker(); // Removido

createRoot(document.getElementById("root")!).render(<App />);