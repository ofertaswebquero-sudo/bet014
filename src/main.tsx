import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalLogging } from "./hooks/useLogs";

// Inicializa o monitoramento global de logs
initGlobalLogging();

createRoot(document.getElementById("root")!).render(<App />);
